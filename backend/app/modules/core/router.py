"""Core base router re-export for modular architecture."""
from fastapi import APIRouter
from app.api.routers.settings import router as settings_router
from app.api.routers.users import router as users_router
from app.api.routers.notifications import router as notifications_router

router = APIRouter(prefix="/modules/core", tags=["core"])

# Include core sub-routes under the module namespace
router.include_router(settings_router, prefix="/settings")
router.include_router(users_router, prefix="/users")
router.include_router(notifications_router, prefix="/notifications")
