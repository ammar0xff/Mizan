import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"

async def main():
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="ar-EG",
        )
        page = await context.new_page()

        # 1. Landing Page
        print("Navigating to Landing Page...")
        await page.goto("http://localhost:5173/Vendora/", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/219_mizan_marketing_hero_and_showcase.png")
        print("Captured 219_mizan_marketing_hero_and_showcase.png")

        # Scroll down to interactive showcase and click a tab
        await page.evaluate("window.scrollTo(0, 1100)")
        await page.wait_for_timeout(1000)
        # Find restaurant tab button and click it
        restaurant_tab = page.locator("button:has-text('المطاعم والكافيهات')").first
        if await restaurant_tab.count() > 0:
            await restaurant_tab.click()
            await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/220_mizan_marketing_interactive_showcase_tab.png")
        print("Captured 220_mizan_marketing_interactive_showcase_tab.png")

        # 2. Product Page
        print("Navigating to Product Page...")
        await page.goto("http://localhost:5173/Vendora/product", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/221_mizan_marketing_product_architecture.png")
        print("Captured 221_mizan_marketing_product_architecture.png")

        # 3. Features Page
        print("Navigating to Features Page...")
        await page.goto("http://localhost:5173/Vendora/features", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/222_mizan_marketing_features_catalog.png")
        print("Captured 222_mizan_marketing_features_catalog.png")

        # 4. Industries Page
        print("Navigating to Industries Page...")
        await page.goto("http://localhost:5173/Vendora/industries", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/223_mizan_marketing_industries_verticals.png")
        print("Captured 223_mizan_marketing_industries_verticals.png")

        # 5. Pricing Page
        print("Navigating to Pricing Page...")
        await page.goto("http://localhost:5173/Vendora/pricing", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/224_mizan_marketing_pricing_plans.png")
        print("Captured 224_mizan_marketing_pricing_plans.png")

        # 6. Docs Portal Homepage
        print("Navigating to Docs Portal...")
        await page.goto("http://localhost:5173/Vendora/docs", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/225_mizan_docs_portal_home.png")
        print("Captured 225_mizan_docs_portal_home.png")

        # 7. Docs Article Page (Introduction)
        print("Navigating to Docs Article (introduction)...")
        await page.goto("http://localhost:5173/Vendora/docs/introduction", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/226_mizan_docs_article_introduction.png")
        print("Captured 226_mizan_docs_article_introduction.png")

        # 8. Blog Index
        print("Navigating to Blog Page...")
        await page.goto("http://localhost:5173/Vendora/blog", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/227_mizan_blog_index.png")
        print("Captured 227_mizan_blog_index.png")

        # 9. Blog Post Page
        print("Navigating to Blog Article (postgresql-rls-multi-tenancy)...")
        await page.goto("http://localhost:5173/Vendora/blog/postgresql-rls-multi-tenancy", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/228_mizan_blog_article_rls.png")
        print("Captured 228_mizan_blog_article_rls.png")

        # 10. Contact Page
        print("Navigating to Contact Page...")
        await page.goto("http://localhost:5173/Vendora/contact", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/229_mizan_marketing_contact_demo.png")
        print("Captured 229_mizan_marketing_contact_demo.png")

        await browser.close()
        print("All marketing & documentation screenshots successfully captured!")

if __name__ == "__main__":
    asyncio.run(main())
