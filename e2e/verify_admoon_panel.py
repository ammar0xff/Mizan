import time
import os
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def test_full_admoon_panel():
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

        # Wait for app ready
        page.wait_for_url("**/Vendora/", timeout=15000)
        time.sleep(1)

        # 2. Navigate to /Vendora/admoon (Dashboard)
        print("1. Testing Admoon Executive Dashboard...")
        page.goto("http://localhost:5173/Vendora/admoon")
        page.wait_for_selector("text=مركز قيادة المنصة", timeout=12000)
        time.sleep(1.5)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/60_admoon_dashboard.png")
        print("Saved 60_admoon_dashboard.png")

        # 3. Navigate to /Vendora/admoon/tenants
        print("2. Testing Tenants Management Table...")
        page.goto("http://localhost:5173/Vendora/admoon/tenants")
        page.wait_for_selector("text=إدارة الشركات والمستأجرين", timeout=10000)
        time.sleep(1)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/61_admoon_tenants.png")
        print("Saved 61_admoon_tenants.png")

        # Open Tech Stack modal on the first tenant
        tech_btn = page.locator("button:has-text('البنية والوحدات')").first
        if tech_btn.is_visible():
            tech_btn.click()
            page.wait_for_selector("text=تعديل البنية التقنية والوحدات", timeout=5000)
            time.sleep(0.5)
            # close
            page.locator("button:has-text('إلغاء')").click()
            time.sleep(0.5)

        # 4. Navigate to /Vendora/admoon/wizard (Tenant Creation Wizard)
        print("3. Testing Multi-Step Provisioning Wizard...")
        page.goto("http://localhost:5173/Vendora/admoon/wizard")
        page.wait_for_selector("text=المعلومات الأساسية وهوية المنشأة", timeout=10000)
        
        # Fill Step 1
        page.fill("input[placeholder*='نادي مونست الرياضي']", "أكاديمية المستقبل التجريبية")
        page.fill("input[placeholder*='monset-gym']", "future-academy-test")
        time.sleep(0.5)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/62_admoon_wizard_step1.png")
        print("Saved 62_admoon_wizard_step1.png")

        # Click next to Step 2
        page.locator("button:has-text('التالي: نمط الاستضافة')").click()
        time.sleep(0.5)

        # Select VPS Deployment in Step 2
        vps_opt = page.locator("text=خادم خاص افتراضي")
        if vps_opt.is_visible():
            vps_opt.click()
        time.sleep(0.5)

        # Click next to Step 3 (Database)
        page.locator("button:has-text('التالي: قاعدة البيانات')").click()
        time.sleep(0.5)

        # Click next to Step 4 (Storage)
        page.locator("button:has-text('التالي: وسيط التخزين')").click()
        time.sleep(0.5)

        # Click next to Step 5 (Modules)
        page.locator("button:has-text('التالي: الوحدات النمطية')").click()
        time.sleep(0.5)

        # Click next to Step 6 (Admin User)
        page.locator("button:has-text('التالي: حساب المدير')").click()
        time.sleep(0.5)

        # Step 6: Fill Admin user details
        page.fill("input[placeholder*='كابتن أحمد منصور']", "المهندس عمار السالم")
        page.fill("input[placeholder*='captain_monset']", "future_admin")
        page.fill("input[type='password']", "secret123456")
        time.sleep(0.5)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/62_admoon_wizard_summary.png")
        print("Saved 62_admoon_wizard_summary.png")

        # 5. Inspect First Tenant Details Page (13 Tabs)
        print("4. Testing Tenant Details Drill-Down & Tabs...")
        page.goto("http://localhost:5173/Vendora/admoon/tenants")
        page.wait_for_selector("a[href*='admoon/tenants/']", timeout=10000)
        href = page.locator("a[href*='admoon/tenants/']").first.get_attribute("href")
        print(f"Navigating to Tenant Details: {href}...")
        page.goto(f"http://localhost:5173{href}")
        page.wait_for_selector("text=نظرة عامة", timeout=10000)
        time.sleep(1)

        # Click Database Tab
        db_tab = page.locator("button:has-text('قاعدة البيانات')")
        if db_tab.is_visible():
            db_tab.click()
            time.sleep(0.5)

        # Click Modules Tab
        modules_tab = page.locator("button:has-text('الوحدات النمطية')")
        if modules_tab.is_visible():
            modules_tab.click()
            time.sleep(0.5)

        # Click Backups Tab
        backups_tab = page.locator("button:has-text('النسخ والتعافي')")
        if backups_tab.is_visible():
            backups_tab.click()
            time.sleep(0.5)

        page.screenshot(path=f"{SCREENSHOTS_DIR}/63_admoon_tenant_details.png")
        print("Saved 63_admoon_tenant_details.png")

        # 6. Test Database Providers Page
        print("5. Testing Database Providers & Connection Tests...")
        page.goto("http://localhost:5173/Vendora/admoon/databases")
        page.wait_for_selector("text=محركات وقواعد بيانات المنظومة", timeout=10000)
        time.sleep(1)
        test_conn_btn = page.locator("button:has-text('اختبار الاتصال')").first
        if test_conn_btn.is_visible():
            test_conn_btn.click()
            time.sleep(1)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/64_admoon_database_providers.png")
        print("Saved 64_admoon_database_providers.png")

        # 7. Test Module Catalog Page
        print("6. Testing Module Catalog & Specialized Collections...")
        page.goto("http://localhost:5173/Vendora/admoon/modules")
        page.wait_for_selector("text=كتالوج وحدات ومجموعات ERP النمطية", timeout=10000)
        time.sleep(1)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/65_admoon_module_catalog.png")
        print("Saved 65_admoon_module_catalog.png")

        # 8. Test Infrastructure Quotas Page
        print("7. Testing Infrastructure Quotas...")
        page.goto("http://localhost:5173/Vendora/admoon/infrastructure")
        page.wait_for_selector("text=إدارة البنية التحتية والموارد", timeout=10000)
        time.sleep(1)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/66_admoon_infrastructure.png")
        print("Saved 66_admoon_infrastructure.png")

        # 9. Test Subscriptions & Pricing Page
        print("8. Testing Subscriptions Tiers...")
        page.goto("http://localhost:5173/Vendora/admoon/subscriptions")
        page.wait_for_selector("text=باقات وخطط الاشتراك", timeout=10000)
        time.sleep(1)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/67_admoon_subscriptions.png")
        print("Saved 67_admoon_subscriptions.png")

        # 10. Test Audit Logs Page
        print("9. Testing Audit Logs...")
        page.goto("http://localhost:5173/Vendora/admoon/audit-logs")
        page.wait_for_selector("text=السجل الرقابي والتدقيق الأمني", timeout=10000)
        time.sleep(1)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/68_admoon_audit_logs.png")
        print("Saved 68_admoon_audit_logs.png")

        browser.close()
        print("All E2E checks passed successfully!")

if __name__ == "__main__":
    test_full_admoon_panel()
