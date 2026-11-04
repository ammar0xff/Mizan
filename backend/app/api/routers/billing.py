"""Billing & Monetization Router: Checkout, Subscriptions & Automated Plan Activation."""
from __future__ import annotations

import random
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.plans import PLANS_CONFIG, get_plan, get_plan_limits
from app.core.tenancy import current_tenant_id
from app.db.base import get_db
from app.dependencies import get_current_user
from app.models.billing import BillingInvoice
from app.models.tenant import Subscription, Tenant
from app.models.user import User
from app.services.plan_gating import get_tenant_limits_and_usage

router = APIRouter(prefix="/billing", tags=["billing"])


# Pydantic Schemas
class CheckoutRequest(BaseModel):
    plan: str = Field(description="starter | pro | enterprise")
    billing_cycle: str = Field(default="monthly", description="monthly | annual")
    payment_method: str = Field(default="card", description="card | fawry | instapay | vodafone_cash")
    contact_phone: Optional[str] = Field(default=None, max_length=32)


class SimulatePaymentRequest(BaseModel):
    invoice_ref: str
    gateway_transaction_id: Optional[str] = None


class WebhookPayload(BaseModel):
    invoice_ref: str
    status: str = "paid"
    transaction_id: str
    amount_cents: int
    currency: str = "EGP"


@router.get("/plans")
async def list_available_plans() -> dict[str, Any]:
    """Return all public SaaS subscription plans and tiers."""
    return {"plans": list(PLANS_CONFIG.values())}


@router.get("/subscription")
async def get_my_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Return current tenant's subscription status, quotas, and recent invoices."""
    tid = current_tenant_id.get() or current_user.tenant_id
    if not tid:
        raise HTTPException(status_code=400, detail="لا توجد مساحة عمل مرتبطة")

    usage = await get_tenant_limits_and_usage(db, tid)

    # Invoices
    q_invoices = await db.execute(
        select(BillingInvoice)
        .where(BillingInvoice.tenant_id == tid)
        .order_by(desc(BillingInvoice.created_at))
        .limit(10)
    )
    invoices = q_invoices.scalars().all()

    return {
        **usage,
        "invoices": [
            {
                "id": str(inv.id),
                "invoice_ref": inv.invoice_ref,
                "plan": inv.plan,
                "billing_cycle": inv.billing_cycle,
                "amount_egp": inv.amount_egp,
                "payment_method": inv.payment_method,
                "status": inv.status,
                "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
                "period_end": inv.period_end.isoformat() if inv.period_end else None,
                "created_at": inv.created_at.isoformat() if inv.created_at else None,
            }
            for inv in invoices
        ],
    }


@router.post("/checkout")
async def create_checkout_session(
    payload: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Initiate subscription checkout session with Paymob / Fawry / InstaPay."""
    tid = current_tenant_id.get() or current_user.tenant_id
    if not tid:
        raise HTTPException(status_code=400, detail="لا توجد مساحة عمل مرتبطة")

    plan_cfg = get_plan(payload.plan)
    if plan_cfg["id"] == "trial":
        raise HTTPException(status_code=400, detail="لا يمكن ترقية الحساب إلى الباقة التجريبية")

    # Compute price
    is_annual = payload.billing_cycle.lower() == "annual"
    amount = plan_cfg["price_annual_egp"] if is_annual else plan_cfg["price_monthly_egp"]

    # Generate invoice reference
    now = datetime.now(UTC)
    invoice_ref = f"INV-{now.strftime('%Y%m')}-{random.randint(1000, 9999)}"

    # Determine period
    period_days = 365 if is_annual else 30
    period_end = now + timedelta(days=period_days)

    invoice = BillingInvoice(
        id=uuid.uuid4(),
        tenant_id=tid,
        invoice_ref=invoice_ref,
        plan=payload.plan,
        billing_cycle="annual" if is_annual else "monthly",
        amount_egp=float(amount),
        payment_method=payload.payment_method,
        status="pending",
        period_start=now,
        period_end=period_end,
    )
    db.add(invoice)

    # Record in subscriptions table for traceability
    sub = Subscription(
        id=uuid.uuid4(),
        tenant_id=tid,
        plan=payload.plan,
        status="checkout_initiated",
        contact_phone=payload.contact_phone,
    )
    db.add(sub)
    await db.commit()

    # Generate payment gateway instructions
    payment_meta = {}
    if payload.payment_method == "fawry":
        fawry_code = f"788{random.randint(1000000, 9999999)}"
        payment_meta = {
            "type": "fawry",
            "fawry_ref": fawry_code,
            "expiry_hours": 48,
            "instructions": f"ادفع في أي منفذ فوري أو عبر تطبيق فوري باي بكود الخدمة (788) والرقم المرجعي: {fawry_code}",
        }
    elif payload.payment_method == "instapay":
        payment_meta = {
            "type": "instapay",
            "ipa_address": "mizan.enterprise@instapay",
            "reference_note": invoice_ref,
            "instructions": f"قم بالتحويل عبر تطبيق إنستاباي إلى العنوان (mizan.enterprise@instapay) مع كتابة الرقم المرجعي ({invoice_ref}) في خانة البيان.",
        }
    else:  # card (Paymob)
        payment_meta = {
            "type": "card",
            "checkout_url": f"/billing/pay/{invoice_ref}",
            "mock_client_secret": f"paymob_sec_{uuid.uuid4().hex[:16]}",
            "instructions": "سيتم توجيهك إلى بوابة الدفع الآمنة (Visa / MasterCard / Meeza)",
        }

    return {
        "invoice_ref": invoice_ref,
        "plan": payload.plan,
        "plan_name": plan_cfg["name"],
        "amount_egp": amount,
        "billing_cycle": "سنوي" if is_annual else "شهري",
        "payment_method": payload.payment_method,
        "payment_meta": payment_meta,
        "status": "pending",
        "message": "تم إنشاء طلب السداد بنجاح",
    }


@router.post("/simulate-payment")
async def simulate_payment(
    payload: SimulatePaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Test payment simulation endpoint for instant demo/staging plan activation."""
    stmt = select(BillingInvoice).where(BillingInvoice.invoice_ref == payload.invoice_ref)
    inv = (await db.execute(stmt)).scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="فاتورة الاشتراك غير موجودة")

    if inv.status == "paid":
        return {"ok": True, "message": "الفاتورة مسددة ومفعلة بالفعل", "plan": inv.plan}

    # Activate Invoice
    now = datetime.now(UTC)
    inv.status = "paid"
    inv.paid_at = now
    inv.payment_gateway_ref = payload.gateway_transaction_id or f"TXN-SIM-{uuid.uuid4().hex[:10].upper()}"

    # Activate Tenant Plan
    stmt_t = select(Tenant).where(Tenant.id == inv.tenant_id)
    tenant = (await db.execute(stmt_t)).scalar_one_or_none()
    if tenant:
        tenant.plan = inv.plan
        tenant.status = "active"
        tenant.limits = get_plan_limits(inv.plan)
        # End trial and grant full subscription period
        tenant.trial_ends_at = None

    # Update subscription record
    stmt_s = select(Subscription).where(Subscription.tenant_id == inv.tenant_id).order_by(desc(Subscription.created_at))
    sub = (await db.execute(stmt_s)).scalars().first()
    if sub:
        sub.status = "active"

    await db.commit()

    return {
        "ok": True,
        "invoice_ref": inv.invoice_ref,
        "plan": inv.plan,
        "activated_plan": inv.plan,
        "limits": tenant.limits if tenant else {},
        "amount_paid_egp": inv.amount_egp,
        "paid_at": inv.paid_at.isoformat(),
        "message": f"تم سداد الفاتورة بنجاح وتفعيل '{get_plan(inv.plan)['name']}' فورياً لمساحة العمل!",
    }


@router.post("/webhook")
async def payment_gateway_webhook(
    payload: WebhookPayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Live Payment Gateway Webhook (Paymob / Fawry / Stripe)."""
    stmt = select(BillingInvoice).where(BillingInvoice.invoice_ref == payload.invoice_ref)
    inv = (await db.execute(stmt)).scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice reference not found")

    if payload.status == "paid":
        now = datetime.now(UTC)
        inv.status = "paid"
        inv.paid_at = now
        inv.payment_gateway_ref = payload.transaction_id

        # Upgrade Tenant
        stmt_t = select(Tenant).where(Tenant.id == inv.tenant_id)
        tenant = (await db.execute(stmt_t)).scalar_one_or_none()
        if tenant:
            tenant.plan = inv.plan
            tenant.status = "active"
            tenant.limits = get_plan_limits(inv.plan)
            tenant.trial_ends_at = None

        await db.commit()
        return {"status": "success", "message": f"Plan {inv.plan} activated for tenant"}

    inv.status = "failed"
    await db.commit()
    return {"status": "failed", "message": "Transaction marked as failed"}
