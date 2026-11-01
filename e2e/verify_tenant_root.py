import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

BASE_URL = "http://localhost:5173/Vendora"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("--- 1. Testing Unauthenticated Tenant Root (/monset-gym) ---")
        await page.goto(f"{BASE_URL}/monset-gym", wait_until="networkidle")
        await page.wait_for_selector("text=نادي مونست الرياضي")
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/53_tenant_root_unauth_login.png")
        print("Captured: 53_tenant_root_unauth_login.png")

        print("--- 2. Logging in as Captain Monset on Tenant Root ---")
        await page.fill("input#u", "captain_monset")
        await page.fill("input#p", "changeme")
        await page.click("button[type='submit']")
        await page.wait_for_selector("text=التشغيل والعمليات", timeout=10000)
        await page.wait_for_timeout(1000)
        
        # Verify dashboard is rendered under /monset-gym
        print(f"Current URL after login: {page.url}")
        assert "/monset-gym" in page.url, f"Expected /monset-gym in {page.url}"
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/54_tenant_root_dashboard.png")
        print("Captured: 54_tenant_root_dashboard.png")

        print("--- 3. Navigating to POS from Sidebar under Tenant Root ---")
        # Click POS link in sidebar
        pos_link = page.locator("a:has-text('نقطة البيع')").first
        await pos_link.click()
        await page.wait_for_timeout(1500)
        print(f"Current URL after clicking POS: {page.url}")
        assert "/monset-gym/pos" in page.url, f"Expected /monset-gym/pos in {page.url}"
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/55_tenant_root_pos.png")
        print("Captured: 55_tenant_root_pos.png")

        print("--- 4. Navigating to Settings from Sidebar under Tenant Root ---")
        settings_link = page.locator("a:has-text('الإعدادات')").first
        await settings_link.click()
        await page.wait_for_timeout(1500)
        print(f"Current URL after clicking Settings: {page.url}")
        assert "/monset-gym/settings" in page.url, f"Expected /monset-gym/settings in {page.url}"
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/56_tenant_root_settings.png")
        print("Captured: 56_tenant_root_settings.png")

        print("--- 5. Direct Deep-Link Navigation to /monset-gym/inventory ---")
        await page.goto(f"{BASE_URL}/monset-gym/inventory", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        print(f"Current URL on direct deep-link: {page.url}")
        assert "/monset-gym/inventory" in page.url, f"Expected /monset-gym/inventory in {page.url}"
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/57_tenant_root_direct_deeplink.png")
        print("Captured: 57_tenant_root_direct_deeplink.png")

        await browser.close()
        print("ALL TENANT ROOT VERIFICATIONS PASSED!")

if __name__ == "__main__":
    asyncio.run(run())
