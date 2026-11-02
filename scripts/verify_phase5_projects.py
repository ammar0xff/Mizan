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
        "gym", "salon", "agency", "field_service", "hr", "mfg", "fod", "phm", "prn",
        "cst", "rec", "agr", "eng"
    ]

    tenant_info = {
        "id": "c935140b-cb68-45ac-a6fe-3e6ccaf09d71",
        "name": "مجموعة فيندورا للأنشطة المتعددة والتصنيع المتقدم",
        "slug": "vendora-enterprise",
        "sector": "projects_infrastructure",
        "scale": "enterprise",
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
            localStorage.setItem("vendora.session", JSON.stringify({{
                token: "{token}",
                user: {json.dumps(user_info)},
                tenant: {json.dumps(tenant_info)}
            }}));
            localStorage.setItem("vendora.active_modules", JSON.stringify({json.dumps(active_mods)}));
            localStorage.setItem("vendora.active_preset", "cst");
        """)

        page = await context.new_page()

        # ==========================================
        # 1. CONSTRUCTION / CONTRACTING (/cst)
        # ==========================================
        print("Navigating to /cst...")
        await page.goto("http://localhost:5173/Vendora/cst", wait_until="networkidle")
        await page.wait_for_selector("text=المشروعات وعقود المقاولات (Projects)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{screenshot_dir}/153_cst_projects_wbs_overview.png")
        print("Saved 153_cst_projects_wbs_overview.png")

        # Tab 2: BOQ Items
        await page.click("text=جداول الكميات والبنود (BOQ Engine)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/154_cst_boq_items_rate_analysis.png")
        print("Saved 154_cst_boq_items_rate_analysis.png")

        # Tab 3: IPC Progress Certificates
        await page.click("text=مستخلصات التنفيذ والاستقطاعات (IPC)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/155_cst_ipc_certificates_retention.png")
        print("Saved 155_cst_ipc_certificates_retention.png")

        # Tab 5: Heavy Machinery & Equipment
        await page.click("text=تشغيل المعدات والديزل (Machinery & Plant)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/156_cst_machinery_heavy_equipment.png")
        print("Saved 156_cst_machinery_heavy_equipment.png")

        # ==========================================
        # 2. REAL ESTATE & PROPERTY MANAGEMENT (/rec)
        # ==========================================
        print("Navigating to /rec...")
        await page.goto("http://localhost:5173/Vendora/rec", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/157_rec_properties_portfolio_gla.png")
        print("Saved 157_rec_properties_portfolio_gla.png")

        # Tab 2: Units Matrix
        await page.click("text=مصفوفة الوحدات والشواغر")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/158_rec_units_occupancy_matrix.png")
        print("Saved 158_rec_units_occupancy_matrix.png")

        # Tab 3: Lease Contracts
        await page.click("text=عقود الإيجار والتأجير")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/159_rec_lease_contracts_lifecycle.png")
        print("Saved 159_rec_lease_contracts_lifecycle.png")

        # Tab 4: PDC Cheques Vault
        await page.click("text=خزانة الشيكات الآجلة (PDC)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/160_rec_pdc_cheques_vault.png")
        print("Saved 160_rec_pdc_cheques_vault.png")

        # ==========================================
        # 3. COMMERCIAL AGRICULTURE & LIVESTOCK (/agr)
        # ==========================================
        print("Navigating to /agr...")
        await page.goto("http://localhost:5173/Vendora/agr", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/161_agr_farm_plots_pivot_sectors.png")
        print("Saved 161_agr_farm_plots_pivot_sectors.png")

        # Tab 2: Crop Seasons
        await page.click("text=الدورات والمواسم المحصولية")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/162_agr_crop_seasons_planning.png")
        print("Saved 162_agr_crop_seasons_planning.png")

        # Tab 3: Chemical Sprays & PHI
        await page.click("text=سجل الرش وفترات الأمان (PHI)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/163_agr_sprays_fertilizers_phi.png")
        print("Saved 163_agr_sprays_fertilizers_phi.png")

        # Tab 4: Harvest Batches
        await page.click("text=دفعات الحصاد والتصدير (GlobalG.A.P.)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/164_agr_harvest_batches_globalgap.png")
        print("Saved 164_agr_harvest_batches_globalgap.png")

        # ==========================================
        # 4. ENERGY & POWER PLANT ERP (/eng)
        # ==========================================
        print("Navigating to /eng...")
        await page.goto("http://localhost:5173/Vendora/eng", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/165_eng_functional_assets_kks.png")
        print("Saved 165_eng_functional_assets_kks.png")

        # Tab 2: SCADA Telemetry
        await page.click("text=مراقبة التردد والإنتاج اللحظي (SCADA)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/166_eng_scada_telemetry_frequency.png")
        print("Saved 166_eng_scada_telemetry_frequency.png")

        # Tab 3: Digital PTW & LOTO
        await page.click("text=تصاريح العمل وإجراءات العزل (PTW/LOTO)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/167_eng_digital_ptw_loto.png")
        print("Saved 167_eng_digital_ptw_loto.png")

        # Tab 4: PPA Agreements
        await page.click("text=اتفاقيات شراء الطاقة وتسوية التعرفة (PPA)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/168_eng_ppa_tariff_billing_settlement.png")
        print("Saved 168_eng_ppa_tariff_billing_settlement.png")

        await browser.close()
        print("All Phase 5 Project & Infrastructure screens verified successfully!")

if __name__ == "__main__":
    asyncio.run(run())
