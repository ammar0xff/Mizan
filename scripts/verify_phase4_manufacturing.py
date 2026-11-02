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
        "gym", "salon", "agency", "field_service", "hr", "mfg", "fod", "phm", "prn"
    ]

    tenant_info = {
        "id": "c935140b-cb68-45ac-a6fe-3e6ccaf09d71",
        "name": "مجموعة فيندورا للأنشطة المتعددة والتصنيع المتقدم",
        "slug": "vendora-enterprise",
        "sector": "manufacturing",
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
            localStorage.setItem("vendora.active_preset", "mfg");
        """)

        page = await context.new_page()

        # ==========================================
        # 1. DISCRETE MANUFACTURING (/mfg)
        # ==========================================
        print("Navigating to /mfg...")
        await page.goto("http://localhost:5173/Vendora/mfg", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/137_mfg_production_orders_wip.png")
        print("Saved 137_mfg_production_orders_wip.png")

        # Tab 2: BOM Structure
        await page.click("text=شجرة المنتجات والتكاليف (BOM)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/138_mfg_multi_level_bom.png")
        print("Saved 138_mfg_multi_level_bom.png")

        # Tab 3: Work Centers & Routing
        await page.click("text=مراكز العمل والماكينات")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/139_mfg_work_centers_routing.png")
        print("Saved 139_mfg_work_centers_routing.png")

        # Tab 4: Inspections & NCR
        await page.click("text=رقابة الجودة وتقارير NCR")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/140_mfg_shop_floor_dispatch.png")
        print("Saved 140_mfg_shop_floor_dispatch.png")

        # ==========================================
        # 2. FOOD & BEVERAGE PROCESS MANUFACTURING (/fod)
        # ==========================================
        print("Navigating to /fod...")
        await page.goto("http://localhost:5173/Vendora/fod", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/141_fod_batch_orders_fefo.png")
        print("Saved 141_fod_batch_orders_fefo.png")

        # Tab 2: Recipes & Allergens
        await page.click("text=وصفات الخلط ومعايرة التركيبات")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/142_fod_recipes_allergen_matrix.png")
        print("Saved 142_fod_recipes_allergen_matrix.png")

        # Tab 3: HACCP CCP
        await page.click("text=نقاط التحكم الحرجة (HACCP)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/143_fod_haccp_ccp_monitoring.png")
        print("Saved 143_fod_haccp_ccp_monitoring.png")

        # Tab 4: Mock Recall Simulator
        await page.click("text=محاكي الاستدعاء (Mock Recall)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/144_fod_mock_recall_traceability.png")
        print("Saved 144_fod_mock_recall_traceability.png")

        # ==========================================
        # 3. PHARMACEUTICAL & CHEMICAL GMP (/phm)
        # ==========================================
        print("Navigating to /phm...")
        await page.goto("http://localhost:5173/Vendora/phm", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/145_phm_ebr_batch_records.png")
        print("Saved 145_phm_ebr_batch_records.png")

        # Tab 2: QP Release
        await page.click("text=إفراج الصيدلي المؤهل (21 CFR Part 11 QP Release)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/146_phm_qp_release_digital_signature.png")
        print("Saved 146_phm_qp_release_digital_signature.png")

        # Tab 3: Deviations & CAPA
        await page.click("text=الانحرافات وخطة CAPA التصحيحية")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/147_phm_deviations_capa_investigation.png")
        print("Saved 147_phm_deviations_capa_investigation.png")

        # Tab 4: CIP Logs & Line Clearance
        await page.click("text=تطهير المفاعلات وخلو الخطوط (CIP Logs)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/148_phm_cip_line_clearance.png")
        print("Saved 148_phm_cip_line_clearance.png")

        # ==========================================
        # 4. PRINTING & PACKAGING ERP (/prn)
        # ==========================================
        print("Navigating to /prn...")
        await page.goto("http://localhost:5173/Vendora/prn", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/149_prn_job_dockets_specifications.png")
        print("Saved 149_prn_job_dockets_specifications.png")

        # Tab 2: Imposition Plans
        await page.click("text=تخطيط الفراخ والمونتاج (Imposition & Yield)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/150_prn_sheet_imposition_nesting.png")
        print("Saved 150_prn_sheet_imposition_nesting.png")

        # Tab 3: Press Machines & MHR
        await page.click("text=ماكينات الطباعة وتكلفة الساعة (MHR)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/151_prn_press_machines_mhr.png")
        print("Saved 151_prn_press_machines_mhr.png")

        # Tab 5: Post-Press Finishing
        await page.click("text=التشطيب والتكسير واللصق (Post-Press Finishing)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/152_prn_postpress_finishing_diecut.png")
        print("Saved 152_prn_postpress_finishing_diecut.png")

        await browser.close()
        print("Phase 4 Visual Audit Completed: 16 screenshots saved successfully!")

if __name__ == "__main__":
    asyncio.run(run())
