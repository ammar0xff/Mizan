import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user, require_is_manager, require_perm, verify_warehouse_access
from app.models.shift import DrawerTransaction, Shift, ShiftStatus
from app.models.user import User
from app.schemas.shift import (
    CloseWithManagerRequest,
    DrawerTxCreate,
    DrawerTxOut,
    RevenueDeliveryRequest,
    ShiftClose,
    ShiftOpen,
    ShiftOut,
    ShiftSummary,
    TransferDrawerRequest,
)
from app.services import shift_service

router = APIRouter(prefix="/shifts", tags=["shifts"])


# ── Open ──────────────────────────────────────────────────────────────────────

@router.post("/open", response_model=ShiftOut)
async def open_shift(data: ShiftOpen, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("shifts"))):
    shift = await shift_service.open_shift(db, current_user.id, data.warehouse_id, data.initial_amount, data.supervisor_id)
    out = ShiftOut.model_validate(shift)
    out.cashier_name = current_user.full_name
    return out


# ── Last drawer amount ─────────────────────────────────────────────────────────

@router.get("/last-drawer")
async def last_drawer_amount(warehouse_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await verify_warehouse_access(db, current_user, warehouse_id)
    result = await db.execute(
        select(Shift.next_day_drawer)
        .where(Shift.status == ShiftStatus.closed, Shift.next_day_drawer.isnot(None),
               Shift.warehouse_id == warehouse_id)
        .order_by(Shift.closed_at.desc()).limit(1)
    )
    val = result.scalar_one_or_none()
    return {"amount": float(val) if val is not None else 0.0}


# ── Current shift ──────────────────────────────────────────────────────────────

@router.get("/current", response_model=ShiftOut | None)
async def get_current_shift(warehouse_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await verify_warehouse_access(db, current_user, warehouse_id)
    result = await db.execute(
        select(Shift)
        .where(Shift.warehouse_id == warehouse_id,
               Shift.cashier_id == current_user.id,
               Shift.status == ShiftStatus.open)
        .order_by(Shift.started_at.desc()).limit(1)
    )
    shift = result.scalar_one_or_none()
    if not shift:
        return None  # no open shift — 200 null (the UI treats it as "مغلقة")
    out = ShiftOut.model_validate(shift)
    name = (await db.execute(text("SELECT full_name FROM users WHERE id=:id"), {"id": shift.cashier_id})).scalar()
    out.cashier_name = name
    return out


# ── Close ──────────────────────────────────────────────────────────────────────

@router.post("/{shift_id}/close")
async def close_shift(shift_id: uuid.UUID, data: ShiftClose, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("shifts"))):
    shift = await db.get(Shift, shift_id)
    if shift:
        await verify_warehouse_access(db, current_user, shift.warehouse_id)
    return await shift_service.close_shift(db, shift_id, data.closing_balance, data.next_day_drawer, data.notes, current_user.id)


@router.post("/{shift_id}/close-with-manager")
async def close_with_manager(shift_id: uuid.UUID, data: CloseWithManagerRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("shifts"))):
    shift = await db.get(Shift, shift_id)
    if shift:
        await verify_warehouse_access(db, current_user, shift.warehouse_id)
    return await shift_service.close_shift_with_manager(db, shift_id, data, current_user.id)


# ── Revenue delivery ───────────────────────────────────────────────────────────

@router.post("/{shift_id}/revenue-delivery")
async def revenue_delivery(shift_id: uuid.UUID, data: RevenueDeliveryRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("shifts"))):
    return await shift_service.revenue_delivery(db, shift_id, data, current_user)


# ── Transfer ───────────────────────────────────────────────────────────────────

@router.post("/{shift_id}/transfer", response_model=ShiftOut)
async def transfer_drawer(shift_id: uuid.UUID, data: TransferDrawerRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("shifts"))):
    shift = await db.get(Shift, shift_id)
    if shift:
        await verify_warehouse_access(db, current_user, shift.warehouse_id)
    is_privileged = current_user.is_manager or current_user.role in ('admin', 'manager')
    # Pass None as from_user_id so service skips ownership check for privileged users
    ownership_id = None if is_privileged else current_user.id
    new_shift = await shift_service.transfer_drawer(db, shift_id, data.to_user_id, data.amount, ownership_id, data.notes, closed_by=current_user.id)
    out = ShiftOut.model_validate(new_shift)
    name = (await db.execute(text("SELECT full_name FROM users WHERE id=:id"), {"id": new_shift.cashier_id})).scalar()
    out.cashier_name = name
    return out


# ── Summary ────────────────────────────────────────────────────────────────────

@router.get("/{shift_id}/summary", response_model=ShiftSummary)
async def shift_summary(shift_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    shift = await db.get(Shift, shift_id)
    is_own = shift and shift.cashier_id == current_user.id
    is_privileged = current_user.is_manager or current_user.role in ('admin', 'manager')
    if shift and not is_own and not is_privileged:
        raise HTTPException(status_code=403, detail="لا يمكنك الاطلاع على وردية موظف آخر")
    return await shift_service.compute_summary(db, shift_id)


# ── Transactions ───────────────────────────────────────────────────────────────

@router.post("/{shift_id}/transactions", response_model=DrawerTxOut)
async def add_transaction(shift_id: uuid.UUID, data: DrawerTxCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_perm("shifts"))):
    return await shift_service.add_transaction(
        db, shift_id, data.type, data.amount, current_user.id,
        note=data.note, category_id=data.category_id,
        payment_method=data.payment_method, wallet_id=data.wallet_id,
        customer_id=data.customer_id,
    )


@router.get("/{shift_id}/transactions", response_model=list[DrawerTxOut])
async def list_transactions(shift_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    shift = await db.get(Shift, shift_id)
    is_own = shift and shift.cashier_id == current_user.id
    is_privileged = current_user.is_manager or current_user.role in ('admin', 'manager')
    if shift and not is_own and not is_privileged:
        raise HTTPException(status_code=403, detail="لا يمكنك الاطلاع على وردية موظف آخر")
    result = await db.execute(
        select(DrawerTransaction).where(DrawerTransaction.shift_id == shift_id).order_by(DrawerTransaction.created_at)
    )
    return result.scalars().all()


# ── List shifts ────────────────────────────────────────────────────────────────

@router.get("", response_model=list[ShiftOut])
async def list_shifts(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    warehouse_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_perm("shifts")),
):
    await verify_warehouse_access(db, current_user, warehouse_id)
    q = select(Shift)
    if warehouse_id:
        q = q.where(Shift.warehouse_id == warehouse_id)
    q = q.order_by(Shift.started_at.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    shifts = result.scalars().all()
    out = []
    for s in shifts:
        o = ShiftOut.model_validate(s)
        if s.cashier_id:
            name = (await db.execute(text("SELECT full_name FROM users WHERE id=:id"), {"id": s.cashier_id})).scalar()
            o.cashier_name = name
        out.append(o)
    return out


# ── Delete transaction ─────────────────────────────────────────────────────────

@router.delete("/transactions/{tx_id}", status_code=204)
async def delete_drawer_transaction(tx_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_is_manager)):
    await shift_service.delete_drawer_transaction(db, tx_id, current_user.id)
