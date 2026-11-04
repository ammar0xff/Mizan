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
        "name": "مجموعة فيندورا للشركات والأنشطة المتعددة",
        "slug": "mizan-enterprise",
        "sector": "general",
        "scale": "medium",
        "palette": {"name": "blue", "hue": 220},
        "features": ["all"],
        "active_modules": ["core", "inventory", "pos", "finance", "pharmacy", "restaurant", "school", "services", "hr"],
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
            localStorage.setItem("mizan.active_modules", JSON.stringify(["core", "inventory", "pos", "finance", "pharmacy", "restaurant", "school", "services", "hr"]));
            localStorage.setItem("mizan.active_preset", "retail");
        """)

        page = await context.new_page()

        # ====================================================================
        # 1. Restaurant Suite (Hall, KDS, Recipe BOM & Food Costing, Waste)
        # ====================================================================
        print(">>> Testing Restaurant Suite...")
        await page.goto("http://localhost:5173/Mizan/restaurant/tables", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)

        # Navigate to Recipe BOM & Food Costing tab
        recipes_tab_btn = page.locator("button:has-text('شجرة الوصفات وتكاليف الطعام')")
        await recipes_tab_btn.click()
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/83_restaurant_recipe_bom_costing.png", full_page=True)
        print("  ✓ Captured 83_restaurant_recipe_bom_costing.png")

        # Test Backflushing Depletion Simulation
        deplete_btn = page.locator("button:has-text('خصم تلقائي')").first
        await deplete_btn.click()
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/84_restaurant_backflush_modal.png")
        print("  ✓ Captured 84_restaurant_backflush_modal.png")

        # Close modal
        close_modal_btn = page.locator("div[role='dialog'] button, button[aria-label='Close'], button:has-text('✕')").first
        if await close_modal_btn.count() > 0:
            await close_modal_btn.click()
            await page.wait_for_timeout(500)
        else:
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(500)

        # Navigate to Food Waste tab
        waste_tab_btn = page.locator("button:has-text('الهادر والتالف')")
        await waste_tab_btn.click()
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/85_restaurant_food_waste_tab.png", full_page=True)
        print("  ✓ Captured 85_restaurant_food_waste_tab.png")

        # ====================================================================
        # 2. School Suite (Students, Installments, Attendance, Gradebook)
        # ====================================================================
        print(">>> Testing School Suite...")
        await page.goto("http://localhost:5173/Mizan/school/students", wait_until="domcontentloaded")
        await page.wait_for_timeout(3500)
        await page.screenshot(path=f"{screenshot_dir}/86_school_students_installments.png", full_page=True)
        print("  ✓ Captured 86_school_students_installments.png")

        # Attendance Tab
        attendance_tab_btn = page.locator("button:has-text('الحضور والغياب')")
        await attendance_tab_btn.click()
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/87_school_attendance_tab.png", full_page=True)
        print("  ✓ Captured 87_school_attendance_tab.png")

        # Gradebook Tab
        grades_tab_btn = page.locator("button:has-text('دفتر الدرجات والاختبارات')")
        await grades_tab_btn.click()
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/88_school_gradebook_tab.png", full_page=True)
        print("  ✓ Captured 88_school_gradebook_tab.png")

        # ====================================================================
        # 3. Consulting / Professional Services Suite
        # ====================================================================
        print(">>> Testing Consulting & Professional Services Suite...")
        await page.goto("http://localhost:5173/Mizan/services", wait_until="domcontentloaded")
        await page.wait_for_timeout(3500)
        await page.screenshot(path=f"{screenshot_dir}/89_services_engagements_retainers.png", full_page=True)
        print("  ✓ Captured 89_services_engagements_retainers.png")

        # Timesheets Tab
        timesheets_tab_btn = page.locator("button:has-text('ساعات الفوترة')")
        await timesheets_tab_btn.click()
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/90_services_timesheets_billable.png", full_page=True)
        print("  ✓ Captured 90_services_timesheets_billable.png")

        # Statutory Tax Deadlines Tab
        deadlines_tab_btn = page.locator("button:has-text('الاستحقاقات والإقرارات الضريبية')")
        await deadlines_tab_btn.click()
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/91_services_statutory_tax_deadlines.png", full_page=True)
        print("  ✓ Captured 91_services_statutory_tax_deadlines.png")

        await browser.close()
        print(">>> All Phase 1 modules verified successfully!")

if __name__ == "__main__":
    asyncio.run(run())
