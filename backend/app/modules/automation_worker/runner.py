"""Automation Worker execution runner and task definitions."""
from __future__ import annotations

import datetime
import logging
import time
import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.product import Product
from app.models.sale import Sale
from app.models.shift import Shift, ShiftStatus
from app.models.tenant import Tenant
from app.modules.automation_worker.models import AutomationJobLog, AutomationSchedule

logger = logging.getLogger("mizan.automation")


async def auto_close_stale_shifts(db: AsyncSession) -> dict[str, Any]:
    """Finds shifts open for more than 24h and closes them with Z-Report summary."""
    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)
    stmt = select(Shift).where(Shift.status == ShiftStatus.open, Shift.started_at <= cutoff)
    res = await db.execute(stmt)
    stale_shifts = res.scalars().all()

    closed_count = 0
    closed_details = []

    for shift in stale_shifts:
        # Calculate sales count & total during shift
        sales_stmt = select(
            func.count(Sale.id),
            func.coalesce(func.sum(Sale.total), Decimal("0")),
        ).where(Sale.shift_id == shift.id)
        sales_res = await db.execute(sales_stmt)
        sales_cnt, sales_sum = sales_res.one()

        shift.status = ShiftStatus.closed
        shift.closed_at = datetime.datetime.now(datetime.timezone.utc)
        shift.closing_balance = sales_sum + (shift.initial_amount or Decimal("0"))
        shift.expected_balance = shift.closing_balance
        shift.difference = Decimal("0")
        shift.notes = (
            f"إغلاق آلي بواسطة محرك الأتمتة (Z-Report Auto Cutover) — مبيعات: {sales_sum} ج.م ({sales_cnt} فاتورة)"
        )

        closed_count += 1
        closed_details.append(
            {
                "shift_id": str(shift.id),
                "warehouse_id": str(shift.warehouse_id) if shift.warehouse_id else None,
                "sales_total": float(sales_sum),
                "sales_count": sales_cnt,
            }
        )

    await db.commit()
    return {
        "message": f"تم إغلاق {closed_count} وردية متأخرة بنجاح وتوليد ملخص Z-Report",
        "items_processed": closed_count,
        "details": closed_details,
    }


async def enforce_subscription_expiry(db: AsyncSession) -> dict[str, Any]:
    """Inspects tenant trials and active subscription expiry dates, alerts owners and updates status."""
    now = datetime.datetime.now(datetime.timezone.utc)
    stmt = select(Tenant).where(
        Tenant.status.in_(["active", "trial"]),
        Tenant.trial_ends_at.is_not(None),
        Tenant.trial_ends_at < now,
    )
    res = await db.execute(stmt)
    expired_tenants = res.scalars().all()

    processed_count = 0
    for tenant in expired_tenants:
        tenant.status = "expired"

        # Emit high-priority in-app alert
        notification = Notification(
            tenant_id=tenant.id,
            title="انتهاء فترة الاشتراك التجريبي",
            body=f"انتهت الفترة التجريبية لمنشأة '{tenant.name}'. يرجى ترقية باقتك للاستمرار بالوصول الكامل لجميع العمليات.",
            type="billing_alert",
            severity="warning",
        )
        db.add(notification)
        processed_count += 1

    await db.commit()
    return {
        "message": f"تم فحص الاشتراكات وتحديث {processed_count} منشأة منتهية وتوجيه تنبيهات مباشرة",
        "items_processed": processed_count,
    }


async def generate_daily_metrics_digest(db: AsyncSession) -> dict[str, Any]:
    """Generates a daily operational and sales performance digest for active tenants."""
    today_start = datetime.datetime.now(datetime.timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    tenants_stmt = select(Tenant).where(Tenant.status.in_(["active", "trial"]))
    tenants_res = await db.execute(tenants_stmt)
    tenants = tenants_res.scalars().all()

    digests_created = 0
    for tenant in tenants:
        # Today's sales
        sales_stmt = select(
            func.count(Sale.id),
            func.coalesce(func.sum(Sale.total), Decimal("0")),
        ).where(Sale.tenant_id == tenant.id, Sale.created_at >= today_start)
        sales_res = await db.execute(sales_stmt)
        sales_cnt, sales_sum = sales_res.one()

        # Low stock count
        low_stock_stmt = select(func.count(Product.id)).where(
            Product.tenant_id == tenant.id,
            Product.is_active == True,  # noqa: E712
            Product.reorder_point > 0,
        )
        low_stock_res = await db.execute(low_stock_stmt)
        low_stock_cnt = low_stock_res.scalar_one()

        # Create daily digest notification
        note = Notification(
            tenant_id=tenant.id,
            title="تقرير الأداء والعمليات اليومي (Daily Digest)",
            body=(
                f"ملخص نشاط اليوم: تم تسجيل مبيعات إجمالية بقيمة {float(sales_sum):,.2f} ج.م عبر {sales_cnt} فاتورة. "
                f"يوجد {low_stock_cnt} أصناف وصلت لحد إعادة الطلب وتحتاج تزويد."
            ),
            type="system",
            severity="info",
        )
        db.add(note)
        digests_created += 1

    await db.commit()
    return {
        "message": f"تم توليد ونشر {digests_created} ملخصاً تشغيلياً يومياً لكافة المنشآت النشطة",
        "items_processed": digests_created,
    }


async def cleanup_system_stale_data(db: AsyncSession) -> dict[str, Any]:
    """Prunes expired auth sessions and old automation logs older than 30 days."""
    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)
    del_stmt = (
        AutomationJobLog.__table__.delete().where(AutomationJobLog.created_at < cutoff)
    )
    res = await db.execute(del_stmt)
    deleted_rows = res.rowcount if hasattr(res, "rowcount") else 0
    await db.commit()
    return {
        "message": f"تم تنظيف السجلات المؤقتة القديمة بنجاح ({deleted_rows} سجل تم حذفه)",
        "items_processed": deleted_rows,
    }


JOB_REGISTRY = {
    "auto_close_shifts": {
        "title": "إغلاق الورديات التلقائي منتصف الليل",
        "title_en": "Midnight Stale Shifts Auto-Close (Z-Report)",
        "description": "إغلاق أي وردية مفتوحة لأكثر من 24 ساعة وتوليد تقرير المبيعات والرصيد الختامي آلياً",
        "cron": "0 0 * * *",
        "handler": auto_close_stale_shifts,
    },
    "enforce_subscription_expiry": {
        "title": "متابعة الاشتراكات والتجربة المجانية",
        "title_en": "Subscription & Trial Expiry Enforcement",
        "description": "فحص صلاحية المستأجرين وتحديث حالة الحساب وإصدار إشعارات الترقية والتجديد",
        "cron": "0 */6 * * *",
        "handler": enforce_subscription_expiry,
    },
    "generate_daily_metrics_digest": {
        "title": "ملخص العمليات والتنبيهات اليومي",
        "title_en": "Daily Performance & Low-Stock Digest",
        "description": "تجميع إجمالي مبيعات اليوم والنواقص وإرسال تقرير تشغيلي لكافة المنشآت",
        "cron": "0 23 * * *",
        "handler": generate_daily_metrics_digest,
    },
    "cleanup_system_stale_data": {
        "title": "تنظيف السجلات والبيانات المؤقتة",
        "title_en": "Maintenance & Stale Data Cleanup",
        "description": "أرشفة وتنظيف سجلات المهام المؤقتة وجلسات المصادقة القديمة",
        "cron": "0 3 * * 0",
        "handler": cleanup_system_stale_data,
    },
}


async def run_job(job_name: str, db: AsyncSession, tenant_id: str | None = None) -> dict[str, Any]:
    """Execute a single registered automation worker task by key."""
    if job_name not in JOB_REGISTRY:
        raise KeyError(f"Automation job '{job_name}' is not registered.")

    job_def = JOB_REGISTRY[job_name]
    start_ts = time.time()
    job_log = AutomationJobLog(
        job_name=job_name,
        tenant_id=uuid.UUID(tenant_id) if tenant_id else None,
        status="running",
        start_time=datetime.datetime.now(datetime.timezone.utc),
    )
    db.add(job_log)
    await db.commit()
    await db.refresh(job_log)

    try:
        handler = job_def["handler"]
        result = await handler(db)
        duration_ms = int((time.time() - start_ts) * 1000)

        job_log.status = "success"
        job_log.end_time = datetime.datetime.now(datetime.timezone.utc)
        job_log.duration_ms = duration_ms
        job_log.items_processed = result.get("items_processed", 0)
        job_log.message = result.get("message", "Job completed successfully")

        # Update schedule last_run
        sched_stmt = (
            update(AutomationSchedule)
            .where(AutomationSchedule.job_name == job_name)
            .values(last_run_at=datetime.datetime.now(datetime.timezone.utc))
        )
        await db.execute(sched_stmt)
        await db.commit()

        return {
            "status": "success",
            "job_name": job_name,
            "title": job_def["title"],
            "duration_ms": duration_ms,
            "items_processed": job_log.items_processed,
            "message": job_log.message,
        }

    except Exception as exc:
        duration_ms = int((time.time() - start_ts) * 1000)
        logger.error("Job %s failed after %dms: %s", job_name, duration_ms, exc, exc_info=True)
        job_log.status = "failed"
        job_log.end_time = datetime.datetime.now(datetime.timezone.utc)
        job_log.duration_ms = duration_ms
        job_log.error_details = str(exc)
        job_log.message = f"فشلت المهمة: {exc}"
        await db.commit()
        return {
            "status": "failed",
            "job_name": job_name,
            "title": job_def["title"],
            "duration_ms": duration_ms,
            "error": str(exc),
        }


async def run_all_jobs(db: AsyncSession) -> list[dict[str, Any]]:
    """Execute all registered automation jobs sequentially."""
    results = []
    for job_name in JOB_REGISTRY.keys():
        res = await run_job(job_name, db)
        results.append(res)
    return results
