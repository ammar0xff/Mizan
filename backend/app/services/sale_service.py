import uuid
from datetime import UTC
from decimal import Decimal

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BusinessError
from app.models.sale import Sale, SaleItem, SaleStatus
from app.models.shift import DrawerTransaction, DrawerTxType, Shift
from app.models.stock import MovementType, StockMovement
from app.schemas.stock import StockMovementCreate
from app.services.stock_service import _update_stock_balance, get_balance, record_movement


async def _invoice_number(db) -> str:
    from sqlalchemy import text
    seq = (await db.execute(text("SELECT nextval('invoice_seq')"))).scalar()
    return f"INV-{seq:06d}"

async def _quotation_number(db) -> str:
    from sqlalchemy import text
    seq = (await db.execute(text("SELECT nextval('quotation_seq')"))).scalar()
    return f"QUO-{seq:06d}"



async def _is_untracked(db, product_id, warehouse_id=None) -> bool:
    from sqlalchemy import text as sqlt
    if warehouse_id:
        wh_row = await db.execute(sqlt(
            "SELECT status FROM warehouse_product_status WHERE product_id=:pid AND warehouse_id=:wid"
        ), {"pid": product_id, "wid": warehouse_id})
        wh_status = wh_row.scalar()
        if wh_status is not None:
            return wh_status != 'tracked'
        return True
    row = await db.execute(sqlt("SELECT stock_status FROM products WHERE id=:id"), {"id": product_id})
    return row.scalar() != 'tracked'

async def create_quotation(db: AsyncSession, data, cashier_id: uuid.UUID) -> Sale:
    """Create a quotation (عرض سعر) — no stock deduction, status=quotation."""
    gross_total = sum(Decimal(str(i.qty)) * Decimal(str(i.unit_price)) for i in data.items)
    total_discount = sum(Decimal(str(i.discount)) for i in data.items)
    net_total = gross_total - total_discount - Decimal(str(data.discount_amount))

    sale = Sale(
        invoice_number=await _quotation_number(db),
        customer_id=data.customer_id,
        warehouse_id=data.warehouse_id,
        cashier_id=cashier_id,
        shift_id=data.shift_id,
        sale_mode=data.sale_mode,
        discount_amount=data.discount_amount,
        total=Decimal(str(gross_total)),
        net_total=Decimal(str(net_total)),
        notes=data.notes,
        status=SaleStatus.quotation,
        created_by=cashier_id,
    )
    db.add(sale)
    await db.flush()
    for item in data.items:
        db.add(SaleItem(sale_id=sale.id, product_id=item.product_id, qty=item.qty,
                        unit_price=item.unit_price, unit_cost=item.unit_cost, discount=item.discount))
    # Auto-archive within same transaction
    from app.models.archive import ArchivedDocument, DocType
    db.add(ArchivedDocument(doc_number=sale.invoice_number, doc_type=DocType.quotation,
                            ref_id=sale.id, created_by=cashier_id,
                            metadata_={"items_count": len(data.items), "mode": data.sale_mode}))
    await db.commit()
    result = await db.execute(select(Sale).options(selectinload(Sale.items)).where(Sale.id == sale.id))
    return result.scalar_one()


async def confirm_quotation(db: AsyncSession, sale_id: uuid.UUID, user_id: uuid.UUID,
                            destination: str = "drawer", safe_id: uuid.UUID | None = None) -> Sale:
    """Convert a quotation to a confirmed sale — deducts stock and records the cash destination (drawer/safe)."""
    result = await db.execute(select(Sale).options(selectinload(Sale.items)).where(Sale.id == sale_id).with_for_update())
    sale = result.scalar_one_or_none()
    if not sale:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Quotation not found")
    if sale.status != SaleStatus.quotation:
        raise BusinessError("Only quotations can be confirmed this way")

    sorted_items = sorted(sale.items, key=lambda i: str(i.product_id))
    for item in sorted_items:
        if not await _is_untracked(db, item.product_id, sale.warehouse_id):
            balance = await get_balance(db, item.product_id, sale.warehouse_id, for_update=True)
            if balance < item.qty:
                from sqlalchemy import text as sqlt
                prod = await db.execute(sqlt("SELECT name FROM products WHERE id=:id"), {"id": item.product_id})
                prod_name = prod.scalar() or str(item.product_id)
                raise BusinessError(f"المخزون غير كافي لـ {prod_name}")

    movements = [
        StockMovement(
            product_id=item.product_id, warehouse_id=sale.warehouse_id,
            movement_type=MovementType.sale, qty=item.qty,
            unit_cost=item.unit_cost, unit_price=item.unit_price,
            created_by=user_id, ref_id=sale.id, ref_type="sale", sale_id=sale.id,
        )
        for item in sorted_items
    ]
    db.add_all(movements)

    # Update maintained stock balances for each movement
    for mv in movements:
        await _update_stock_balance(db, mv.product_id, mv.warehouse_id, -mv.qty)

    sale.status = SaleStatus.confirmed
    sale.invoice_number = await _invoice_number(db)
    from app.models.archive import ArchivedDocument, DocType
    doc = ArchivedDocument(
        doc_type=DocType.sale_invoice,
        doc_number=sale.invoice_number,
        amount=sale.net_total,
        ref_id=sale.id,
        created_by=user_id,
    )
    db.add(doc)

    # ── Cash destination: drawer (user's open shift) or safe ─────────────
    if sale.net_total and not sale.is_credit:
        from app.models.shift import ShiftStatus
        if destination == "safe":
            if not safe_id:
                raise BusinessError("يجب اختيار خزنة لإيداع المقبوضات")
            safe = (await db.execute(
                text("SELECT * FROM safes WHERE id=:id AND is_active=true FOR UPDATE"), {"id": safe_id}
            )).one_or_none()
            if not safe:
                raise BusinessError("الخزنة غير موجودة")
            seq = (await db.execute(text("SELECT nextval('invoice_seq')"))).scalar()
            dep_doc = f"DEP-{seq:06d}"
            await db.execute(text("""
                INSERT INTO safe_deposits
                    (safe_id, shift_id, warehouse_id, amount, deposited_by, deposited_by_name, notes, doc_number)
                VALUES (:sid, :shift, :wh, :amt, :uid, :uname, :note, :doc)
            """), {
                "sid": safe_id, "shift": sale.shift_id, "wh": sale.warehouse_id,
                "amt": float(sale.net_total), "uid": user_id,
                "uname": (await db.execute(text("SELECT full_name FROM users WHERE id=:id"), {"id": user_id})).scalar() or "",
                "note": f"تأكيد عرض سعر {sale.invoice_number}",
                "doc": dep_doc,
            })
            await db.execute(text(
                "UPDATE safes SET balance = balance + :amt WHERE id = :id"
            ), {"amt": float(sale.net_total), "id": safe_id})
            new_safe_balance = (await db.execute(text("SELECT balance FROM safes WHERE id=:id"), {"id": safe_id})).scalar()
            await db.execute(text("""
                INSERT INTO safe_transactions (safe_id, tx_type, amount, balance_after, note, created_by)
                VALUES (:sid, 'deposit', :amt, :bal, :note, :uid)
            """), {"sid": safe_id, "amt": float(sale.net_total), "bal": new_safe_balance,
                    "note": f"تأكيد عرض سعر {sale.invoice_number}", "uid": user_id})
            db.add(ArchivedDocument(
                doc_type=DocType.safe_deposit,
                doc_number=dep_doc, amount=sale.net_total, ref_id=sale.id, created_by=user_id))
        else:
            # drawer → user's own open shift in this warehouse
            shift = (await db.execute(
                select(Shift).where(
                    Shift.warehouse_id == sale.warehouse_id,
                    Shift.cashier_id == user_id,
                    Shift.status == ShiftStatus.open,
                ).order_by(Shift.started_at.desc()).limit(1)
            )).scalar_one_or_none()
            if not shift:
                raise BusinessError("لا توجد وردية مفتوحة لك في هذا الفرع")
            db.add(DrawerTransaction(
                shift_id=shift.id, type=DrawerTxType.sale,
                amount=sale.net_total, ref_id=sale.id, created_by=user_id,
                note=f"تأكيد عرض سعر {sale.invoice_number}",
            ))
        sale.paid_amount = sale.net_total

    await db.commit()
    await db.refresh(sale)
    return sale


async def create_draft_sale(db: AsyncSession, data, cashier_id: uuid.UUID) -> Sale:
    """Create a draft sale — no stock deduction, status=draft, no archive."""
    if data.shift_id:
        shift = await db.get(Shift, data.shift_id)
        if not shift or shift.cashier_id != cashier_id:
            raise BusinessError("هذه الوردية لا تخصك")
    gross_total = sum(Decimal(str(i.qty)) * Decimal(str(i.unit_price)) for i in data.items)
    total_discount = sum(Decimal(str(i.discount)) for i in data.items)
    net_total = gross_total - total_discount - Decimal(str(data.discount_amount))

    sale = Sale(
        invoice_number=await _invoice_number(db),
        customer_id=data.customer_id,
        warehouse_id=data.warehouse_id,
        cashier_id=cashier_id,
        shift_id=data.shift_id,
        sale_mode=data.sale_mode,
        discount_amount=data.discount_amount,
        total=Decimal(str(gross_total)),
        net_total=Decimal(str(net_total)),
        paid_amount=Decimal("0"),
        notes=data.notes,
        is_credit=data.is_credit,
        payment_method=data.payment_method,
        status=SaleStatus.draft,
        created_by=cashier_id,
    )
    db.add(sale)
    await db.flush()
    for item in data.items:
        db.add(SaleItem(sale_id=sale.id, product_id=item.product_id, qty=item.qty,
                        unit_price=item.unit_price, unit_cost=item.unit_cost,
                        discount=item.discount))
    await db.commit()
    result = await db.execute(select(Sale).options(selectinload(Sale.items)).where(Sale.id == sale.id))
    return result.scalar_one()


async def confirm_draft_sale(db: AsyncSession, sale_id: uuid.UUID, user_id: uuid.UUID) -> Sale:
    """Convert a draft sale to confirmed — assigns real invoice number, deducts stock."""
    from app.core.exceptions import NotFoundError
    from app.models.archive import ArchivedDocument, DocType
    result = await db.execute(select(Sale).options(selectinload(Sale.items)).where(Sale.id == sale_id).with_for_update())
    sale = result.scalar_one_or_none()
    if not sale:
        raise NotFoundError("Draft sale not found")
    if sale.status != SaleStatus.draft:
        raise BusinessError("Only draft sales can be confirmed")

    sorted_items = sorted(sale.items, key=lambda i: str(i.product_id))
    for item in sorted_items:
        if not await _is_untracked(db, item.product_id, sale.warehouse_id):
            balance = await get_balance(db, item.product_id, sale.warehouse_id, for_update=True)
            if balance < item.qty:
                from sqlalchemy import text as sqlt
                prod = await db.execute(sqlt("SELECT name FROM products WHERE id=:id"), {"id": item.product_id})
                prod_name = prod.scalar() or str(item.product_id)
                raise BusinessError(f"المخزون غير كافي لـ {prod_name}")

    movements = [
        StockMovement(
            product_id=item.product_id, warehouse_id=sale.warehouse_id,
            movement_type=MovementType.sale, qty=item.qty,
            unit_cost=item.unit_cost, unit_price=item.unit_price,
            created_by=user_id, ref_id=sale.id, ref_type="sale", sale_id=sale.id,
        )
        for item in sorted_items
    ]
    db.add_all(movements)

    # Update maintained stock balances for each movement
    for mv in movements:
        await _update_stock_balance(db, mv.product_id, mv.warehouse_id, -mv.qty)

    new_inv = await _invoice_number(db)
    sale.status = SaleStatus.confirmed
    sale.invoice_number = new_inv
    db.add(ArchivedDocument(doc_number=new_inv, doc_type=DocType.sale_invoice,
                            ref_id=sale.id, created_by=user_id,
                            metadata_={"items_count": len(sale.items)}))
    await db.commit()
    await db.refresh(sale)
    return sale


async def create_sale(db: AsyncSession, data, cashier_id: uuid.UUID) -> Sale:
    from sqlalchemy import text as sqlt

    # Idempotency: if local_id provided (offline sync), check for duplicate
    local_id = getattr(data, 'local_id', None)
    notes_value = f"[local_id:{local_id}] {data.notes or ''}" if local_id else (data.notes or None)
    if local_id:
        existing = (await db.execute(sqlt(
            "SELECT id FROM sales WHERE notes = :notes AND cashier_id = :cid AND created_at > NOW() - INTERVAL '1 hour'"
        ), {"notes": notes_value, "cid": cashier_id})).scalar_one_or_none()
        if existing:
            return (await db.execute(
                select(Sale).options(selectinload(Sale.items)).where(Sale.id == existing)
            )).scalar_one()

    # Sort items by product_id to prevent deadlocks (consistent lock ordering)
    sorted_items = sorted(data.items, key=lambda i: str(i.product_id))

    # Verify shift ownership
    if data.shift_id:
        shift = await db.get(Shift, data.shift_id)
        if not shift or shift.cashier_id != cashier_id:
            raise BusinessError("هذه الوردية لا تخصك")
    allow_neg = bool(getattr(data, "allow_negative_stock", False) or getattr(data, "is_offline_sync", False) or getattr(data, "local_id", None))
    for item in sorted_items:
        if not await _is_untracked(db, item.product_id, data.warehouse_id):
            balance = await get_balance(db, item.product_id, data.warehouse_id, for_update=True)
            if balance < item.qty:
                from sqlalchemy import text as sqlt
                prod = await db.execute(sqlt("SELECT name FROM products WHERE id=:id"), {"id": item.product_id})
                prod_name = prod.scalar() or str(item.product_id)
                if not allow_neg:
                    raise BusinessError(f"المخزون غير كافي لـ {prod_name}")
                from app.models.audit_log import AuditLog
                db.add(AuditLog(
                    user_id=cashier_id,
                    action="inventory_discrepancy",
                    entity_type="product",
                    entity_id=item.product_id,
                    details={
                        "note": f"عجز مخزون ناتج عن مزامنة غير متصلة لـ {prod_name}",
                        "product_name": prod_name,
                        "warehouse_id": str(data.warehouse_id),
                        "balance_before": float(balance),
                        "sold_qty": float(item.qty),
                        "deficit": float(item.qty - balance),
                    },
                ))

    if data.is_credit and data.customer_id:
        from sqlalchemy import text as sqlt
        c = await db.execute(sqlt("SELECT credit_limit, balance FROM customers WHERE id=:id FOR UPDATE"), {"id": data.customer_id})
        c = c.one_or_none()
        if c and c.credit_limit is not None:
            total = sum(Decimal(str(i.qty)) * Decimal(str(i.unit_price)) - Decimal(str(i.discount)) for i in data.items)
            total -= Decimal(str(data.discount_amount))
            new_balance = Decimal(str(c.balance or 0)) + total
            if new_balance > Decimal(str(c.credit_limit)):
                remaining = Decimal(str(c.credit_limit)) - Decimal(str(c.balance or 0))
                raise BusinessError(f"تجاوز حد الائتمان (الحد: {c.credit_limit:.2f}, المتبقي: {remaining:.2f})")

    sale = Sale(
        invoice_number=await _invoice_number(db),
        customer_id=data.customer_id,
        warehouse_id=data.warehouse_id,
        cashier_id=cashier_id,
        shift_id=data.shift_id,
        sale_mode=data.sale_mode,
        discount_amount=data.discount_amount,
        is_credit=data.is_credit,
        payment_method=getattr(data, 'payment_method', 'cash') or 'cash',
        wallet_id=getattr(data, 'wallet_id', None),
        notes=notes_value,
        status=SaleStatus.confirmed,
        created_by=cashier_id,
    )
    db.add(sale)
    await db.flush()

    gross_total = Decimal("0")
    total_discount = Decimal("0")
    sale_items: list[SaleItem] = []
    stock_movements: list = []
    for item in sorted_items:
        si = SaleItem(
            sale_id=sale.id,
            product_id=item.product_id,
            qty=item.qty,
            unit_price=item.unit_price,
            unit_cost=item.unit_cost,
            discount=item.discount,
        )
        sale_items.append(si)
        gross_total += Decimal(str(item.qty)) * Decimal(str(item.unit_price))
        total_discount += Decimal(str(item.discount))

        mv = StockMovement(
            product_id=item.product_id,
            warehouse_id=data.warehouse_id,
            movement_type=MovementType.sale,
            qty=item.qty,
            unit_cost=item.unit_cost,
            unit_price=item.unit_price,
            created_by=cashier_id,
            ref_id=sale.id,
            ref_type="sale",
            sale_id=sale.id,
        )
        stock_movements.append(mv)

    db.add_all(sale_items)
    db.add_all(stock_movements)

    # Update maintained stock balances for each movement
    for mv in stock_movements:
        await _update_stock_balance(db, mv.product_id, mv.warehouse_id, -mv.qty)

    net_total = gross_total - total_discount - Decimal(str(data.discount_amount))
    sale.total = Decimal(str(gross_total))
    sale.net_total = Decimal(str(net_total))
    # ── Split Payments ──────────────────────────────────────────────────
    from sqlalchemy import text as sqlt
    payments = getattr(data, 'payments', None)
    if payments:
        pmt_sum = sum(Decimal(str(p.amount)) for p in payments)
        if pmt_sum != net_total:
            raise BusinessError(f"مجموع المدفوعات ({pmt_sum}) لا يساوي إجمالي الفاتورة ({net_total})")
        is_credit = any(p.method == 'credit' for p in payments)
        sale.is_credit = is_credit
        sale.payment_method = payments[0].method
        paid_cash_wallet = Decimal("0")
        for p in payments:
            await db.execute(sqlt(
                "INSERT INTO sale_payments (sale_id, method, amount, wallet_id) VALUES (:sid, :m, :amt, :wid)"
            ), {"sid": sale.id, "m": p.method, "amt": p.amount, "wid": p.wallet_id})
            if p.method in ('cash', 'bank', 'cheque'):
                paid_cash_wallet += Decimal(str(p.amount))
                if p.method == 'cash' and data.shift_id:
                    db.add(DrawerTransaction(
                        shift_id=data.shift_id, type=DrawerTxType.sale,
                        amount=Decimal(str(p.amount)), ref_id=sale.id, created_by=cashier_id,
                        note=f"قسط نقدي - {sale.invoice_number}",
                    ))
            elif p.method == 'wallet' and p.wallet_id:
                paid_cash_wallet += Decimal(str(p.amount))
                from app.services.wallet_service import record_wallet_tx
                await record_wallet_tx(db, p.wallet_id, Decimal(str(p.amount)), "sale", sale.id,
                                       f"قسط محفظة - {sale.invoice_number}", cashier_id)
            elif p.method == 'credit' and data.customer_id:
                await db.execute(sqlt(
                    "UPDATE customers SET balance = COALESCE(balance,0) + :amt WHERE id = :cid"
                ), {"amt": Decimal(str(p.amount)), "cid": data.customer_id})
        sale.paid_amount = paid_cash_wallet
    else:
        paid = getattr(data, 'paid_amount', None)
        if paid is not None:
            sale.paid_amount = Decimal(str(paid))
        elif data.is_credit:
            sale.paid_amount = Decimal("0")
        else:
            sale.paid_amount = Decimal(str(net_total))
        # Legacy single payment — record drawer only for cash
        if data.shift_id and not data.is_credit and not getattr(data, 'wallet_id', None):
            db.add(DrawerTransaction(
                shift_id=data.shift_id, type=DrawerTxType.sale,
                amount=net_total, ref_id=sale.id, created_by=cashier_id,
            ))
        if data.is_credit and data.customer_id:
            await db.execute(sqlt(
                "UPDATE customers SET balance = COALESCE(balance,0) + :amt WHERE id = :cid"
            ), {"amt": net_total, "cid": data.customer_id})
        if getattr(data, 'wallet_id', None) and not data.is_credit:
            from app.services.wallet_service import record_wallet_tx
            await record_wallet_tx(db, data.wallet_id, net_total, "sale", sale.id,
                                   f"بيع {sale.invoice_number}", cashier_id)

    # Auto-archive within the same transaction
    from app.models.archive import ArchivedDocument, DocType
    db.add(ArchivedDocument(doc_number=sale.invoice_number, doc_type=DocType.sale_invoice,
                            amount=Decimal(str(net_total)), ref_id=sale.id, created_by=cashier_id,
                            metadata_={"items_count": len(data.items), "mode": str(data.sale_mode)}))

    await db.commit()
    result = await db.execute(select(Sale).options(selectinload(Sale.items)).where(Sale.id == sale.id))
    return result.scalar_one()


async def return_sale(db: AsyncSession, sale_id: uuid.UUID, user_id: uuid.UUID) -> dict:
    """Full return: restore stock + record drawer return transaction."""
    from sqlalchemy import text as sqlt
    result = await db.execute(select(Sale).options(selectinload(Sale.items)).where(Sale.id == sale_id).with_for_update())
    sale = result.scalar_one_or_none()
    if not sale:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Sale not found")
    if sale.status != SaleStatus.confirmed:
        raise BusinessError("Only confirmed sales can be returned")

    # Guard: reject full return if any items were already partially returned
    if sale.returns_total and Decimal(str(sale.returns_total)) > 0:
        raise BusinessError("تم إرجاع أجزاء من هذه الفاتورة مسبقاً — استخدم إرجاع جزئي للمتبقي")

    total = Decimal("0")
    for item in sale.items:
        mv = StockMovementCreate(
            product_id=item.product_id,
            warehouse_id=sale.warehouse_id,
            movement_type=MovementType.return_in,
            qty=item.qty,
            unit_cost=item.unit_cost,
            unit_price=item.unit_price,
        )
        await record_movement(db, mv, user_id, ref_id=sale.id, ref_type="return", sale_id=sale.id)
        total += Decimal(str(item.qty)) * Decimal(str(item.unit_price)) - Decimal(str(item.discount))

    total -= Decimal(str(sale.discount_amount))
    sale.status = SaleStatus.returned

    # Only record cash portion in drawer — other methods reversed separately
    pmt = await db.execute(sqlt(
        "SELECT method, COALESCE(SUM(amount),0) as amt FROM sale_payments WHERE sale_id = :sid GROUP BY method"
    ), {"sid": sale_id})
    pmt_map = {r.method: Decimal(str(r.amt)) for r in pmt.fetchall()}
    cash_part = pmt_map.get("cash", Decimal("0"))
    credit_part = pmt_map.get("credit", Decimal("0"))
    wallet_part = pmt_map.get("wallet", Decimal("0"))

    # Cap each method's reversal so total doesn't exceed return value
    remaining = total
    actual_cash = min(cash_part, remaining)
    remaining -= actual_cash
    actual_wallet = min(wallet_part, remaining)
    remaining -= actual_wallet
    actual_credit = min(credit_part, remaining)

    if sale.shift_id and actual_cash > 0:
        db.add(DrawerTransaction(
            shift_id=sale.shift_id,
            type=DrawerTxType.return_,
            amount=Decimal(str(actual_cash)),
            ref_id=sale.id,
            created_by=user_id,
        ))

    # Reverse wallet balance
    if actual_wallet > 0:
        from app.services.wallet_service import record_wallet_tx
        wallet_row = await db.execute(sqlt(
            "SELECT wallet_id FROM sale_payments WHERE sale_id=:sid AND method='wallet' LIMIT 1"
        ), {"sid": sale.id})
        wallet_id = wallet_row.scalar()
        if wallet_id:
            await record_wallet_tx(db, wallet_id, -Decimal(str(actual_wallet)), "return",
                                   sale.id, f"مرتجع {sale.invoice_number}", user_id)

    # Track returns_total on the original sale
    await db.execute(sqlt(
        "UPDATE sales SET returns_total = COALESCE(returns_total,0) + :amt WHERE id = :sid"
    ), {"amt": total, "sid": sale_id})

    # Reverse customer credit balance
    if actual_credit > 0 and sale.customer_id:
        await db.execute(sqlt(
            "UPDATE customers SET balance = GREATEST(COALESCE(balance,0) - :amt, 0) WHERE id = :cid"
        ), {"amt": Decimal(str(actual_credit)), "cid": sale.customer_id})

    await db.commit()
    return {"detail": "Returned", "invoice_number": sale.invoice_number, "amount": total}


async def cancel_sale(db: AsyncSession, sale_id: uuid.UUID, user_id: uuid.UUID) -> Sale:
    from sqlalchemy import text as sqlt


    result = await db.execute(select(Sale).where(Sale.id == sale_id).with_for_update())
    sale = result.scalar_one_or_none()
    if not sale:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Sale not found")
    if sale.status != SaleStatus.confirmed:
        raise BusinessError("Only confirmed sales can be cancelled")
    if sale.returns_total and Decimal(str(sale.returns_total)) > 0:
        raise BusinessError("تم إرجاع أجزاء من هذه الفاتورة مسبقاً — لا يمكن إلغاء الفاتورة")

    sale.status = SaleStatus.cancelled

    # Reverse customer balance for credit sales
    if sale.is_credit and sale.customer_id:
        await db.execute(sqlt(
            "UPDATE customers SET balance = GREATEST(COALESCE(balance,0) - :amt, 0) WHERE id = :cid"
        ), {"amt": sale.net_total, "cid": sale.customer_id})

    # Restore stock for all sale items
    items = (await db.execute(
        select(SaleItem).where(SaleItem.sale_id == sale_id)
    )).scalars().all()
    for item in items:
        await db.execute(sqlt("""
            INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, qty, unit_cost, unit_price, ref_id, ref_type, sale_id, created_by)
            VALUES (gen_random_uuid(), :pid, :wid, 'return_in', :qty, :cost, :price, :sid, 'sale_cancel', :sid, :uid)
        """), {"pid": item.product_id, "wid": sale.warehouse_id, "qty": item.qty,
               "cost": item.unit_cost, "price": item.unit_price, "sid": str(sale_id), "uid": str(user_id)})
        # Update maintained stock balance (return_in increases stock)
        await _update_stock_balance(db, item.product_id, sale.warehouse_id, item.qty)

    # Restore wallet balances for wallet-based drawer transactions before deleting them
    wallet_txns = (await db.execute(
        sqlt("SELECT wallet_id, amount FROM drawer_transactions WHERE ref_id = :sid AND wallet_id IS NOT NULL"),
        {"sid": str(sale_id)}
    )).fetchall()
    for wtx in wallet_txns:
        from app.services.wallet_service import record_wallet_tx
        await record_wallet_tx(db, wtx.wallet_id, -Decimal(str(wtx.amount)), "drawer_txn_reversed",
                               sale.id, f"إلغاء فاتورة {sale.invoice_number}", user_id)

    # Delete all drawer transactions for this sale (reverses cash effects on shifts)
    await db.execute(
        sqlt("DELETE FROM drawer_transactions WHERE ref_id = :sid"),
        {"sid": str(sale_id)}
    )

    # Delete all customer payment records for this sale
    await db.execute(
        sqlt("DELETE FROM customer_payments WHERE sale_id = :sid"),
        {"sid": str(sale_id)}
    )

    # Delete split payment records for this sale
    await db.execute(
        sqlt("DELETE FROM sale_payments WHERE sale_id = :sid"),
        {"sid": str(sale_id)}
    )

    await db.commit()
    await db.refresh(sale)
    return sale


async def partial_return_sale(db: AsyncSession, sale_id: uuid.UUID, data: dict, current_user_id: uuid.UUID) -> dict:
    from datetime import datetime

    from sqlalchemy import text as sqlt
    from sqlalchemy.orm import selectinload as sil

    from app.models.archive import ArchivedDocument, DocType
    from app.models.shift import DrawerTransaction, DrawerTxType
    from app.models.stock import MovementType
    from app.schemas.stock import StockMovementCreate
    from app.services.stock_service import record_movement

    orig = (await db.execute(select(Sale).options(sil(Sale.items)).where(Sale.id == sale_id).with_for_update())).scalar_one_or_none()
    if not orig:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Sale not found")

    return_map = {str(i["product_id"]): Decimal(str(i["qty"])) for i in data.get("items", [])}
    if not return_map:
        raise BusinessError("No items")

    # Validate returnable quantities: compute already-returned qty per product from prior returns
    already_returned: dict[str, Decimal] = {}
    safe_inv = orig.invoice_number.replace("[", "[[]").replace("%", "[%]").replace("_", "[_]")
    prior_returns = (await db.execute(sqlt(
        "SELECT si.product_id, SUM(si.qty) as ret_qty "
        "FROM sale_items si JOIN sales s ON s.id = si.sale_id "
        "WHERE s.status = 'returned' AND s.notes LIKE :pattern "
        "GROUP BY si.product_id"
    ), {"pattern": f"%مرتجع جزئي من {safe_inv}%"})).fetchall()
    for pr in prior_returns:
        already_returned[str(pr.product_id)] = Decimal(str(pr.ret_qty))

    ret = Sale(invoice_number="RET-" + datetime.now(UTC).strftime('%m%d%H%M%S'),
               customer_id=orig.customer_id, warehouse_id=orig.warehouse_id,
               cashier_id=current_user_id, shift_id=data.get("shift_id") or orig.shift_id,
               sale_mode=orig.sale_mode, status=SaleStatus.returned,
               notes=f"مرتجع جزئي من {orig.invoice_number}")
    db.add(ret)
    await db.flush()

    total = Decimal("0")
    for oi in orig.items:
        pid = str(oi.product_id)
        if pid not in return_map:
            continue
        qty = return_map[pid]
        # Block returning more than remaining returnable qty
        already = already_returned.get(pid, Decimal("0"))
        remaining = Decimal(str(oi.qty)) - already
        if qty > remaining:
            raise BusinessError(f"الكمية المرتجعة ({qty}) تتجاوز المتبقي القابل للإرجاع ({remaining}) للمنتج {oi.product_id}")
        # Pro-rate the per-item discount proportionally to the returned qty
        prorated_discount = (oi.discount * qty / oi.qty) if oi.qty else Decimal("0")
        db.add(SaleItem(sale_id=ret.id, product_id=oi.product_id, qty=qty,
                        unit_price=oi.unit_price, unit_cost=oi.unit_cost, discount=prorated_discount))
        total += qty * oi.unit_price - prorated_discount
        await record_movement(db, StockMovementCreate(product_id=oi.product_id, warehouse_id=orig.warehouse_id,
            movement_type=MovementType.return_in, qty=qty, unit_cost=oi.unit_cost, unit_price=oi.unit_price),
            current_user_id, ref_id=ret.id, ref_type="partial_return", sale_id=ret.id)

    from sqlalchemy import text as sqlt
    pmt = await db.execute(sqlt(
        "SELECT method, COALESCE(SUM(amount),0) as amt FROM sale_payments WHERE sale_id = :sid GROUP BY method"
    ), {"sid": sale_id})
    pmt_map = {r.method: Decimal(str(r.amt)) for r in pmt.fetchall()}
    cash_part = pmt_map.get("cash", Decimal("0"))
    credit_part = pmt_map.get("credit", Decimal("0"))
    wallet_part = pmt_map.get("wallet", Decimal("0"))
    ratio = total / orig.total if orig.total > 0 else Decimal("0")
    if ratio == 0:
        raise BusinessError("Original total is zero — cannot prorate return")

    drawer_amt = (cash_part * ratio).quantize(Decimal("0.01"))
    if ret.shift_id and drawer_amt > 0:
        db.add(DrawerTransaction(shift_id=ret.shift_id, type=DrawerTxType.return_,
                                  amount=drawer_amt, ref_id=ret.id, created_by=current_user_id))
    if wallet_part > 0:
        w_amt = (wallet_part * ratio).quantize(Decimal("0.01"))
        if w_amt > 0:
            from app.services.wallet_service import record_wallet_tx
            wallet_row = await db.execute(sqlt(
                "SELECT wallet_id FROM sale_payments WHERE sale_id=:sid AND method='wallet' LIMIT 1"
            ), {"sid": sale_id})
            wallet_id = wallet_row.scalar()
            if wallet_id:
                await record_wallet_tx(db, wallet_id, -Decimal(str(w_amt)), "return",
                                       ret.id, f"مرتجع جزئي من {orig.invoice_number}", current_user_id)
    if credit_part > 0 and orig.customer_id:
        c_amt = (credit_part * ratio).quantize(Decimal("0.01"))
        if c_amt > 0:
            await db.execute(sqlt(
                "UPDATE customers SET balance = GREATEST(COALESCE(balance,0) - :amt, 0) WHERE id = :cid"
            ), {"amt": Decimal(str(c_amt)), "cid": orig.customer_id})

    # Track returns_total on the original sale
    await db.execute(sqlt(
        "UPDATE sales SET returns_total = COALESCE(returns_total,0) + :amt WHERE id = :sid"
    ), {"amt": total, "sid": sale_id})

    db.add(ArchivedDocument(doc_number=ret.invoice_number, doc_type=DocType.sale_invoice,
                             amount=total, ref_id=ret.id, created_by=current_user_id,
                             metadata_={"original_invoice": orig.invoice_number, "type": "partial_return"}))
    await db.commit()
    return {"doc_number": ret.invoice_number, "sale_id": str(ret.id), "total": float(total), "original": orig.invoice_number}


async def update_sale_item_qty(db: AsyncSession, sale_id: uuid.UUID, item_id: uuid.UUID, data, current_user_id: uuid.UUID, current_user_full_name: str) -> dict:
    from sqlalchemy import text as sqlt

    from app.core.exceptions import NotFoundError
    from app.models.shift import DrawerTransaction, DrawerTxType

    new_qty = data.qty

    item_row = await db.execute(sqlt(
        "SELECT si.*, s.warehouse_id, s.shift_id, s.status as sale_status, p.stock_status FROM sale_items si "
        "JOIN sales s ON s.id = si.sale_id "
        "JOIN products p ON p.id = si.product_id "
        "WHERE si.id = :iid AND si.sale_id = :sid FOR UPDATE OF si"
    ), {"iid": item_id, "sid": sale_id})
    item = item_row.fetchone()
    if not item:
        raise NotFoundError("البند غير موجود")
    if item.sale_status not in ('confirmed',):
        raise BusinessError("لا يمكن تعديل فاتورة ملغاة أو مرتجعة")

    old_qty = Decimal(str(item.qty))
    diff_qty = new_qty - old_qty
    diff_amount = diff_qty * Decimal(str(item.unit_price))

    if data.expected_qty is not None:
        result = await db.execute(sqlt(
            "UPDATE sale_items SET qty=:q WHERE id=:id AND qty=:expected"
        ), {"q": new_qty, "id": item_id, "expected": data.expected_qty})
        if result.rowcount == 0:
            current = (await db.execute(sqlt("SELECT qty FROM sale_items WHERE id=:id"), {"id": item_id})).scalar_one_or_none()
            if current is None:
                raise NotFoundError("البند غير موجود")
            raise BusinessError(f"تم تعديل الكمية بواسطة مستخدم آخر (الكمية الحالية: {current})")
    else:
        await db.execute(sqlt("UPDATE sale_items SET qty=:q WHERE id=:id"), {"q": new_qty, "id": item_id})

    if item.stock_status == "tracked":
        if diff_qty > 0:
            mv = StockMovementCreate(product_id=item.product_id, warehouse_id=item.warehouse_id,
                                     movement_type=MovementType.sale, qty=diff_qty,
                                     unit_cost=item.unit_cost, unit_price=item.unit_price)
            await record_movement(db, mv, current_user_id, ref_id=sale_id, ref_type="sale_adjustment", sale_id=sale_id)
        elif diff_qty < 0:
            mv = StockMovementCreate(product_id=item.product_id, warehouse_id=item.warehouse_id,
                                     movement_type=MovementType.return_in, qty=abs(diff_qty),
                                     unit_cost=item.unit_cost, unit_price=item.unit_price)
            await record_movement(db, mv, current_user_id, ref_id=sale_id, ref_type="sale_adjustment", sale_id=sale_id)

    if item.shift_id and diff_amount != 0:
        tx_type = DrawerTxType.sale if diff_amount > 0 else DrawerTxType.return_
        db.add(DrawerTransaction(
            shift_id=item.shift_id,
            type=tx_type,
            amount=abs(diff_amount),
            ref_id=sale_id,
            note=f"تعديل كمية — {item.product_id}",
            created_by=current_user_id
        ))

    from app.services.audit_service import log as audit_log
    await audit_log(db, "sale_item", "update", current_user_id, current_user_full_name, item_id, {"qty": float(data.qty), "unit_price": float(item.unit_price)}, "تعديل صنف في الفاتورة")
    await db.commit()
    return {"ok": True, "old_qty": float(old_qty), "new_qty": float(new_qty), "diff_amount": float(diff_amount)}


async def delete_sale_item(db: AsyncSession, sale_id: uuid.UUID, item_id: uuid.UUID, current_user_id: uuid.UUID) -> dict:
    from sqlalchemy import text as sqlt

    from app.core.exceptions import NotFoundError
    from app.models.shift import DrawerTransaction, DrawerTxType

    item_row = await db.execute(sqlt(
        "SELECT si.*, s.warehouse_id, s.shift_id, s.status as sale_status, p.stock_status FROM sale_items si "
        "JOIN sales s ON s.id = si.sale_id "
        "JOIN products p ON p.id = si.product_id "
        "WHERE si.id = :iid AND si.sale_id = :sid FOR UPDATE OF si"
    ), {"iid": item_id, "sid": sale_id})
    item = item_row.fetchone()
    if not item:
        raise NotFoundError("البند غير موجود")
    if item.sale_status not in ('confirmed',):
        raise BusinessError("لا يمكن حذف بند من فاتورة ملغاة أو مرتجعة")

    qty = Decimal(str(item.qty))
    amount = qty * Decimal(str(item.unit_price))

    await db.execute(sqlt("DELETE FROM sale_items WHERE id=:id"), {"id": item_id})

    if item.stock_status == "tracked":
        mv = StockMovementCreate(product_id=item.product_id, warehouse_id=item.warehouse_id,
                                 movement_type=MovementType.return_in, qty=qty,
                                 unit_cost=item.unit_cost, unit_price=item.unit_price)
        await record_movement(db, mv, current_user_id, ref_id=sale_id, ref_type="item_deleted", sale_id=sale_id)

    if item.shift_id:
        db.add(DrawerTransaction(
            shift_id=item.shift_id,
            type=DrawerTxType.return_,
            amount=amount,
            ref_id=sale_id,
            note=f"حذف بند — {item.product_id}",
            created_by=current_user_id
        ))

    await db.commit()
    return {"ok": True, "reversed_amount": float(amount)}
