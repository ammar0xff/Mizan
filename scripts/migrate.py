"""
migrate.py — Safe incremental DB migrations.
Run after deploy on existing databases to apply new columns/tables.
Each migration is idempotent (safe to run multiple times).
"""
import subprocess, sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
COMPOSE = ["docker", "compose", "-f", str(ROOT / "docker-compose.yml")]

def split_statements(sql: str):
    """Split on top-level semicolons, respecting dollar-quoted blocks
    ($$...$$ and $tag$...$tag$)."""
    import re as _re
    stmts, buf = [], []
    dollar_tag = None
    i = 0
    while i < len(sql):
        m = _re.match(r"\$[A-Za-z_]*\$", sql[i:])
        if m:
            tag = m.group(0)
            if dollar_tag is None:
                dollar_tag = tag
            elif tag == dollar_tag:
                dollar_tag = None
            buf.append(tag)
            i += len(tag)
            continue
        ch = sql[i]
        if ch == ";" and dollar_tag is None:
            stmt = "".join(buf).strip()
            if stmt:
                stmts.append(stmt)
            buf = []
        else:
            buf.append(ch)
        i += 1
    tail = "".join(buf).strip()
    if tail:
        stmts.append(tail)
    return stmts


def psql(sql: str):
    """Execute a migration statement-by-statement so one failure never
    silently aborts the rest of the migration (single-transaction psql -c
    did exactly that). Every statement runs with app.bypass=on and the
    primary tenant bound — pre-tenancy migration INSERTs into scoped
    tables resolve their tenant_id column default correctly."""
    ok = True
    for stmt in split_statements(sql):
        result = subprocess.run(
            COMPOSE + ["exec", "-T", "db", "psql", "-U", "postgres", "-d", "inventory_db"],
            input=("SELECT set_config('app.tenant_id', COALESCE((SELECT id::text FROM tenants ORDER BY created_at LIMIT 1), ''), false), set_config('app.bypass', 'on', false);\n"
                   + stmt + ";"), capture_output=True, text=True
        )
        errors = [l for l in result.stderr.splitlines() if "ERROR" in l and "already exists" not in l and "does not exist, skipping" not in l]
        if errors or result.returncode != 0:
            ok = False
            print(f"    ⚠️  {errors[0] if errors else result.returncode}: {stmt[:90]}")
    return ok

MIGRATIONS = [
    # v0 — migration tracking table
    ("v0_schema_migrations", """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id text PRIMARY KEY,
            applied_at timestamptz DEFAULT now()
        );
    """),

    # v1.1 — accounting_periods: add id column and make it PK (live DB has month as PK)
    ("v1.1_accounting_periods_pk", """
        ALTER TABLE accounting_periods ADD COLUMN IF NOT EXISTS id uuid;
        UPDATE accounting_periods SET id = gen_random_uuid() WHERE id IS NULL;
        ALTER TABLE accounting_periods ALTER COLUMN id SET NOT NULL;
        ALTER TABLE accounting_periods DROP CONSTRAINT IF EXISTS accounting_periods_pkey;
        ALTER TABLE accounting_periods ADD PRIMARY KEY (id);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_accounting_periods_month ON accounting_periods(month);
    """),

    # v1 — stock_status on products
    ("v1_stock_status", """
        ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status text NOT NULL DEFAULT 'tracked';
    """),

    # v2 — safe_transactions table
    ("v2_safe_transactions", """
        CREATE TABLE IF NOT EXISTS safe_transactions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          safe_id uuid NOT NULL REFERENCES safes(id),
          tx_type text NOT NULL CHECK (tx_type IN ('deposit','withdraw')),
          amount numeric(14,2) NOT NULL,
          balance_after numeric(14,2) NOT NULL,
          note text,
          created_by uuid,
          created_at timestamptz DEFAULT now()
        );
    """),

    # v3 — safe_type on safes
    ("v3_safe_type", """
        ALTER TABLE safes ADD COLUMN IF NOT EXISTS safe_type text NOT NULL DEFAULT 'permanent';
    """),

    # v4 — product_collections
    ("v4_collections", """
        CREATE TABLE IF NOT EXISTS product_collections (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          description text,
          retail_price numeric(12,2) DEFAULT 0,
          wholesale_price numeric(12,2) DEFAULT 0,
          is_active boolean DEFAULT true,
          created_at timestamptz DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS collection_items (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          collection_id uuid NOT NULL REFERENCES product_collections(id) ON DELETE CASCADE,
          product_id uuid NOT NULL REFERENCES products(id),
          qty numeric(12,3) NOT NULL DEFAULT 1
        );
        CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);
    """),

    # v5 — paper_size setting
    ("v5_paper_size", """
        INSERT INTO store_settings (key, value) VALUES ('paper_size', '"A4"') ON CONFLICT (key) DO NOTHING;
    """),

    # v7 — wallet_transactions audit table
    ("v7_wallet_transactions", """
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          wallet_id uuid NOT NULL REFERENCES payment_wallets(id),
          amount numeric(14,2) NOT NULL,
          tx_type text NOT NULL,
          ref_id uuid,
          note text,
          created_by uuid,
          created_at timestamptz DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
    """),

    # v6 — wallet_id on sales
    ("v6_wallet_id_sales", """
        ALTER TABLE sales ADD COLUMN IF NOT EXISTS wallet_id uuid REFERENCES payment_wallets(id) ON DELETE SET NULL;
        ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash';
    """),

    # v7 — ZK device sync log + device settings
    ("v7_hr_sync_log", """
        CREATE TABLE IF NOT EXISTS hr_sync_log (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            synced_at timestamptz DEFAULT now(),
            status text NOT NULL,
            fetched int DEFAULT 0,
            added int DEFAULT 0,
            updated int DEFAULT 0,
            message text
        );
        INSERT INTO hr_settings (key, value) VALUES ('device_host', '192.168.1.201') ON CONFLICT (key) DO NOTHING;
        INSERT INTO hr_settings (key, value) VALUES ('device_port', '4370') ON CONFLICT (key) DO NOTHING;
        INSERT INTO hr_settings (key, value) VALUES ('device_timeout', '5') ON CONFLICT (key) DO NOTHING;
    """),

    ("v8_warehouse_product_status", """
         CREATE TABLE IF NOT EXISTS warehouse_product_status (
             warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
             product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
             status       text NOT NULL DEFAULT 'untracked',
             PRIMARY KEY (warehouse_id, product_id)
         );
         ALTER TABLE warehouse_product_status ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
         ALTER TABLE warehouse_product_status ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
         INSERT INTO warehouse_product_status (tenant_id, warehouse_id, product_id, status)
         SELECT (SELECT id FROM tenants ORDER BY created_at LIMIT 1), warehouse_id, product_id, 'tracked'
         FROM stock_movements
         ON CONFLICT DO NOTHING;
     """),

    ("v9_product_barcodes", """
         CREATE TABLE IF NOT EXISTS product_barcodes (
             id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
             product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
             barcode text NOT NULL,
             is_primary boolean NOT NULL DEFAULT false,
             created_at timestamptz DEFAULT now(),
             UNIQUE(barcode)
         );
         CREATE INDEX IF NOT EXISTS idx_product_barcodes_product ON product_barcodes(product_id);
         CREATE INDEX IF NOT EXISTS idx_product_barcodes_barcode ON product_barcodes(barcode);
         -- Table may pre-exist from create_all without a DB-side id default
         ALTER TABLE product_barcodes ALTER COLUMN id SET DEFAULT gen_random_uuid();
         -- Migrate existing barcodes from products table if they exist
         INSERT INTO product_barcodes (product_id, barcode, is_primary)
         SELECT id, barcode, true FROM products WHERE barcode IS NOT NULL
         ON CONFLICT (barcode) DO NOTHING;
     """),

    ("v10_supplier_prices", """
         CREATE TABLE IF NOT EXISTS supplier_prices (
             id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
             supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
             product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
             price numeric(12,2) NOT NULL,
             currency text DEFAULT 'EGP',
             min_qty numeric(12,3) DEFAULT 1,
             last_purchase_date timestamptz,
             notes text,
             is_active boolean DEFAULT true,
             created_at timestamptz DEFAULT now(),
             updated_at timestamptz DEFAULT now(),
             UNIQUE(supplier_id, product_id)
         );
         CREATE INDEX IF NOT EXISTS idx_supplier_prices_supplier ON supplier_prices(supplier_id);
         CREATE INDEX IF NOT EXISTS idx_supplier_prices_product ON supplier_prices(product_id);
         -- Table may pre-exist from create_all without DB-side defaults
         ALTER TABLE supplier_prices ALTER COLUMN currency  SET DEFAULT 'EGP';
         ALTER TABLE supplier_prices ALTER COLUMN min_qty   SET DEFAULT 1;
         ALTER TABLE supplier_prices ALTER COLUMN is_active SET DEFAULT true;
         -- Best-effort seed from existing purchase orders if tables exist.
         DO $$
         BEGIN
           IF to_regclass('purchase_orders') IS NOT NULL AND to_regclass('purchase_order_items') IS NOT NULL THEN
             INSERT INTO supplier_prices (supplier_id, product_id, price, last_purchase_date)
             SELECT po.supplier_id, poi.product_id, poi.unit_cost, po.created_at
             FROM purchase_orders po
             JOIN purchase_order_items poi ON poi.po_id = po.id
             WHERE po.supplier_id IS NOT NULL
             ON CONFLICT (supplier_id, product_id) DO NOTHING;
           END IF;
         END $$;
     """),

    # v11 — HR payroll period workflow
    ("v11_hr_payroll_periods", """
        CREATE TABLE IF NOT EXISTS hr_payroll_periods (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            month text UNIQUE NOT NULL,
            status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','paid')),
            submitted_by uuid REFERENCES users(id),
            submitted_at timestamptz,
            approved_by uuid REFERENCES users(id),
            approved_at timestamptz,
            paid_by uuid REFERENCES users(id),
            paid_at timestamptz,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_hr_payroll_periods_status ON hr_payroll_periods(status);
        CREATE INDEX IF NOT EXISTS idx_hr_payroll_periods_month ON hr_payroll_periods(month);
    """),

    # v12 — suppliers soft-delete
    ("v12_suppliers_soft_delete", """
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
        UPDATE suppliers SET is_active = true WHERE is_active IS NULL;
        CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);
    """),

    # v13 — sales total/net_total/paid_amount columns (added after model refactor)
    ("v13_sales_amount_columns", """
        ALTER TABLE sales ADD COLUMN IF NOT EXISTS total numeric(12,2) NOT NULL DEFAULT 0;
        ALTER TABLE sales ADD COLUMN IF NOT EXISTS net_total numeric(12,2) NOT NULL DEFAULT 0;
        ALTER TABLE sales ADD COLUMN IF NOT EXISTS paid_amount numeric(12,2) DEFAULT 0;
        ALTER TABLE sales ALTER COLUMN total SET DEFAULT 0;
        ALTER TABLE sales ALTER COLUMN net_total SET DEFAULT 0;
    """),

    # v14 — sale_payments split-payment table
    ("v14_sale_payments", """
        CREATE TABLE IF NOT EXISTS sale_payments (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
            method text NOT NULL,
            amount numeric(12,2) NOT NULL,
            wallet_id uuid REFERENCES payment_wallets(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON sale_payments(sale_id);
    """),

    # v15 — shift model: expected_balance, difference, deposit tracking
    ("v15_shift_expected_balance", """
        ALTER TABLE shifts ADD COLUMN IF NOT EXISTS expected_balance numeric(12,2);
        ALTER TABLE shifts ADD COLUMN IF NOT EXISTS difference numeric(12,2);
        ALTER TABLE shifts ADD COLUMN IF NOT EXISTS deposit_received_by uuid REFERENCES users(id);
        ALTER TABLE shifts ADD COLUMN IF NOT EXISTS deposit_amount numeric(12,2);
    """),

    # v16 — hr_payroll_entries: add missing columns from old hr_payroll table
    ("v16_hr_payroll_entries_full", """
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS working_days integer;
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS actual_working_days integer;
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS absent_days integer;
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS vacation_days integer;
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS total_hours numeric(12,2);
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS lateness_minutes integer;
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS early_leave_minutes integer;
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS missing_scan_minutes integer;
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS lateness_deduction numeric(12,2);
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS overtime_hours numeric(12,2);
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS overtime_pay numeric(12,2);
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS bonus_days integer;
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS bonus_payment numeric(12,2);
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS bonus numeric(12,2);
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS deductions numeric(12,2);
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS advances numeric(12,2);
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS drawer_variance numeric(12,2);
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS net_salary numeric(12,2);
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS hourly_rate numeric(12,2);
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS daily_breakdown jsonb;
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id);
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
    """),

    # v17 — unique constraint on (period_id, employee_id) for upsert
    ("v17_hr_payroll_entries_unique", """
        ALTER TABLE hr_payroll_entries DROP CONSTRAINT IF EXISTS hr_payroll_entries_period_id_employee_id_key;
        ALTER TABLE hr_payroll_entries ADD CONSTRAINT hr_payroll_entries_period_id_employee_id_key UNIQUE (period_id, employee_id);
    """),

    # v18 — hr_payroll_periods: add default for id column
    ("v18_hr_payroll_periods_id_default", """
        ALTER TABLE hr_payroll_periods ALTER COLUMN id SET DEFAULT gen_random_uuid();
    """),

    # v19 — 54 missing FK indexes across 27 tables (from model<->DB audit)
    ("v19_missing_fk_indexes",
     (ROOT / "backend" / "migrations" / "add_missing_indexes.sql").read_text()),

    # v20 — stock_balances maintained table: O(1) balance reads + backfill from movements
    ("v20_stock_balances",
     (ROOT / "backend" / "migrations" / "add_stock_balances.sql").read_text()),

    # v21 — reconcile columns present in models but missing from older databases
    ("v21_model_column_reconciliation", """
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit numeric(14,2);
        ALTER TABLE financial_categories ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
        ALTER TABLE financial_categories ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
    """),

    # v22 — reconcile enum values + uuid PK defaults used by raw-SQL inserts
    ("v22_defaults_and_enum_reconciliation", """
        ALTER TYPE drawer_tx_type_enum ADD VALUE IF NOT EXISTS 'revenue_delivery';
        ALTER TABLE accounting_periods   ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE archived_documents   ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE expenses             ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE expense_vendors      ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE sale_items           ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE sale_payments        ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE stock_movements      ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE suppliers            ALTER COLUMN id SET DEFAULT gen_random_uuid();
    """),

    # v23 — payment wallet types are free-form String(32) in the model
    # (clients register custom wallet types); drop the legacy 3-value check
    ("v23_drop_wallet_type_check", """
        ALTER TABLE payment_wallets DROP CONSTRAINT IF EXISTS payment_wallets_type_check;
    """),

    # v24 — boolean flag defaults so raw-SQL inserts that omit them succeed
    ("v24_flag_defaults", """
        ALTER TABLE expense_vendors ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE expenses        ALTER COLUMN is_recurring SET DEFAULT false;
    """),

    # v25 — nullability reconciliation with models (loosen legacy NOT NULLs)
    ("v25_nullability_reconciliation", """
        ALTER TABLE expenses           ALTER COLUMN recurring_interval DROP NOT NULL;
        ALTER TABLE expenses           ALTER COLUMN recurring_end_date DROP NOT NULL;
        ALTER TABLE hr_settings        ALTER COLUMN value DROP NOT NULL;
        ALTER TABLE products           ALTER COLUMN subcategory_id DROP NOT NULL;
        ALTER TABLE hr_payroll_entries ALTER COLUMN deductions DROP NOT NULL;
    """),

    # v26 — columns present in models but missing from pre-refactor snapshots
    ("v26_model_column_backfill", """
        ALTER TABLE audit_log            ADD COLUMN IF NOT EXISTS action_type text;
        ALTER TABLE audit_log            ADD COLUMN IF NOT EXISTS reason text;
        ALTER TABLE audit_log            ADD COLUMN IF NOT EXISTS details text;
        ALTER TABLE categories           ADD COLUMN IF NOT EXISTS code varchar(32);
        ALTER TABLE categories           ADD COLUMN IF NOT EXISTS image_url varchar(512);
        ALTER TABLE subcategories        ADD COLUMN IF NOT EXISTS code varchar(32);
        ALTER TABLE products             ADD COLUMN IF NOT EXISTS code varchar(32);
        ALTER TABLE products             ADD COLUMN IF NOT EXISTS shelf_number varchar(32);
        ALTER TABLE products             ADD COLUMN IF NOT EXISTS description text;
        ALTER TABLE sales                ADD COLUMN IF NOT EXISTS returns_total numeric(12,2) NOT NULL DEFAULT 0;
        ALTER TABLE sales                ADD COLUMN IF NOT EXISTS last_paid_at timestamptz;
        ALTER TABLE customer_payments    ADD COLUMN IF NOT EXISTS sale_id uuid;
        ALTER TABLE stock_movements      ADD COLUMN IF NOT EXISTS sale_id uuid;
        ALTER TABLE stock_movements      ADD COLUMN IF NOT EXISTS purchase_id uuid;
        ALTER TABLE hr_advances          ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
        ALTER TABLE hr_attendance        ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
        ALTER TABLE hr_payroll           ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
        ALTER TABLE payroll_entries      ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
        ALTER TABLE supplier_transactions ADD COLUMN IF NOT EXISTS tx_type varchar(16);
        ALTER TABLE hr_shifts            ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
        ALTER TABLE hr_shifts            ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
        ALTER TABLE hr_shifts            ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
        ALTER TABLE hr_settings          ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();
        ALTER TABLE hr_settings          ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
        ALTER TABLE hr_settings          ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='hr_settings'::regclass AND contype='p') THEN
                ALTER TABLE hr_settings ADD PRIMARY KEY (id);
            END IF;
        END $$;
    """),

    # v27 — uuid PK defaults everywhere (ORM inserts rely on them on every table)
    ("v27_uuid_pk_defaults", """
        ALTER TABLE categories           ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE collection_items     ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE customer_payments    ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE customers            ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE device_tokens        ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE drawer_transactions  ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE employees            ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE hr_payroll_entries   ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE hr_sync_log          ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE payroll_entries      ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE payroll_periods      ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE product_barcodes     ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE product_collections  ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE product_images       ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE products             ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE purchase_order_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE purchase_orders      ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE sales                ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE shifts               ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE subcategories        ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE supplier_prices      ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE users                ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE wallet_transactions  ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE warehouses           ALTER COLUMN id SET DEFAULT gen_random_uuid();
    """),

    # v28 — hr_sync_log counters: raw-SQL failure path inserts without them
    ("v28_sync_log_counter_defaults", """
        ALTER TABLE hr_sync_log ALTER COLUMN fetched SET DEFAULT 0;
        ALTER TABLE hr_sync_log ALTER COLUMN added   SET DEFAULT 0;
        ALTER TABLE hr_sync_log ALTER COLUMN updated SET DEFAULT 0;
    """),
    # v29 — multi-tenancy: tenants + tenant_id on all business tables (backfill = tenant #1)
    ("v29_multi_tenancy", """
        CREATE TABLE IF NOT EXISTS tenants (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, sector text NOT NULL DEFAULT 'plumbing', scale text NOT NULL DEFAULT 'medium', palette jsonb NOT NULL DEFAULT '{}'::jsonb, features jsonb NOT NULL DEFAULT '[]'::jsonb, plan text NOT NULL DEFAULT 'trial', trial_ends_at timestamptz, storefront_slug text UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
        CREATE TABLE IF NOT EXISTS subscriptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, plan text NOT NULL, status text NOT NULL DEFAULT 'requested', contact_phone text, created_at timestamptz NOT NULL DEFAULT now());
        INSERT INTO tenants (id, name, sector, scale, palette, features, plan) SELECT gen_random_uuid(), 'المصرية الألمانية للأدوات الصحية', 'plumbing', 'large', '{}'::jsonb, '[]'::jsonb, 'enterprise' WHERE NOT EXISTS (SELECT 1 FROM tenants);
        ALTER TABLE accounting_periods ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE archived_documents ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE collection_items ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE drawer_transactions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE expense_vendors ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE financial_categories ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE hr_advances ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE hr_attendance ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE hr_audit_log ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE hr_payroll ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE hr_payroll_entries ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE hr_payroll_periods ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE hr_settings ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE hr_shifts ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE hr_sync_log ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE payment_wallets ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE payroll_entries ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE product_barcodes ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE product_collections ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE product_images ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE purchase_price_history ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE safe_deposits ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE safe_transactions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE safes ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE sale_payments ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE shifts ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE stock_balances ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE supplier_prices ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE supplier_transactions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE warehouse_product_status ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
        UPDATE users SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE accounting_periods SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE archived_documents SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE audit_log SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE categories SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE customer_payments SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE collection_items SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE employees SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE customers SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE device_tokens SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE drawer_transactions SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE expense_vendors SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE expenses SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE financial_categories SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE hr_advances SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE hr_attendance SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE hr_audit_log SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE hr_employees SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE hr_payroll SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE hr_payroll_entries SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE hr_payroll_periods SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE hr_settings SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE hr_shifts SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE hr_sync_log SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE payment_wallets SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE payroll_entries SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE product_barcodes SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE product_collections SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE product_images SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE products SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE purchase_order_items SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE purchase_orders SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE purchase_price_history SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE safe_deposits SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE safe_transactions SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE safes SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE sale_items SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE sale_payments SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE sales SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE shifts SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE stock_balances SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE stock_movements SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE store_settings SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE subcategories SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE supplier_prices SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE supplier_transactions SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE suppliers SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE wallet_transactions SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE warehouse_product_status SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        UPDATE warehouses SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1) WHERE tenant_id IS NULL;
        CREATE INDEX IF NOT EXISTS ix_accounting_periods_tenant_id ON accounting_periods(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_archived_documents_tenant_id ON archived_documents(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_audit_log_tenant_id ON audit_log(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_categories_tenant_id ON categories(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_customer_payments_tenant_id ON customer_payments(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_collection_items_tenant_id ON collection_items(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_employees_tenant_id ON employees(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_customers_tenant_id ON customers(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_device_tokens_tenant_id ON device_tokens(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_drawer_transactions_tenant_id ON drawer_transactions(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_expense_vendors_tenant_id ON expense_vendors(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_expenses_tenant_id ON expenses(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_financial_categories_tenant_id ON financial_categories(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_hr_advances_tenant_id ON hr_advances(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_hr_attendance_tenant_id ON hr_attendance(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_hr_audit_log_tenant_id ON hr_audit_log(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_hr_employees_tenant_id ON hr_employees(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_hr_payroll_tenant_id ON hr_payroll(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_hr_payroll_entries_tenant_id ON hr_payroll_entries(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_hr_payroll_periods_tenant_id ON hr_payroll_periods(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_hr_settings_tenant_id ON hr_settings(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_hr_shifts_tenant_id ON hr_shifts(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_hr_sync_log_tenant_id ON hr_sync_log(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_payment_wallets_tenant_id ON payment_wallets(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_payroll_entries_tenant_id ON payroll_entries(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_product_barcodes_tenant_id ON product_barcodes(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_product_collections_tenant_id ON product_collections(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_product_images_tenant_id ON product_images(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_products_tenant_id ON products(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_purchase_order_items_tenant_id ON purchase_order_items(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_purchase_orders_tenant_id ON purchase_orders(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_purchase_price_history_tenant_id ON purchase_price_history(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_safe_deposits_tenant_id ON safe_deposits(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_safe_transactions_tenant_id ON safe_transactions(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_safes_tenant_id ON safes(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_sale_items_tenant_id ON sale_items(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_sale_payments_tenant_id ON sale_payments(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_sales_tenant_id ON sales(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_shifts_tenant_id ON shifts(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_stock_balances_tenant_id ON stock_balances(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_stock_movements_tenant_id ON stock_movements(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_store_settings_tenant_id ON store_settings(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_subcategories_tenant_id ON subcategories(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_supplier_prices_tenant_id ON supplier_prices(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_supplier_transactions_tenant_id ON supplier_transactions(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_suppliers_tenant_id ON suppliers(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_wallet_transactions_tenant_id ON wallet_transactions(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_warehouse_product_status_tenant_id ON warehouse_product_status(tenant_id);
        CREATE INDEX IF NOT EXISTS ix_warehouses_tenant_id ON warehouses(tenant_id);
        ALTER TABLE accounting_periods ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE archived_documents ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE audit_log ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE categories ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE customer_payments ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE collection_items ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE employees ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE customers ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE device_tokens ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE drawer_transactions ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE expense_vendors ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE expenses ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE financial_categories ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr_advances ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr_attendance ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr_audit_log ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr_employees ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr_payroll ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr_payroll_entries ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr_payroll_periods ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr_settings ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr_shifts ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE hr_sync_log ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE payment_wallets ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE payroll_entries ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE product_barcodes ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE product_collections ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE product_images ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE products ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE purchase_order_items ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE purchase_orders ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE purchase_price_history ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE safe_deposits ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE safe_transactions ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE safes ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE sale_items ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE sale_payments ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE sales ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE shifts ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE stock_balances ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE stock_movements ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE store_settings ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE subcategories ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE supplier_prices ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE supplier_transactions ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE suppliers ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE wallet_transactions ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE warehouse_product_status ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE warehouses ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_categories_name') THEN ALTER TABLE categories ADD CONSTRAINT uq_categories_name UNIQUE (tenant_id, name); END IF; END $$;
        ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS warehouses_code_key;
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_warehouses_code') THEN ALTER TABLE warehouses ADD CONSTRAINT uq_warehouses_code UNIQUE (tenant_id, code); END IF; END $$;
        ALTER TABLE payment_wallets DROP CONSTRAINT IF EXISTS payment_wallets_name_key;
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_payment_wallets_name') THEN ALTER TABLE payment_wallets ADD CONSTRAINT uq_payment_wallets_name UNIQUE (tenant_id, name); END IF; END $$;
        ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_invoice_number_key;
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_sales_invoice_number') THEN ALTER TABLE sales ADD CONSTRAINT uq_sales_invoice_number UNIQUE (tenant_id, invoice_number); END IF; END $$;
        ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_po_number_key;
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_purchase_orders_po_number') THEN ALTER TABLE purchase_orders ADD CONSTRAINT uq_purchase_orders_po_number UNIQUE (tenant_id, po_number); END IF; END $$;
        ALTER TABLE hr_payroll_periods DROP CONSTRAINT IF EXISTS hr_payroll_periods_month_key;
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_hr_payroll_periods_month') THEN ALTER TABLE hr_payroll_periods ADD CONSTRAINT uq_hr_payroll_periods_month UNIQUE (tenant_id, month); END IF; END $$;
        ALTER TABLE accounting_periods DROP CONSTRAINT IF EXISTS accounting_periods_month_key;
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_accounting_periods_month') THEN ALTER TABLE accounting_periods ADD CONSTRAINT uq_accounting_periods_month UNIQUE (tenant_id, month); END IF; END $$;
        ALTER TABLE hr_settings DROP CONSTRAINT IF EXISTS hr_settings_key_key;
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_hr_settings_key') THEN ALTER TABLE hr_settings ADD CONSTRAINT uq_hr_settings_key UNIQUE (tenant_id, key); END IF; END $$;
        ALTER TABLE hr_employees DROP CONSTRAINT IF EXISTS hr_employees_emp_code_key;
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_hr_employees_emp_code') THEN ALTER TABLE hr_employees ADD CONSTRAINT uq_hr_employees_emp_code UNIQUE (tenant_id, emp_code); END IF; END $$;
    """),
    # v30 — row-level security: DB-enforced tenancy for ORM AND raw SQL
    ("v30_rls", """
        ALTER TABLE accounting_periods ENABLE ROW LEVEL SECURITY;
        ALTER TABLE accounting_periods FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounting_periods' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON accounting_periods
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE archived_documents ENABLE ROW LEVEL SECURITY;
        ALTER TABLE archived_documents FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'archived_documents' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON archived_documents
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
        ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_log' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON audit_log
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE categories FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON categories
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
        ALTER TABLE collection_items FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collection_items' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON collection_items
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;
        ALTER TABLE customer_payments FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_payments' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON customer_payments
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
        ALTER TABLE customers FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON customers
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
        ALTER TABLE device_tokens FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'device_tokens' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON device_tokens
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE drawer_transactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE drawer_transactions FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drawer_transactions' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON drawer_transactions
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
        ALTER TABLE employees FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON employees
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE expense_vendors ENABLE ROW LEVEL SECURITY;
        ALTER TABLE expense_vendors FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expense_vendors' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON expense_vendors
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
        ALTER TABLE expenses FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON expenses
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE financial_categories FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'financial_categories' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON financial_categories
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE hr_advances ENABLE ROW LEVEL SECURITY;
        ALTER TABLE hr_advances FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_advances' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON hr_advances
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE hr_attendance ENABLE ROW LEVEL SECURITY;
        ALTER TABLE hr_attendance FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_attendance' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON hr_attendance
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE hr_audit_log ENABLE ROW LEVEL SECURITY;
        ALTER TABLE hr_audit_log FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_audit_log' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON hr_audit_log
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE hr_employees ENABLE ROW LEVEL SECURITY;
        ALTER TABLE hr_employees FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_employees' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON hr_employees
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE hr_payroll ENABLE ROW LEVEL SECURITY;
        ALTER TABLE hr_payroll FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_payroll' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON hr_payroll
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE hr_payroll_entries ENABLE ROW LEVEL SECURITY;
        ALTER TABLE hr_payroll_entries FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_payroll_entries' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON hr_payroll_entries
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE hr_payroll_periods ENABLE ROW LEVEL SECURITY;
        ALTER TABLE hr_payroll_periods FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_payroll_periods' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON hr_payroll_periods
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE hr_settings ENABLE ROW LEVEL SECURITY;
        ALTER TABLE hr_settings FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_settings' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON hr_settings
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE hr_shifts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE hr_shifts FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_shifts' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON hr_shifts
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE hr_sync_log ENABLE ROW LEVEL SECURITY;
        ALTER TABLE hr_sync_log FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_sync_log' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON hr_sync_log
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE payment_wallets ENABLE ROW LEVEL SECURITY;
        ALTER TABLE payment_wallets FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_wallets' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON payment_wallets
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
        ALTER TABLE payroll_entries FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payroll_entries' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON payroll_entries
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE product_barcodes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE product_barcodes FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_barcodes' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON product_barcodes
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;
        ALTER TABLE product_collections FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_collections' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON product_collections
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
        ALTER TABLE product_images FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON product_images
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE products ENABLE ROW LEVEL SECURITY;
        ALTER TABLE products FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON products
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
        ALTER TABLE purchase_order_items FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_items' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON purchase_order_items
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
        ALTER TABLE purchase_orders FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON purchase_orders
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE purchase_price_history ENABLE ROW LEVEL SECURITY;
        ALTER TABLE purchase_price_history FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_price_history' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON purchase_price_history
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE safe_deposits ENABLE ROW LEVEL SECURITY;
        ALTER TABLE safe_deposits FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'safe_deposits' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON safe_deposits
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE safe_transactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE safe_transactions FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'safe_transactions' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON safe_transactions
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE safes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE safes FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'safes' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON safes
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
        ALTER TABLE sale_items FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sale_items' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON sale_items
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
        ALTER TABLE sale_payments FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sale_payments' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON sale_payments
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
        ALTER TABLE sales FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON sales
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE shifts FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shifts' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON shifts
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE stock_balances ENABLE ROW LEVEL SECURITY;
        ALTER TABLE stock_balances FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_balances' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON stock_balances
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
        ALTER TABLE stock_movements FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_movements' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON stock_movements
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
        ALTER TABLE store_settings FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'store_settings' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON store_settings
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE subcategories FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subcategories' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON subcategories
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE supplier_prices ENABLE ROW LEVEL SECURITY;
        ALTER TABLE supplier_prices FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'supplier_prices' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON supplier_prices
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE supplier_transactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE supplier_transactions FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'supplier_transactions' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON supplier_transactions
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
        ALTER TABLE suppliers FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON suppliers
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE wallet_transactions FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallet_transactions' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON wallet_transactions
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE warehouse_product_status ENABLE ROW LEVEL SECURITY;
        ALTER TABLE warehouse_product_status FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouse_product_status' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON warehouse_product_status
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
        ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
        ALTER TABLE warehouses FORCE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'warehouses' AND policyname = 'tenant_isolation') THEN
            CREATE POLICY tenant_isolation ON warehouses
              USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on')
              WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.bypass', true) = 'on');
          END IF;
        END $$;
    """),
    # v31 — raw-SQL inserts get tenant_id from the RLS GUC automatically
    ("v31_tenant_default", """
        ALTER TABLE accounting_periods ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE archived_documents ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE audit_log ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE categories ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE collection_items ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE customer_payments ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE customers ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE device_tokens ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE drawer_transactions ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE employees ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE expense_vendors ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE expenses ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE financial_categories ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE hr_advances ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE hr_attendance ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE hr_audit_log ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE hr_employees ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE hr_payroll ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE hr_payroll_entries ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE hr_payroll_periods ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE hr_settings ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE hr_shifts ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE hr_sync_log ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE payment_wallets ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE payroll_entries ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE product_barcodes ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE product_collections ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE product_images ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE products ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE purchase_order_items ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE purchase_orders ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE purchase_price_history ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE safe_deposits ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE safe_transactions ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE safes ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE sale_items ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE sale_payments ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE sales ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE shifts ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE stock_balances ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE stock_movements ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE store_settings ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE subcategories ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE supplier_prices ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE supplier_transactions ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE suppliers ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE wallet_transactions ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE warehouse_product_status ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
        ALTER TABLE warehouses ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid;
    """),
    # v32 — tenant deletion cascades to all tenant data (incl. user accounts)
    ("v32_tenant_cascade", """
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;
        ALTER TABLE users ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE accounting_periods DROP CONSTRAINT IF EXISTS accounting_periods_tenant_id_fkey;
        ALTER TABLE accounting_periods ADD CONSTRAINT accounting_periods_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE archived_documents DROP CONSTRAINT IF EXISTS archived_documents_tenant_id_fkey;
        ALTER TABLE archived_documents ADD CONSTRAINT archived_documents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_tenant_id_fkey;
        ALTER TABLE audit_log ADD CONSTRAINT audit_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_tenant_id_fkey;
        ALTER TABLE categories ADD CONSTRAINT categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE collection_items DROP CONSTRAINT IF EXISTS collection_items_tenant_id_fkey;
        ALTER TABLE collection_items ADD CONSTRAINT collection_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE customer_payments DROP CONSTRAINT IF EXISTS customer_payments_tenant_id_fkey;
        ALTER TABLE customer_payments ADD CONSTRAINT customer_payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_tenant_id_fkey;
        ALTER TABLE customers ADD CONSTRAINT customers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE device_tokens DROP CONSTRAINT IF EXISTS device_tokens_tenant_id_fkey;
        ALTER TABLE device_tokens ADD CONSTRAINT device_tokens_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE drawer_transactions DROP CONSTRAINT IF EXISTS drawer_transactions_tenant_id_fkey;
        ALTER TABLE drawer_transactions ADD CONSTRAINT drawer_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_tenant_id_fkey;
        ALTER TABLE employees ADD CONSTRAINT employees_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE expense_vendors DROP CONSTRAINT IF EXISTS expense_vendors_tenant_id_fkey;
        ALTER TABLE expense_vendors ADD CONSTRAINT expense_vendors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_tenant_id_fkey;
        ALTER TABLE expenses ADD CONSTRAINT expenses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE financial_categories DROP CONSTRAINT IF EXISTS financial_categories_tenant_id_fkey;
        ALTER TABLE financial_categories ADD CONSTRAINT financial_categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE hr_advances DROP CONSTRAINT IF EXISTS hr_advances_tenant_id_fkey;
        ALTER TABLE hr_advances ADD CONSTRAINT hr_advances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE hr_attendance DROP CONSTRAINT IF EXISTS hr_attendance_tenant_id_fkey;
        ALTER TABLE hr_attendance ADD CONSTRAINT hr_attendance_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE hr_audit_log DROP CONSTRAINT IF EXISTS hr_audit_log_tenant_id_fkey;
        ALTER TABLE hr_audit_log ADD CONSTRAINT hr_audit_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE hr_employees DROP CONSTRAINT IF EXISTS hr_employees_tenant_id_fkey;
        ALTER TABLE hr_employees ADD CONSTRAINT hr_employees_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE hr_payroll DROP CONSTRAINT IF EXISTS hr_payroll_tenant_id_fkey;
        ALTER TABLE hr_payroll ADD CONSTRAINT hr_payroll_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE hr_payroll_entries DROP CONSTRAINT IF EXISTS hr_payroll_entries_tenant_id_fkey;
        ALTER TABLE hr_payroll_entries ADD CONSTRAINT hr_payroll_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE hr_payroll_periods DROP CONSTRAINT IF EXISTS hr_payroll_periods_tenant_id_fkey;
        ALTER TABLE hr_payroll_periods ADD CONSTRAINT hr_payroll_periods_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE hr_settings DROP CONSTRAINT IF EXISTS hr_settings_tenant_id_fkey;
        ALTER TABLE hr_settings ADD CONSTRAINT hr_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE hr_shifts DROP CONSTRAINT IF EXISTS hr_shifts_tenant_id_fkey;
        ALTER TABLE hr_shifts ADD CONSTRAINT hr_shifts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE hr_sync_log DROP CONSTRAINT IF EXISTS hr_sync_log_tenant_id_fkey;
        ALTER TABLE hr_sync_log ADD CONSTRAINT hr_sync_log_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE payment_wallets DROP CONSTRAINT IF EXISTS payment_wallets_tenant_id_fkey;
        ALTER TABLE payment_wallets ADD CONSTRAINT payment_wallets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE payroll_entries DROP CONSTRAINT IF EXISTS payroll_entries_tenant_id_fkey;
        ALTER TABLE payroll_entries ADD CONSTRAINT payroll_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE product_barcodes DROP CONSTRAINT IF EXISTS product_barcodes_tenant_id_fkey;
        ALTER TABLE product_barcodes ADD CONSTRAINT product_barcodes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE product_collections DROP CONSTRAINT IF EXISTS product_collections_tenant_id_fkey;
        ALTER TABLE product_collections ADD CONSTRAINT product_collections_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_tenant_id_fkey;
        ALTER TABLE product_images ADD CONSTRAINT product_images_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE products DROP CONSTRAINT IF EXISTS products_tenant_id_fkey;
        ALTER TABLE products ADD CONSTRAINT products_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE purchase_order_items DROP CONSTRAINT IF EXISTS purchase_order_items_tenant_id_fkey;
        ALTER TABLE purchase_order_items ADD CONSTRAINT purchase_order_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_tenant_id_fkey;
        ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE purchase_price_history DROP CONSTRAINT IF EXISTS purchase_price_history_tenant_id_fkey;
        ALTER TABLE purchase_price_history ADD CONSTRAINT purchase_price_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE safe_deposits DROP CONSTRAINT IF EXISTS safe_deposits_tenant_id_fkey;
        ALTER TABLE safe_deposits ADD CONSTRAINT safe_deposits_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE safe_transactions DROP CONSTRAINT IF EXISTS safe_transactions_tenant_id_fkey;
        ALTER TABLE safe_transactions ADD CONSTRAINT safe_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE safes DROP CONSTRAINT IF EXISTS safes_tenant_id_fkey;
        ALTER TABLE safes ADD CONSTRAINT safes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_tenant_id_fkey;
        ALTER TABLE sale_items ADD CONSTRAINT sale_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE sale_payments DROP CONSTRAINT IF EXISTS sale_payments_tenant_id_fkey;
        ALTER TABLE sale_payments ADD CONSTRAINT sale_payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_tenant_id_fkey;
        ALTER TABLE sales ADD CONSTRAINT sales_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_tenant_id_fkey;
        ALTER TABLE shifts ADD CONSTRAINT shifts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE stock_balances DROP CONSTRAINT IF EXISTS stock_balances_tenant_id_fkey;
        ALTER TABLE stock_balances ADD CONSTRAINT stock_balances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_tenant_id_fkey;
        ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE store_settings DROP CONSTRAINT IF EXISTS store_settings_tenant_id_fkey;
        ALTER TABLE store_settings ADD CONSTRAINT store_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE subcategories DROP CONSTRAINT IF EXISTS subcategories_tenant_id_fkey;
        ALTER TABLE subcategories ADD CONSTRAINT subcategories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE supplier_prices DROP CONSTRAINT IF EXISTS supplier_prices_tenant_id_fkey;
        ALTER TABLE supplier_prices ADD CONSTRAINT supplier_prices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE supplier_transactions DROP CONSTRAINT IF EXISTS supplier_transactions_tenant_id_fkey;
        ALTER TABLE supplier_transactions ADD CONSTRAINT supplier_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_tenant_id_fkey;
        ALTER TABLE suppliers ADD CONSTRAINT suppliers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_tenant_id_fkey;
        ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE warehouse_product_status DROP CONSTRAINT IF EXISTS warehouse_product_status_tenant_id_fkey;
        ALTER TABLE warehouse_product_status ADD CONSTRAINT warehouse_product_status_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS warehouses_tenant_id_fkey;
        ALTER TABLE warehouses ADD CONSTRAINT warehouses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    """),
]

def ensure_foundation():
    """tenants table + primary workspace must exist before ANY migration —
    scoped-table column defaults and backfills depend on them."""
    foundation = """
        CREATE TABLE IF NOT EXISTS tenants (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            name text NOT NULL,
            sector text NOT NULL DEFAULT 'plumbing',
            scale text NOT NULL DEFAULT 'medium',
            palette jsonb NOT NULL DEFAULT '{}'::jsonb,
            features jsonb NOT NULL DEFAULT '[]'::jsonb,
            plan text NOT NULL DEFAULT 'trial',
            trial_ends_at timestamptz,
            storefront_slug text UNIQUE,
            created_at timestamptz NOT NULL DEFAULT now()
        );
        INSERT INTO tenants (id, name, sector, scale, palette, features, plan)
        SELECT gen_random_uuid(), 'المصرية الألمانية للأدوات الصحية', 'plumbing', 'large', '{}'::jsonb, '[]'::jsonb, 'enterprise'
        WHERE NOT EXISTS (SELECT 1 FROM tenants);
        -- pre-tenancy migration INSERTs resolve tenant_id from this GUC default
        DO $fn$
        BEGIN
            IF to_regclass('public.accounting_periods') IS NOT NULL THEN ALTER TABLE accounting_periods ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.archived_documents') IS NOT NULL THEN ALTER TABLE archived_documents ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.audit_log') IS NOT NULL THEN ALTER TABLE audit_log ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.categories') IS NOT NULL THEN ALTER TABLE categories ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.collection_items') IS NOT NULL THEN ALTER TABLE collection_items ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.customer_payments') IS NOT NULL THEN ALTER TABLE customer_payments ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.customers') IS NOT NULL THEN ALTER TABLE customers ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.device_tokens') IS NOT NULL THEN ALTER TABLE device_tokens ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.drawer_transactions') IS NOT NULL THEN ALTER TABLE drawer_transactions ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.employees') IS NOT NULL THEN ALTER TABLE employees ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.expense_vendors') IS NOT NULL THEN ALTER TABLE expense_vendors ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.expenses') IS NOT NULL THEN ALTER TABLE expenses ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.financial_categories') IS NOT NULL THEN ALTER TABLE financial_categories ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.hr_advances') IS NOT NULL THEN ALTER TABLE hr_advances ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.hr_attendance') IS NOT NULL THEN ALTER TABLE hr_attendance ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.hr_audit_log') IS NOT NULL THEN ALTER TABLE hr_audit_log ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.hr_employees') IS NOT NULL THEN ALTER TABLE hr_employees ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.hr_payroll') IS NOT NULL THEN ALTER TABLE hr_payroll ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.hr_payroll_entries') IS NOT NULL THEN ALTER TABLE hr_payroll_entries ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.hr_payroll_periods') IS NOT NULL THEN ALTER TABLE hr_payroll_periods ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.hr_settings') IS NOT NULL THEN ALTER TABLE hr_settings ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.hr_shifts') IS NOT NULL THEN ALTER TABLE hr_shifts ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.hr_sync_log') IS NOT NULL THEN ALTER TABLE hr_sync_log ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.payment_wallets') IS NOT NULL THEN ALTER TABLE payment_wallets ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.payroll_entries') IS NOT NULL THEN ALTER TABLE payroll_entries ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.product_barcodes') IS NOT NULL THEN ALTER TABLE product_barcodes ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.product_collections') IS NOT NULL THEN ALTER TABLE product_collections ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.product_images') IS NOT NULL THEN ALTER TABLE product_images ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.products') IS NOT NULL THEN ALTER TABLE products ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.purchase_order_items') IS NOT NULL THEN ALTER TABLE purchase_order_items ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.purchase_orders') IS NOT NULL THEN ALTER TABLE purchase_orders ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.purchase_price_history') IS NOT NULL THEN ALTER TABLE purchase_price_history ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.safe_deposits') IS NOT NULL THEN ALTER TABLE safe_deposits ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.safe_transactions') IS NOT NULL THEN ALTER TABLE safe_transactions ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.safes') IS NOT NULL THEN ALTER TABLE safes ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.sale_items') IS NOT NULL THEN ALTER TABLE sale_items ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.sale_payments') IS NOT NULL THEN ALTER TABLE sale_payments ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.sales') IS NOT NULL THEN ALTER TABLE sales ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.shifts') IS NOT NULL THEN ALTER TABLE shifts ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.stock_balances') IS NOT NULL THEN ALTER TABLE stock_balances ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.stock_movements') IS NOT NULL THEN ALTER TABLE stock_movements ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.store_settings') IS NOT NULL THEN ALTER TABLE store_settings ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.subcategories') IS NOT NULL THEN ALTER TABLE subcategories ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.supplier_prices') IS NOT NULL THEN ALTER TABLE supplier_prices ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.supplier_transactions') IS NOT NULL THEN ALTER TABLE supplier_transactions ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.suppliers') IS NOT NULL THEN ALTER TABLE suppliers ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.wallet_transactions') IS NOT NULL THEN ALTER TABLE wallet_transactions ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.warehouse_product_status') IS NOT NULL THEN ALTER TABLE warehouse_product_status ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
            IF to_regclass('public.warehouses') IS NOT NULL THEN ALTER TABLE warehouses ALTER COLUMN tenant_id SET DEFAULT current_setting('app.tenant_id', true)::uuid; END IF;
        END
        $fn$;
    """
    psql(foundation)


def run():
    print("🔄 Running DB migrations...")
    ensure_foundation()
    ok = 0
    for name, sql in MIGRATIONS:
        # Check if already applied
        check = subprocess.run(
            COMPOSE + ["exec", "-T", "db", "psql", "-U", "postgres", "-d", "inventory_db", "-t", "-c",
                       f"SELECT 1 FROM schema_migrations WHERE id='{name}'"],
            capture_output=True, text=True
        )
        if check.returncode == 0 and check.stdout.strip():
            print(f"  ⏭️  {name} (already applied)")
            ok += 1
            continue
        result = psql(sql)
        status = "✅" if result else "⚠️ "
        print(f"  {status} {name}")
        if result:
            ok += 1
            # Record as applied
            subprocess.run(
                COMPOSE + ["exec", "-T", "db", "psql", "-U", "postgres", "-d", "inventory_db", "-c",
                           f"INSERT INTO schema_migrations (id) VALUES ('{name}') ON CONFLICT DO NOTHING"],
                capture_output=True, text=True
            )
    print(f"\n{'✅' if ok == len(MIGRATIONS) else '❌'} Done — {ok}/{len(MIGRATIONS)} migrations applied.")
    if ok < len(MIGRATIONS):
        print("Some migrations failed — check that the compose stack is running.")
        sys.exit(1)

if __name__ == "__main__":
    run()
