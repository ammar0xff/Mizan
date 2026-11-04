import os
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173/Vendora"
OUT_DIR = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"
os.makedirs(OUT_DIR, exist_ok=True)

VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900},
    "tablet": {"width": 768, "height": 1024},
    "mobile": {"width": 390, "height": 844},
}

PAGES = [
    {"name": "landing_ar", "path": "/", "locale": "ar"},
    {"name": "landing_en", "path": "/", "locale": "en"},
    {"name": "product_en", "path": "/product", "locale": "en"},
    {"name": "product_ar", "path": "/product", "locale": "ar"},
    {"name": "features_ar", "path": "/features", "locale": "ar"},
    {"name": "industries_ar", "path": "/industries", "locale": "ar"},
    {"name": "pricing_ar", "path": "/pricing", "locale": "ar"},
    {"name": "pricing_en", "path": "/pricing", "locale": "en"},
    {"name": "about_ar", "path": "/about", "locale": "ar"},
    {"name": "contact_ar", "path": "/contact", "locale": "ar"},
    {"name": "blog_ar", "path": "/blog", "locale": "ar"},
    {"name": "docs_ar", "path": "/docs", "locale": "ar"},
    {"name": "demo_light", "path": "/demo", "locale": "ar", "action": "light"},
    {"name": "demo_dark", "path": "/demo", "locale": "ar", "action": "dark"},
    {"name": "login_ar", "path": "/login", "locale": "ar"},
    {"name": "signup_ar", "path": "/signup", "locale": "ar"},
]

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        for pinfo in PAGES:
            target_url = f"{BASE_URL}{pinfo['path']}"
            
            # Default viewport desktop
            vp = VIEWPORTS["desktop"]
            context = browser.new_context(
                viewport=vp,
                device_scale_factor=2,
            )
            page = context.new_page()
            
            page.goto(target_url, wait_until="networkidle")
            
            # Ensure correct language via vendora.locale
            desired_locale = pinfo["locale"]
            page.evaluate(f"() => {{ localStorage.setItem('vendora.locale', '{desired_locale}'); }}")
            page.reload(wait_until="networkidle")

            # Handle Dark mode action on demo page
            if pinfo.get("action") == "dark":
                try:
                    dark_btn = page.locator("button:has-text('Dark'), button:has-text('الداكن')").first
                    if dark_btn.is_visible():
                        dark_btn.click()
                        time.sleep(0.5)
                except Exception as e:
                    pass

            time.sleep(0.8) # Allow smooth framer motion to settle

            # Capture Desktop
            desk_path = os.path.join(OUT_DIR, f"mizan_editorial_{pinfo['name']}_desktop.png")
            page.screenshot(path=desk_path, full_page=False)
            print(f"Captured: {desk_path}")

            # Capture Tablet for primary landing
            if pinfo["name"] in ["landing_ar", "pricing_ar", "demo_light"]:
                page.set_viewport_size(VIEWPORTS["tablet"])
                time.sleep(0.5)
                tab_path = os.path.join(OUT_DIR, f"mizan_editorial_{pinfo['name']}_tablet.png")
                page.screenshot(path=tab_path, full_page=False)
                print(f"Captured: {tab_path}")

                # Capture Mobile
                page.set_viewport_size(VIEWPORTS["mobile"])
                time.sleep(0.5)
                mob_path = os.path.join(OUT_DIR, f"mizan_editorial_{pinfo['name']}_mobile.png")
                page.screenshot(path=mob_path, full_page=False)
                print(f"Captured: {mob_path}")

            context.close()

        browser.close()
    print("All screenshots successfully captured!")

if __name__ == "__main__":
    run()
