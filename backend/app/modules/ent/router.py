"""API Router for Entertainment, Events & Gaming ERP module (ENT-01..12)."""
from __future__ import annotations

import uuid
from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.models.user import User

async def get_current_tenant_id(user: User = Depends(get_current_user)) -> str:
    return str(user.tenant_id)

from app.modules.ent.models import (
    EntEventSession,
    EntTicket,
    EntGamingCard,
    EntConcessionOrder,
)

router = APIRouter(prefix="/ent", tags=["Entertainment & Events ERP"])

# Pydantic Schemas
class EventSessionCreate(BaseModel):
    event_code: str
    title: str
    category: str = "concert"
    venue_name: str
    session_start: str
    total_capacity: int = 1000
    sold_tickets_count: int = 0
    status: str = "scheduled"

class TicketCreate(BaseModel):
    session_id: str
    ticket_barcode: str
    seat_tier: str = "royal_gold"
    seat_number: str
    price_egp: float
    customer_name: str

class TicketScanRequest(BaseModel):
    turnstile_gate: str = "Gate A - Turnstile 01"

class GamingCardCreate(BaseModel):
    rfid_tag: str
    holder_name: str
    credits_balance_egp: float = 500.0
    bonus_tickets_count: int = 100
    loyalty_tier: str = "standard"
    last_tap_attraction: str = "قطار الموت السريع (Hyper Coaster)"
    status: str = "active"

class ConcessionCreate(BaseModel):
    order_ref: str
    counter_station: str
    combo_summary: str
    total_amount_egp: float
    payment_method: str = "card"
    cashier_name: str
    status: str = "completed"

# Endpoints
@router.get("/summary")
async def get_ent_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    q_events = await db.execute(select(EntEventSession).where(EntEventSession.tenant_id == tenant_id))
    events = q_events.scalars().all()

    q_tickets = await db.execute(select(EntTicket).where(EntTicket.tenant_id == tenant_id))
    tickets = q_tickets.scalars().all()
    total_box_office = sum(t.price_egp for t in tickets if t.status != "refunded")
    scanned_count = sum(1 for t in tickets if t.scanned_at_turnstile)

    q_cards = await db.execute(select(EntGamingCard).where(EntGamingCard.tenant_id == tenant_id))
    cards = q_cards.scalars().all()

    q_orders = await db.execute(select(EntConcessionOrder).where(EntConcessionOrder.tenant_id == tenant_id))
    orders = q_orders.scalars().all()
    total_concessions = sum(o.total_amount_egp for o in orders)

    return {
        "total_active_events_count": len(events),
        "total_tickets_sold_count": len(tickets),
        "total_box_office_revenue_egp": round(total_box_office, 2),
        "active_gaming_cards_count": len(cards),
        "total_concessions_revenue_egp": round(total_concessions, 2),
        "turnstile_scanned_entries_count": scanned_count
    }

@router.get("/events")
async def list_events(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(EntEventSession).where(EntEventSession.tenant_id == tenant_id).order_by(EntEventSession.created_at.desc()))
    return q.scalars().all()

@router.post("/events")
async def create_event(
    payload: EventSessionCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    event = EntEventSession(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        event_code=payload.event_code,
        title=payload.title,
        category=payload.category,
        venue_name=payload.venue_name,
        session_start=payload.session_start,
        total_capacity=payload.total_capacity,
        sold_tickets_count=payload.sold_tickets_count,
        status=payload.status
    )
    db.add(event)
    await db.commit()
    return event

@router.get("/tickets")
async def list_tickets(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(EntTicket).where(EntTicket.tenant_id == tenant_id))
    tickets = q.scalars().all()
    results = []
    for t in tickets:
        qe = await db.execute(select(EntEventSession).where(EntEventSession.id == t.session_id))
        ev = qe.scalar_one_or_none()
        results.append({
            "id": t.id,
            "session_id": t.session_id,
            "event_title": ev.title if ev else "Unknown Event",
            "venue_name": ev.venue_name if ev else "Venue",
            "ticket_barcode": t.ticket_barcode,
            "seat_tier": t.seat_tier,
            "seat_number": t.seat_number,
            "price_egp": t.price_egp,
            "customer_name": t.customer_name,
            "scanned_at_turnstile": t.scanned_at_turnstile,
            "scan_timestamp": t.scan_timestamp,
            "status": t.status
        })
    return results

@router.post("/tickets")
async def create_ticket(
    payload: TicketCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    ticket = EntTicket(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        session_id=payload.session_id,
        ticket_barcode=payload.ticket_barcode,
        seat_tier=payload.seat_tier,
        seat_number=payload.seat_number,
        price_egp=payload.price_egp,
        customer_name=payload.customer_name,
        scanned_at_turnstile=False,
        status="valid"
    )
    db.add(ticket)

    # Increment sold count on event
    qe = await db.execute(select(EntEventSession).where(EntEventSession.id == payload.session_id, EntEventSession.tenant_id == tenant_id))
    ev = qe.scalar_one_or_none()
    if ev:
        ev.sold_tickets_count += 1

    await db.commit()
    return ticket

@router.post("/tickets/{id}/scan")
async def scan_ticket(
    id: str,
    payload: TicketScanRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(EntTicket).where(EntTicket.id == id, EntTicket.tenant_id == tenant_id))
    t = q.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if t.scanned_at_turnstile:
        raise HTTPException(status_code=400, detail="Ticket already scanned and used (Anti-Passback Alert)")

    t.scanned_at_turnstile = True
    t.scan_timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    t.status = "scanned_used"
    await db.commit()
    return {"message": "Access Granted", "ticket_barcode": t.ticket_barcode, "scan_time": t.scan_timestamp}

@router.get("/gaming-cards")
async def list_gaming_cards(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(EntGamingCard).where(EntGamingCard.tenant_id == tenant_id))
    return q.scalars().all()

@router.post("/gaming-cards")
async def create_gaming_card(
    payload: GamingCardCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    card = EntGamingCard(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        rfid_tag=payload.rfid_tag,
        holder_name=payload.holder_name,
        credits_balance_egp=payload.credits_balance_egp,
        bonus_tickets_count=payload.bonus_tickets_count,
        loyalty_tier=payload.loyalty_tier,
        last_tap_attraction=payload.last_tap_attraction,
        status=payload.status
    )
    db.add(card)
    await db.commit()
    return card

@router.get("/concessions")
async def list_concessions(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    q = await db.execute(select(EntConcessionOrder).where(EntConcessionOrder.tenant_id == tenant_id).order_by(EntConcessionOrder.created_at.desc()))
    return q.scalars().all()

@router.post("/concessions")
async def create_concession(
    payload: ConcessionCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    order = EntConcessionOrder(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        order_ref=payload.order_ref,
        counter_station=payload.counter_station,
        combo_summary=payload.combo_summary,
        total_amount_egp=payload.total_amount_egp,
        payment_method=payload.payment_method,
        cashier_name=payload.cashier_name,
        status=payload.status
    )
    db.add(order)
    await db.commit()
    return order

@router.post("/seed")
async def seed_ent_data(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
):
    """Seed comprehensive demo data for Entertainment & Events ERP."""
    q_existing = await db.execute(select(EntEventSession).where(EntEventSession.tenant_id == tenant_id))
    if q_existing.scalars().first():
        return {"message": "Entertainment module already seeded"}

    e1_id = str(uuid.uuid4())
    e2_id = str(uuid.uuid4())
    events = [
        EntEventSession(
            id=e1_id,
            tenant_id=tenant_id,
            event_code="EVT-ORCH-2026",
            title="حفل أوركسترا القاهرة السيمفوني بقيادة المايسترو العالمي",
            category="concert",
            venue_name="دار الأوبرا المصرية - المسرح الكبير",
            session_start="2026-11-20 20:00",
            total_capacity=1200,
            sold_tickets_count=980,
            status="doors_open"
        ),
        EntEventSession(
            id=e2_id,
            tenant_id=tenant_id,
            event_code="EVT-PARK-MAGIC",
            title="كرنفال ماجيك لاند الشتوي والعروض البهلوانية ثلاثية الأبعاد",
            category="theme_park_show",
            venue_name="مدينة الإنتاج الإعلامي - ساحة العروض الكبرى",
            session_start="2026-11-25 18:30",
            total_capacity=3500,
            sold_tickets_count=2100,
            status="scheduled"
        )
    ]
    for ev in events:
        db.add(ev)
    await db.flush()

    # Tickets
    tickets = [
        EntTicket(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            session_id=e1_id,
            ticket_barcode="TKT-OPR-VIP-0012",
            seat_tier="vip_box",
            seat_number="Royal Box 1",
            price_egp=2500.0,
            customer_name="المهندس طارق السلاب",
            scanned_at_turnstile=True,
            scan_timestamp="2026-11-20 19:15:30",
            status="scanned_used"
        ),
        EntTicket(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            session_id=e1_id,
            ticket_barcode="TKT-OPR-GLD-0419",
            seat_tier="royal_gold",
            seat_number="Row G - Seat 14",
            price_egp=1200.0,
            customer_name="الأستاذة ياسمين علوي",
            scanned_at_turnstile=False,
            status="valid"
        )
    ]
    for tk in tickets:
        db.add(tk)

    # Gaming Cards
    cards = [
        EntGamingCard(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            rfid_tag="RFID-MAGIC-8810",
            holder_name="يوسف أحمد الشناوي",
            credits_balance_egp=850.0,
            bonus_tickets_count=420,
            loyalty_tier="silver_gamer",
            last_tap_attraction="سباق السيارات التصادمية (Bumper Cars)",
            status="active"
        )
    ]
    for c in cards:
        db.add(c)

    # Concessions
    concessions = [
        EntConcessionOrder(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            order_ref="ORD-FNB-2026-0914",
            counter_station="كشك الفشار والمشروبات - الصالة الذهبية",
            combo_summary="2x كومبو عائلي فشار بالكراميل + 2x موهيتو توت مثلج",
            total_amount_egp=460.0,
            payment_method="card",
            cashier_name="سارة كمال",
            status="completed"
        )
    ]
    for cn in concessions:
        db.add(cn)

    await db.commit()
    return {"message": "Entertainment module seeded successfully"}
