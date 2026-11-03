import asyncio
import json
import urllib.request
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"

async def run_verification():
    print("=== Starting In-App Notification Center & Live Alerts Verification ===")

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

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 2. Trigger fresh system alerts
    gen_req = urllib.request.Request(
        "http://localhost:8000/notifications/generate-system-alerts",
        data=b"{}",
        headers=headers
    )
    with urllib.request.urlopen(gen_req) as resp:
        print("✓ System alerts generated:", json.loads(resp.read().decode()))

    # Also add a fresh storefront web order alert
    create_req = urllib.request.Request(
        "http://localhost:8000/notifications/create",
        data=json.dumps({
            "type": "storefront_order",
            "severity": "info",
            "title": "طلب شراء جديد من المتجر الإلكتروني (ORD-202611-9988)",
            "body": "قام العميل «كريم عبد العزيز» بإرسال طلب أونلاين بقيمة 340.00 ج.م بانتظار التجهيز.",
            "link": "/storefront",
            "data_json": {"order_number": "ORD-202611-9988", "amount": 340}
        }).encode(),
        headers=headers
    )
    with urllib.request.urlopen(create_req) as resp:
        print("✓ Seeded new storefront order notification:", json.loads(resp.read().decode()))

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

        # Inject auth state
        await page.add_init_script(f"""
            window.localStorage.setItem('vendora.session', JSON.stringify({json.dumps(session_payload)}));
            window.localStorage.setItem('vendora.active_modules', JSON.stringify({json.dumps(tenant_info["active_modules"])}));
        """)

        # ---------------------------------------------------------
        # Step 1: Navigate to Dashboard and verify Notification Bell & Badge
        # ---------------------------------------------------------
        print("\n--> Step 1: Loading ERP Dashboard and Checking Notification Bell Badge...")
        await page.goto("http://localhost:5173/Vendora/c/german-egyptian", wait_until="networkidle")
        await page.wait_for_timeout(3000)

        # Locate Notification Bell trigger
        bell_btn = page.locator("button[aria-label*='مركز التنبيهات والإشعارات']").first
        await bell_btn.wait_for(state="visible", timeout=10000)
        print("✓ Found Notification Bell in TopNav")

        # Screenshot 202: Topbar with Notification Bell Badge
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/202_topbar_notification_bell_badge.png")
        print(f"✓ Saved screenshot: 202_topbar_notification_bell_badge.png")

        # ---------------------------------------------------------
        # Step 2: Open Notification Center Popover
        # ---------------------------------------------------------
        print("\n--> Step 2: Opening Notification Center Popover...")
        await bell_btn.click()
        await page.wait_for_timeout(1500)

        # Verify Popover content
        await page.wait_for_selector("text=مركز التنبيهات", timeout=5000)
        print("✓ Notification Center Popover opened successfully")

        # Screenshot 203: Popover Open with Live Alert Cards
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/203_notification_center_popover_open.png")
        print(f"✓ Saved screenshot: 203_notification_center_popover_open.png")

        # ---------------------------------------------------------
        # Step 3: Test Filter Tabs (e.g. Low Stock filter)
        # ---------------------------------------------------------
        print("\n--> Step 3: Testing Filter Tabs...")
        stock_filter_btn = page.locator("button:has-text('المخزون')").first
        if await stock_filter_btn.is_visible():
            await stock_filter_btn.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path=f"{SCREENSHOTS_DIR}/204_notification_center_filtered_stock.png")
            print(f"✓ Saved screenshot: 204_notification_center_filtered_stock.png")

        # ---------------------------------------------------------
        # Step 4: Test Mark All as Read
        # ---------------------------------------------------------
        print("\n--> Step 4: Testing 'قراءة الكل' (Mark All as Read)...")
        # Return to 'All' filter first
        all_tab = page.locator("button:has-text('الكل')").first
        await all_tab.click()
        await page.wait_for_timeout(500)

        mark_all_btn = page.locator("button:has-text('قراءة الكل')").first
        if await mark_all_btn.is_visible():
            await mark_all_btn.click()
            await page.wait_for_timeout(1500)
            print("✓ Clicked Mark All as Read")

        # Screenshot 205: Popover showing all marked read
        await page.screenshot(path=f"{SCREENSHOTS_DIR}/205_notification_center_all_read.png")
        print(f"✓ Saved screenshot: 205_notification_center_all_read.png")

        await browser.close()
        print("\n=== In-App Notification Center Verification Completed Successfully! ===")

if __name__ == "__main__":
    asyncio.run(run_verification())
