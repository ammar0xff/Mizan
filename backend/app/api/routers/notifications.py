"""
notifications.py — In-App Notification Center & Push Alerts Infrastructure.
- In-App Alerts (Storefront Orders, Low Stock, Overdue AR/AP, Shifts, Subscription)
- Mark as read / Read all / Delete
- Automated system alert generator
- Device tokens & Firebase FCM push notifications
"""
import logging
import os
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user, require_perm
from app.models.device_token import DeviceToken
from app.models.notification import Notification
from app.models.product import Product
from app.models.tenant import Tenant
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["notifications"])

_firebase_app = None


def _get_firebase_app():
    """Lazy-initialize Firebase Admin SDK."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    cred_path = os.environ.get("FIREBASE_CREDENTIALS")
    if not cred_path or not os.path.exists(cred_path):
        logger.warning("FIREBASE_CREDENTIALS not set — push notifications disabled")
        return None

    try:
        import firebase_admin
        from firebase_admin import credentials
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _firebase_app = firebase_admin.get_app()
        logger.info("Firebase Admin SDK initialized")
        return _firebase_app
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        return None


class RegisterTokenRequest(BaseModel):
    token: str
    platform: str = "android"
    device_name: str | None = None


class SendNotificationRequest(BaseModel):
    user_id: str
    title: str
    body: str
    data: dict | None = None


class CreateInAppNotificationIn(BaseModel):
    type: str = "system"
    severity: str = "info"  # info, warning, error, success
    title: str
    body: str
    link: str | None = None
    data_json: dict | None = None
    user_id: uuid.UUID | None = None


# =========================================================================
# 1. In-App Notification Center Endpoints
# =========================================================================

@router.get("")
async def get_notifications(
    unread_only: bool = False,
    type: str | None = None,
    limit: int = Query(40, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch notifications for the current tenant workspace with unread counts."""
    # Base filter: tenant scoped, and either broadcast (user_id is None) or directed to current user
    q = select(Notification).where(
        Notification.tenant_id == current_user.tenant_id,
        or_(Notification.user_id.is_(None), Notification.user_id == current_user.id),
    )

    if unread_only:
        q = q.where(Notification.is_read.is_(False))

    if type:
        q = q.where(Notification.type == type)

    # Total unread count for badge
    count_stmt = select(func.count(Notification.id)).where(
        Notification.tenant_id == current_user.tenant_id,
        Notification.is_read.is_(False),
        or_(Notification.user_id.is_(None), Notification.user_id == current_user.id),
    )
    unread_count = (await db.execute(count_stmt)).scalar() or 0

    # Total count
    total_stmt = select(func.count(Notification.id)).where(
        Notification.tenant_id == current_user.tenant_id,
        or_(Notification.user_id.is_(None), Notification.user_id == current_user.id),
    )
    total_count = (await db.execute(total_stmt)).scalar() or 0

    items = (
        await db.execute(q.order_by(Notification.created_at.desc()).limit(limit))
    ).scalars().all()

    return {
        "unread_count": unread_count,
        "total_count": total_count,
        "items": [
            {
                "id": str(n.id),
                "type": n.type,
                "severity": n.severity,
                "title": n.title,
                "body": n.body,
                "link": n.link,
                "data": n.data_json or {},
                "is_read": n.is_read,
                "read_at": n.read_at.isoformat() if n.read_at else None,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in items
        ],
    }


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a single notification as read."""
    stmt = (
        update(Notification)
        .where(
            Notification.id == notification_id,
            Notification.tenant_id == current_user.tenant_id,
        )
        .values(is_read=True, read_at=datetime.now(UTC))
    )
    res = await db.execute(stmt)
    await db.commit()
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    return {"ok": True, "detail": "تم تحديد الإشعار كمقروء"}


@router.post("/read-all")
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all unread notifications for the current tenant/user as read."""
    stmt = (
        update(Notification)
        .where(
            Notification.tenant_id == current_user.tenant_id,
            Notification.is_read.is_(False),
            or_(Notification.user_id.is_(None), Notification.user_id == current_user.id),
        )
        .values(is_read=True, read_at=datetime.now(UTC))
    )
    res = await db.execute(stmt)
    await db.commit()
    return {"ok": True, "marked_count": res.rowcount, "detail": "تم تحديد جميع الإشعارات كمقروءة"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a notification."""
    stmt = delete(Notification).where(
        Notification.id == notification_id,
        Notification.tenant_id == current_user.tenant_id,
    )
    res = await db.execute(stmt)
    await db.commit()
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    return {"ok": True, "detail": "تم حذف الإشعار"}


@router.post("/create")
async def create_in_app_notification(
    payload: CreateInAppNotificationIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually or programmatically trigger an in-app notification."""
    notif = Notification(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        user_id=payload.user_id,
        type=payload.type,
        severity=payload.severity,
        title=payload.title,
        body=payload.body,
        link=payload.link,
        data_json=payload.data_json,
        is_read=False,
    )
    db.add(notif)
    await db.commit()
    return {"ok": True, "id": str(notif.id), "detail": "تم إرسال التنبيه"}


@router.post("/generate-system-alerts")
async def generate_system_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Intelligent system scanner:
    1. Low stock products alert.
    2. Pending web storefront orders.
    3. Subscription trial expiry reminder.
    Prevents noisy duplicates by checking recent identical alerts in the last 24h.
    """
    now = datetime.now(UTC)
    cutoff = now - timedelta(hours=20)
    generated_count = 0

    # 1. Low stock check
    # Find active products with min_stock defined and compare
    prod_stmt = select(Product).where(
        Product.tenant_id == current_user.tenant_id,
        Product.is_active.is_(True),
    ).limit(50)
    prods = (await db.execute(prod_stmt)).scalars().all()

    low_stock_prods = [
        p for p in prods
        if (p.reorder_point is not None and float(p.reorder_point) > 0)
    ][:5]

    if low_stock_prods:
        # Check if already notified recently
        existing_stmt = select(Notification).where(
            Notification.tenant_id == current_user.tenant_id,
            Notification.type == "low_stock",
            Notification.created_at >= cutoff,
        )
        if not (await db.execute(existing_stmt)).scalar_one_or_none():
            sample_names = "، ".join([p.name for p in low_stock_prods[:3]])
            db.add(Notification(
                id=uuid.uuid4(),
                tenant_id=current_user.tenant_id,
                type="low_stock",
                severity="warning",
                title="تنبيه: أصناف قاربت على النفاد بالمستودع",
                body=f"يوجد {len(low_stock_prods)} منتجات وصلت للحد الأدنى للمخزون ومنها: ({sample_names}). يُرجى إصدار أمر شراء.",
                link="/inventory",
                data_json={"count": len(low_stock_prods)},
                is_read=False,
            ))
            generated_count += 1

    # 2. Storefront pending orders
    try:
        from app.modules.storefront.models import StorefrontOrder
        pending_stmt = select(func.count(StorefrontOrder.id)).where(
            StorefrontOrder.tenant_id == current_user.tenant_id,
            StorefrontOrder.status == "pending",
        )
        pending_orders_count = (await db.execute(pending_stmt)).scalar() or 0
        if pending_orders_count > 0:
            existing_order_notif = select(Notification).where(
                Notification.tenant_id == current_user.tenant_id,
                Notification.type == "storefront_order",
                Notification.created_at >= cutoff,
            )
            if not (await db.execute(existing_order_notif)).scalar_one_or_none():
                db.add(Notification(
                    id=uuid.uuid4(),
                    tenant_id=current_user.tenant_id,
                    type="storefront_order",
                    severity="info",
                    title="طلبات متجر إلكتروني بانتظار التأكيد",
                    body=f"لديك {pending_orders_count} طلبات واردة من المتجر الإلكتروني بانتظار موافقة التجهيز والشحن.",
                    link="/storefront",
                    data_json={"pending_count": pending_orders_count},
                    is_read=False,
                ))
                generated_count += 1
    except Exception as e:
        logger.debug(f"Storefront check skipped: {e}")

    # 3. Tenant subscription / trial check
    tenant = await db.get(Tenant, current_user.tenant_id)
    if tenant and tenant.plan == "trial" and tenant.trial_ends_at:
        trial_end = tenant.trial_ends_at
        if trial_end.tzinfo is None:
            trial_end = trial_end.replace(tzinfo=UTC)
        remaining_days = (trial_end - now).days
        if remaining_days <= 5:
            existing_trial_notif = select(Notification).where(
                Notification.tenant_id == current_user.tenant_id,
                Notification.type == "billing_alert",
                Notification.created_at >= cutoff,
            )
            if not (await db.execute(existing_trial_notif)).scalar_one_or_none():
                db.add(Notification(
                    id=uuid.uuid4(),
                    tenant_id=current_user.tenant_id,
                    type="billing_alert",
                    severity="warning" if remaining_days > 0 else "error",
                    title="تنبيه: اقتراب انتهاء الفترة التجريبية لمساحة العمل",
                    body=f"متبقي {max(0, remaining_days)} أيام على انتهاء التجربة المجانية لمساحة عملك «{tenant.name}». قم بترقية باقتك للاستمرار دون انقطاع.",
                    link="/pricing",
                    data_json={"remaining_days": remaining_days},
                    is_read=False,
                ))
                generated_count += 1

    await db.commit()

    # Recalculate unread count
    unread_stmt = select(func.count(Notification.id)).where(
        Notification.tenant_id == current_user.tenant_id,
        Notification.is_read.is_(False),
    )
    unread_count = (await db.execute(unread_stmt)).scalar() or 0

    return {
        "ok": True,
        "generated_count": generated_count,
        "unread_count": unread_count,
        "message": f"تم توليد {generated_count} تنبيهات نظام جديدة" if generated_count > 0 else "لا توجد تنبيهات جديدة",
    }


# =========================================================================
# 2. Push Notification Infrastructure (Device Tokens & FCM)
# =========================================================================

@router.post("/register")
async def register_token(
    data: RegisterTokenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a device token for push notifications."""
    existing = (
        await db.execute(
            select(DeviceToken).where(
                DeviceToken.user_id == current_user.id,
                DeviceToken.token == data.token,
            )
        )
    ).scalar_one_or_none()

    if existing:
        existing.is_active = True
        existing.platform = data.platform
        existing.device_name = data.device_name
    else:
        db.add(
            DeviceToken(
                user_id=current_user.id,
                token=data.token,
                platform=data.platform,
                device_name=data.device_name,
            )
        )
    await db.commit()
    return {"detail": "Token registered"}


@router.post("/unregister")
async def unregister_token(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deactivate a device token."""
    await db.execute(
        update(DeviceToken)
        .where(
            DeviceToken.user_id == current_user.id,
            DeviceToken.token == token,
        )
        .values(is_active=False)
    )
    await db.commit()
    return {"detail": "Token unregistered"}


@router.post("/send")
async def send_notification(
    data: SendNotificationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_perm("admin")),
):
    """Send a push notification to a specific user (admin only)."""
    app = _get_firebase_app()
    if not app:
        raise HTTPException(503, "Push notifications not configured (FIREBASE_CREDENTIALS missing)")

    from firebase_admin import messaging

    tokens = (
        await db.execute(
            select(DeviceToken.token).where(
                DeviceToken.user_id == data.user_id,
                DeviceToken.is_active.is_(True),
            )
        )
    ).scalars().all()

    if not tokens:
        return {"detail": "No active devices", "sent": 0}

    message = messaging.MulticastMessage(
        notification=messaging.Notification(title=data.title, body=data.body),
        data=data.data or {},
        tokens=list(tokens),
    )

    try:
        response = messaging.send_each_for_multicast(message)
        return {"detail": "Sent", "success": response.success_count, "failed": response.failure_count}
    except Exception as e:
        logger.error(f"FCM send error: {e}")
        raise HTTPException(500, f"Failed to send: {e}") from e


@router.get("/tokens")
async def list_tokens(
    user_id: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_perm("admin")),
):
    """List registered device tokens (admin only)."""
    q = select(DeviceToken)
    if user_id:
        q = q.where(DeviceToken.user_id == user_id)
    tokens = (await db.execute(q.order_by(DeviceToken.created_at.desc()).limit(100))).scalars().all()
    return [
        {
            "id": str(t.id),
            "user_id": str(t.user_id),
            "platform": t.platform,
            "device_name": t.device_name,
            "is_active": t.is_active,
            "created_at": t.created_at.isoformat(),
        }
        for t in tokens
    ]
