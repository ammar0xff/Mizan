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

    active_mods = [
        "core", "inventory", "pos", "finance", "pharmacy", "restaurant", "school", "services",
        "wholesale", "logistics", "wms", "ecommerce", "hr"
    ]

    tenant_info = {
        "id": "c935140b-cb68-45ac-a6fe-3e6ccaf09d71",
        "name": "مجموعة فيندورا للشركات والأنشطة المتعددة",
        "slug": "mizan-enterprise",
        "sector": "general",
        "scale": "medium",
        "palette": {"name": "blue", "hue": 220},
        "features": ["all"],
        "active_modules": active_mods,
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
            localStorage.setItem("mizan.active_modules", JSON.stringify({json.dumps(active_mods)}));
            localStorage.setItem("mizan.active_preset", "wholesale");
        """)

        page = await context.new_page()

        # ==========================================
        # 1. WHOLESALE & DISTRIBUTION (/wholesale)
        # ==========================================
        print("Navigating to /wholesale...")
        await page.goto("http://localhost:5173/Mizan/wholesale", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/92_wholesale_tiered_pricing.png")
        print("Saved 92_wholesale_tiered_pricing.png")

        # Tab 2: Credit Exposure
        await page.click("text=سقوف الائتمان ورقابة المخاطر")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/93_wholesale_credit_exposure.png")
        print("Saved 93_wholesale_credit_exposure.png")

        # Tab 3: Landed Cost
        await page.click("text=تكلفة الاستيراد المفرغة")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/94_wholesale_landed_costs.png")
        print("Saved 94_wholesale_landed_costs.png")

        # Tab 4: Drop-Shipping & Rebates
        await page.click("text=الشحن المباشر ومكافآت التوزيع")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/95_wholesale_dropship_rebates.png")
        print("Saved 95_wholesale_dropship_rebates.png")

        # ==========================================
        # 2. LOGISTICS & FLEET (/logistics)
        # ==========================================
        print("Navigating to /logistics...")
        await page.goto("http://localhost:5173/Mizan/logistics", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/96_logistics_consignments_waybills.png")
        print("Saved 96_logistics_consignments_waybills.png")

        # Open e-POD modal
        epod_btn = page.locator("button:has-text('e-POD')").first
        if await epod_btn.is_visible():
            await epod_btn.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path=f"{screenshot_dir}/97_logistics_epod_modal.png")
            print("Saved 97_logistics_epod_modal.png")
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(500)

        # Tab 2: Fleet & Vehicles
        await page.click("text=أسطول الشاحنات والمركبات")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/98_logistics_fleet_vehicles.png")
        print("Saved 98_logistics_fleet_vehicles.png")

        # Tab 3: Driver Rostering
        await page.click("text=سجل السائقين والامتثال")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/99_logistics_driver_rostering.png")
        print("Saved 99_logistics_driver_rostering.png")

        # Tab 4: Route Trips, Fuel & Claims
        await page.click("text=الرحلات ومصاريف الوقود")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/100_logistics_trips_fuel_claims.png")
        print("Saved 100_logistics_trips_fuel_claims.png")

        # ==========================================
        # 3. 3PL & WMS (/wms)
        # ==========================================
        print("Navigating to /wms...")
        await page.goto("http://localhost:5173/Mizan/wms", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/101_wms_bin_locations_grid.png")
        print("Saved 101_wms_bin_locations_grid.png")

        # Tab 2: Clients & Billing
        await page.click("text=عملاء 3PL والتعرفة والفوترة")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/102_wms_client_accounts_billing.png")
        print("Saved 102_wms_client_accounts_billing.png")

        # Tab 3: Wave Picking
        await page.click("text=موجات الجمع والانتقاء")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/103_wms_wave_picking_batches.png")
        print("Saved 103_wms_wave_picking_batches.png")

        # Tab 4: Inbound & Cross-Dock
        await page.click("text=الاستلام وفروقات الشحن والعبور السريع")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/104_wms_inbound_osd_crossdock.png")
        print("Saved 104_wms_inbound_osd_crossdock.png")

        # ==========================================
        # 4. ECOMMERCE HUB (/ecommerce)
        # ==========================================
        print("Navigating to /ecommerce...")
        await page.goto("http://localhost:5173/Mizan/ecommerce", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{screenshot_dir}/105_ecommerce_orders_fulfillment.png")
        print("Saved 105_ecommerce_orders_fulfillment.png")

        # Tab 2: Channels
        await page.click("text=القنوات والربط المتعدد")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/106_ecommerce_connected_channels.png")
        print("Saved 106_ecommerce_connected_channels.png")

        # Tab 3: COD Remittances
        await page.click("text=تسوية الدفع عند الاستلام")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/107_ecommerce_cod_remittances.png")
        print("Saved 107_ecommerce_cod_remittances.png")

        # Tab 4: RMA & Abandoned Carts
        await page.click("text=المرتجعات والسلات المتروكة")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/108_ecommerce_rma_abandoned_carts.png")
        print("Saved 108_ecommerce_rma_abandoned_carts.png")

        await browser.close()
        print("Phase 2 Playwright verification completed successfully!")

if __name__ == "__main__":
    asyncio.run(run())
