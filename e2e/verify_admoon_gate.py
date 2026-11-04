import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

BASE_URL = "http://localhost:5173/Mizan"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("--- 1. Login as tenant admin (captain_monset) first ---")
        await page.goto(f"{BASE_URL}/monset-gym", wait_until="networkidle")
        await page.fill("input#u", "captain_monset")
        await page.fill("input#p", "changeme")
        await page.click("button[type='submit']")
        await page.wait_for_selector("text=التشغيل والعمليات", timeout=10000)
        print("Logged in as captain_monset.")

        print("--- 2. Navigate to /admoon (should encounter 403 and show Gate) ---")
        await page.goto(f"{BASE_URL}/admoon", wait_until="networkidle")
        await page.wait_for_selector("text=بوابة الإدارة العليا (Admoon)", timeout=10000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/58_admoon_forbidden_gate.png")
        print("Captured: 58_admoon_forbidden_gate.png")

        print("--- 3. Click Superadmin Fast Login Button ---")
        fast_btn = page.locator("button:has-text('دخول سريع كـ ammar')").first
        await fast_btn.click()
        await page.wait_for_selector("text=SaaS Control Plane", timeout=10000)
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/59_admoon_authenticated_dashboard.png")
        print("Captured: 59_admoon_authenticated_dashboard.png")

        await browser.close()
        print("ADMOON GATE VERIFICATION PASSED!")

if __name__ == "__main__":
    asyncio.run(run())
