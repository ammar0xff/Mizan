"""Purchases & Procurement Module Router."""
from fastapi import APIRouter
from app.api.routers.purchases import router as purchases_router

router = APIRouter(prefix="/modules/purchases", tags=["purchases"])

router.include_router(purchases_router)
