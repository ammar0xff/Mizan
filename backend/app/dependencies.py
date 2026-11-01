import uuid
from datetime import datetime

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.core.tenancy import bind_tenant
from app.db.base import get_db
from app.models.user import User, user_warehouses

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def _decode_user_id(payload: dict) -> str:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return user_id


async def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    # 1: Try httpOnly cookie first
    cookie_token = request.cookies.get("access_token")
    payload = None
    if cookie_token:
        try:
            payload = decode_token(cookie_token)
        except HTTPException:
            payload = None

    # 2: Fallback to Bearer header (migration compat)
    if not payload and token:
        try:
            payload = decode_token(token)
        except HTTPException:
            payload = None

    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    user_id = _decode_user_id(payload)
    tid_str = payload.get("tid")
    if tid_str:
        await bind_tenant(db, uuid.UUID(tid_str))
    else:
        # Fallback for tokens issued without tid payload
        await db.execute(text("SELECT set_config('app.bypass', 'on', true)"))

    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id), User.is_active)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not tid_str:
        await bind_tenant(db, user.tenant_id)
    return user


async def get_print_user(request: Request, token: str | None = None, db: AsyncSession = Depends(get_db)) -> User:
    # Accept httpOnly cookie OR query param (frontend sends ?token=... for browser-opened tabs)
    t = request.cookies.get("access_token") or token
    if not t:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token required")
    payload = decode_token(t)
    # Validate print scope
    if payload.get("scope") != "print":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token scope for print")
    user_id = payload.get("sub")
    tid_str = payload.get("tid")
    if tid_str:
        await bind_tenant(db, uuid.UUID(tid_str))
    else:
        await db.execute(text("SELECT set_config('app.bypass', 'on', true)"))

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id), User.is_active))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not tid_str:
        await bind_tenant(db, user.tenant_id)
    return user


def require_perm(*perms: str):
    async def checker(current_user: User = Depends(get_current_user)) -> User:
        user_perms = current_user.permissions or []
        if any(p in user_perms for p in perms):
            return current_user
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return checker


async def require_is_manager(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_manager:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="مدير فقط")
    return current_user


async def require_open_period(db: AsyncSession = Depends(get_db)):
    """Block transactions if the current accounting month is closed.
    Uses the same table schema as periods.py (UUID pk, closed_by, closed_at).
    """
    month = datetime.now().strftime("%Y-%m")
    try:
        status_row = (await db.execute(text(
            "SELECT status FROM accounting_periods WHERE month=:m"
        ), {"m": month})).scalar_one_or_none()
    except Exception as e:
        # Only allow through if the table doesn't exist (42P01 = undefined_table in PG)
        # For all other errors (connection, auth, etc.) — fail closed
        if hasattr(e, 'orig') and getattr(e.orig, 'pgcode', None) == '42P01':
            return  # table doesn't exist yet — no periods are closed
        raise
    if status_row == "closed":
        raise HTTPException(status_code=400, detail=f"الشهر {month} مغلق — لا يمكن إجراء المعاملات")


async def verify_warehouse_access(
    db: AsyncSession,
    current_user: User,
    warehouse_id: uuid.UUID | None,
) -> uuid.UUID | None:
    """Check if user has access to a warehouse. Returns warehouse_id if valid."""
    if warehouse_id is None:
        return None
    # Managers and admins have full access to all warehouses.
    if current_user.is_manager or current_user.role in ("admin", "manager"):
        return warehouse_id
    result = await db.execute(
        select(user_warehouses.c.warehouse_id).where(
            user_warehouses.c.user_id == current_user.id,
            user_warehouses.c.warehouse_id == warehouse_id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ليس لديك صلاحية الوصول إلى هذا الفرع")
    return warehouse_id


