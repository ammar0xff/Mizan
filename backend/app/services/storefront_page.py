"""Public storefront HTML page.

GET /storefront serves the customer-facing store:
- If a custom template ZIP was imported (settings: storefront_custom_theme),
  its self-contained HTML document is served directly.
- Otherwise a themed, RTL Arabic catalog page is rendered server-side from
  live store settings (identity, colors, fonts, hero) and the active catalog.

The built-in page is deliberately dependency-free: inline CSS, no build step,
and a few lines of vanilla JS that call the public /store/products endpoint
for search and pagination (path-aware so it works mounted at / or /api).
"""
from __future__ import annotations

import json
from html import escape

from sqlalchemy import text as sqlt
from sqlalchemy.ext.asyncio import AsyncSession

_PAGE_SIZE = 24
_DEFAULTS = {
    "theme_primary": "#b45309",
    "theme_accent": "#0f766e",
    "theme_bg": "#faf9f7",
    "font_heading": "Tajawal",
    "font_body": "Tajawal",
}

_SCRIPT = """
<script>
const base = location.pathname.replace(/\\/storefront\\/?$/, '');
const grid = document.getElementById('grid'), more = document.getElementById('more');
const q = document.getElementById('q'), chips = document.getElementById('chips');
let query = '', page = 1, pages = 1, busy = false;
function card(p) {
  const img = (p.image_url || (p.images && p.images[0]))
    ? '<img loading="lazy" src="' + (p.image_url || p.images[0]) + '" alt="">'
    : '<span class="noimg">🛍️</span>';
  return '<article class="card"><div class="thumb">' + img + '</div><div class="card-body">' +
    (p.category_name ? '<span class="cat">' + p.category_name + '</span>' : '') +
    '<h3>' + p.name + '</h3><div class="row"><span class="price">' +
    Number(p.retail_price).toLocaleString('ar-EG', {minimumFractionDigits: 2}) +
    ' ج.م</span><span class="unit">' + (p.unit || '') + '</span></div></div></article>';
}
async function load(reset) {
  if (busy || (query && page >= pages && !reset)) return;
  busy = true;
  if (reset) { page = 1; grid.querySelectorAll('.card,.empty').forEach(e => e.remove()); }
  const url = base + '/store/products?page=' + page + '&page_size=' + PAGE_SIZE +
    (query ? '&search=' + encodeURIComponent(query) : '');
  try {
    const r = await fetch(url); const d = await r.json();
    pages = d.pages || 1;
    if (reset && !d.items.length)
      grid.insertAdjacentHTML('beforeend', '<p class="empty">لا توجد نتائج مطابقة</p>');
    d.items.forEach(p => grid.insertAdjacentHTML('beforeend', card(p)));
    more.hidden = page >= pages;
    page++;
  } catch { more.hidden = false; }
  busy = false;
}
let t;
q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { query = q.value.trim(); load(true); }, 300); });
chips.addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  chips.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); b.classList.add('on');
  query = b.dataset.q || ''; q.value = query; load(true);
});
more.addEventListener('click', () => load(false));
load(false);
</script>
"""


async def _settings(db: AsyncSession, keys: list) -> dict:
    rows = (await db.execute(
        sqlt("SELECT key, value FROM store_settings WHERE key = ANY(:keys)"),
        {"keys": keys},
    )).fetchall()
    return {r[0]: (r[1] or "").strip() for r in rows}


async def get_storefront_html(db: AsyncSession) -> str:
    s = await _settings(db, [*_DEFAULTS,
        "store_name", "logo_url", "store_phone", "store_address", "store_email",
        "store_hours", "store_map_url",
        "storefront_hero_title", "storefront_hero_subtitle", "storefront_tagline",
        "storefront_socials", "storefront_custom_theme", "storefront_template",
    ])

    custom = s.get("storefront_custom_theme", "")
    if custom:
        try:
            theme = json.loads(custom)
            if theme.get("html"):
                return theme["html"]
        except (ValueError, TypeError):
            pass  # fall through to the built-in template

    products = (await db.execute(sqlt("""
        SELECT p.name, p.code, p.unit, p.retail_price, p.image_url, c.name AS cat
        FROM products p
        LEFT JOIN subcategories s ON s.id = p.subcategory_id
        LEFT JOIN categories c ON c.id = s.category_id
        WHERE p.is_active = true
        ORDER BY p.code NULLS LAST, p.name
        LIMIT :lim
    """), {"lim": _PAGE_SIZE})).fetchall()

    categories = (await db.execute(sqlt("""
        SELECT c.name, COUNT(p.id) AS n
        FROM categories c
        JOIN subcategories s ON s.category_id = c.id
        JOIN products p ON p.subcategory_id = s.id AND p.is_active = true
        GROUP BY c.name ORDER BY n DESC LIMIT 12
    """))).fetchall()

    return _render(s, products, categories)


def _render(s: dict, products, categories) -> str:
    name = s.get("store_name") or "ميزان"
    primary = s.get("theme_primary") or _DEFAULTS["theme_primary"]
    accent = s.get("theme_accent") or _DEFAULTS["theme_accent"]
    bg = s.get("theme_bg") or _DEFAULTS["theme_bg"]
    fhead = (s.get("font_heading") or _DEFAULTS["font_heading"]).replace(" ", "+")
    fbody = (s.get("font_body") or _DEFAULTS["font_body"]).replace(" ", "+")
    logo = s.get("logo_url") or ""
    hero_title = s.get("storefront_hero_title") or name
    hero_sub = s.get("storefront_hero_subtitle") or s.get("storefront_tagline") or ""
    phone = s.get("store_phone") or ""
    address = s.get("store_address") or ""
    hours = s.get("store_hours") or ""

    def money(v) -> str:
        return f"{float(v):,.2f}"

    cards = "\n".join(
        f"""<article class="card">
          <div class="thumb">{'<img loading="lazy" src="' + escape(str(r[4])) + '" alt="">' if r[4] else '<span class="noimg">🛍️</span>'}</div>
          <div class="card-body">
            <span class="cat">{escape(str(r[5] or ''))}</span>
            <h3>{escape(str(r[0]))}</h3>
            <div class="row"><span class="price">{money(r[3])} ج.م</span><span class="unit">{escape(str(r[2] or ''))}</span></div>
          </div>
        </article>"""
        for r in products
    ) or '<p class="empty">لا توجد منتجات معروضة حالياً</p>'

    chips = '<button class="chip on" data-q="">الكل</button>' + "\n".join(
        f'<button class="chip" data-q="{escape(str(c[0]))}">{escape(str(c[0]))} <small>({c[1]})</small></button>'
        for c in categories
    )

    contact_bits = []
    if phone:
        contact_bits.append(f'<span>📞 <a href="tel:{escape(phone)}" dir="ltr">{escape(phone)}</a></span>')
    if address:
        contact_bits.append(f"<span>📍 {escape(address)}</span>")
    if hours:
        contact_bits.append(f"<span>🕒 {escape(hours)}</span>")
    contact = " ".join(contact_bits)

    html = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="{escape(primary)}">
<title>{escape(name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={fhead}:wght@500;700;800&family={fbody}:wght@400;500;700&display=swap">
<style>
:root {{ --p: {escape(primary)}; --a: {escape(accent)}; --bg: {escape(bg)}; --ink: #1c1917; --mut: #78716c; --line: #e7e5e4; }}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: '{fbody}', 'Segoe UI', Tahoma, sans-serif; background: var(--bg); color: var(--ink); line-height: 1.7; }}
header.hero {{ background: linear-gradient(135deg, var(--p), var(--a)); color: #fff; padding: 56px 20px 88px; text-align: center; }}
header.hero img.logo {{ width: 84px; height: 84px; border-radius: 20px; object-fit: cover; background: #fff; margin-bottom: 16px; border: 3px solid rgba(255,255,255,.6); }}
header.hero h1 {{ font-family: '{fhead}', sans-serif; font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800; }}
header.hero p {{ opacity: .92; max-width: 560px; margin: 8px auto 0; font-size: 1.05rem; }}
.searchbar {{ max-width: 720px; margin: -34px auto 0; padding: 0 20px; position: relative; z-index: 2; }}
.searchbar input {{ width: 100%; padding: 16px 22px; border: 1px solid var(--line); border-radius: 14px; font: inherit; font-size: 1.05rem; box-shadow: 0 8px 24px rgba(0,0,0,.08); }}
.chips {{ display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 22px 20px; }}
.chip {{ border: 1px solid var(--line); background: #fff; border-radius: 999px; padding: 7px 16px; font: inherit; cursor: pointer; color: var(--mut); }}
.chip.on, .chip:hover {{ background: var(--p); border-color: var(--p); color: #fff; }}
main {{ max-width: 1180px; margin: 8px auto 48px; padding: 0 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); gap: 18px; }}
.card {{ background: #fff; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; transition: box-shadow .15s, transform .15s; }}
.card:hover {{ box-shadow: 0 10px 26px rgba(0,0,0,.09); transform: translateY(-2px); }}
.thumb {{ aspect-ratio: 1.35; background: #f5f5f4; display: grid; place-items: center; }}
.thumb img {{ width: 100%; height: 100%; object-fit: cover; }}
.noimg {{ font-size: 2.2rem; opacity: .45; }}
.card-body {{ padding: 12px 14px 14px; }}
.card-body .cat {{ color: var(--a); font-size: .75rem; font-weight: 700; }}
.card-body h3 {{ font-size: .98rem; font-weight: 700; margin: 2px 0 8px; min-height: 2.9em; }}
.card-body .row {{ display: flex; justify-content: space-between; align-items: baseline; }}
.price {{ color: var(--p); font-weight: 800; font-variant-numeric: tabular-nums; }}
.unit {{ color: var(--mut); font-size: .8rem; }}
.empty {{ grid-column: 1/-1; text-align: center; color: var(--mut); padding: 60px 0; }}
#more {{ grid-column: 1/-1; justify-self: center; margin-top: 6px; border: 0; background: var(--ink); color: #fff; font: inherit; font-weight: 700; padding: 12px 34px; border-radius: 12px; cursor: pointer; }}
footer {{ background: #fff; border-top: 1px solid var(--line); padding: 26px 20px; text-align: center; color: var(--mut); font-size: .95rem; }}
footer .c {{ display: flex; flex-wrap: wrap; gap: 18px; justify-content: center; margin-bottom: 8px; }}
footer a {{ color: var(--a); text-decoration: none; }}
</style>
</head>
<body>
<header class="hero">
  {'<img class="logo" src="' + escape(logo) + '" alt="">' if logo else ''}
  <h1>{escape(hero_title)}</h1>
  {f'<p>{escape(hero_sub)}</p>' if hero_sub else ''}
</header>
<div class="searchbar"><input id="q" type="search" placeholder="ابحث عن منتج…" autocomplete="off"></div>
<nav class="chips" id="chips">{chips}</nav>
<main id="grid">{cards}</main>
<button id="more" hidden>تحميل المزيد</button>
<footer>
  <div class="c">{contact}</div>
  <div>© {escape(name)} — جميع الحقوق محفوظة</div>
</footer>""" + _SCRIPT.replace("PAGE_SIZE", str(_PAGE_SIZE)) + "\n</body>\n</html>"
    return html
