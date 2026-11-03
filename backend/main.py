import logging
import os
import tempfile
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

import app.models.archive
import app.models.audit_log
import app.models.collection
import app.models.customer_payment
import app.models.device_token
import app.models.notification
import app.models.employee
import app.models.expense
import app.models.financial_category
import app.models.hr_advance
import app.models.hr_attendance
import app.models.hr_audit_log
import app.models.hr_payroll_legacy
import app.models.hr_settings
import app.models.hr_shift
import app.models.hr_sync_log
import app.models.party
import app.models.payment_wallet
import app.models.payroll
import app.models.payroll_legacy
import app.models.period
import app.models.product
import app.models.purchase
import app.models.purchase_price_history
import app.models.safe
import app.models.sale
import app.models.sale_payment
import app.models.schema_migration
import app.models.settings
import app.models.shift
import app.models.stock
import app.models.stock_balance
import app.models.supplier_price
import app.models.supplier_transaction
import app.models.tenant
import app.models.user
import app.models.warehouse
import app.models.warehouse_product_status
import app.modules.kitchen_display.models
import app.modules.restaurant.models
import app.modules.school.models
import app.modules.pharmacy.models
import app.modules.services.models
import app.modules.wholesale.models
import app.modules.logistics.models
import app.modules.wms.models
import app.modules.ecommerce.models
import app.modules.clinic.models
import app.modules.law.models
import app.modules.travel.models
import app.modules.hospitality.models
import app.modules.gym.models
import app.modules.salon.models
import app.modules.agency.models
import app.modules.field_service.models
import app.modules.mfg.models
import app.modules.fod.models
import app.modules.phm.models
import app.modules.prn.models
import app.modules.cst.models
import app.modules.rec.models
import app.modules.agr.models
import app.modules.eng.models
import app.modules.bnk.models
import app.modules.ins.models
import app.modules.gov.models
import app.modules.ent.models
import app.modules.oil.models
import app.modules.storefront.models
from app.api.router import router
from app.core.config import settings
from app.core.tenancy import install_tenancy_events
from app.db.base import Base, engine
from app.middleware import add_csrf_middleware

install_tenancy_events()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Ensure safe_deposit exists in the doc_type_enum (added after initial creation)
        await conn.execute(text("ALTER TYPE doc_type_enum ADD VALUE IF NOT EXISTS 'safe_deposit'"))
    yield


app = FastAPI(title="Inventory ERP API", version="1.0.0", lifespan=lifespan)

logger = logging.getLogger("validation")


@app.exception_handler(RequestValidationError)
async def log_validation_error(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    logger.error("Validation error on %s %s: %s", request.method, request.url.path, errors)
    safe_errors = []
    for e in errors:
        ctx = e.get("ctx", {})
        clean_ctx = {}
        for k, v in ctx.items():
            clean_ctx[k] = str(v) if not isinstance(v, (str, int, float, bool, type(None))) else v
        safe_errors.append({**e, "ctx": clean_ctx})
    return JSONResponse(status_code=422, content={"detail": safe_errors})


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add CSRF protection middleware
add_csrf_middleware(app)

def _resolve_writable_dir(path: str) -> str:
    """Return the path if writable, else a writable mirror under /tmp."""
    try:
        os.makedirs(path, exist_ok=True)
        probe = os.path.join(path, ".wprobe")
        with open(probe, "w") as f:
            f.write("")
        os.remove(probe)
        return path
    except OSError:
        alt = os.path.join(tempfile.gettempdir(), os.path.basename(path.strip(os.sep)))
        os.makedirs(alt, exist_ok=True)
        return alt


upload_dir = _resolve_writable_dir(settings.UPLOAD_DIR)
settings.UPLOAD_DIR = upload_dir
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")
updates_dir = _resolve_writable_dir(os.environ.get("UPDATES_DIR", "./updates"))
app.mount("/updates", StaticFiles(directory=updates_dir), name="updates")
app.include_router(router)


@app.get("/")
async def root():
    return {"name": "Vendora Inventory ERP API", "docs": "/docs", "health": "/health"}


@app.get("/health")
async def health():
    from sqlalchemy import text

    from app.db.base import AsyncSessionLocal
    try:
        async with AsyncSessionLocal() as sess:
            await sess.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception:
        return {"status": "degraded", "database": "disconnected"}
