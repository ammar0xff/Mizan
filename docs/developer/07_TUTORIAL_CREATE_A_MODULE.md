# Mizan ERP — Step-by-Step Tutorial: Building a Module from Scratch

**Target Audience:** New module authors, backend/frontend engineers.  
**Project Goal:** Build, test, package, and deploy a complete **"Loyalty Rewards & Points Engine" (`loyalty_rewards`)** module.

---

## 1. Goal & Architecture of the Module

Our module will:
1. Track customer reward points balances and tiers (Bronze, Silver, Gold).
2. Earn points when sales are finalized in POS.
3. Redeem points as cash discounts during checkout.
4. Provide zero-code settings configuration in Mizan Admin.

```
backend/app/modules/loyalty_rewards/
├── manifest.json         # Module descriptor & settings schema
├── __init__.py           # Exports models and router
├── models.py             # Tenant-scoped database tables
└── router.py             # FastAPI REST endpoints
```

---

## 2. Step 1: Create the Manifest (`manifest.json`)

Create `backend/app/modules/loyalty_rewards/manifest.json`:

```json
{
  "id": "loyalty_rewards",
  "name": "نقاط الولاء ومكافآت العملاء",
  "name_en": "Loyalty Points & Customer Rewards",
  "category": "retail",
  "version": "1.0.0",
  "icon": "Gift",
  "description": "نظام احتساب نقاط المكافآت التراكمية لمشتريات العملاء، ترقية مستويات العضوية (برونزي، فضي، ذهبي)، واستبدال النقاط بخصومات فورية في الكاشير.",
  "dependencies": ["core", "pos"],
  "is_core": false,
  "badge": "جديد",
  "target_business_types": ["retail", "restaurant", "salon"],
  "nav_items": [
    {
      "id": "loyalty_accounts",
      "label": "أرصدة نقاط العملاء",
      "label_en": "Loyalty Accounts",
      "path": "/loyalty/accounts",
      "icon": "Sparkles",
      "permission": "pos.view"
    }
  ],
  "settings_schema": [
    {
      "key": "earn_rate_currency_per_point",
      "label": "قيمة المشتريات لكسب نقطة واحدة (جنيه/ريال)",
      "type": "number",
      "default": 10,
      "description": "لكل 10 جنيهات ينفقها العميل يكسب نقطة ولاء واحدة"
    },
    {
      "key": "point_redemption_value",
      "label": "القيمة النقدية للنقطة عند الاستبدال",
      "type": "number",
      "default": 0.5,
      "description": "كل نقطة تعادل 0.50 جنيه/ريال كخصم نقدي"
    },
    {
      "key": "minimum_points_to_redeem",
      "label": "الحد الأدنى من النقاط المسموح باستبدالها",
      "type": "number",
      "default": 50,
      "description": "لا يمكن الاستبدال إلا بعد وصول الرصيد إلى 50 نقطة فأكثر"
    },
    {
      "key": "allow_silver_gold_tiers",
      "label": "تفعيل مستويات العضوية التلقائية (Silver / Gold)",
      "type": "boolean",
      "default": true,
      "description": "مضاعفة سرعة كسب النقاط للعملاء المميزين تلقائياً"
    }
  ]
}
```

---

## 3. Step 2: Define Database Models (`models.py`)

Create `backend/app/modules/loyalty_rewards/models.py`:

```python
from __future__ import annotations

import enum
from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
from app.core.tenancy import TenantScoped


class LoyaltyTier(str, enum.Enum):
    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"


class TransactionType(str, enum.Enum):
    EARN = "EARN"
    REDEEM = "REDEEM"
    ADJUSTMENT = "ADJUSTMENT"


class LoyaltyAccount(TenantScoped, Base):
    __tablename__ = "mod_loyalty_accounts"
    __table_args__ = (
        UniqueConstraint("tenant_id", "customer_id", name="uq_tenant_customer_loyalty"),
    )

    customer_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    customer_name = Column(String(150), nullable=False)
    points_balance = Column(Integer, default=0, nullable=False)
    total_lifetime_points = Column(Integer, default=0, nullable=False)
    tier = Column(
        Enum(LoyaltyTier, name="loyalty_tier_enum"),
        default=LoyaltyTier.BRONZE,
        nullable=False,
    )


class LoyaltyTransaction(TenantScoped, Base):
    __tablename__ = "mod_loyalty_transactions"

    account_id = Column(
        UUID(as_uuid=True),
        ForeignKey("mod_loyalty_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    transaction_type = Column(
        Enum(TransactionType, name="loyalty_tx_type_enum"),
        nullable=False,
    )
    points_delta = Column(Integer, nullable=False)  # +10 on earn, -50 on redeem
    monetary_equivalent = Column(Numeric(10, 2), default=0.00, nullable=False)
    reference_order_id = Column(String(50), nullable=True)
    notes = Column(String(255), nullable=True)
```

---

## 4. Step 3: Implement API Endpoints (`router.py`)

Create `backend/app/modules/loyalty_rewards/router.py`:

```python
from __future__ import annotations

import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user, require_perm
from app.core.modules import require_module
from app.models.user import User
from app.modules.loyalty_rewards.models import (
    LoyaltyAccount,
    LoyaltyTransaction,
    LoyaltyTier,
    TransactionType,
)

router = APIRouter(prefix="/modules/loyalty_rewards", tags=["loyalty-rewards"])


class EarnPointsRequest(BaseModel):
    customer_id: uuid.UUID
    customer_name: str
    order_id: str
    order_total: float = Field(..., gt=0)


class RedeemPointsRequest(BaseModel):
    customer_id: uuid.UUID
    points_to_redeem: int = Field(..., ge=1)
    order_id: str


@router.get("/accounts/{customer_id}")
async def get_loyalty_balance(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    _mod: bool = Depends(require_module("loyalty_rewards")),
):
    """Retrieve customer loyalty points balance and tier."""
    stmt = select(LoyaltyAccount).where(
        LoyaltyAccount.tenant_id == user.tenant_id,
        LoyaltyAccount.customer_id == customer_id,
    )
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()
    if not account:
        return {
            "customer_id": customer_id,
            "points_balance": 0,
            "tier": LoyaltyTier.BRONZE,
            "exists": False,
        }
    return {
        "customer_id": customer_id,
        "customer_name": account.customer_name,
        "points_balance": account.points_balance,
        "lifetime_points": account.total_lifetime_points,
        "tier": account.tier,
        "exists": True,
    }


@router.post("/earn")
async def earn_points_endpoint(
    req: EarnPointsRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    _mod: bool = Depends(require_module("loyalty_rewards")),
    _perm: bool = Depends(require_perm("pos.create")),
):
    """Accrue loyalty points for a completed order (1 point per 10 currency units)."""
    points_earned = int(req.order_total // 10)
    if points_earned <= 0:
        return {"earned": 0, "message": "قيمة الطلب لا تكفي لكسب نقاط"}

    stmt = select(LoyaltyAccount).where(
        LoyaltyAccount.tenant_id == user.tenant_id,
        LoyaltyAccount.customer_id == req.customer_id,
    )
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()

    if not account:
        account = LoyaltyAccount(
            tenant_id=user.tenant_id,
            customer_id=req.customer_id,
            customer_name=req.customer_name,
            points_balance=0,
            total_lifetime_points=0,
            tier=LoyaltyTier.BRONZE,
        )
        db.add(account)
        await db.flush()

    account.points_balance += points_earned
    account.total_lifetime_points += points_earned

    # Check tier upgrades
    if account.total_lifetime_points >= 1000:
        account.tier = LoyaltyTier.GOLD
    elif account.total_lifetime_points >= 300:
        account.tier = LoyaltyTier.SILVER

    # Record audit transaction
    tx = LoyaltyTransaction(
        tenant_id=user.tenant_id,
        account_id=account.id,
        transaction_type=TransactionType.EARN,
        points_delta=points_earned,
        reference_order_id=req.order_id,
        notes=f"كسب نقاط عن فاتورة رقم #{req.order_id}",
    )
    db.add(tx)
    await db.commit()

    return {
        "detail": f"تمت إضافة {points_earned} نقطة بنجاح لرصيد العميل",
        "current_balance": account.points_balance,
        "tier": account.tier,
    }
```

---

## 5. Step 4: Export Symbols (`__init__.py`)

Create `backend/app/modules/loyalty_rewards/__init__.py`:

```python
from app.modules.loyalty_rewards.models import LoyaltyAccount, LoyaltyTransaction
from app.modules.loyalty_rewards.router import router

__all__ = ["LoyaltyAccount", "LoyaltyTransaction", "router"]
```

---

## 6. Step 5: Verification & Testing

### 1. Verify Auto-Discovery:
Restart the backend or invoke Python:
```python
from app.modules.loader import registry
manifests = registry.discover_modules()
assert "loyalty_rewards" in manifests
print("Discovered:", manifests["loyalty_rewards"].name)
```

### 2. Verify OpenAPI Documentation:
Navigate to `http://localhost:8000/docs`. You will see the **`loyalty-rewards`** group with all declared endpoints!

### 3. Test Zero-Code Settings:
Open the browser at `http://localhost:5173/Mizan/modules` -> Locate **"نقاط الولاء ومكافآت العملاء"** -> Click **"إعدادات"**.  
Mizan will automatically render the 4 input fields we declared in `manifest.json`!

---

## 7. Step 6: Packaging for Distribution

Compress your module into a distributable `.zip` archive:

```bash
cd backend/app/modules/
zip -r loyalty_rewards.zip loyalty_rewards/
```

You can now upload `loyalty_rewards.zip` to any other Mizan ERP server via the Admin UI or via curl!
