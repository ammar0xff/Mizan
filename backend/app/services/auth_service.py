from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User


async def authenticate(db: AsyncSession, username: str, password: str) -> User:
    from sqlalchemy import text
    await db.execute(text("SELECT set_config('app.bypass', 'on', true)"))
    result = await db.execute(select(User).where(User.username == username, User.is_active))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return user


def issue_token(user: User) -> dict:
    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "username": user.username,
        "tid": str(user.tenant_id) if user.tenant_id else None,
    })
    return {"access_token": token, "token_type": "bearer", "user_id": str(user.id),
            "username": user.username, "role": user.role, "full_name": user.full_name or user.username,
            "tenant_id": str(user.tenant_id) if user.tenant_id else None}


async def create_user(db: AsyncSession, data) -> User:
    from fastapi import HTTPException
    from sqlalchemy.exc import IntegrityError

    from app.core.roles import ROLE_DEFAULT_PERMISSIONS
    from app.core.tenancy import current_tenant_id, primary_tenant_id
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    tid = current_tenant_id.get() or await primary_tenant_id(db)
    user = User(
        username=data.username,
        full_name=data.full_name,
        role=data.role,
        password_hash=hash_password(data.password),
        permissions=ROLE_DEFAULT_PERMISSIONS.get(data.role, []),
        tenant_id=tid,
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        import traceback
        traceback.print_exc()
        err_msg = str(exc).lower()
        if "uq_users_tenant_username" in err_msg or "users_username_key" in err_msg or ("unique constraint" in err_msg and "username" in err_msg):
            raise HTTPException(400, f"اسم المستخدم '{data.username}' مستخدم بالفعل") from None
        raise
    await db.refresh(user)
    return user


async def change_password(db: AsyncSession, user: User, current_password: str, new_password: str):
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    user.password_hash = hash_password(new_password)
    await db.commit()
