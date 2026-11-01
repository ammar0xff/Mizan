import os
import sys
import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

BASE_URL = "http://localhost:5173/Vendora"

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="ar-EG",
        )
        page = context.new_page()

        print("1. Loading official Vendora Landing Page...")
        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        page.wait_for_selector("text=Vendora ERP")
        page.wait_for_timeout(1000)
        
        # Verify branding and key elements
        assert page.locator("text=Vendora ERP").count() > 0, "Missing Vendora ERP header"
        assert page.locator("text=منظومة ERP متعددة المستأجرين").count() > 0, "Missing multi-tenant badge"
        assert page.locator("text=14+").count() > 0, "Missing 14+ modules metric"
        assert page.locator("text=monset-gym").count() > 0, "Missing demo slug button"
        
        # Hero Screenshot
        page.screenshot(path=f"{SCREENSHOTS_DIR}/69_official_landing_hero.png", full_page=False)
        print("  -> Saved 69_official_landing_hero.png")

        # Scroll to Industry Verticals
        print("2. Testing Industry Verticals Switcher...")
        page.locator("#industries").scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/70_official_landing_gym_vertical.png", full_page=False)
        print("  -> Saved 70_official_landing_gym_vertical.png (Gym-POS)")

        # Click Restaurant vertical
        page.locator("button:has-text('المطاعم والكافيهات')").click()
        page.wait_for_timeout(500)
        assert page.locator("text=restaurant-pos").count() > 0, "Restaurant collection missing"
        page.screenshot(path=f"{SCREENSHOTS_DIR}/71_official_landing_restaurant_vertical.png", full_page=False)
        print("  -> Saved 71_official_landing_restaurant_vertical.png (Restaurant-POS)")

        # Scroll to Deployment Architectures
        print("3. Testing Deployment Architectures...")
        page.locator("#deployments").scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/72_official_landing_deployments.png", full_page=False)
        print("  -> Saved 72_official_landing_deployments.png")

        # Scroll to Printing & Hardware Engine
        print("4. Testing Thermal Receipt & Printing Engine...")
        page.locator("#printing").scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        assert page.locator("text=VENDORA ERP · فندق ومطعم الواحة").count() > 0, "Missing thermal invoice text"
        page.screenshot(path=f"{SCREENSHOTS_DIR}/73_official_landing_printing_engine.png", full_page=False)
        print("  -> Saved 73_official_landing_printing_engine.png")

        # Scroll to Pricing Grid on Landing Page
        print("5. Testing Pricing section on Landing Page...")
        page.locator("#pricing").scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/74_official_landing_pricing_grid.png", full_page=False)
        print("  -> Saved 74_official_landing_pricing_grid.png")

        # Navigate to Full Dedicated Pricing Page
        print("6. Loading Dedicated Pricing Page (/pricing)...")
        page.goto(f"{BASE_URL}/pricing", wait_until="networkidle")
        page.wait_for_selector("text=باقات تناسب نمو منشأتك")
        page.wait_for_timeout(800)
        assert page.locator("text=باقة المحترفين (Pro)").count() > 0, "Missing Pro plan on pricing page"
        page.screenshot(path=f"{SCREENSHOTS_DIR}/75_official_pricing_page.png", full_page=False)
        print("  -> Saved 75_official_pricing_page.png")

        # Test Annual Billing Switch on Pricing Page
        print("7. Testing Annual Billing toggle...")
        page.locator("button:has-text('الدفع السنوي')").click()
        page.wait_for_timeout(500)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/76_official_pricing_annual_discount.png", full_page=False)
        print("  -> Saved 76_official_pricing_annual_discount.png")

        browser.close()
        print("All official website tests and screenshots completed successfully!")

if __name__ == "__main__":
    run_verification()
