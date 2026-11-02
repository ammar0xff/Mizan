from fastapi import APIRouter

from app.api.routers import (
    admin_overview,
    archive,
    auth,
    expenses,
    finance,
    hr,
    notifications,
    operations,
    parties,
    periods,
    print_router,
    products,
    purchases,
    reports,
    safes,
    sales,
    settings,
    shifts,
    stock,
    storefront,
    suppliers,
    users,
    wallets,
    modules,
    admoon,
)
from app.api.routers import collections as collections_router
from app.api.routers import export as export_router
from app.api.routers import ledger as ledger_router
from app.api.routers import platform as platform_router
from app.api.routers import updater as updater_router

router = APIRouter()

router.include_router(auth.router)
router.include_router(users.router)
router.include_router(products.router)
router.include_router(stock.router)
router.include_router(sales.router)
router.include_router(shifts.router)
router.include_router(reports.router)
router.include_router(parties.router)
router.include_router(purchases.router)
router.include_router(archive.router)
router.include_router(settings.router)
router.include_router(operations.router)
router.include_router(ledger_router.router)
router.include_router(storefront.router)
router.include_router(storefront.page_router)
router.include_router(hr.router)
router.include_router(finance.router)
router.include_router(suppliers.router)
router.include_router(print_router.router)
router.include_router(admin_overview.router)
router.include_router(safes.router)
router.include_router(platform_router.router)
router.include_router(collections_router.router)
router.include_router(wallets.router)
router.include_router(expenses.router)
router.include_router(periods.router)
router.include_router(export_router.router)
router.include_router(notifications.router)
router.include_router(updater_router.router)
router.include_router(modules.router)
router.include_router(admoon.router)

from app.modules.pharmacy.router import router as pharmacy_router
router.include_router(pharmacy_router)

