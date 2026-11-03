import uuid
from decimal import Decimal

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user, require_open_period, require_perm, verify_warehouse_access
from app.models.user import User
from app.models.warehouse import Warehouse
from app.schemas.stock import StockMovementCreate, StockMovementOut, TransferRequest
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate
from app.services import stock_service
from app.services.audit_service import log as audit_log

router = APIRouter(prefix="/stock", tags=["stock"])


@router.get("/warehouses", response_model=list[dict])
async def list_warehouses(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(Warehouse).where(Warehouse.is_active))
    return [{"id": str(w.id), "code": w.code, "name": w.name, "warehouse_type": w.warehouse_type} for w in result.scalars().all()]


@router.post("/warehouses")
async def create_warehouse(data: WarehouseCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("settings"))):
    if current_user.tenant_id:
        from app.services.plan_gating import check_branch_creation_limit
        await check_branch_creation_limit(db, current_user.tenant_id)
    w = Warehouse(code=data.code, name=data.name, warehouse_type=data.warehouse_type)
    db.add(w)
    await db.commit()
    await db.refresh(w)
    return {"id": str(w.id), "code": w.code, "name": w.name, "warehouse_type": w.warehouse_type}


@router.put("/warehouses/{wh_id}")
async def update_warehouse(wh_id: uuid.UUID, data: WarehouseUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_perm("settings"))):
    result = await db.execute(select(Warehouse).where(Warehouse.id == wh_id))
    w = result.scalar_one_or_none()
    if not w:
        from app.core.exceptions import NotFoundError
        raise NotFoundError()
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(w, k, v)
    await db.commit()
    await db.refresh(w)
    return {"id": str(w.id), "code": w.code, "name": w.name}


@router.delete("/warehouses/{wh_id}", status_code=204)
async def delete_warehouse(wh_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_perm("settings"))):
    from sqlalchemy import text as sqlt

    from app.core.exceptions import BusinessError

    result = await db.execute(select(Warehouse).where(Warehouse.id == wh_id))
    w = result.scalar_one_or_none()
    if not w:
        from app.core.exceptions import NotFoundError
        raise NotFoundError()

    # Check for linked records
    movements_count = await db.scalar(sqlt("SELECT COUNT(*) FROM stock_movements WHERE warehouse_id = :id"), {"id": wh_id})
    sales_count = await db.scalar(sqlt("SELECT COUNT(*) FROM sales WHERE warehouse_id = :id"), {"id": wh_id})
    shifts_count = await db.scalar(sqlt("SELECT COUNT(*) FROM shifts WHERE warehouse_id = :id"), {"id": wh_id})

    total_linked = (movements_count or 0) + (sales_count or 0) + (shifts_count or 0)
    if total_linked > 0:
        raise BusinessError(
            f"لا يمكن حذف هذا المخزن — يحتوي على {movements_count or 0} حركة مخزون، {sales_count or 0} فاتورة بيع، و{shifts_count or 0} شيفت. يرجى حذف البيانات المرتبطة أولاً."
        )

    w.is_active = False
    await db.commit()


@router.post("/balance/bulk")
async def get_balance_bulk(warehouse_id: uuid.UUID, product_ids: list[uuid.UUID] = Body(...), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """POST body: list of product UUIDs. Returns {product_id: qty} plus a __tracked__ map."""
    from sqlalchemy import text as sqlt

    from app.models.stock_balance import StockBalance
    await verify_warehouse_access(db, current_user, warehouse_id)
    if not product_ids:
        return {}
    result = await db.execute(
        select(StockBalance.product_id, StockBalance.qty)
        .where(StockBalance.warehouse_id == warehouse_id, StockBalance.product_id.in_(product_ids))
    )
    out = {str(row.product_id): float(row.qty) for row in result.all()}
    st_rows = (await db.execute(sqlt(
        "SELECT product_id FROM warehouse_product_status WHERE warehouse_id=:wid AND status='tracked' AND product_id = ANY(:ids)"
    ), {"wid": warehouse_id, "ids": list(product_ids)})).fetchall()
    raised = {str(r[0]) for r in st_rows}
    out["__tracked__"] = {str(pid): str(pid) in raised for pid in product_ids}
    return out


@router.post("/balance/total")
async def get_total_balance_bulk(product_ids: list[uuid.UUID] = Body(...), db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    """Total stock across ALL warehouses. POST body: list of product UUIDs."""
    from sqlalchemy import func

    from app.models.stock_balance import StockBalance
    if not product_ids:
        return {}
    result = await db.execute(
        select(
            StockBalance.product_id,
            func.coalesce(func.sum(StockBalance.qty), 0).label("qty")
        )
        .where(StockBalance.product_id.in_(product_ids))
        .group_by(StockBalance.product_id)
    )
    return {str(row.product_id): float(row.qty) for row in result.all()}


@router.get("/balance/breakdown/{product_id}")
async def get_balance_breakdown(product_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    """Stock per warehouse for a single product — uses maintained balances."""
    from sqlalchemy import func

    from app.models.stock_balance import StockBalance
    rows = await db.execute(
        select(
            Warehouse.name.label("warehouse_name"),
            Warehouse.warehouse_type,
            func.coalesce(StockBalance.qty, 0).label("qty")
        )
        .outerjoin(StockBalance, (StockBalance.product_id == product_id) & (StockBalance.warehouse_id == Warehouse.id))
        .order_by(Warehouse.name)
    )
    return [dict(r._mapping) for r in rows.fetchall()]


@router.post("/movements", response_model=StockMovementOut)
async def add_movement(data: StockMovementCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("inventory")), _=Depends(require_open_period)):
    mv = await stock_service.record_movement(db, data, current_user.id)
    await db.commit()
    await db.refresh(mv)
    return mv


@router.delete("/movements", status_code=204)
async def reset_warehouse_stock(
    warehouse_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_perm("settings")),
):
    """Delete all stock movements for a warehouse (reset inventory)."""
    from sqlalchemy import text as sqlt

    from app.core.exceptions import BusinessError
    count = (await db.execute(sqlt("SELECT COUNT(*) FROM stock_movements WHERE warehouse_id = :wid"), {"wid": warehouse_id})).scalar() or 0
    if count > 1000:
        raise BusinessError(f"لا يمكن إعادة تعيين {count} حركة — تجاوز الحد الأقصى")
    await db.execute(sqlt("DELETE FROM stock_movements WHERE warehouse_id = :wid"), {"wid": warehouse_id})
    await db.execute(sqlt("DELETE FROM stock_balances WHERE warehouse_id = :wid"), {"wid": warehouse_id})
    await db.execute(sqlt("DELETE FROM warehouse_product_status WHERE warehouse_id = :wid"), {"wid": warehouse_id})
    await db.execute(sqlt("""
        UPDATE products SET stock_status = 'untracked'
        WHERE id NOT IN (SELECT DISTINCT product_id FROM stock_movements)
        AND id NOT IN (SELECT DISTINCT product_id FROM warehouse_product_status)
    """))
    await db.commit()


@router.get("/movements")
async def list_movements(
    product_id: uuid.UUID | None = None,
    warehouse_id: uuid.UUID | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_warehouse_access(db, current_user, warehouse_id)
    from math import ceil

    from sqlalchemy import text as sqlt
    conditions = ["1=1"]
    params: dict = {}
    if product_id:
        conditions.append("sm.product_id = :product_id")
        params["product_id"] = product_id
    if warehouse_id:
        conditions.append("sm.warehouse_id = :warehouse_id")
        params["warehouse_id"] = warehouse_id
    where_sql = " AND ".join(conditions)

    count_result = await db.execute(sqlt(f"SELECT COUNT(*) FROM stock_movements sm WHERE {where_sql}"), params)
    total = count_result.scalar_one() or 0
    pages = max(1, ceil(total / page_size))
    offset = (page - 1) * page_size

    params["limit"] = page_size
    params["offset"] = offset
    rows = await db.execute(sqlt(f"""
        SELECT sm.*, p.name as product_name, w.name as warehouse_name
        FROM stock_movements sm
        LEFT JOIN products p ON p.id = sm.product_id
        LEFT JOIN warehouses w ON w.id = sm.warehouse_id
        WHERE {where_sql}
        ORDER BY sm.created_at DESC LIMIT :limit OFFSET :offset
    """), params)
    items = [dict(r._mapping) for r in rows.fetchall()]
    return {"items": items, "total": total, "page": page, "size": page_size, "pages": pages}


@router.post("/adjustment/bulk")
async def bulk_adjustment(data: list[StockMovementCreate], db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("inventory")), _=Depends(require_open_period)):
    """Bulk stock adjustment — equivalent to Qt's AddStockDialog / bulk_add_stock().
    Body: [{"product_id": "...", "warehouse_id": "...", "movement_type": "adjustment_in", "qty": 10, "note": "..."}]
    """
    from fastapi import HTTPException
    if len(data) > 500:
        raise HTTPException(400, "Too many items (max 500)")
    for item in data:
        await stock_service.record_movement(db, item, current_user.id)
        await audit_log(db, "stock", "adjustment", current_user.id, current_user.full_name, None, {"product_id": str(item.product_id), "qty": float(item.qty), "type": item.movement_type}, "تسوية مخزون")
    await db.commit()
    return {"detail": f"{len(data)} movements recorded"}


@router.post("/transfer")
async def transfer(data: TransferRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("inventory"))):
    await stock_service.transfer_stock(db, data, current_user.id)
    return {"detail": "Transfer completed"}


@router.get("/low-stock")
async def low_stock(warehouse_id: uuid.UUID, threshold: Decimal = Decimal("5"), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await verify_warehouse_access(db, current_user, warehouse_id)
    rows = await stock_service.get_low_stock(db, warehouse_id, threshold)
    return [{"product_id": str(p.id), "product_name": p.name, "current_qty": qty, "unit": p.unit} for p, qty in rows]


@router.get("/valuation")
async def valuation(warehouse_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await verify_warehouse_access(db, current_user, warehouse_id)
    row = await stock_service.get_valuation(db, warehouse_id)
    return {"total_cost_value": row.cost_value or 0, "total_retail_value": row.retail_value or 0, "product_count": row.product_count or 0}
