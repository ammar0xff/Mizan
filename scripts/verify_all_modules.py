import asyncio
import json
import urllib.request
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"

async def run_verification():
    print("=== Starting Comprehensive Modular Integrations Playwright Verification ===")

    # 1. Obtain auth token
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
        "active_modules": ["pos", "inventory", "storefront", "core", "finance", "hr", "pos_hardware", "automation_worker", "zk_attendance", "i18n"],
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

        # Inject session into localStorage
        await page.goto("http://localhost:5173/Mizan/")
        await page.evaluate(f"""() => {{
            localStorage.setItem("mizan.session", JSON.stringify({json.dumps(session_payload)}));
            localStorage.setItem("mizan.active_modules", JSON.stringify({json.dumps(tenant_info["active_modules"])}));
            localStorage.setItem("mizan.tenant_slug", "german-egyptian");
            localStorage.setItem("mizan.locale", "ar");
        }}""")

        # ── Test 1: POS Hardware & Velocity Shortcuts ───────────────────────────
        print("\n--- 1. Testing POS Hardware, Barcode Gun Listener & Thermal Receipts ---")
        await page.goto("http://localhost:5173/Mizan/c/german-egyptian/pos")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

        # 1a. Click "الاختصارات" cheat sheet button
        shortcuts_btn = page.locator("button:has-text('الاختصارات')").first
        await shortcuts_btn.click()
        await page.locator("text=اختصارات لوحة المفاتيح والسرعة الفائقة").wait_for(state="visible", timeout=10000)
        await asyncio.sleep(0.5)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/206_pos_keyboard_velocity_shortcuts.png")
        print("✓ Captured 206_pos_keyboard_velocity_shortcuts.png")

        # Close shortcuts modal
        await page.keyboard.press("Escape")
        await asyncio.sleep(1)

        # 1b. Open hardware modal using ribbon click on "الطابعة والورق"
        printer_btn = page.locator("text=الطابعة والورق").first
        await printer_btn.click()
        await page.locator("text=إعدادات عتاد الكاشير والطباعة الحرارية").wait_for(state="visible", timeout=10000)
        await asyncio.sleep(1)

        # Switch to Thermal Preview tab
        preview_tab = page.locator("button:has-text('معاينة')").first
        await preview_tab.click()
        await page.locator("text=INV-2026-0042").wait_for(state="visible", timeout=10000)
        await asyncio.sleep(0.5)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/207_pos_thermal_receipt_80mm_preview.png")
        print("✓ Captured 207_pos_thermal_receipt_80mm_preview.png")

        # Switch back to Config tab, choose 58mm compact
        config_tab = page.locator("button:has-text('خيارات الطابعة')").first
        await config_tab.click()
        await asyncio.sleep(0.5)

        compact_58mm_btn = page.locator("text=58 مم").first
        await compact_58mm_btn.click()
        await asyncio.sleep(0.5)

        # Switch to preview 58mm
        await preview_tab.click()
        await asyncio.sleep(0.5)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/208_pos_thermal_receipt_58mm_compact_preview.png")
        print("✓ Captured 208_pos_thermal_receipt_58mm_compact_preview.png")

        # Save settings and close modal
        save_btn = page.locator("button:has-text('حفظ الإعدادات')").first
        if await save_btn.is_visible():
            await save_btn.click()
            await asyncio.sleep(1)
        await page.keyboard.press("Escape")
        await asyncio.sleep(1)

        # 1c. Add product to cart via click to demonstrate active POS and continuous scanner ready
        product_card = page.locator(".group.cursor-pointer").first
        if await product_card.is_visible():
            await product_card.click()
            await asyncio.sleep(1)

        await page.screenshot(path=f"{SCREENSHOTS_DIR}/209_pos_continuous_barcode_scan_added.png")
        print("✓ Captured 209_pos_continuous_barcode_scan_added.png")

        # ── Test 2: Background Automation & Cron Worker ─────────────────────────
        print("\n--- 2. Testing Background Automation & Cron Worker Module ---")
        # Click the Cpu icon button in TopBar
        cpu_btn = page.locator("button[title*='الأتمتة']").first
        await cpu_btn.click()
        await page.locator("text=محرك الأتمتة وجدولة المهام").wait_for(state="visible", timeout=10000)
        await asyncio.sleep(1)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/210_automation_worker_scheduled_jobs.png")
        print("✓ Captured 210_automation_worker_scheduled_jobs.png")

        # Switch to Logs tab
        logs_tab = page.locator("button:has-text('سجل التشغيل')").first
        await logs_tab.click(force=True)
        await asyncio.sleep(1)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/211_automation_worker_execution_logs.png")
        print("✓ Captured 211_automation_worker_execution_logs.png")

        # Close automation modal
        await page.keyboard.press("Escape")
        await asyncio.sleep(1)

        # ── Test 3: HR Biometric Attendance & Device Sync ────────────────────────
        print("\n--- 3. Testing HR Biometric Attendance & Device Sync Module ---")
        await page.goto("http://localhost:5173/Mizan/c/german-egyptian/hr")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.5)

        # Click tab "المزامنة والجهاز"
        sync_tab_btn = page.locator("button:has-text('المزامنة والجهاز')").first
        await sync_tab_btn.click()
        await page.locator("text=ZKTeco Biometrics").wait_for(state="visible", timeout=10000)
        await asyncio.sleep(1)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/212_hr_biometric_device_manager.png")
        print("✓ Captured 212_hr_biometric_device_manager.png")

        # Click "مزامنة الآن" button on the device card
        device_sync_btn = page.locator("button:has-text('مزامنة الآن')").first
        if await device_sync_btn.is_visible():
            await device_sync_btn.click()
            await asyncio.sleep(2.5)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/213_hr_biometric_punches_synced.png")
        print("✓ Captured 213_hr_biometric_punches_synced.png")

        # ── Test 4: Internationalization (i18n) AR / EN System ───────────────────
        print("\n--- 4. Testing Internationalization (i18n) AR / EN System ---")
        # Click the EN language switcher button in TopBar
        lang_switcher = page.locator("button:has-text('EN')").first
        await lang_switcher.click()
        await asyncio.sleep(1.5)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/214_i18n_english_ltr_layout.png")
        print("✓ Captured 214_i18n_english_ltr_layout.png")

        # Click عربي switcher to restore RTL Arabic
        ar_switcher = page.locator("button:has-text('عربي')").first
        await ar_switcher.click()
        await asyncio.sleep(1.5)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/215_i18n_arabic_rtl_restored.png")
        print("✓ Captured 215_i18n_arabic_rtl_restored.png")

        await browser.close()
        print("\n=== All 10 Audit Screenshots Generated Successfully ===")

if __name__ == "__main__":
    asyncio.run(run_verification())
