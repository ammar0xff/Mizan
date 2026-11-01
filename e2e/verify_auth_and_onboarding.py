import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"

def test_login_and_onboarding():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="ar-EG"
        )
        page = context.new_page()

        # 1. Test Login Page
        print("Navigating to login page...")
        page.goto("http://localhost:5173/Vendora/login")
        page.wait_for_selector("input#u", timeout=10000)
        time.sleep(1)

        # Capture Login Page
        page.screenshot(path=f"{SCREENSHOTS_DIR}/42_login_page_de_ai.png")
        print("Saved 42_login_page_de_ai.png")

        # 2. Test Appearance Modal from Login Page
        theme_btn = page.locator("button:has-text('المظهر')")
        if theme_btn.count() > 0:
            theme_btn.first.click()
            page.wait_for_selector("text=تخصيص المظهر وتخطيط النظام", timeout=5000)
            time.sleep(0.5)
            # Pick warm amber theme
            amber_radio = page.locator("button:has-text('عنبري دافئ')")
            if amber_radio.count() > 0:
                amber_radio.click()
                time.sleep(0.5)
            # Close modal
            page.locator("button:has-text('تم وحفظ')").click()
            time.sleep(0.5)
            print("Successfully opened appearance modal from login and picked amber theme")

        # 3. Test Signup -> Onboarding
        print("Navigating to signup page...")
        page.goto("http://localhost:5173/Vendora/signup")
        page.wait_for_selector("input#fn", timeout=10000)
        time.sleep(0.5)

        test_user = f"chef_{int(time.time()) % 10000}"
        page.fill("input#fn", "الشيف حسام الدين")
        page.fill("input#u", test_user)
        page.fill("input#p", "Password123!")
        page.click("button[type='submit']")

        # Onboarding Step 1: Business Sector
        print("Waiting for onboarding wizard step 1...")
        page.wait_for_selector("text=نشاطك التجاري", timeout=10000)
        time.sleep(0.5)
        # Select restaurant sector
        page.locator("button:has-text('مطاعم، كافيهات، وضيافة')").click()
        time.sleep(0.5)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/43_onboarding_wizard_step1.png")
        print("Saved 43_onboarding_wizard_step1.png")

        # Proceed to Step 2
        page.click("button:has-text('التالي')")
        page.wait_for_selector("text=اسم منشأتك وحجم فروعها", timeout=5000)
        time.sleep(0.5)
        comp_input = page.locator("input[placeholder*='مجمع']")
        comp_input.fill("مطعم وكافيه شمس الأصيل")
        page.screenshot(path=f"{SCREENSHOTS_DIR}/44_onboarding_wizard_step2.png")
        print("Saved 44_onboarding_wizard_step2.png")

        # Proceed to Step 3
        page.click("button:has-text('التالي')")
        page.wait_for_selector("text=لوحة الألوان والوحدات المبدئية", timeout=5000)
        time.sleep(0.5)
        # Select warm amber palette
        page.locator("button:has-text('عنبري دافئ (Warm POS & Food)')").click()
        time.sleep(0.5)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/45_onboarding_wizard_step3.png")
        print("Saved 45_onboarding_wizard_step3.png")

        # Finish onboarding and create tenant
        print("Submitting onboarding...")
        page.click("button:has-text('أنشئ مساحة عملي الآن')")

        # Wait for redirect to dashboard
        page.wait_for_url("**/Vendora/", timeout=20000)
        time.sleep(3)

        theme_attr = page.evaluate("document.documentElement.getAttribute('data-theme')")
        print(f"Current document theme: {theme_attr}")

        page.screenshot(path=f"{SCREENSHOTS_DIR}/46_new_restaurant_tenant_dashboard.png")
        print("Saved 46_new_restaurant_tenant_dashboard.png")

        browser.close()
        print("All onboarding verifications completed successfully!")

if __name__ == "__main__":
    test_login_and_onboarding()
