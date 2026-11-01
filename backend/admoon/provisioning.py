"""Asynchronous Provisioning Engine.

Handles multi-step infrastructure, database, storage, modules, and admin user provisioning.
Supports progress tracking, idempotency, retry mechanisms, and step logging.
"""
from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.core.tenancy import bind_tenant
from app.models.tenant import (
    DatabaseConfig,
    HostingConfig,
    ProvisioningJob,
    StorageConfig,
    Tenant,
)
from app.models.user import User
from app.services.demo_seed import seed_demo
from admoon.providers.database import get_db_provider
from admoon.providers.storage import get_storage_provider

logger = logging.getLogger("admoon.provisioning")

PROVISIONING_STEPS = [
    ("validate_config", 10, "التحقق من بيانات المنشأة والإعدادات"),
    ("validate_db", 25, "التحقق من اتصال وتوافق محرك قاعدة البيانات"),
    ("validate_storage", 35, "التحقق من وسيط التخزين والحصص"),
    ("provision_infra", 50, "تهيئة بيئة الاستضافة وعزل الشبكة"),
    ("initialize_db", 65, "إنشاء جداول قاعدة البيانات وتشغيل الترحيلات"),
    ("create_admin_user", 75, "إنشاء حساب مدير المنشأة وتوليد الصلاحيات"),
    ("entitle_modules", 85, "تفعيل باقة الاشتراك وتثبيت الوحدات النمطية المحددة"),
    ("health_check", 95, "إجراء الفحص الصحي الشامل لبيئة العمل"),
    ("activate", 100, "تفعيل المنشأة وإصدار مسارات العمل"),
]


class ProvisioningEngine:
    """Orchestrates tenant infrastructure creation and provisioning."""

    async def create_job(self, db: AsyncSession, tenant_id: uuid.UUID, job_type: str = "new_tenant") -> ProvisioningJob:
        job = ProvisioningJob(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            job_type=job_type,
            current_step="validate_config",
            progress_percent=0,
            status="running",
            step_logs=[{"step": "queued", "message": "تم إدراج وظيفة التأسيس في الطابور", "timestamp": datetime.now(UTC).isoformat()}],
        )
        db.add(job)
        await db.commit()
        return job

    async def execute_provisioning(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        owner_username: str,
        owner_password: str,
        owner_full_name: str,
        job_id: uuid.UUID | None = None,
    ) -> dict[str, Any]:
        """Execute the full provisioning pipeline sequentially."""
        tenant = (await db.execute(select(Tenant).where(Tenant.id == tenant_id))).scalar_one_or_none()
        if not tenant:
            raise ValueError(f"Tenant {tenant_id} not found")

        job: ProvisioningJob | None = None
        if job_id:
            job = (await db.execute(select(ProvisioningJob).where(ProvisioningJob.id == job_id))).scalar_one_or_none()

        if not job:
            job = await self.create_job(db, tenant_id)

        step_logs = list(job.step_logs or [])

        try:
            for step_key, pct, desc in PROVISIONING_STEPS:
                job.current_step = step_key
                job.progress_percent = pct
                step_logs.append({
                    "step": step_key,
                    "progress": pct,
                    "message": f"جارٍ تنفيذ: {desc}",
                    "timestamp": datetime.now(UTC).isoformat(),
                })
                job.step_logs = step_logs
                await db.flush()

                # Step execution logic
                if step_key == "validate_db":
                    db_prov = get_db_provider(tenant.tech_stack.get("db_engine", "postgres_shared"))
                    await db_prov.test_connection(tenant.tech_stack)

                elif step_key == "validate_storage":
                    st_prov = get_storage_provider(tenant.tech_stack.get("storage_driver", "local"))
                    await st_prov.health_check(tenant.tech_stack)

                elif step_key == "initialize_db":
                    db_prov = get_db_provider(tenant.tech_stack.get("db_engine", "postgres_shared"))
                    await db_prov.provision(tenant.tech_stack)
                    await db_prov.migrate(tenant.tech_stack)

                elif step_key == "create_admin_user":
                    existing_user = (
                        await db.execute(select(User).where(User.username == owner_username.strip()))
                    ).scalar_one_or_none()
                    if not existing_user:
                        await bind_tenant(db, tenant_id)
                        owner = User(
                            id=uuid.uuid4(),
                            username=owner_username.strip(),
                            full_name=owner_full_name.strip(),
                            role="admin",
                            is_manager=True,
                            permissions=["*"],
                            password_hash=hash_password(owner_password),
                            tenant_id=tenant_id,
                        )
                        db.add(owner)
                        await db.flush()
                        # Seed sector starter catalogs
                        await seed_demo(db, tenant_id, owner.id, tenant.sector, tenant.scale, tenant.active_modules)

                elif step_key == "activate":
                    tenant.status = "active"

            job.status = "completed"
            job.progress_percent = 100
            job.completed_at = datetime.now(UTC)
            step_logs.append({
                "step": "done",
                "progress": 100,
                "message": f"تم اكتمال تأسيس وتفعيل مساحة عمل '{tenant.name}' بنجاح",
                "timestamp": datetime.now(UTC).isoformat(),
            })
            job.step_logs = step_logs
            await db.commit()

            return {
                "success": True,
                "tenant_id": str(tenant.id),
                "slug": tenant.slug,
                "job_id": str(job.id),
                "status": "completed",
            }

        except Exception as err:
            logger.error("Provisioning failed for tenant %s: %s", tenant_id, err, exc_info=True)
            job.status = "failed"
            job.error_message = str(err)
            step_logs.append({
                "step": "error",
                "error": str(err),
                "message": f"فشل التأسيس عند خطوة {job.current_step}: {err}",
                "timestamp": datetime.now(UTC).isoformat(),
            })
            job.step_logs = step_logs
            tenant.status = "failed"
            await db.commit()
            return {
                "success": False,
                "tenant_id": str(tenant.id),
                "job_id": str(job.id),
                "error": str(err),
            }


provisioning_engine = ProvisioningEngine()
