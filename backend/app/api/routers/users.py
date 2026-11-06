import uuid
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import delete as sqldelete
from sqlalchemy import select, text, update as sqlupdate
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.base import get_db
from app.dependencies import get_current_user, require_perm
from app.models.user import User, user_warehouses
from app.schemas.user import PasswordReset, SetUserWarehouses, UserCreate, UserOut, UserUpdate
from app.services import auth_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/managers")
async def list_managers(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    """Any authenticated user can get the list of managers (for shift close)."""
    rows = await db.execute(text("SELECT id, full_name FROM users WHERE is_manager = true AND is_active = true ORDER BY full_name"))
    return [{"id": str(r.id), "full_name": r.full_name} for r in rows.fetchall()]


@router.get("/me/settings")
async def get_my_settings(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Per-user personal settings (separate from global store settings)."""
    return {"settings": current_user.settings or {}}


@router.put("/me/settings")
async def update_my_settings(data: dict[str, Any], db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update per-user personal settings (merges into existing)."""
    incoming = data.get("settings") if isinstance(data.get("settings"), dict) else data
    merged = {**(current_user.settings or {}), **(incoming or {})}
    await db.execute(sqlupdate(User).where(User.id == current_user.id).values(settings=merged))
    await db.commit()
    current_user.settings = merged
    return {"settings": merged}


@router.get("")
async def list_users(db: AsyncSession = Depends(get_db), _=Depends(require_perm("users"))):
    rows = await db.execute(text("""
        SELECT u.*, w.name as default_warehouse_name
        FROM users u
        LEFT JOIN warehouses w ON w.id = u.default_warehouse_id
        WHERE u.is_active = true ORDER BY u.full_name
    """))
    return [dict(r._mapping) for r in rows.fetchall()]


@router.post("", response_model=UserOut)
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("users"))):
    if current_user.tenant_id:
        from app.services.plan_gating import check_user_creation_limit
        await check_user_creation_limit(db, current_user.tenant_id)
    return await auth_service.create_user(db, data)


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_perm("users"))):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    return user


@router.put("/{user_id}")
async def update_user(user_id: uuid.UUID, data: UserUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_perm("users"))):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    from app.core.roles import ROLE_LABELS
    fields = data.model_dump(exclude_unset=True)
    for k, v in fields.items():
        if k == "is_manager":
            user.is_manager = bool(v) if v is not None else None
        elif k == "default_warehouse_id":
            user.default_warehouse_id = str(v) if v else None
        elif v is not None:
            setattr(user, k, str(v) if isinstance(v, str) and v != "" else v)
    # Validate role
    if "role" in fields and fields["role"] not in ROLE_LABELS:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid role: {fields['role']}")
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/{user_id}/reset-password", status_code=204)
async def reset_password(user_id: uuid.UUID, data: PasswordReset, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("users"))):
    from sqlalchemy import text as sqlt

    from app.core.security import hash_password
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError()
    user.password_hash = hash_password(data.password)
    await db.execute(sqlt(
        "INSERT INTO hr_audit_log (action_type, entity_type, entity_id, performed_by, reason, details) VALUES ('update', 'user', :eid, :by, 'إعادة تعيين كلمة المرور', CAST(:det AS jsonb))"
    ), {"eid": str(user_id), "by": current_user.id, "det": '{"action":"password_reset"}'})
    await db.commit()


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(require_perm("users"))):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    if str(user.id) == str(current_user.id):
        from app.core.exceptions import BusinessError
        raise BusinessError("Cannot delete your own account")
    user.is_active = False
    await db.commit()


@router.put("/{user_id}/warehouses", status_code=200)
async def set_user_warehouses(user_id: uuid.UUID, data: SetUserWarehouses, db: AsyncSession = Depends(get_db), _=Depends(require_perm("users"))):
    """Set which warehouses a user can access."""
    await db.execute(sqldelete(user_warehouses).where(user_warehouses.c.user_id == user_id))
    for wid in data.warehouse_ids:
        await db.execute(
            user_warehouses.insert().values(user_id=user_id, warehouse_id=uuid.UUID(wid))
        )
    await db.commit()
    return {"ok": True}


@router.get("/{user_id}/warehouses")
async def get_user_warehouses(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_perm("users"))):
    """Get warehouse IDs assigned to a user."""
    result = await db.execute(
        select(user_warehouses.c.warehouse_id).where(user_warehouses.c.user_id == user_id)
    )
    return [str(r[0]) for r in result.fetchall()]
