"""SQLAlchemy models for Entertainment, Events & Gaming ERP module (ENT-01..12)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.core.tenancy import TenantScoped

class EntEventSession(TenantScoped, Base):
    __tablename__ = "ent_event_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(64), default="concert")  # concert, cinema, theme_park_show, sports_match, theatrical_play
    venue_name: Mapped[str] = mapped_column(String(255), nullable=False)
    session_start: Mapped[str] = mapped_column(String(32), nullable=False)
    total_capacity: Mapped[int] = mapped_column(Integer, default=1000)
    sold_tickets_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="scheduled")  # scheduled, doors_open, in_progress, completed, cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class EntTicket(TenantScoped, Base):
    __tablename__ = "ent_tickets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("ent_event_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    ticket_barcode: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    seat_tier: Mapped[str] = mapped_column(String(64), default="royal_gold")  # vip_box, royal_gold, silver_orchestra, balcony, general_admission
    seat_number: Mapped[str] = mapped_column(String(32), nullable=False)
    price_egp: Mapped[float] = mapped_column(Float, default=0.0)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    scanned_at_turnstile: Mapped[bool] = mapped_column(Boolean, default=False)
    scan_timestamp: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="valid")  # valid, scanned_used, refunded

class EntGamingCard(TenantScoped, Base):
    __tablename__ = "ent_gaming_cards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rfid_tag: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    holder_name: Mapped[str] = mapped_column(String(255), nullable=False)
    credits_balance_egp: Mapped[float] = mapped_column(Float, default=0.0)
    bonus_tickets_count: Mapped[int] = mapped_column(Integer, default=0)
    loyalty_tier: Mapped[str] = mapped_column(String(32), default="standard")  # standard, silver_gamer, vip_platinum
    last_tap_attraction: Mapped[str] = mapped_column(String(255), default="قطار الموت السريع (Hyper Coaster)")
    status: Mapped[str] = mapped_column(String(32), default="active")  # active, blocked

class EntConcessionOrder(TenantScoped, Base):
    __tablename__ = "ent_concession_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_ref: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    counter_station: Mapped[str] = mapped_column(String(128), nullable=False)
    combo_summary: Mapped[str] = mapped_column(String(255), nullable=False)
    total_amount_egp: Mapped[float] = mapped_column(Float, default=0.0)
    payment_method: Mapped[str] = mapped_column(String(32), default="card")  # cash, card, game_card_credits
    cashier_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="completed")  # completed, refunded
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
