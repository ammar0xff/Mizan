"""Sales & Invoicing Module Router."""
from fastapi import APIRouter
from app.api.routers.sales import router as sales_router

router = APIRouter(prefix="/modules/sales", tags=["sales"])

router.include_router(sales_router)
