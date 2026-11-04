"""Seed realistic Egyptian SaaS billing invoices and subscriptions for Mizan."""
import asyncio
import uuid
from datetime import UTC, datetime, timedelta
from app.db.base import AsyncSessionLocal
from app.models.tenant import Tenant, Subscription
from app.models.billing import BillingInvoice
from sqlalchemy import select

async def seed_billing():
    async with AsyncSessionLocal() as session:
        # Get first tenant or create reference
        res = await session.execute(select(Tenant))
        tenants = res.scalars().all()
        if not tenants:
            print("No tenants found!")
            return

        main_tenant = tenants[0]
        print(f"Seeding billing records for tenant: {main_tenant.name} ({main_tenant.id})")

        # Check existing invoices
        res_inv = await session.execute(select(BillingInvoice))
        existing = res_inv.scalars().first()
        if existing:
            print("Billing invoices already seeded.")
            return

        now = datetime.now(UTC)
        invoices = [
            BillingInvoice(
                id=uuid.uuid4(),
                tenant_id=main_tenant.id,
                invoice_ref="INV-202610-1042",
                plan="pro",
                billing_cycle="monthly",
                amount_egp=850.0,
                payment_method="card",
                payment_gateway_ref="PAYMOB_TXN_981249",
                status="paid",
                paid_at=now - timedelta(days=32),
                period_start=now - timedelta(days=32),
                period_end=now - timedelta(days=2),
                notes="تجديد شهري باقة المحترفين - فيزا مصرية",
                created_at=now - timedelta(days=32),
            ),
            BillingInvoice(
                id=uuid.uuid4(),
                tenant_id=main_tenant.id,
                invoice_ref="INV-202611-2091",
                plan="enterprise",
                billing_cycle="monthly",
                amount_egp=1950.0,
                payment_method="instapay",
                payment_gateway_ref="INSTAPAY_REF_88124",
                status="paid",
                paid_at=now - timedelta(days=1),
                period_start=now - timedelta(days=1),
                period_end=now + timedelta(days=29),
                notes="ترقية إلى باقة المؤسسات الكبرى - تحويل إنستاباي",
                created_at=now - timedelta(days=1),
            ),
        ]

        # If there are more tenants, seed invoices for them too
        if len(tenants) > 1:
            invoices.append(
                BillingInvoice(
                    id=uuid.uuid4(),
                    tenant_id=tenants[1].id,
                    invoice_ref="INV-202611-3015",
                    plan="starter",
                    billing_cycle="annual",
                    amount_egp=4500.0,
                    payment_method="fawry",
                    payment_gateway_ref="FAWRY_REF_7881923",
                    status="pending",
                    period_start=now,
                    period_end=now + timedelta(days=365),
                    notes="اشتراك سنوي باقة البداية - فوري باي",
                    created_at=now,
                )
            )

        for inv in invoices:
            session.add(inv)

        await session.commit()
        print("Successfully seeded billing invoices!")

if __name__ == "__main__":
    asyncio.run(seed_billing())
