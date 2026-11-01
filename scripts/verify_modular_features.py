import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1400, "height": 900},
            locale="ar-EG"
        )
        page = await context.new_page()

        # Step 1: Open Modules Page
        print("Navigating to Modules Marketplace...")
        await page.goto("http://localhost:5173/Vendora/#/modules")
        await page.wait_for_timeout(2000)

        # Open upload modal
        upload_btn = page.locator("button:has-text('تثبيت موديول خارجي')")
        await upload_btn.click()
        await page.wait_for_timeout(600)
        await page.screenshot(path="/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens/28_module_upload_modal.png")
        print("Saved 28_module_upload_modal.png")

        # Set file input
        file_input = page.locator("input[type='file']")
        await file_input.set_input_files("/tmp/gym_fitness_module.zip")
        await page.wait_for_timeout(600)

        # Submit upload
        submit_btn = page.locator("button:has-text('تثبيت الموديول في النظام')")
        await submit_btn.click()
        await page.wait_for_timeout(1800)

        # Capture post-upload screenshot
        await page.screenshot(path="/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens/29_module_uploaded_success.png")
        print("Saved 29_module_uploaded_success.png")

        # Step 2: Test School Student Payment & Official Receipt
        print("Navigating to School Students Page...")
        await page.goto("http://localhost:5173/Vendora/#/school/students")
        await page.wait_for_timeout(1500)

        # Find student with balance due and click "تحصيل قسط"
        pay_btn = page.locator("tr:has-text('يوسف طارق علي') button:has-text('تحصيل قسط')")
        if await pay_btn.count() > 0:
            await pay_btn.click()
            await page.wait_for_timeout(600)

            # Fill payment amount
            amt_input = page.locator("input[placeholder='0.00']")
            await amt_input.fill("2000")
            await page.wait_for_timeout(300)

            # Submit
            confirm_btn = page.locator("button:has-text('تأكيد السداد وإصدار إيصال إلكتروني')")
            await confirm_btn.click()
            await page.wait_for_timeout(1500)

            # Capture official receipt modal
            await page.screenshot(path="/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens/30_school_tuition_official_receipt.png")
            print("Saved 30_school_tuition_official_receipt.png")

            # Close receipt modal
            close_receipt = page.locator("button:has-text('إغلاق')")
            if await close_receipt.count() > 0:
                await close_receipt.first.click()
                await page.wait_for_timeout(500)

        # Step 3: Test Restaurant Dining Hall & Guest Check
        print("Navigating to Restaurant Tables...")
        await page.goto("http://localhost:5173/Vendora/#/restaurant/tables")
        await page.wait_for_timeout(1500)

        # Click an occupied table or occupy table 03
        table_card = page.locator("div:has-text('طاولة 01')").first
        await table_card.click()
        await page.wait_for_timeout(600)

        # Click "طباعة بون الحساب"
        guest_check_btn = page.locator("button:has-text('طباعة بون الحساب (Guest Check)')")
        if await guest_check_btn.count() > 0:
            await guest_check_btn.click()
            await page.wait_for_timeout(600)
            await page.screenshot(path="/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens/31_restaurant_guest_check_modal.png")
            print("Saved 31_restaurant_guest_check_modal.png")

            close_check = page.locator("button:has-text('إغلاق')")
            if await close_check.count() > 0:
                await close_check.first.click()
                await page.wait_for_timeout(500)

        # Step 4: Test Command Palette Live Search
        print("Testing Command Palette (Ctrl+K)...")
        await page.keyboard.press("Control+k")
        await page.wait_for_timeout(500)
        await page.keyboard.type("طاولة")
        await page.wait_for_timeout(800)

        await page.screenshot(path="/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens/32_command_palette_modular_search.png")
        print("Saved 32_command_palette_modular_search.png")

        await browser.close()
        print("All visual verifications completed successfully!")

if __name__ == "__main__":
    asyncio.run(run())
