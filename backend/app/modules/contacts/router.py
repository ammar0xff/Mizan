"""Contacts & Partners Module Router."""
from fastapi import APIRouter
from app.api.routers.parties import router as parties_router

router = APIRouter(prefix="/modules/contacts", tags=["contacts"])

router.include_router(parties_router)
