"""Human Resources & Payroll Module Router."""
from fastapi import APIRouter
from app.api.routers.hr import router as hr_router
from app.api.routers.payroll import router as payroll_router

router = APIRouter(prefix="/modules/hr", tags=["hr"])

router.include_router(hr_router)
router.include_router(payroll_router, prefix="/payroll")
