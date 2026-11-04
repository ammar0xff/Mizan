import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = "/home/ammar/.gemini/antigravity/brain/6d5afa1e-9da9-4298-949d-64f04df6ec73/audit_screens"

async def test_and_capture():
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        widths = [
            ("mobile", 390, 844),
            ("tablet", 768, 1024),
            ("desktop", 1440, 900),
        ]

        themes = ["light", "dark"]

        # Run acceptance test on desktop light
        context = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ar-EG")
        page = await context.new_page()

        print("\n--- 1. Testing Acceptance Criteria: POS Scan 3 Times ---")
        await page.goto("http://localhost:5173/Vendora/", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Scroll to demo section
        demo_elem = page.locator("#demo")
        await demo_elem.scroll_into_view_if_needed()
        await page.wait_for_timeout(500)

        scan_btn = demo_elem.locator("button:has-text('مسح باركود')")
        issue_btn = demo_elem.locator("button:has-text('إصدار الفاتورة')")

        # Initial state verification
        print("Initial state check...")
        initial_inv = await demo_elem.locator("span:has-text('INV-')").first.inner_text()
        print(f"Initial Invoice sequence: {initial_inv}")

        # Scan 1
        print("Clicking Scan 1...")
        await scan_btn.click()
        await page.wait_for_timeout(300)

        # Scan 2
        print("Clicking Scan 2...")
        await scan_btn.click()
        await page.wait_for_timeout(300)

        # Scan 3
        print("Clicking Scan 3...")
        await scan_btn.click()
        await page.wait_for_timeout(300)

        # Read cart totals after 3 scans
        total_text = await demo_elem.locator(".num.font-bold").all_inner_texts()
        print(f"Demo figures after 3 scans: {total_text}")

        # Issue Invoice
        print("Clicking Issue Invoice...")
        await issue_btn.click()
        await page.wait_for_timeout(500)

        new_inv = await demo_elem.locator("span:has-text('INV-')").first.inner_text()
        print(f"New Invoice sequence after issuance: {new_inv}")

        # Verify Printed badge
        printed_badge = await demo_elem.locator("text='تم إصدار الفاتورة'").count()
        print(f"Printed badge displayed: {printed_badge > 0}")

        # Capture interaction proof
        await demo_elem.screenshot(path=f"{SCREENSHOTS_DIR}/230_pos_demo_scan_3x_acceptance.png")
        print("Captured 230_pos_demo_scan_3x_acceptance.png")

        # Check DOM for any font size < 12px
        sub_12px = await page.evaluate("""() => {
            const elements = Array.from(document.querySelectorAll('*'));
            const violations = [];
            for (const el of elements) {
                if (el.children.length === 0 && el.textContent.trim()) {
                    const fs = window.getComputedStyle(el).fontSize;
                    const px = parseFloat(fs);
                    if (px < 11.9 && !el.closest('svg')) {
                        violations.push({ text: el.textContent.trim().slice(0, 30), fs });
                    }
                }
            }
            return violations;
        }""")
        print(f"Sub-12px elements found: {len(sub_12px)} -> {sub_12px[:5]}")

        # Check for Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩)
        arabic_digits = await page.evaluate("""() => {
            const regex = /[٠-٩]/;
            const elements = Array.from(document.querySelectorAll('*'));
            const violations = [];
            for (const el of elements) {
                if (el.children.length === 0 && regex.test(el.textContent)) {
                    violations.push(el.textContent.trim().slice(0, 40));
                }
            }
            return violations;
        }""")
        print(f"Arabic-Indic digits found: {len(arabic_digits)} -> {arabic_digits[:5]}")

        # Check for raw ✓ or ✕ glyphs
        raw_glyphs = await page.evaluate("""() => {
            const regex = /[✓✕●•]/;
            const elements = Array.from(document.querySelectorAll('*'));
            const violations = [];
            for (const el of elements) {
                if (el.children.length === 0 && regex.test(el.textContent) && !el.closest('pre')) {
                    violations.push(el.textContent.trim().slice(0, 40));
                }
            }
            return violations;
        }""")
        print(f"Raw forbidden glyphs found: {len(raw_glyphs)} -> {raw_glyphs[:5]}")

        # Measure CTA contrast in Light & Dark mode
        print("\n--- 2. Measuring Primary CTA Contrast ---")
        contrast_calc_script = """() => {
            const btn = document.querySelector('a[href*="signup"]');
            if (!btn) return { error: 'Button not found' };
            const cs = window.getComputedStyle(btn);
            
            // Function to parse rgb/rgba/oklch to relative luminance
            // Since browser resolves getComputedStyle to rgb(r, g, b), we parse it:
            function getLuminance(rgbStr) {
                const match = rgbStr.match(/\\d+(\\.\\d+)?/g);
                if (!match || match.length < 3) return 0.5;
                const r = parseFloat(match[0]) / 255;
                const g = parseFloat(match[1]) / 255;
                const b = parseFloat(match[2]) / 255;
                const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
                return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
            }

            const lumBg = getLuminance(cs.backgroundColor);
            const lumFg = getLuminance(cs.color);
            const lighter = Math.max(lumBg, lumFg);
            const darker = Math.min(lumBg, lumFg);
            const ratio = (lighter + 0.05) / (darker + 0.05);

            return {
                bg: cs.backgroundColor,
                color: cs.color,
                ratio: ratio.toFixed(2),
                fontSize: cs.fontSize,
                fontWeight: cs.fontWeight
            };
        }"""

        light_contrast = await page.evaluate(contrast_calc_script)
        print(f"Light CTA styles: {light_contrast}")

        # Toggle to dark
        await page.click('button[aria-label="تبديل مظهر العرض"]')
        await page.wait_for_timeout(500)

        dark_contrast = await page.evaluate(contrast_calc_script)
        print(f"Dark CTA styles: {dark_contrast}")

        await context.close()

        # --- 3. Viewport Height & Screenshots at 3 Widths x 2 Themes ---
        print("\n--- 3. Capturing 3 Widths x 2 Themes & Viewport Height ---")
        for theme in themes:
            for name, w, h in widths:
                ctx = await browser.new_context(
                    viewport={"width": w, "height": h},
                    locale="ar-EG",
                )
                p_page = await ctx.new_page()

                # Set theme
                if theme == "dark":
                    await p_page.add_init_script("document.documentElement.classList.add('dark')")
                else:
                    await p_page.add_init_script("document.documentElement.classList.remove('dark')")

                await p_page.goto("http://localhost:5173/Vendora/", wait_until="networkidle")
                await p_page.wait_for_timeout(1000)

                # Check total height at 390
                if w == 390:
                    scroll_height = await p_page.evaluate("document.documentElement.scrollHeight")
                    viewports = scroll_height / 844
                    print(f"[{theme.upper()}] 390x844 scroll height: {scroll_height}px ({viewports:.2f} viewports, target <= 6.5)")

                # Check horizontal overflow
                has_h_scroll = await p_page.evaluate("document.documentElement.scrollWidth > window.innerWidth")
                print(f"[{theme.upper()} - {name} {w}px] Horizontal overflow: {has_h_scroll}")

                filename = f"231_landing_{theme}_{name}_{w}px.png"
                await p_page.screenshot(path=f"{SCREENSHOTS_DIR}/{filename}", full_page=False)
                print(f"Saved viewport: {filename}")

                # Also save full page for review
                full_filename = f"232_landing_full_{theme}_{name}_{w}px.png"
                await p_page.screenshot(path=f"{SCREENSHOTS_DIR}/{full_filename}", full_page=True)
                print(f"Saved full page: {full_filename}")

                await ctx.close()

        await browser.close()
        print("\nAll tests and captures completed successfully!")

if __name__ == "__main__":
    asyncio.run(test_and_capture())
