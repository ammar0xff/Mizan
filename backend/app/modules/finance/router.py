"""Finance & Accounting Module Router."""
from fastapi import APIRouter
from app.api.routers.finance import router as finance_router
from app.api.routers.safes import router as safes_router
from app.api.routers.expenses import router as expenses_router
from app.api.routers.wallets import router as wallets_router

router = APIRouter(prefix="/modules/finance", tags=["finance"])

router.include_router(finance_router)
router.include_router(safes_router, prefix="/safes")
router.include_router(expenses_router, prefix="/expenses")
router.include_router(wallets_router, prefix="/wallets")
