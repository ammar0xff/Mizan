"""CSRF protection — double-submit cookie pattern.

A random token lives in a JS-readable cookie (not httpOnly) and must be echoed
in the X-CSRF-Token header on mutating requests. A cross-site attacker can
neither read the cookie (same-origin policy) nor set custom headers, so the
header/cookie pair can't be forged.

Requests authenticated by an Authorization header (Bearer) are exempt: they do
not rely on ambient cookie auth and are not CSRF-forgeable.

The token is stateless — no server-side session store — so it works unchanged
behind multi-worker/multi-instance deployments.
"""
import secrets
from collections.abc import Callable

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_403_FORBIDDEN

CSRF_COOKIE = "csrf_token"
CSRF_HEADER = "X-CSRF-Token"

# Paths that never require (and never make sense for) CSRF validation.
# Login is the issuance point: it can't present a token it doesn't have yet.
CSRF_EXEMPT_SUFFIXES = (
    "/health",
    "/",
    "/docs",
    "/openapi.json",
    "/auth/login",
    "/auth/reauthenticate",
    "/auth/print-token",
    "/platform/signup",
)

MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def _script_rel_path(path: str) -> str:
    """Strip a deployment base prefix (e.g. /api) so exemptions match any mount point."""
    if path.startswith("/api/") or path == "/api":
        path = path[len("/api"):]
    return path


def _is_https(request: Request) -> bool:
    if request.url.scheme == "https":
        return True
    forwarded = request.headers.get("X-Forwarded-Proto", "")
    return "https" in forwarded.lower()


def _is_exempt(path: str) -> bool:
    rel = _script_rel_path(path)
    if rel.startswith("/storefront/") or rel.startswith("/store/") or rel.startswith("/billing/webhook"):
        return True
    return rel in CSRF_EXEMPT_SUFFIXES


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        cookie_token = request.cookies.get(CSRF_COOKIE)

        needs_check = (
            request.method in MUTATING_METHODS
            and not _is_exempt(path)
            and not request.headers.get("Authorization")  # header-auth is not CSRF-forgeable
        )

        if needs_check:
            header_token = request.headers.get(CSRF_HEADER, "")
            if not cookie_token or not header_token or not secrets.compare_digest(header_token, cookie_token):
                return JSONResponse(
                    status_code=HTTP_403_FORBIDDEN,
                    content={"detail": "CSRF token missing or invalid"},
                )

        response = await call_next(request)

        # Issue a token to any client that doesn't have one yet (login included).
        if not cookie_token:
            response.set_cookie(
                key=CSRF_COOKIE,
                value=secrets.token_urlsafe(32),
                httponly=False,  # must be readable by the SPA to echo into the header
                secure=_is_https(request),
                samesite="lax",
                max_age=24 * 3600,
                path="/",
            )
        return response


def add_csrf_middleware(app: FastAPI):
    app.add_middleware(CSRFMiddleware)
