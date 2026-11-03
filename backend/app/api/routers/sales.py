import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BusinessError, NotFoundError
from app.db.base import get_db
from app.dependencies import get_current_user, require_is_manager, require_open_period, require_perm
from app.models.product import Product
from app.models.sale import Sale, SaleItem, SaleStatus
from app.models.user import User
from app.schemas.sale import (
    ConfirmQuotationRequest,
    PartialReturnRequest,
    SaleCreate,
    SaleItemUpdate,
    SaleOut,
    UpdateSale,
)
from app.services import sale_service
from app.services.audit_service import log as audit_log

router = APIRouter(prefix="/sales", tags=["sales"])


@router.post("", response_model=SaleOut)
async def create_sale(data: SaleCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("sales", "pos")), _=Depends(require_open_period)):
    if current_user.tenant_id:
        from app.services.plan_gating import check_sales_volume_limit
        await check_sales_volume_limit(db, current_user.tenant_id)
    sale = await sale_service.create_sale(db, data, current_user.id)
    await audit_log(db, "sale", "create", current_user.id, current_user.full_name, sale.id, {"invoice_number": sale.invoice_number, "total": float(sale.total)}, f"فاتورة {sale.invoice_number}")
    return sale


@router.post("/draft", response_model=SaleOut)
async def create_draft(data: SaleCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("sales", "pos"))):
    """Save a draft sale — no stock deduction."""
    sale = await sale_service.create_draft_sale(db, data, current_user.id)
    return sale


@router.get("/drafts", response_model=list[SaleOut])
async def list_drafts(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    """List all draft sales."""
    result = await db.execute(
        select(Sale).options(selectinload(Sale.items))
        .where(Sale.status == SaleStatus.draft)
        .order_by(Sale.created_at.desc())
    )
    return result.scalars().all()


@router.put("/{sale_id}/confirm", response_model=SaleOut)
async def confirm_draft(sale_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("sales", "pos"))):
    """Confirm a draft sale — deduct stock, assign invoice number."""
    sale = await sale_service.confirm_draft_sale(db, sale_id, current_user.id)
    await audit_log(db, "sale", "confirm_draft", current_user.id, current_user.full_name, sale.id, {"invoice_number": sale.invoice_number}, f"تأكيد مسودة فاتورة {sale.invoice_number}")
    return sale


@router.delete("/{sale_id}", status_code=204)
async def delete_sale(sale_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("sales"))):
    """Delete a draft or quotation."""
    result = await db.execute(select(Sale).where(Sale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise NotFoundError()
    if sale.status not in (SaleStatus.draft, SaleStatus.quotation):
        raise BusinessError("Only drafts and quotations can be deleted")
    await db.execute(text("DELETE FROM archived_documents WHERE ref_id=:id AND doc_type IN ('sale_invoice','quotation')"), {"id": sale_id})
    await db.delete(sale)
    await db.commit()


@router.get("", response_model=list[SaleOut])
async def list_sales(
    from_date: str | None = None,
    to_date: str | None = None,
    cashier_id: uuid.UUID | None = None,
    status: str | None = None,
    product_search: str | None = None,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    from sqlalchemy import text as sqlt

    from app.models.party import Customer
    q = select(Sale, Customer.name.label("customer_name")).outerjoin(Customer, Sale.customer_id == Customer.id)
    q = q.options(selectinload(Sale.items)).order_by(Sale.created_at.desc()).limit(limit).offset(offset)
    if from_date:
        q = q.where(Sale.created_at >= from_date)
    if to_date:
        q = q.where(Sale.created_at <= to_date)
    if cashier_id:
        q = q.where(Sale.cashier_id == cashier_id)
    if status:
        q = q.where(Sale.status == status)
    if product_search:
        term = f"%{product_search}%"
        subq = select(SaleItem.sale_id).join(Product, Product.id == SaleItem.product_id).where(Product.name.ilike(term))
        matching = [r[0] for r in (await db.execute(subq)).fetchall()]
        if not matching:
            return []
        q = q.where(Sale.id.in_(matching))
    rows = (await db.execute(q)).all()
    # Get user names in one query
    user_ids = list({str(sale.created_by) for sale, _ in rows if sale.created_by})
    user_names: dict = {}
    if user_ids:
        urows = await db.execute(sqlt("SELECT id, full_name FROM users WHERE id = ANY(:ids)"), {"ids": user_ids})
        user_names = {str(r.id): r.full_name for r in urows.fetchall()}
    # Get product names for items
    items_list = [i for s, _ in rows for i in (s.items or [])]
    all_pids = list({i.product_id for i in items_list})
    pnames = {}
    if all_pids:
        prod_rows = await db.execute(sqlt("SELECT id, name FROM products WHERE id = ANY(:ids)"), {"ids": [str(p) for p in all_pids]})
        pnames = {str(r.id): r.name for r in prod_rows.fetchall()}
    result = []
    for sale, cname in rows:
        d = SaleOut.model_validate(sale).model_dump()
        d['customer_name'] = cname
        d['created_by_name'] = user_names.get(str(sale.created_by), '')
        for item in d.get('items') or []:
            item['product_name'] = pnames.get(str(item['product_id']), '')
        result.append(d)
    return result



@router.post("/quotations", response_model=SaleOut)
async def create_quotation(data: SaleCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("quotations", "sales"))):
    """إنشاء عرض سعر — لا يُخصم من المخزون."""
    sale = await sale_service.create_quotation(db, data, current_user.id)
    await audit_log(db, "quotation", "create", current_user.id, current_user.full_name, sale.id, {"invoice_number": sale.invoice_number}, f"عرض سعر {sale.invoice_number}")
    return sale


@router.post("/{sale_id}/confirm-quotation", response_model=SaleOut)
async def confirm_quotation(sale_id: uuid.UUID, data: ConfirmQuotationRequest | None = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("quotations", "sales"))):
    """تحويل عرض السعر إلى فاتورة مبيعات مؤكدة — المقبوض يذهب إلى درج أو خزنة."""
    sale = await sale_service.confirm_quotation(
        db, sale_id, current_user.id,
        destination=data.destination if data else "drawer",
        safe_id=data.safe_id if data else None,
    )
    await audit_log(db, "quotation", "confirm", current_user.id, current_user.full_name, sale_id, {"destination": data.destination if data else "drawer"}, "تأكيد عرض السعر")
    return sale


@router.get("/{sale_id}/print")
async def print_sale(sale_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    """بيانات الفاتورة/عرض السعر للطباعة — تشمل بيانات المتجر والعميل والمنتجات."""
    from sqlalchemy import select as sa_select

    from app.models.party import Customer
    from app.models.product import Product
    from app.models.settings import StoreSetting

    result = await db.execute(sa_select(Sale).options(selectinload(Sale.items)).where(Sale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise NotFoundError("Sale not found")

    # Enrich items with product names — single bulk query (avoids N+1)
    product_ids = list({item.product_id for item in sale.items})
    products_map: dict = {}
    if product_ids:
        prod_rows = await db.execute(sa_select(Product).where(Product.id.in_(product_ids)))
        products_map = {p.id: p for p in prod_rows.scalars().all()}

    items_out = []
    for item in sale.items:
        prod = products_map.get(item.product_id)
        items_out.append({
            "product_name": prod.name if prod else str(item.product_id),
            "unit": prod.unit if prod else "",
            "qty": float(item.qty),
            "unit_price": float(item.unit_price),
            "discount": float(item.discount),
            "total": float(item.qty) * float(item.unit_price) - float(item.discount),
        })

    customer = None
    if sale.customer_id:
        customer = (await db.execute(sa_select(Customer).where(Customer.id == sale.customer_id))).scalar_one_or_none()

    settings_rows = (await db.execute(sa_select(StoreSetting))).scalars().all()
    settings = {r.key: r.value for r in settings_rows}

    subtotal = sum(i["total"] for i in items_out)
    total = subtotal - float(sale.discount_amount)

    return {
        "store": {"name": settings.get("store_name", ""), "address": settings.get("store_address", ""), "phone": settings.get("store_phone", ""), "logo_url": settings.get("logo_url", "")},
        "document_type": "عرض سعر" if sale.status == "quotation" else "فاتورة مبيعات",
        "invoice_number": sale.invoice_number,
        "date": sale.created_at.isoformat(),
        "sale_mode": sale.sale_mode,
        "status": sale.status,
        "customer": {"name": customer.name if customer else "عميل عادي", "phone": customer.phone if customer else ""},
        "items": items_out,
        "subtotal": subtotal,
        "discount": float(sale.discount_amount),
        "total": total,
        "notes": sale.notes or "",
        "created_by_name": (await db.execute(text("SELECT full_name FROM users WHERE id=:id"), {"id": sale.created_by})).scalar() if sale.created_by else "",
    }
@router.get("/{sale_id}")
async def get_sale(sale_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    from sqlalchemy import text as sqlt

    from app.models.customer_payment import CustomerPayment
    row = await db.execute(sqlt("""
        SELECT s.*, c.name as customer_name,
                COALESCE(json_agg(json_build_object(
                 'id', si.id, 'product_id', si.product_id, 'product_name', p.name,
                 'qty', si.qty, 'unit_price', si.unit_price, 'unit_cost', si.unit_cost,
                 'discount', si.discount
                )) FILTER (WHERE si.id IS NOT NULL), '[]'::json) as items
        FROM sales s
        LEFT JOIN customers c ON c.id = s.customer_id
        LEFT JOIN sale_items si ON si.sale_id = s.id
        LEFT JOIN products p ON p.id = si.product_id
        WHERE s.id = :id
        GROUP BY s.id, c.name
    """), {"id": sale_id})
    sale = row.fetchone()
    if not sale:
        raise NotFoundError("Sale not found")
    result = dict(sale._mapping)
    # Get payments linked to this sale
    payments = (await db.execute(
        select(CustomerPayment).where(CustomerPayment.sale_id == sale_id).order_by(CustomerPayment.created_at.desc())
    )).scalars().all()
    result["payment_history"] = [{
        "id": str(p.id),
        "amount": float(p.amount),
        "note": p.note,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    } for p in payments]
    # Use returns_total stored on the sale (updated by return_sale / partial_return_sale)
    # which correctly accounts for item discounts.  Fall back to 0 if not set.
    net_total = float(result.get("net_total", 0))
    paid = float(result.get("paid_amount", 0) or 0)
    returns_total = float(result.get("returns_total", 0) or 0)
    result["returns_total"] = returns_total
    result["remaining"] = round(max(0.0, net_total - returns_total - paid), 2)
    return result


@router.put("/{sale_id}")
async def update_sale(sale_id: uuid.UUID, data: UpdateSale, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("quotations"))):
    """Edit a quotation (status=quotation only)."""
    from sqlalchemy import text as sqlt
    d = data.model_dump()
    sale_row = await db.execute(sqlt("SELECT status FROM sales WHERE id=:id"), {"id": sale_id})
    sale = sale_row.fetchone()
    if not sale:
        raise NotFoundError()
    if sale.status != "quotation":
        raise BusinessError("Only quotations can be edited")
    # Update items + recalculate total
    await db.execute(sqlt("DELETE FROM sale_items WHERE sale_id=:id"), {"id": sale_id})
    total = 0.0
    for item in d.get("items", []):
        line = float(item["qty"]) * float(item["unit_price"])
        disc = item.get("discount", 0) or 0
        total += line - disc
        await db.execute(sqlt("""
            INSERT INTO sale_items (id, sale_id, product_id, qty, unit_price, unit_cost, discount)
            VALUES (gen_random_uuid(), :sid, :pid, :qty, :price, :cost, :disc)
        """), {"sid": sale_id, "pid": item["product_id"], "qty": item["qty"],
               "price": item["unit_price"], "cost": item.get("unit_cost", 0),
               "disc": disc})
    invoice_disc = float(d.get("discount_amount", 0) or 0)
    net_total = total - invoice_disc
    await db.execute(sqlt("UPDATE sales SET total=:total, net_total=:net, discount_amount=:disc WHERE id=:id"),
                     {"total": total, "net": net_total, "disc": invoice_disc, "id": sale_id})
    if "notes" in d:
        await db.execute(sqlt("UPDATE sales SET notes=:notes WHERE id=:id"), {"notes": d["notes"], "id": sale_id})
    if "customer_id" in d:
        await db.execute(sqlt("UPDATE sales SET customer_id=:cid WHERE id=:id"), {"cid": d.get("customer_id"), "id": sale_id})
    await db.commit()
    return {"id": str(sale_id)}


@router.put("/{sale_id}/cancel")
async def cancel_sale(sale_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("sales"))):
    sale = await sale_service.cancel_sale(db, sale_id, current_user.id)
    return {"detail": "Cancelled", "invoice_number": sale.invoice_number}


@router.post("/{sale_id}/return")
async def return_sale(sale_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("sales"))):
    """Full return of a confirmed sale."""
    sale = await sale_service.return_sale(db, sale_id, current_user.id)
    await audit_log(db, "sale", "return", current_user.id, current_user.full_name, sale_id, {}, f"إرجاع فاتورة {sale['invoice_number']}")
    return sale


@router.post("/{sale_id}/partial-return")
async def partial_return(sale_id: uuid.UUID, data: PartialReturnRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("sales"))):
    """مرتجع جزئي — body: {items:[{product_id,qty}], shift_id?}"""
    return await sale_service.partial_return_sale(db, sale_id, data.model_dump(), current_user.id)


@router.put("/{sale_id}/items/{item_id}")
async def update_sale_item_qty(
    sale_id: uuid.UUID,
    item_id: uuid.UUID,
    data: SaleItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_is_manager)
):
    """Adjust qty of a sale item with optimistic locking."""
    return await sale_service.update_sale_item_qty(db, sale_id, item_id, data, current_user.id, current_user.full_name)


@router.delete("/{sale_id}/items/{item_id}")
async def delete_sale_item(
    sale_id: uuid.UUID,
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_is_manager)
):
    """Delete a sale item. Reverses stock movement and drawer balance."""
    return await sale_service.delete_sale_item(db, sale_id, item_id, current_user.id)
