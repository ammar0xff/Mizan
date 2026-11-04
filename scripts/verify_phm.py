import asyncio
import json
import urllib.request
from playwright.async_api import async_playwright

async def run():
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
            "permissions": ["all"],
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
        "slug": "mizan-enterprise",
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

        await context.add_init_script(f"""
            localStorage.setItem("mizan.session", JSON.stringify({{
                token: "{token}",
                user: {json.dumps(user_info)},
                tenant: {json.dumps(tenant_info)}
            }}));
            localStorage.setItem("mizan.active_modules", JSON.stringify({json.dumps(active_mods)}));
            localStorage.setItem("mizan.active_preset", "phm");
        """)

        page = await context.new_page()

        print("Navigating to /phm...")
        await page.goto("http://localhost:5173/Mizan/phm", wait_until="networkidle")
        await page.wait_for_selector("text=EBR-2026-", timeout=10000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{screenshot_dir}/145_phm_ebr_batch_records.png")
        print("Saved 145_phm_ebr_batch_records.png")

        # Tab 2: QP Release
        await page.click("text=إفراج الصيدلي المؤهل (21 CFR Part 11 QP Release)")
        await page.wait_for_selector("text=QP-CERT-", timeout=10000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{screenshot_dir}/146_phm_qp_release_digital_signature.png")
        print("Saved 146_phm_qp_release_digital_signature.png")

        # Tab 3: Deviations & CAPA
        await page.click("text=الانحرافات وخطة CAPA التصحيحية")
        await page.wait_for_selector("text=DEV-2026-", timeout=10000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{screenshot_dir}/147_phm_deviations_capa_investigation.png")
        print("Saved 147_phm_deviations_capa_investigation.png")

        # Tab 4: CIP Logs & Line Clearance
        await page.click("text=تطهير المفاعلات وخلو الخطوط (CIP Logs)")
        await page.wait_for_selector("text=µS/cm", timeout=10000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{screenshot_dir}/148_phm_cip_line_clearance.png")
        print("Saved 148_phm_cip_line_clearance.png")

        await browser.close()
        print("PHM Screenshots Refreshed!")

if __name__ == "__main__":
    asyncio.run(run())
