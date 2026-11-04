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

    tenant_info = {
        "id": "c935140b-cb68-45ac-a6fe-3e6ccaf09d71",
        "name": "مجموعة صيدليات فيندورا التخصصية",
        "slug": "german-egyptian",
        "sector": "pharmacy",
        "scale": "medium",
        "palette": {"name": "teal", "hue": 175},
        "features": ["all"],
        "active_modules": ["core", "inventory", "pos", "finance", "pharmacy", "hr"],
        "plan": "pro",
        "trial_ends_at": None
    }

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
            localStorage.setItem("mizan.active_modules", JSON.stringify(["core", "inventory", "pos", "finance", "pharmacy", "hr"]));
            localStorage.setItem("mizan.active_preset", "pharmacy");
        """)

        page = await context.new_page()

        # 1. Modules Marketplace
        print("Navigating to Modules Catalog...")
        await page.goto("http://localhost:5173/Mizan/modules")
        await page.wait_for_timeout(2500)
        await page.screenshot(path="/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens/77_modules_pharmacy_present.png")
        print("Saved 77_modules_pharmacy_present.png")

        # 2. Pharmacy Console
        print("Navigating to Pharmacy Console...")
        await page.goto("http://localhost:5173/Mizan/pharmacy")
        await page.wait_for_timeout(3000)
        await page.screenshot(path="/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens/78_pharmacy_dashboard_kpis.png")
        print("Saved 78_pharmacy_dashboard_kpis.png")

        # 3. Test Generic Alternatives Modal
        print("Testing Generic Alternatives modal...")
        alt_btn = page.locator("button:has-text('بديل مكافئ')").first
        if await alt_btn.count() > 0:
            await alt_btn.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path="/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens/79_pharmacy_generic_alternatives_modal.png")
            print("Saved 79_pharmacy_generic_alternatives_modal.png")
            # Close modal
            close_btn = page.locator("button:has-text('إغلاق')").last
            await close_btn.click()
            await page.wait_for_timeout(600)

        # 4. FEFO Batches Tab
        print("Navigating to FEFO Batches Tab...")
        batches_tab = page.locator("button:has-text('أرصدة التشغيلات')")
        if await batches_tab.count() > 0:
            await batches_tab.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path="/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens/80_pharmacy_fefo_batches_tab.png")
            print("Saved 80_pharmacy_fefo_batches_tab.png")

        # 5. Controlled Register Tab
        print("Navigating to Controlled Substances Register Tab...")
        ctrl_tab = page.locator("button:has-text('سجل الرقابة')")
        if await ctrl_tab.count() > 0:
            await ctrl_tab.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path="/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens/81_pharmacy_controlled_register_tab.png")
            print("Saved 81_pharmacy_controlled_register_tab.png")

        # 6. Test Prescription Dispensing & Receipt Generation
        print("Opening Dispensing Modal...")
        dispense_btn = page.locator("button:has-text('صرف روشتة / تذكرة طبية')").first
        if await dispense_btn.count() > 0:
            await dispense_btn.click()
            await page.wait_for_timeout(800)

            # Fill dispensing form
            await page.locator("input[placeholder='أحمد محمد السيد']").fill("حسام الدين محمود")
            await page.locator("input[placeholder='010XXXXXXXX']").fill("01099887766")
            await page.locator("input[placeholder='د. طارق العوضي']").fill("د. مصطفى الشناوي")
            await page.locator("input[placeholder='MED-12345']").fill("LIC-55443")
            await page.locator("input[placeholder='ارتفاع ضغط دم مزمن، حساسية صدرية، التهاب...']").fill("التهاب رئوي حاد")
            await page.locator("input[placeholder='بوبا، كير بلس، متلايف، نقابة المهندسين...']").fill("بوبا مصر للتأمين الطبي")

            # Select Drug
            select_el = page.locator("select").last
            await select_el.select_option(index=1)
            await page.wait_for_timeout(500)

            # Submit
            print("Submitting prescription...")
            confirm_btn = page.locator("button:has-text('تأكيد الصرف وطباعة الإيصال')")
            await confirm_btn.click()
            await page.wait_for_timeout(2500)

            # Capture official dispensing receipt modal
            await page.screenshot(path="/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens/82_pharmacy_dispensing_receipt_modal.png")
            print("Saved 82_pharmacy_dispensing_receipt_modal.png")

        await browser.close()
        print("Phase 1 Pharmacy validation complete!")

if __name__ == "__main__":
    asyncio.run(run())
