import asyncio
import json
import urllib.request
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"

async def verify_odoo_modularity():
    print("=== Testing Odoo-Style Modularity & App Launcher ===")

    login_req = urllib.request.Request(
        "http://localhost:8000/auth/login",
        data=b'{"username":"ammar","password":"changeme"}',
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(login_req) as resp:
        auth_data = json.loads(resp.read().decode())
        token = auth_data["access_token"]

    tenant_info = {
        "id": "c935140b-cb68-45ac-a6fe-3e6ccaf09d71",
        "name": "المصرية الألمانية للأدوات الصحية",
        "slug": "german-egyptian",
        "sector": "plumbing",
        "scale": "medium",
        "palette": {"name": "emerald", "hue": 160},
        "features": ["all"],
        "active_modules": [
            "pos", "inventory", "storefront", "core", "finance", "hr",
            "pos_hardware", "automation_worker", "zk_attendance", "i18n",
            "sales", "purchases", "contacts"
        ],
    }

    user_info = {
        "id": auth_data["user_id"],
        "username": auth_data["username"],
        "full_name": auth_data["full_name"],
        "role": auth_data["role"],
        "permissions": ["all", "pos", "sales", "inventory", "customers", "finance", "settings", "hr"],
        "tenant_id": tenant_info["id"],
        "is_manager": True,
        "is_superadmin": True,
    }

    session_payload = {
        "token": token,
        "user": user_info,
        "tenant": tenant_info,
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="ar-EG",
        )
        page = await context.new_page()

        # Seed localStorage
        await page.goto("http://localhost:5173/Vendora/")
        await page.evaluate(f"""() => {{
            localStorage.setItem("vendora.session", JSON.stringify({json.dumps(session_payload)}));
            localStorage.setItem("vendora.active_modules", JSON.stringify({json.dumps(tenant_info["active_modules"])}));
            localStorage.setItem("vendora.tenant_slug", "german-egyptian");
            localStorage.setItem("vendora.locale", "ar");
        }}""")

        # 1. Test Odoo App Launcher in TopBar
        print("\n--- 1. Testing Odoo App Launcher ---")
        await page.goto("http://localhost:5173/Vendora/c/german-egyptian/")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

        # Click the 9-dots App Launcher button
        launcher_btn = page.locator("button[title*='Odoo Apps Launcher']").first
        await launcher_btn.click()
        await page.locator("text=تطبيقات المنظومة").wait_for(state="visible", timeout=10000)
        await asyncio.sleep(1)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/216_odoo_style_app_launcher_grid.png")
        print("✓ Captured 216_odoo_style_app_launcher_grid.png")

        # 2. Search inside the App Launcher
        print("\n--- 2. Testing App Launcher Search Filter ---")
        search_input = page.locator("input[placeholder*='ابحث عن تطبيق']").first
        await search_input.fill("نقطة")
        await asyncio.sleep(1)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/217_odoo_style_app_launcher_search_filtered.png")
        print("✓ Captured 217_odoo_style_app_launcher_search_filtered.png")

        # 3. Test Modules App Store (/modules)
        print("\n--- 3. Testing Full Modular Catalog (47 Modules) ---")
        await page.goto("http://localhost:5173/Vendora/c/german-egyptian/modules")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/218_odoo_modular_apps_catalog_47_modules.png")
        print("✓ Captured 218_odoo_modular_apps_catalog_47_modules.png")

        await browser.close()
        print("\n=== Odoo Modularity Verification Completed Successfully ===")

if __name__ == "__main__":
    asyncio.run(verify_odoo_modularity())
