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
    billing,
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
router.include_router(billing.router)

from app.modules.pharmacy.router import router as pharmacy_router
router.include_router(pharmacy_router)

from app.modules.restaurant.router import router as restaurant_router
router.include_router(restaurant_router, prefix="/restaurant")

from app.modules.school.router import router as school_router
router.include_router(school_router, prefix="/school")

from app.modules.services.router import router as services_router
router.include_router(services_router, prefix="/services")

from app.modules.wholesale.router import router as wholesale_router
router.include_router(wholesale_router)

from app.modules.logistics.router import router as logistics_router
router.include_router(logistics_router)

from app.modules.wms.router import router as wms_router
router.include_router(wms_router)

from app.modules.ecommerce.router import router as ecommerce_router
router.include_router(ecommerce_router)

from app.modules.healthcare_clinic.router import router as clinic_router
router.include_router(clinic_router)

from app.modules.whatsapp_gateway.router import router as whatsapp_gateway_router
router.include_router(whatsapp_gateway_router)

from app.modules.law.router import router as law_router
router.include_router(law_router)

from app.modules.travel.router import router as travel_router
router.include_router(travel_router)

from app.modules.hospitality.router import router as hospitality_router
router.include_router(hospitality_router)

from app.modules.gym.router import router as gym_router
router.include_router(gym_router)

from app.modules.salon.router import router as salon_router
router.include_router(salon_router)

from app.modules.agency.router import router as agency_router
router.include_router(agency_router)

from app.modules.field_service.router import router as field_service_router
router.include_router(field_service_router)

from app.modules.mfg.router import router as mfg_router
router.include_router(mfg_router)

from app.modules.fod.router import router as fod_router
router.include_router(fod_router)

from app.modules.phm.router import router as phm_router
router.include_router(phm_router)

from app.modules.prn.router import router as prn_router
router.include_router(prn_router)

from app.modules.cst.router import router as cst_router
router.include_router(cst_router)

from app.modules.rec.router import router as rec_router
router.include_router(rec_router)

from app.modules.agr.router import router as agr_router
router.include_router(agr_router)

from app.modules.eng.router import router as eng_router
router.include_router(eng_router)

from app.modules.bnk.router import router as bnk_router
router.include_router(bnk_router)

from app.modules.ins.router import router as ins_router
router.include_router(ins_router)

from app.modules.gov.router import router as gov_router
router.include_router(gov_router)

from app.modules.ent.router import router as ent_router
router.include_router(ent_router)

from app.modules.oil.router import router as oil_router
router.include_router(oil_router)

from app.modules.storefront.router import router as storefront_module_router
router.include_router(storefront_module_router)

from app.modules.pos_hardware.router import router as pos_hardware_router
router.include_router(pos_hardware_router)

from app.modules.automation_worker.router import router as automation_worker_router
router.include_router(automation_worker_router)

from app.modules.zk_attendance.router import router as zk_attendance_router
router.include_router(zk_attendance_router)

from app.modules.core.router import router as core_module_router
router.include_router(core_module_router)

from app.modules.inventory.router import router as inventory_module_router
router.include_router(inventory_module_router)

from app.modules.pos.router import router as pos_module_router
router.include_router(pos_module_router)

from app.modules.sales.router import router as sales_module_router
router.include_router(sales_module_router)

from app.modules.purchases.router import router as purchases_module_router
router.include_router(purchases_module_router)

from app.modules.finance.router import router as finance_module_router
router.include_router(finance_module_router)

from app.modules.contacts.router import router as contacts_module_router
router.include_router(contacts_module_router)

from app.modules.hr.router import router as hr_module_router
router.include_router(hr_module_router)




