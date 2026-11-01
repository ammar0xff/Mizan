from datetime import timedelta

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.ratelimit import RateLimiter
from app.core.security import create_access_token
from app.db.base import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserPasswordUpdate
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

login_limiter = RateLimiter(max_requests=10, window_seconds=60)
password_limiter = RateLimiter(max_requests=3, window_seconds=300)
reauth_limiter = RateLimiter(max_requests=5, window_seconds=60)


@router.post("/login")
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db), _=Depends(login_limiter)):
    user = await auth_service.authenticate(db, data.username, data.password, tenant_slug=data.tenant_slug)
    token = auth_service.issue_token(user)
    body = TokenResponse(
        access_token=token["access_token"],
        token_type="bearer",
        user_id=token["user_id"],
        username=token["username"],
        full_name=token["full_name"],
        role=token["role"],
    ).model_dump()
    resp = JSONResponse(content=body)
    resp.set_cookie(
        key="access_token",
        value=token["access_token"],
        httponly=True,
        secure=settings.IS_PRODUCTION,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return resp


@router.get("/roles")
async def get_roles(_=Depends(get_current_user)):
    from app.core.roles import ROLE_LABELS
    return [{"value": k, "label": v} for k, v in ROLE_LABELS.items()]


@router.get("/me")
async def me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models.tenant import Tenant
    user = await db.merge(current_user)
    await db.refresh(user)

    tenant_info = None
    if user.tenant_id:
        t = await db.get(Tenant, user.tenant_id)
        if t:
            tenant_info = {
                "id": str(t.id),
                "name": t.name,
                "slug": t.slug,
                "custom_domain": t.custom_domain,
                "sector": t.sector,
                "business_type": t.business_type,
                "palette": t.palette or {"name": "neutral", "hue": 0},
                "active_modules": t.active_modules or ["pos", "inventory"],
                "deployment_mode": t.deployment_mode,
                "tech_stack": t.tech_stack or {},
                "limits": t.limits or {},
                "plan": t.plan,
                "trial_ends_at": t.trial_ends_at.isoformat() if t.trial_ends_at else None,
            }

    return {
        "id": str(user.id),
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
        "permissions": user.permissions or [],
        "is_manager": bool(user.is_manager) if user.is_manager is not None else False,
        "is_superadmin": bool(user.is_superadmin),
        "default_warehouse_id": str(user.default_warehouse_id) if user.default_warehouse_id else None,
        "tenant": tenant_info,
    }


@router.put("/me/password")
async def change_password(data: UserPasswordUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db), _=Depends(password_limiter)):
    await auth_service.change_password(db, current_user, data.current_password, data.new_password)
    return {"detail": "Password updated"}


@router.post("/print-token")
async def issue_print_token(current_user: User = Depends(get_current_user)):
    token = create_access_token(
        {"sub": str(current_user.id), "scope": "print", "tid": str(current_user.tenant_id)},
        expires_delta=timedelta(seconds=60),
    )
    return {"token": token}


@router.post("/reauthenticate")
async def reauthenticate(data: LoginRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db), _=Depends(reauth_limiter)):
    """Verify credentials without issuing a new session — used for handover/manager approval."""
    user = await auth_service.authenticate(db, data.username, data.password)
    return {"user_id": str(user.id), "username": user.username, "full_name": user.full_name}
