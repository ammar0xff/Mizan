import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"

def test_admoon_and_multitenancy():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="ar-EG"
        )
        page = context.new_page()

        # 1. Login as Superadmin (ammar)
        print("Logging in as Superadmin (ammar)...")
        page.goto("http://localhost:5173/Vendora/login")
        page.wait_for_selector("input#u", timeout=10000)
        page.fill("input#u", "ammar")
        page.fill("input#p", "changeme")
        page.click("button[type='submit']")

        # Wait for dashboard
        page.wait_for_url("**/Vendora/", timeout=15000)
        time.sleep(1)

        # 2. Navigate to /admoon
        print("Navigating to /admoon SaaS Control Plane...")
        page.goto("http://localhost:5173/Vendora/admoon")
        page.wait_for_selector("text=SaaS Control Plane", timeout=10000)
        time.sleep(1)

        # Capture Admoon Dashboard Overview
        page.screenshot(path=f"{SCREENSHOTS_DIR}/47_admoon_dashboard_overview.png")
        print("Saved 47_admoon_dashboard_overview.png")

        # 3. Check Table & Search for monset-gym
        search_input = page.locator("input[placeholder*='بحث باسم المنشأة']")
        search_input.fill("monset")
        time.sleep(0.5)

        # Capture filtered view
        page.screenshot(path=f"{SCREENSHOTS_DIR}/48_admoon_tenants_table.png")
        print("Saved 48_admoon_tenants_table.png")

        # 4. Open Tech Stack & Modules modal for monset-gym
        print("Opening Tech Stack & Modules modal...")
        tech_btn = page.locator("button:has-text('البنية والوحدات')").first
        tech_btn.click()
        page.wait_for_selector("text=تعديل البنية التقنية والوحدات", timeout=5000)
        time.sleep(0.5)

        page.screenshot(path=f"{SCREENSHOTS_DIR}/49_admoon_tech_stack_modal.png")
        print("Saved 49_admoon_tech_stack_modal.png")

        # Close tech stack modal
        page.locator("button:has-text('إلغاء')").click()
        time.sleep(0.5)

        # 5. Open Offline License Key Modal
        print("Generating offline license key...")
        lic_btn = page.locator("button[title*='مفتاح ترخيص']").first
        lic_btn.click()
        page.wait_for_selector("text=مفتاح ترخيص أوفلاين للنسخة المكتبية", timeout=5000)
        time.sleep(0.5)

        page.screenshot(path=f"{SCREENSHOTS_DIR}/50_admoon_offline_license_modal.png")
        print("Saved 50_admoon_offline_license_modal.png")

        # Close license modal
        page.locator("button:has-text('نسخ المفتاح')").click()
        time.sleep(0.5)
        close_btn = page.locator("div.fixed button:has(svg.lucide-x)")
        if close_btn.count() > 0:
            close_btn.click()
        else:
            page.keyboard.press("Escape")
        time.sleep(0.5)

        # 6. Test One-Click Impersonation into Monset Gym ERP
        print("Testing one-click impersonation into Monset Gym...")
        imp_btn = page.locator("button:has-text('دخول كمدير')").first
        imp_btn.click()

        # Wait for redirect into Monset Gym ERP
        page.wait_for_url("**/Vendora/**", timeout=15000)
        time.sleep(2)

        page.screenshot(path=f"{SCREENSHOTS_DIR}/51_admoon_impersonated_gym_erp.png")
        print("Saved 51_admoon_impersonated_gym_erp.png")

        # 7. Test Tenant Slug Resolver /c/monset-gym
        print("Testing tenant slug resolver /c/monset-gym...")
        page.goto("http://localhost:5173/Vendora/c/monset-gym")
        time.sleep(2)

        page.screenshot(path=f"{SCREENSHOTS_DIR}/52_tenant_slug_resolver_gym.png")
        print("Saved 52_tenant_slug_resolver_gym.png")

        browser.close()
        print("All Admoon and Multi-Tenancy E2E tests finished successfully!")

if __name__ == "__main__":
    test_admoon_and_multitenancy()
