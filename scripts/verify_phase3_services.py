import asyncio
import json
import urllib.request
from playwright.async_api import async_playwright

async def run():
    # Step 0: Obtain real auth token from backend
    login_req = urllib.request.Request(
        "http://localhost:8000/auth/login",
        data=b'{"username":"ammar","password":"changeme"}',
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(login_req) as resp:
        auth_data = json.loads(resp.read().decode())
        token = auth_data["access_token"]
        user_info = {
            "id": auth_data["user_id"],
            "username": auth_data["username"],
            "full_name": auth_data["full_name"],
            "role": auth_data["role"],
            "permissions": ["all", "pos", "sales", "shifts", "inventory", "purchases", "operations", "customers", "finance", "reports", "payroll", "archive", "users", "settings"],
            "is_manager": True,
            "is_superadmin": True,
            "default_warehouse_id": None
        }

    active_mods = [
        "core", "inventory", "pos", "finance", "pharmacy", "restaurant", "school", "services",
        "wholesale", "logistics", "wms", "ecommerce", "clinic", "law", "travel", "hospitality",
        "gym", "salon", "agency", "field_service", "hr"
    ]

    tenant_info = {
        "id": "c935140b-cb68-45ac-a6fe-3e6ccaf09d71",
        "name": "مجموعة فيندورا للأنشطة المتعددة والخدمات المتخصصة",
        "slug": "mizan-enterprise",
        "sector": "services",
        "scale": "medium",
        "palette": {"name": "blue", "hue": 220},
        "features": ["all"],
        "active_modules": active_mods,
        "plan": "enterprise",
        "trial_ends_at": None
    }

    screenshot_dir = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 950},
            locale="ar-EG"
        )

        # Pre-seed session before any JS runs
        await context.add_init_script(f"""
            localStorage.setItem("mizan.session", JSON.stringify({{
                token: "{token}",
                user: {json.dumps(user_info)},
                tenant: {json.dumps(tenant_info)}
            }}));
            localStorage.setItem("mizan.active_modules", JSON.stringify({json.dumps(active_mods)}));
            localStorage.setItem("mizan.active_preset", "clinic");
        """)

        page = await context.new_page()

        # ==========================================
        # 1. CLINIC & HOSPITAL ERP (/clinic)
        # ==========================================
        print("Navigating to /clinic...")
        await page.goto("http://localhost:5173/Mizan/clinic", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/109_clinic_patient_records.png")
        print("Saved 109_clinic_patient_records.png")

        # Tab 2: Encounters & ICD-10
        await page.click("text=السجلات الطبية والتشخيص")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/110_clinic_encounters_icd10.png")
        print("Saved 110_clinic_encounters_icd10.png")

        # Tab 3: Prescriptions & Labs
        await page.click("text=الروشتات والفحوصات")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/111_clinic_prescriptions_dispense.png")
        print("Saved 111_clinic_prescriptions_dispense.png")

        # Tab 4: Inpatient Beds
        await page.click("text=أقسام وأسِرّة التنويم")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/112_clinic_inpatient_beds_map.png")
        print("Saved 112_clinic_inpatient_beds_map.png")

        # ==========================================
        # 2. LAW FIRM & LEGAL PRACTICE (/law)
        # ==========================================
        print("Navigating to /law...")
        await page.goto("http://localhost:5173/Mizan/law", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/113_law_cases_matters_ledger.png")
        print("Saved 113_law_cases_matters_ledger.png")

        # Tab 2: Hearings
        await page.click("text=الأجندة وجلسات المحاكم")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/114_law_hearings_outcomes_calendar.png")
        print("Saved 114_law_hearings_outcomes_calendar.png")

        # Tab 3: Billable Hours
        await page.click("text=الساعات والأتعاب المهنية")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/115_law_billable_hours_tracking.png")
        print("Saved 115_law_billable_hours_tracking.png")

        # Tab 4: Client Trust IOLTA
        await page.click("text=أمانات الموكلين والتعارض")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/116_law_client_trust_iolta.png")
        print("Saved 116_law_client_trust_iolta.png")

        # ==========================================
        # 3. TRAVEL & TOURISM AGENCY (/travel)
        # ==========================================
        print("Navigating to /travel...")
        await page.goto("http://localhost:5173/Mizan/travel", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/117_travel_packages_itineraries.png")
        print("Saved 117_travel_packages_itineraries.png")

        # Tab 2: Bookings & Vouchers
        await page.click("text=حجوزات التذاكر والفنادق")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/118_travel_pnr_vouchers_manifest.png")
        print("Saved 118_travel_pnr_vouchers_manifest.png")

        # Tab 4: Passports & Visas Vault
        await page.click("text=خزينة الجوازات والتأشيرات")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/119_travel_visas_passports_vault.png")
        print("Saved 119_travel_visas_passports_vault.png")

        # ==========================================
        # 4. HOTEL & HOSPITALITY PMS (/hospitality)
        # ==========================================
        print("Navigating to /hospitality...")
        await page.goto("http://localhost:5173/Mizan/hospitality", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/120_hospitality_room_matrix.png")
        print("Saved 120_hospitality_room_matrix.png")

        # Tab 2: Reservations & Folios
        await page.click("text=الحجوزات ومكتب الاستقبال")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/121_hospitality_frontdesk_folios.png")
        print("Saved 121_hospitality_frontdesk_folios.png")

        # Tab 4: Housekeeping Dispatch
        await page.click("text=الإشراف الداخلي والنظافة")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/122_hospitality_housekeeping_dispatch.png")
        print("Saved 122_hospitality_housekeeping_dispatch.png")

        # ==========================================
        # 5. GYM & FITNESS SPORTS CLUB (/gym)
        # ==========================================
        print("Navigating to /gym...")
        await page.goto("http://localhost:5173/Mizan/gym", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/123_gym_memberships_lifecycle.png")
        print("Saved 123_gym_memberships_lifecycle.png")

        # Tab 2: Turnstile RFID Simulator
        await page.click("text=بوابات الدخول RFID")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/124_gym_turnstile_rfid_access.png")
        print("Saved 124_gym_turnstile_rfid_access.png")

        # Tab 3: PT Sessions
        await page.click("text=التدريب الشخصي (PT)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/125_gym_pt_packages_sessions.png")
        print("Saved 125_gym_pt_packages_sessions.png")

        # Tab 5: InBody Biometrics
        await page.click("text=فحوصات InBody والتطور")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/126_gym_inbody_biometrics.png")
        print("Saved 126_gym_inbody_biometrics.png")

        # ==========================================
        # 6. SALON & BEAUTY SPA (/salon)
        # ==========================================
        print("Navigating to /salon...")
        await page.goto("http://localhost:5173/Mizan/salon", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/127_salon_appointments_calendar.png")
        print("Saved 127_salon_appointments_calendar.png")

        # Tab 2: Services Catalog
        await page.click("text=كتالوج الخدمات والمدد")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/128_salon_services_catalog.png")
        print("Saved 128_salon_services_catalog.png")

        # Tab 4: Hair Formulas & Patch Tests
        await page.click("text=تركيبات الصبغة واختبارات الحساسية")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/129_salon_color_formulas_patch_tests.png")
        print("Saved 129_salon_color_formulas_patch_tests.png")

        # ==========================================
        # 7. CREATIVE, MEDIA & TRANSLATION AGENCY (/agency)
        # ==========================================
        print("Navigating to /agency...")
        await page.goto("http://localhost:5173/Mizan/agency", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/130_agency_projects_milestone_gates.png")
        print("Saved 130_agency_projects_milestone_gates.png")

        # Tab 2: Capacity Heatmap
        await page.click("text=لوحة إشغال الفريق (Heatmap)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/131_agency_team_capacity_heatmap.png")
        print("Saved 131_agency_team_capacity_heatmap.png")

        # Tab 3: Retainers & Scope Creep
        await page.click("text=ساعات العقود الشهرية (Retainers)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/132_agency_retainers_scope_creep.png")
        print("Saved 132_agency_retainers_scope_creep.png")

        # ==========================================
        # 8. FIELD SERVICE & MAINTENANCE (/field-service)
        # ==========================================
        print("Navigating to /field-service...")
        await page.goto("http://localhost:5173/Mizan/field-service", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/133_field_service_work_orders_sla.png")
        print("Saved 133_field_service_work_orders_sla.png")

        # Tab 2: Technicians Roster
        await page.click("text=خريطة الفنيين والسيارات")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/134_field_service_technicians_roster.png")
        print("Saved 134_field_service_technicians_roster.png")

        # Tab 3: Van Inventory
        await page.click("text=مخازن سيارات الصيانة (Van Parts)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/135_field_service_van_inventory.png")
        print("Saved 135_field_service_van_inventory.png")

        # Tab 4: Assets & AMC
        await page.click("text=أصول الأجهزة وعقود AMC")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/136_field_service_equipment_amc.png")
        print("Saved 136_field_service_equipment_amc.png")

        await browser.close()
        print("All Phase 3 screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(run())
