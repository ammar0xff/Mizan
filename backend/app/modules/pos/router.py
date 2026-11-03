"""Point of Sale (POS) Module Router."""
from fastapi import APIRouter
from app.api.routers.shifts import router as shifts_router

router = APIRouter(prefix="/modules/pos", tags=["pos"])

router.include_router(shifts_router, prefix="/shifts")
