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
        "wholesale", "logistics", "wms", "ecommerce", "clinic", "law", "travel", "hospitality",
        "gym", "salon", "agency", "field_service", "hr", "mfg", "fod", "phm", "prn",
        "cst", "rec", "agr", "eng",
        "bnk", "ins", "gov", "ent", "oil"
    ]

    tenant_info = {
        "id": "c935140b-cb68-45ac-a6fe-3e6ccaf09d71",
        "name": "مجموعة فيندورا للأنشطة المتعددة والتصنيع المتقدم",
        "slug": "mizan-enterprise",
        "sector": "specialized_sectors",
        "scale": "enterprise",
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
            localStorage.setItem("mizan.active_preset", "bnk");
        """)

        page = await context.new_page()

        # ==========================================
        # 1. BANKING & FINANCIAL INSTITUTIONS (/bnk)
        # ==========================================
        print("Navigating to /bnk...")
        await page.goto("http://localhost:5173/Mizan/bnk", wait_until="networkidle")
        await page.wait_for_selector("text=الأنظمة المصرفية والمؤسسات المالية")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{screenshot_dir}/169_bnk_accounts_cif_portfolio.png")
        print("Saved 169_bnk_accounts_cif_portfolio.png")

        # Tab 2: Transactions
        await page.click("text=دفتر المعاملات اللحظية (IPN/ACH)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/170_bnk_double_entry_transactions_ledger.png")
        print("Saved 170_bnk_double_entry_transactions_ledger.png")

        # Tab 3: Loans & Underwriting
        await page.click("text=محفظة القروض والائتمان (I-Score)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/171_bnk_loans_underwriting_iscore_ecl.png")
        print("Saved 171_bnk_loans_underwriting_iscore_ecl.png")

        # Tab 4: AML & Compliance
        await page.click("text=الامتثال ومكافحة غسيل الأموال (AML)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/172_bnk_aml_sanctions_sar_alerts.png")
        print("Saved 172_bnk_aml_sanctions_sar_alerts.png")

        # ==========================================
        # 2. INSURANCE & REINSURANCE (/ins)
        # ==========================================
        print("Navigating to /ins...")
        await page.goto("http://localhost:5173/Mizan/ins", wait_until="networkidle")
        await page.wait_for_selector("text=إدارة التأمين وإعادة التأمين")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{screenshot_dir}/173_ins_policies_underwriting_gwp.png")
        print("Saved 173_ins_policies_underwriting_gwp.png")

        # Tab 2: Claims
        await page.click("text=المطالبات والحوادث (Claims)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/174_ins_fnol_claims_loss_adjusting.png")
        print("Saved 174_ins_fnol_claims_loss_adjusting.png")

        # Tab 3: Surveys
        await page.click("text=المعاينات وتقدير الأضرار (Surveys)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/175_ins_damage_surveys_subrogation.png")
        print("Saved 175_ins_damage_surveys_subrogation.png")

        # Tab 4: Treaties
        await page.click("text=اتفاقيات إعادة التأمين (Treaties)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/176_ins_reinsurance_treaties_quota_share.png")
        print("Saved 176_ins_reinsurance_treaties_quota_share.png")

        # ==========================================
        # 3. GOVERNMENT & NONPROFIT (/gov)
        # ==========================================
        print("Navigating to /gov...")
        await page.goto("http://localhost:5173/Mizan/gov", wait_until="networkidle")
        await page.wait_for_selector("text=إدارة المؤسسات الحكومية والمنظمات غير الهادفة للربح")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{screenshot_dir}/177_gov_fund_accounting_unrestricted_grants.png")
        print("Saved 177_gov_fund_accounting_unrestricted_grants.png")

        # Tab 2: Commitments
        await page.click("text=الارتباط وحجز الموازنة (Encumbrance)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/178_gov_budget_encumbrances_requisitions.png")
        print("Saved 178_gov_budget_encumbrances_requisitions.png")

        # Tab 3: Aids
        await page.click("text=إعانات المستفيدين البيومترية (Aid)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/179_gov_beneficiary_biometric_aid_registry.png")
        print("Saved 179_gov_beneficiary_biometric_aid_registry.png")

        # Tab 4: Tenders
        await page.click("text=المناقصات العامة (Tenders)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/180_gov_public_tenders_procurement_bids.png")
        print("Saved 180_gov_public_tenders_procurement_bids.png")

        # ==========================================
        # 4. ENTERTAINMENT & EVENTS (/ent)
        # ==========================================
        print("Navigating to /ent...")
        await page.goto("http://localhost:5173/Mizan/ent", wait_until="networkidle")
        await page.wait_for_selector("text=إدارة الترفيه، الفعاليات والملاهي")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{screenshot_dir}/181_ent_event_sessions_venue_capacity.png")
        print("Saved 181_ent_event_sessions_venue_capacity.png")

        # Tab 2: Tickets
        await page.click("text=شباك التذاكر والبوابات (Tickets & Turnstiles)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/182_ent_box_office_tickets_turnstile_scan.png")
        print("Saved 182_ent_box_office_tickets_turnstile_scan.png")

        # Tab 3: Gaming Cards
        await page.click("text=بطاقات ألعاب الملاهي (RFID Cards)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/183_ent_rfid_arcade_gaming_cards.png")
        print("Saved 183_ent_rfid_arcade_gaming_cards.png")

        # Tab 4: Concessions
        await page.click("text=منافذ الأغذية والضيافة (F&B Concessions)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/184_ent_concessions_pos_food_beverage.png")
        print("Saved 184_ent_concessions_pos_food_beverage.png")

        # ==========================================
        # 5. OIL & GAS EXTRACTION (/oil)
        # ==========================================
        print("Navigating to /oil...")
        await page.goto("http://localhost:5173/Mizan/oil", wait_until="networkidle")
        await page.wait_for_selector("text=إدارة استخراج وإنتاج البترول والغاز")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{screenshot_dir}/185_oil_wellhead_reservoirs_hierarchy.png")
        print("Saved 185_oil_wellhead_reservoirs_hierarchy.png")

        # Tab 2: Production
        await page.click("text=الإنتاج اليومي (Production)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/186_oil_daily_production_hydrocarbon_bbl.png")
        print("Saved 186_oil_daily_production_hydrocarbon_bbl.png")

        # Tab 3: Drilling
        await page.click("text=تقارير الحفر والبرائم (DDR)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/187_oil_ddr_daily_drilling_reports_rigs.png")
        print("Saved 187_oil_ddr_daily_drilling_reports_rigs.png")

        # Tab 4: Tanks
        await page.click("text=حظيرة الخزانات (Tank Farm)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{screenshot_dir}/188_oil_tank_farm_storage_jv_cash_calls.png")
        print("Saved 188_oil_tank_farm_storage_jv_cash_calls.png")

        await browser.close()
        print("Phase 6 visual audit completed successfully! 20 screenshots captured (169-188).")

if __name__ == "__main__":
    asyncio.run(run())
