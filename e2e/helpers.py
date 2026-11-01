"""Shared helpers for Vendora E2E tests (live API + DB cleanup).

Every test creates its own rows tagged with a unique marker (name/barcode/
invoice prefix). `Conftest` teardown hard-deletes those rows in FK-safe order
and restores stored counters (safes / wallets / warehouse-product tracking),
so the production DB is left clean after the suite.
"""
from __future__ import annotations

import os
import re
import uuid
from typing import Any

import httpx

BASE = os.environ.get("E2E_API_BASE", "https://vendora-backend-six.vercel.app/api")

DEFAULT_ADMIN = ("ammar", os.environ.get("E2E_ADMIN_PASSWORD", "changeme"))


def uid(prefix: str, length: int = 8) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:length]}"


def to_uuid(v: Any) -> str:
    if isinstance(v, uuid.UUID):
        return str(v)
    if isinstance(v, dict):
        return str(v["id"])
    return str(v)


def q(ids) -> str:
    """Format a list of UUIDs for inclusion in an IN (...) clause."""
    vals = [f"'{str(i)}'::uuid" for i in ids]
    return ", ".join(vals) if vals else "NULL::uuid"


def qt(ids) -> str:
    """Format a list of ids as plain text literals (for varchar id columns)."""
    vals = [f"'{str(i)}'" for i in ids]
    return ", ".join(vals) if vals else "NULL"


class Api:
    """Small httpx wrapper with bearer auth + response helpers."""

    def __init__(self, username: str = "", password: str = "", token: str = ""):
        self.client = httpx.Client(base_url=BASE, timeout=45, follow_redirects=True)
        self.token = token
        if token:
            self.client.headers["Authorization"] = f"Bearer {token}"
        self.username = username

    def login(self, username: str, password: str, attempts: int = 4) -> dict:
        import time

        last = None
        for i in range(attempts):
            r = self.client.post("/auth/login", json={"username": username, "password": password})
            if r.status_code == 429:
                last = r
                wait = int(r.headers.get("Retry-After", "60")) + 2
                print(f"[login] 429 for {username}, sleeping {wait}s (attempt {i + 1}/{attempts})")
                time.sleep(wait)
                continue
            assert r.status_code == 200, f"login failed {r.status_code}: {r.text[:300]}"
            self.token = r.json()["access_token"]
            self.client.headers["Authorization"] = f"Bearer {self.token}"
            self.username = username
            return r.json()
        raise AssertionError(f"login rate-limited after {attempts} attempts: {last.text[:200]}")

    def _request(self, method: str, path: str, **kw):
        kw.setdefault("timeout", 45)
        if method in ("POST", "PUT", "PATCH", "DELETE"):
            # CSRF double-submit: echo the csrf_token cookie in the header
            tok = self.client.cookies.get("csrf_token")
            if tok:
                self.client.headers["X-CSRF-Token"] = tok
        r = self.client.request(method, path, **kw)
        return r

    def get(self, path: str, **kw):
        return self._request("GET", path, **kw)

    def post(self, path: str, json=None, **kw):
        return self._request("POST", path, json=json, **kw)

    def put(self, path: str, json=None, **kw):
        return self._request("PUT", path, json=json, **kw)

    def delete(self, path: str, **kw):
        return self._request("DELETE", path, **kw)

    def ok(self, r: httpx.Response, *codes: int) -> dict:
        want = codes or (200,)
        assert r.status_code in want, f"expected {want}, got {r.status_code}: {r.text[:400]}"
        if r.content:
            try:
                return r.json()
            except Exception:
                return {}
        return {}

    def admin(self) -> "Api":
        a = Api()
        a.login(*DEFAULT_ADMIN)
        return a


class Registry:
    """Buckets of created-id sequences + scalar snapshots for cleanup."""

    def __init__(self):
        self.buckets: dict[str, list[str]] = {}
        self.snapshots: list[tuple] = []  # (table, id, column, orig_value)

    def add(self, bucket: str, id_) -> None:
        self.buckets.setdefault(bucket, []).append(str(id_))

    def ids(self, *buckets: str) -> list[str]:
        out: list[str] = []
        for b in buckets:
            out.extend(self.buckets.get(b, []))
        return out

    def snapshot(self, table: str, id_, column: str, orig_value) -> None:
        self.snapshots.append((table, str(id_), column, orig_value))


def load_database_url() -> str | None:
    url = os.environ.get("E2E_DATABASE_URL")
    if url:
        return url
    env = os.environ.get("E2E_BACKEND_ENV_FILE", "/tmp/opencode/be.env")
    if os.path.isfile(env):
        for line in open(env):
            if line.startswith("DATABASE_URL="):
                v = line.strip().split("=", 1)[1].strip().strip('"')
                # Vercel env exports can mash later vars into the URL query string
                # (e.g. ...channel_binding=require"NX_DAEMON="false"...) — cut them off.
                m = re.match(r"(postgresql://[^?\s]+\?[^\"\s]+)", v)
                return m.group(1) if m else v
    return None


class DB:
    """Direct Postgres access for test data cleanup / verification."""

    def __init__(self, url: str):
        import psycopg

        self.conn = psycopg.connect(url, connect_timeout=20)

    def q(self, sql: str, params: tuple | None = None) -> list[tuple]:
        with self.conn.cursor() as cur:
            cur.execute(sql, params)
            if cur.description is None:
                self.conn.commit()
                return []
            return cur.fetchall()

    def one(self, sql: str, params: tuple | None = None):
        rows = self.q(sql, params)
        return rows[0] if rows else None

    def exec(self, sql: str) -> None:
        with self.conn.cursor() as cur:
            cur.execute(sql)
        self.conn.commit()

    def close(self):
        self.conn.close()

    def cleanup(self, reg: Registry) -> None:
        """Hard-delete all rows tagged by the registry + restore counters.

        Each statement commits on its own so a failed statement cannot
        cascade into 'current transaction is aborted' for the rest.
        """
        pid = reg.ids("product")
        cat = reg.ids("category")
        sub = reg.ids("subcategory")
        cust = reg.ids("customer")
        supp = reg.ids("supplier")
        sale = reg.ids("sale")
        po = reg.ids("purchase_order")
        shift = reg.ids("shift")
        safe = reg.ids("safe")
        wallet = reg.ids("wallet")
        emp = reg.ids("employee")
        dtx = reg.ids("drawer_tx")
        exp = reg.ids("expense")
        fcat = reg.ids("financial_category")
        usr = reg.ids("user")
        wh = reg.ids("warehouse")
        op = reg.ids("operation")
        coll = reg.ids("collection")
        pay = reg.ids("payment")
        all_ = reg.ids("sale", "product", "category", "subcategory", "customer",
                      "supplier", "purchase_order", "shift", "safe", "wallet",
                      "employee", "drawer_tx", "expense", "financial_category",
                      "user", "warehouse", "operation", "collection", "payment",
                      "supplier_price", "expense_vendor", "employee_shift", "advance")

        steps = [
            f"DELETE FROM drawer_transactions WHERE ref_id IN ({q(all_)}) OR shift_id IN ({q(shift)}) OR category_id IN ({q(fcat)}) OR wallet_id IN ({q(wallet)}) OR id IN ({q(dtx)})",
            f"DELETE FROM stock_movements WHERE product_id IN ({q(pid)}) OR warehouse_id IN ({q(wh)}) OR ref_id IN ({q(all_)}) OR sale_id IN ({q(sale)}) OR purchase_id IN ({q(po)})",

            f"DELETE FROM sale_items WHERE sale_id IN ({q(sale)}) OR product_id IN ({q(pid)})",
            f"DELETE FROM sale_payments WHERE sale_id IN ({q(sale)}) OR wallet_id IN ({q(wallet)})",
            f"DELETE FROM sales WHERE id IN ({q(sale)}) OR customer_id IN ({q(cust)}) OR warehouse_id IN ({q(wh)})",
            f"DELETE FROM customer_payments WHERE customer_id IN ({q(cust)}) OR sale_id IN ({q(sale)}) OR id IN ({q(pay)})",
            f"DELETE FROM purchase_order_items WHERE po_id IN ({q(po)}) OR product_id IN ({q(pid)})",
            f"DELETE FROM purchase_orders WHERE id IN ({q(po)}) OR supplier_id IN ({q(supp)}) OR warehouse_id IN ({q(wh)})",
            f"DELETE FROM purchase_price_history WHERE product_id IN ({q(pid)}) OR po_id IN ({q(po)}) OR supplier_id IN ({q(supp)})",
            f"DELETE FROM supplier_prices WHERE supplier_id IN ({q(supp)}) OR product_id IN ({q(pid)}) OR id IN ({q(reg.ids('supplier_price'))})",
            f"DELETE FROM supplier_transactions WHERE supplier_id IN ({q(supp)})",
            f"DELETE FROM product_barcodes WHERE product_id IN ({q(pid)})",
            f"DELETE FROM product_images WHERE product_id IN ({q(pid)})",
            f"DELETE FROM products WHERE id IN ({q(pid)}) OR subcategory_id IN ({q(sub)})",
            f"DELETE FROM subcategories WHERE id IN ({q(sub)}) OR category_id IN ({q(cat)})",
            f"DELETE FROM categories WHERE id IN ({q(cat)})",
            f"DELETE FROM customers WHERE id IN ({q(cust)})",
            f"DELETE FROM suppliers WHERE id IN ({q(supp)})",
            f"DELETE FROM hr_payroll_periods WHERE month IN (SELECT DISTINCT substring(e.notes from 18) FROM expenses e WHERE e.notes LIKE 'HR payroll month %')",
            f"DELETE FROM expenses WHERE id IN ({q(exp)}) OR vendor_id IN ({q(reg.ids('expense_vendor'))}) OR category_id IN ({q(fcat)}) OR wallet_id IN ({q(wallet)}) OR safe_id IN ({q(safe)})",
            f"DELETE FROM expense_vendors WHERE id IN ({q(reg.ids('expense_vendor'))})",
            f"DELETE FROM financial_categories WHERE id IN ({q(fcat)})",
            f"DELETE FROM archived_documents WHERE ref_id IN ({q(all_)})",
            f"DELETE FROM audit_log WHERE entity_id IN ({q(all_)}) OR id IN ({q(reg.ids('audit'))})",
            f"DELETE FROM hr_attendance WHERE employee_id IN ({q(emp)})",
            f"DELETE FROM hr_advances WHERE employee_id IN ({q(emp)}) OR created_by IN ({q(usr)})",
            f"DELETE FROM hr_payroll_entries WHERE employee_id IN ({q(emp)}) OR period_id IN ({q(reg.ids('hr_period'))}) OR period_id IN (SELECT id FROM hr_payroll_periods WHERE month > to_char(now(), 'YYYY-MM'))",
            f"DELETE FROM hr_payroll WHERE employee_id IN ({q(emp)}) OR created_by IN ({q(usr)})",
            f"DELETE FROM hr_payroll WHERE id IN ({q(reg.ids('payroll'))})",
            f"DELETE FROM hr_employees WHERE id IN ({q(emp)}) OR shift_id IN ({qt(reg.ids('employee_shift'))})",
            f"DELETE FROM hr_shifts WHERE CAST(id AS text) IN ({qt(reg.ids('employee_shift'))})",
            f"DELETE FROM hr_payroll_periods WHERE id IN ({q(reg.ids('hr_period'))}) OR month > to_char(now(), 'YYYY-MM')",
            f"DELETE FROM hr_audit_log WHERE CAST(entity_id AS text) IN ({qt(all_)}) OR performed_by IN ({q(usr)})",
            f"DELETE FROM safe_transactions WHERE safe_id IN ({q(safe)})",
            f"DELETE FROM safe_deposits WHERE safe_id IN ({q(safe)}) OR shift_id IN ({q(shift)}) OR warehouse_id IN ({q(wh)})",
            f"DELETE FROM shifts WHERE id IN ({q(shift)}) OR warehouse_id IN ({q(wh)})",
            f"DELETE FROM safes WHERE id IN ({q(safe)})",
            f"DELETE FROM payment_wallets WHERE id IN ({q(wallet)})",
            f"DELETE FROM wallet_transactions WHERE wallet_id IN ({q(wallet)}) OR ref_id IN ({q(all_)})",
            f"DELETE FROM user_warehouses WHERE user_id IN ({q(usr)}) OR warehouse_id IN ({q(wh)})",
            f"DELETE FROM device_tokens WHERE user_id IN ({q(usr)})",
            f"DELETE FROM users WHERE id IN ({q(usr)})",
        ]
        with self.conn.cursor() as cur:
            for i, sql in enumerate(steps):
                try:
                    cur.execute(sql)
                    self.conn.commit()
                except Exception as e:  # keep going; one bad statement must not abort cleanup
                    print(f"[cleanup] step {i} failed: {e}")
                    self.conn.rollback()
            for table, id_, column, orig in reg.snapshots:
                try:
                    cur.execute(
                        f"UPDATE {table} SET {column} = %s WHERE id = %s", (orig, id_)
                    )
                    self.conn.commit()
                except Exception as e:
                    print(f"[cleanup] snapshot restore failed: {e}")
                    self.conn.rollback()
        self.conn.commit()

    def barcode_is_present(self, barcode: str) -> bool:
        row = self.one(
            "SELECT COUNT(*) FROM product_barcodes WHERE barcode = %s", (barcode,)
        )
        return bool(row) and row[0] > 0


# convenience: fresh admin Api
api = Api()