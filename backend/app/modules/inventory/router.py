"""Inventory & Warehouse Management Router."""
from fastapi import APIRouter
from app.api.routers.products import router as products_router
from app.api.routers.stock import router as stock_router

router = APIRouter(prefix="/modules/inventory", tags=["inventory"])

router.include_router(products_router, prefix="/products")
router.include_router(stock_router, prefix="/stock")
