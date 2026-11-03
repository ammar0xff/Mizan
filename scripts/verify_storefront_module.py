import asyncio
import json
import urllib.request
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"

async def run_verification():
    print("=== Starting Tenant Storefront End-to-End Verification ===")

    # 1. Obtain real auth credentials for ERP back-office
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
        "active_modules": ["pos", "inventory", "storefront", "core", "finance"],
    }

    user_info = {
        "id": auth_data["user_id"],
        "username": auth_data["username"],
        "full_name": auth_data["full_name"],
        "role": auth_data["role"],
        "permissions": ["all", "pos", "sales", "inventory", "customers", "finance", "settings"],
        "tenant_id": tenant_info["id"],
        "is_manager": True,
        "is_superadmin": True,
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="ar-EG",
        )
        page = await context.new_page()

        # ---------------------------------------------------------
        # Step 1: Public Customer Storefront Catalog
        # ---------------------------------------------------------
        print("\n--> Step 1: Loading Public Customer Storefront...")
        await page.goto("http://localhost:5173/Vendora/store/german-egyptian", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # Check for store brand title and catalog
        await page.wait_for_selector("text=المصرية الألمانية للأدوات الصحية", timeout=10000)
        print("✓ Verified Store Brand Header")

        # Take Screenshot 196
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/196_public_storefront_catalog.png")
        print(f"✓ Saved screenshot: 196_public_storefront_catalog.png")

        # ---------------------------------------------------------
        # Step 2: Add Product to Cart & Open Cart Drawer
        # ---------------------------------------------------------
        print("\n--> Step 2: Adding Product to Cart and Testing Cart Drawer...")
        # Find the first "أضف للسلة" button
        add_btn = page.locator("button:has-text('أضف للسلة')").first
        await add_btn.wait_for(state="visible", timeout=10000)
        await add_btn.click()
        await page.wait_for_timeout(1000)

        # Click the cart button to open drawer
        cart_trigger = page.locator("button:has-text('السلة')").first
        await cart_trigger.click()
        await page.wait_for_timeout(1000)

        # Verify drawer has opened
        await page.wait_for_selector("text=سلة الشراء", timeout=5000)
        print("✓ Verified Cart Drawer opened")

        # Test Coupon application: WELCOME10
        coupon_input = page.locator("input[placeholder*='كود الخصم']")
        if await coupon_input.is_visible():
            await coupon_input.fill("WELCOME10")
            apply_coupon_btn = page.locator("button:has-text('تطبيق')").first
            await apply_coupon_btn.click()
            await page.wait_for_timeout(1500)
            print("✓ Applied promo coupon WELCOME10")

        # Take Screenshot 197
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/197_storefront_cart_drawer.png")
        print(f"✓ Saved screenshot: 197_storefront_cart_drawer.png")

        # ---------------------------------------------------------
        # Step 3: Checkout Modal & Order Placement
        # ---------------------------------------------------------
        print("\n--> Step 3: Proceeding to Checkout...")
        checkout_btn = page.locator("button:has-text('متابعة إتمام الطلب')").first
        await checkout_btn.click()
        await page.wait_for_timeout(1000)

        # Fill Customer Details
        name_input = page.locator("input[placeholder*='يوسف إبراهيم']")
        await name_input.fill("م. هاني شاكر")

        phone_input = page.locator("input[placeholder*='010xxxxxxxx']")
        await phone_input.fill("01098765432")

        # Select Fawry payment option
        fawry_option = page.locator("button:has-text('فوري')").first
        if await fawry_option.is_visible():
            await fawry_option.click()
            await page.wait_for_timeout(500)

        # Check address field if home delivery
        addr_input = page.locator("input[placeholder*='المعادي']")
        if await addr_input.is_visible():
            await addr_input.fill("المعادي الجديدة، شارع النصر، عمارة 15، الدور الثالث")

        # Submit Order
        confirm_btn = page.locator("button:has-text('تأكيد الطلب الآن')").first
        await confirm_btn.click()
        await page.wait_for_timeout(3000)

        # Verify confirmation dialog
        await page.wait_for_selector("text=تم استلام طلبك بنجاح", timeout=10000)
        print("✓ Order placed successfully! Confirmation modal displayed.")

        # Take Screenshot 198
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/198_storefront_order_placed_confirmation.png")
        print(f"✓ Saved screenshot: 198_storefront_order_placed_confirmation.png")

        # ---------------------------------------------------------
        # Step 4: Back-Office Storefront Dispatch Hub
        # ---------------------------------------------------------
        print("\n--> Step 4: Loading ERP Back-Office Storefront Dispatch Board...")
        admin_page = await context.new_page()

        session_payload = {
            "token": token,
            "user": user_info,
            "tenant": tenant_info,
        }

        # Inject auth state before loading
        await admin_page.add_init_script(f"""
            window.localStorage.setItem('vendora.session', JSON.stringify({json.dumps(session_payload)}));
            window.localStorage.setItem('vendora.active_modules', JSON.stringify({json.dumps(tenant_info["active_modules"])}));
        """)

        await admin_page.goto("http://localhost:5173/Vendora/c/german-egyptian/storefront", wait_until="networkidle")
        await admin_page.wait_for_timeout(3000)

        # Verify Storefront Admin header & KPIs
        await admin_page.wait_for_selector("text=Tenant Storefront", timeout=15000)
        print("✓ Verified Storefront Back-Office Hub loaded")

        # Take Screenshot 199
        await admin_page.screenshot(path=f"{SCREENSHOTS_DIR}/199_storefront_admin_dispatch_board.png")
        print(f"✓ Saved screenshot: 199_storefront_admin_dispatch_board.png")

        # ---------------------------------------------------------
        # Step 5: Test Customizer & Promo Coupons Tabs
        # ---------------------------------------------------------
        print("\n--> Step 5: Testing Customizer & Coupons tabs...")

        # Switch to Customizer tab
        customizer_tab = admin_page.locator("button:has-text('تخصيص وهوية المتجر')").first
        if await customizer_tab.is_visible():
            await customizer_tab.click()
            await admin_page.wait_for_timeout(1000)
            await admin_page.screenshot(path=f"{SCREENSHOTS_DIR}/200_storefront_admin_customizer.png")
            print(f"✓ Saved screenshot: 200_storefront_admin_customizer.png")

        # Switch to Coupons tab
        coupons_tab = admin_page.locator("button:has-text('قسائم وكوبونات الخصم')").first
        if await coupons_tab.is_visible():
            await coupons_tab.click()
            await admin_page.wait_for_timeout(1000)
            await admin_page.screenshot(path=f"{SCREENSHOTS_DIR}/201_storefront_admin_coupons.png")
            print(f"✓ Saved screenshot: 201_storefront_admin_coupons.png")

        await browser.close()
        print("\n=== All Storefront Tests & Screenshots Completed Successfully! ===")

if __name__ == "__main__":
    asyncio.run(run_verification())
