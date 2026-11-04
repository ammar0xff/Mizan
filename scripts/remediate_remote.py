"""One-shot remediation for the Vercel/Neon Mizan database.

Brings a database that lived through the pre-refactor era (and accumulated e2e
test pollution) to the current production state:

  1. pg_dump backup to ./backups/ (always, before any change)
  2. All tracked migrations from scripts/migrate.py (v0-v28, idempotent)
  3. e2e pollution cleanup (by name pattern, FK-safe order)
  4. Restore the real store name
  5. Post-remediation verification report

Usage:
    python scripts/remediate_remote.py "postgresql://...sslmode=require" [--apply]

Without --apply it is a DRY RUN: shows exactly what would be deleted and what
migrations are missing, changes nothing.
"""
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from migrate import MIGRATIONS  # noqa: E402

import psycopg  # noqa: E402

ROOT = Path(__file__).parent.parent
BACKUPS = ROOT / "backups"
REAL_STORE_NAME = "شركة المصرية الالمانية"

# FK-safe ordered cleanup, modeled on e2e/helpers.py — matched by name pattern.
CLEANUP_SQL = [
    ("e2e users (draft)", "SELECT count(*) FROM users WHERE username LIKE 'e2e\\_%'"),
    # children first
    ("drawer txs (e2e users/warehouses)", """
        DELETE FROM drawer_transactions WHERE created_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')
            OR shift_id IN (SELECT id FROM shifts WHERE warehouse_id IN (SELECT id FROM warehouses WHERE name LIKE 'E2E-%'))"""),
    ("stock movements (e2e)", """
        DELETE FROM stock_movements WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'E2E-%')
            OR warehouse_id IN (SELECT id FROM warehouses WHERE name LIKE 'E2E-%')"""),
    ("sale items/payments (e2e sales)", """
        DELETE FROM sale_items WHERE sale_id IN (
            SELECT id FROM sales WHERE created_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')
                OR warehouse_id IN (SELECT id FROM warehouses WHERE name LIKE 'E2E-%'))"""),
    ("sale payments (e2e sales)", """
        DELETE FROM sale_payments WHERE sale_id IN (
            SELECT id FROM sales WHERE created_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')
                OR warehouse_id IN (SELECT id FROM warehouses WHERE name LIKE 'E2E-%'))"""),
    ("sales (e2e)", """
        DELETE FROM sales WHERE created_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')
            OR warehouse_id IN (SELECT id FROM warehouses WHERE name LIKE 'E2E-%')"""),
    ("customer payments (e2e)", """
        DELETE FROM customer_payments WHERE created_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')
            OR customer_id IN (SELECT id FROM customers WHERE name LIKE 'E2E-%')"""),
    ("hr payroll entries (future periods)", """
        DELETE FROM hr_payroll_entries WHERE period_id IN (SELECT id FROM hr_payroll_periods WHERE month > to_char(now(), 'YYYY-MM'))"""),
    ("hr payroll periods (future months)", "DELETE FROM hr_payroll_periods WHERE month > to_char(now(), 'YYYY-MM')"),
    ("hr attendance (e2e employees)", "DELETE FROM hr_attendance WHERE employee_id IN (SELECT id FROM hr_employees WHERE name LIKE 'E2E-%')"),
    ("hr advances (e2e)", """
        DELETE FROM hr_advances WHERE employee_id IN (SELECT id FROM hr_employees WHERE name LIKE 'E2E-%')
            OR created_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')"""),
    ("hr payroll legacy rows (e2e)", """
        DELETE FROM hr_payroll WHERE employee_id IN (SELECT id FROM hr_employees WHERE name LIKE 'E2E-%')
            OR created_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')"""),
    ("hr employees (e2e)", "DELETE FROM hr_employees WHERE name LIKE 'E2E-%'"),
    ("hr shifts (e2e)", "DELETE FROM hr_shifts WHERE name LIKE 'E2E-%'"),
    ("expenses (e2e users)", "DELETE FROM expenses WHERE created_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')"),
    ("expense vendors (e2e)", "DELETE FROM expense_vendors WHERE name LIKE 'E2E-%'"),
    ("safe transactions (e2e)", "DELETE FROM safe_transactions WHERE safe_id IN (SELECT id FROM safes WHERE name LIKE 'E2E-%')"),
    ("safe deposits (e2e)", """
        DELETE FROM safe_deposits WHERE safe_id IN (SELECT id FROM safes WHERE name LIKE 'E2E-%')
            OR warehouse_id IN (SELECT id FROM warehouses WHERE name LIKE 'E2E-%')
            OR shift_id IN (SELECT id FROM shifts WHERE warehouse_id IN (SELECT id FROM warehouses WHERE name LIKE 'E2E-%'))"""),
    ("safes (e2e)", "DELETE FROM safes WHERE name LIKE 'E2E-%'"),
    ("wallet transactions (e2e)", "DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM payment_wallets WHERE name LIKE 'E2E-%')"),
    ("wallets (e2e)", "DELETE FROM payment_wallets WHERE name LIKE 'E2E-%'"),
    ("shifts (e2e warehouses)", "DELETE FROM shifts WHERE warehouse_id IN (SELECT id FROM warehouses WHERE name LIKE 'E2E-%')"),
    ("supplier transactions (e2e suppliers)", "DELETE FROM supplier_transactions WHERE supplier_id IN (SELECT id FROM suppliers WHERE name LIKE 'E2E-%')"),
    ("supplier prices (e2e products)", "DELETE FROM supplier_prices WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'E2E-%')"),
    ("purchase order items (e2e)", """
        DELETE FROM purchase_order_items WHERE po_id IN (
            SELECT id FROM purchase_orders WHERE created_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')
                OR warehouse_id IN (SELECT id FROM warehouses WHERE name LIKE 'E2E-%'))"""),
    ("purchase orders (e2e)", """
        DELETE FROM purchase_orders WHERE created_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')
            OR warehouse_id IN (SELECT id FROM warehouses WHERE name LIKE 'E2E-%')"""),
    ("purchase price history (e2e)", "DELETE FROM purchase_price_history WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'E2E-%')"),
    ("barcodes (e2e products)", "DELETE FROM product_barcodes WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'E2E-%')"),
    ("product images (e2e)", "DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'E2E-%')"),
    ("warehouse product status (e2e)", "DELETE FROM warehouse_product_status WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'E2E-%') OR warehouse_id IN (SELECT id FROM warehouses WHERE name LIKE 'E2E-%')"),
    ("stock balances (e2e)", "DELETE FROM stock_balances WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'E2E-%') OR warehouse_id IN (SELECT id FROM warehouses WHERE name LIKE 'E2E-%')"),
    ("collection items (e2e)", """
        DELETE FROM collection_items WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'E2E-%')
            OR collection_id IN (SELECT id FROM product_collections WHERE name LIKE 'E2E-%')"""),
    ("collections (e2e)", "DELETE FROM product_collections WHERE name LIKE 'E2E-%'"),
    ("sale items (e2e products)", "DELETE FROM sale_items WHERE product_id IN (SELECT id FROM products WHERE name LIKE 'E2E-%')"),
    ("products (e2e)", "DELETE FROM products WHERE name LIKE 'E2E-%'"),
    ("subcategories (e2e)", "DELETE FROM subcategories WHERE name LIKE 'E2E-%'"),
    ("categories (e2e)", "DELETE FROM categories WHERE name LIKE 'E2E-%'"),
    ("customers (e2e)", "DELETE FROM customers WHERE name LIKE 'E2E-%'"),
    ("suppliers (e2e)", "DELETE FROM suppliers WHERE name LIKE 'E2E-%'"),
    ("user_warehouses (e2e)", """
        DELETE FROM user_warehouses WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')
            OR warehouse_id IN (SELECT id FROM warehouses WHERE name LIKE 'E2E-%')"""),
    ("warehouses (e2e)", "DELETE FROM warehouses WHERE name LIKE 'E2E-%'"),
    ("archived docs (e2e refs)", """
        DELETE FROM archived_documents WHERE created_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')"""),
    ("audit log (e2e users)", "DELETE FROM audit_log WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')"),
    ("hr audit log (e2e)", "DELETE FROM hr_audit_log WHERE performed_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')"),
    ("device tokens (e2e)", "DELETE FROM device_tokens WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')"),
    ("hr payroll entries (e2e periods)", """
        DELETE FROM hr_payroll_entries WHERE period_id IN (
            SELECT id FROM hr_payroll_periods WHERE submitted_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')
                OR approved_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')
                OR paid_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%'))"""),
    ("hr payroll periods (e2e users)", """
        DELETE FROM hr_payroll_periods WHERE submitted_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')
            OR approved_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')
            OR paid_by IN (SELECT id FROM users WHERE username LIKE 'e2e\\_%')"""),
    ("users (e2e)", "DELETE FROM users WHERE username LIKE 'e2e\\_%'"),
]


def count(conn, sql: str) -> int:
    with conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchone()[0]


def backup(url: str) -> Path:
    BACKUPS.mkdir(exist_ok=True)
    out = BACKUPS / f"remote-backup-{subprocess.run(['date', '+%Y%m%d_%H%M%S'], capture_output=True, text=True).stdout.strip()}.sql"
    print(f"→ pg_dump backup to {out} ...")
    r = subprocess.run(["pg_dump", "--no-owner", "--no-privileges", "-f", str(out), url],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[:500])
        sys.exit("BACKUP FAILED — aborting, nothing was changed.")
    size = out.stat().st_size
    if size < 10_000:
        sys.exit(f"Backup suspiciously small ({size}B) — aborting.")
    print(f"✅ backup OK ({size / 1e6:.1f} MB)")
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    url = sys.argv[1]
    apply = "--apply" in sys.argv
    mode = "APPLY" if apply else "DRY RUN"
    print(f"═══ Mizan remote remediation — {mode} ═══")

    if apply:
        backup(url)

    # dry-run wraps everything in a transaction and rolls back — PostgreSQL
    # executes data-modifying CTEs even in SELECT, so preview MUST roll back.
    conn_kwargs = dict(autocommit=True) if apply else dict(autocommit=False)
    with psycopg.connect(url, **conn_kwargs) as conn:
        # ── 1. migrations ──
        if apply:
            with conn.cursor() as cur:
                cur.execute("CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz DEFAULT now())")
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM schema_migrations")
            done = {r[0] for r in cur.fetchall()}
        missing = [(n, sql) for n, sql in MIGRATIONS if n not in done]
        print(f"\nmigrations: {len(done)} applied, {len(missing)} missing")
        for name, sql in missing:
            print(f"  - {name}")
            if apply:
                with conn.cursor() as cur:
                    cur.execute(sql)
                    cur.execute("INSERT INTO schema_migrations (id) VALUES (%s) ON CONFLICT DO NOTHING", (name,))

        # ── 2. cleanup ──
        print("\ne2e pollution cleanup:")
        total = 0
        for label, sql in CLEANUP_SQL:
            if label.endswith("(draft)"):
                n = count(conn, sql)
                print(f"  · {label}: {n}")
                continue
            if apply:
                with conn.cursor() as cur:
                    cur.execute(sql)
                    n = cur.rowcount
                total += max(n, 0)
                print(f"  ✂ {label}: deleted {n}")
            else:
                with conn.cursor() as cur:
                    cur.execute(f"WITH x AS ({sql} RETURNING 1) SELECT count(*) FROM x")
                    n = cur.fetchone()[0]
                total += n
                print(f"  · would delete {label}: {n}")

        # ── 3. store name ──
        current = count(conn, "SELECT value FROM store_settings WHERE key='store_name'")
        print(f"\nstore_name currently: {current!r}")
        if apply and current != REAL_STORE_NAME:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO store_settings (key, value, updated_at) VALUES ('store_name', %s, now())
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
                """, (REAL_STORE_NAME,))
            print(f"  ✅ restored to {REAL_STORE_NAME!r}")

        # ── 4. verification ──
        print("\nverification:")
        for label, sql in [
            ("stock_movements rows", "SELECT count(*) FROM stock_movements"),
            ("stock_balances rows", "SELECT count(*) FROM stock_balances"),
            ("products", "SELECT count(*) FROM products"),
            ("remaining E2E warehouses", "SELECT count(*) FROM warehouses WHERE name LIKE 'E2E-%'"),
            ("remaining e2e users", "SELECT count(*) FROM users WHERE username LIKE 'e2e\\_%'"),
            ("future payroll periods", "SELECT count(*) FROM hr_payroll_periods WHERE month > to_char(now(),'YYYY-MM')"),
        ]:
            print(f"  {label}: {count(conn, sql)}")

        if not apply:
            conn.rollback()  # discard every previewed change
    print(f"\n{'✅ APPLY complete' if apply else 'DRY RUN complete — nothing was changed; re-run with --apply to execute'}"
          f"{' (' + str(total) + ' rows deleted)' if apply else ''}")


if __name__ == "__main__":
    main()
