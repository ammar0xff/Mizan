# Mizan ERP — Backend Models & API Development

**Target Audience:** Backend engineers, database administrators, API designers.  
**Platform Version:** Mizan 3.0 (FastAPI + SQLAlchemy 2.0 Async)

---

## 1. Database Architecture & Tenancy Foundation

In Mizan, all business models belong to a specific tenant. Data isolation is maintained mathematically via PostgreSQL Row-Level Security (RLS) combined with application-level foreign keys.

### The `TenantScoped` Mixin
Every tenant-scoped database table **must** inherit from `TenantScoped` and `Base`:

```python
# backend/app/core/tenancy.py
from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

class TenantScoped:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
```

By inheriting `TenantScoped`, your model automatically gains:
- Secure UUID v4 Primary Key (`id`).
- Indexed Tenant Foreign Key (`tenant_id`) with CASCADE delete.
- Timezone-aware UTC timestamps (`created_at` and `updated_at`).

---

## 2. Defining Module Models (`models.py`)

Here is an authentic implementation of an industry module table (`LoyaltyRewardRule`):

```python
# backend/app/modules/loyalty/models.py
from __future__ import annotations

import enum
from sqlalchemy import Column, String, Numeric, Boolean, Enum, UniqueConstraint
from app.db.base import Base
from app.core.tenancy import TenantScoped


class RewardCalculationType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED_TIER = "fixed_tier"


class LoyaltyProgram(TenantScoped, Base):
    __tablename__ = "mod_loyalty_programs"
    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_loyalty_code"),
    )

    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Financial fields use Numeric with strict 2-decimal precision
    points_per_currency = Column(Numeric(10, 2), default=1.00, nullable=False)
    currency_per_point = Column(Numeric(10, 2), default=0.05, nullable=False)
    calculation_type = Column(
        Enum(RewardCalculationType, name="loyalty_calc_type"),
        default=RewardCalculationType.PERCENTAGE,
        nullable=False,
    )
```

### Best Practices:
1. **Always Table-Prefix:** Module tables should be prefixed with `mod_<module_id>_` to prevent namespace collisions with core tables.
2. **Compound Unique Constraints:** Always scope uniqueness by tenant:  
   `UniqueConstraint("tenant_id", "code", name="uq_tenant_<module>_code")`.
3. **Monetary Precision:** Always use `Numeric(12, 2)` or `Numeric(10, 2)` for currency and points; never use floating-point types (`Float`) for financial values.

---

## 3. Creating Module Routers (`router.py`)

A module router exposes the endpoints to the FastAPI application. Mizan's module loader scans each module directory and mounts any variable named `router` that is an instance of `APIRouter`.

```python
# backend/app/modules/loyalty/router.py
from __future__ import annotations

import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user, require_perm
from app.core.modules import require_module
from app.models.user import User
from app.modules.loyalty.models import LoyaltyProgram

# 1. Instantiate router with standard prefix and OpenAPI tag
router = APIRouter(prefix="/modules/loyalty", tags=["loyalty"])


# 2. Pydantic v2 Request & Response Schemas
class CreateLoyaltyProgramRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=50)
    points_per_currency: float = Field(default=1.0, ge=0.01)
    currency_per_point: float = Field(default=0.05, ge=0.001)


class LoyaltyProgramResponse(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    is_active: bool
    points_per_currency: float
    currency_per_point: float

    model_config = ConfigDict(from_attributes=True)


# 3. Protected Endpoints with Module Guard and RBAC
@router.get("", response_model=list[LoyaltyProgramResponse])
async def list_loyalty_programs(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    _mod: bool = Depends(require_module("loyalty")),
):
    """List all loyalty programs for the active tenant."""
    stmt = (
        select(LoyaltyProgram)
        .where(LoyaltyProgram.tenant_id == user.tenant_id)
        .order_by(LoyaltyProgram.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=LoyaltyProgramResponse, status_code=status.HTTP_201_CREATED)
async def create_loyalty_program(
    payload: CreateLoyaltyProgramRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    _mod: bool = Depends(require_module("loyalty")),
    _perm: bool = Depends(require_perm("settings")),
):
    """Create a new loyalty program. Requires module active + 'settings' permission."""
    # Check duplicate code in this tenant
    stmt = select(LoyaltyProgram).where(
        LoyaltyProgram.tenant_id == user.tenant_id,
        LoyaltyProgram.code == payload.code,
    )
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"برنامج الولاء بالرمز «{payload.code}» مسجل مسبقاً في النظام.",
        )

    program = LoyaltyProgram(
        tenant_id=user.tenant_id,
        name=payload.name,
        code=payload.code,
        points_per_currency=payload.points_per_currency,
        currency_per_point=payload.currency_per_point,
    )
    db.add(program)
    await db.commit()
    await db.refresh(program)
    return program
```

---

## 4. Security & Guard Dependencies

Mizan enforces security through layered FastAPI dependencies:

### 1. `require_module(module_id: str)`
Guards endpoints to guarantee the requesting tenant has activated the module:
```python
_mod: bool = Depends(require_module("pos_hardware"))
```
If the module is not active in the tenant's `installed_modules` setting, the request immediately terminates with:
```json
{
  "detail": "وحدة «إدارة أجهزة نقاط البيع والطباعة الحرارية» غير مفعلة في اشتراك المنشأة الحالي. يمكنك تفعيلها من متجر الإضافات."
}
```

### 2. `require_perm(permission_code: str)`
Enforces Role-Based Access Control (RBAC):
```python
_perm: bool = Depends(require_perm("pos.create"))
```
Verifies that the authenticated `user` has the required permission or belongs to an administrative role (`admin`, `owner`).

### 3. `get_current_user`
Resolves the JWT token, extracts user claims, verifies tenant status, and provides the hydrated `User` model with `user.tenant_id`.

---

## 5. Async Database Operations Cheat Sheet

| Operation | SQLAlchemy 2.0 Async Syntax |
| :--- | :--- |
| **Fetch All** | `res = await db.execute(select(Model).where(...))`  <br>`items = res.scalars().all()` |
| **Fetch One / None** | `res = await db.execute(select(Model).where(...))`  <br>`item = res.scalar_one_or_none()` |
| **Fetch Count** | `res = await db.execute(select(func.count(Model.id)).where(...))`  <br>`total = res.scalar_one()` |
| **Insert** | `db.add(entity)`  <br>`await db.commit()`  <br>`await db.refresh(entity)` |
| **Update** | `entity.field = new_val`  <br>`await db.commit()` |
| **Delete** | `await db.delete(entity)`  <br>`await db.commit()` |
| **Rollback** | `await db.rollback()` |
