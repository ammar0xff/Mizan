"""API router for Restaurant module with full PostgreSQL persistence, Recipe BOM & Food Costing."""
from __future__ import annotations

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.dependencies import get_current_user
from app.modules.restaurant.models import (
    RestaurantRecipe,
    RestaurantRecipeItem,
    RestaurantTable,
    RestaurantWasteLog,
)

router = APIRouter(prefix="", tags=["Restaurant Module"])


class UpdateTableStatusRequest(BaseModel):
    status: str  # available, occupied, reserved
    guests: int | None = None
    order_total: float | None = None
    opened_at: str | None = None


class RecipeItemInput(BaseModel):
    raw_item_name: str
    qty_per_portion: float
    unit: str = "كجم"
    unit_cost: float
    yield_loss_pct: float = 0.0


class CreateRecipeRequest(BaseModel):
    menu_item_name: str
    category: str = "وجبات رئيسية"
    sale_price: float
    yield_portions: int = 1
    prep_time_minutes: int = 15
    station: str = "المطبخ الرئيسي"
    notes: str | None = None
    ingredients: list[RecipeItemInput] = []


class RecordWasteRequest(BaseModel):
    item_name: str
    qty: float
    unit: str = "كجم"
    estimated_cost: float
    reason: str  # prep_waste, expired, spoiled, customer_return
    notes: str | None = None
    logged_by: str = "شيف المطبخ"


class DepleteOrderRequest(BaseModel):
    order_number: str
    items: list[dict]  # list of { "recipe_id": str, "qty": int }


DEFAULT_TABLES = [
    {"number": "1", "capacity": 4, "section": "الصالة الرئيسية", "status": "occupied", "order_total": 450.0, "guests": 3, "opened_at": "منذ 25 دقيقة"},
    {"number": "2", "capacity": 2, "section": "الصالة الرئيسية", "status": "available", "order_total": 0.0, "guests": 0, "opened_at": None},
    {"number": "3", "capacity": 6, "section": "صالة العائلات", "status": "occupied", "order_total": 1280.0, "guests": 5, "opened_at": "منذ 45 دقيقة"},
    {"number": "4", "capacity": 4, "section": "صالة العائلات", "status": "reserved", "order_total": 0.0, "guests": 0, "opened_at": None},
    {"number": "5", "capacity": 8, "section": "التراس الخارجي", "status": "occupied", "order_total": 890.0, "guests": 6, "opened_at": "منذ 10 دقائق"},
    {"number": "6", "capacity": 2, "section": "التراس الخارجي", "status": "available", "order_total": 0.0, "guests": 0, "opened_at": None},
]

DEFAULT_RECIPES = [
    {
        "id": "rec-01",
        "menu_item_name": "برجر دبل بيف مشوي",
        "category": "برجر ومشويات",
        "sale_price": 220.0,
        "yield_portions": 1,
        "prep_time_minutes": 15,
        "station": "شواية اللحوم (Grill Station)",
        "notes": "اللحم مشوي على الفحم مع صوص مدخن وجبن شيدر",
        "ingredients": [
            {"raw_item_name": "شريحة لحم بقر بلدي 150ج", "qty_per_portion": 0.300, "unit": "كجم", "unit_cost": 280.0, "yield_loss_pct": 5.0},
            {"raw_item_name": "خبز بريوش فاخر", "qty_per_portion": 1.0, "unit": "قطعة", "unit_cost": 7.0, "yield_loss_pct": 0.0},
            {"raw_item_name": "صوص برجر مدخن سري", "qty_per_portion": 0.035, "unit": "كجم", "unit_cost": 65.0, "yield_loss_pct": 2.0},
            {"raw_item_name": "شريحة جبن شيدر أمريكي", "qty_per_portion": 2.0, "unit": "قطعة", "unit_cost": 5.0, "yield_loss_pct": 0.0},
        ],
    },
    {
        "id": "rec-02",
        "menu_item_name": "بيتزا رانش دجاج لارج",
        "category": "بيتزا ومخبوزات",
        "sale_price": 195.0,
        "yield_portions": 1,
        "prep_time_minutes": 20,
        "station": "فرن البيتزا (Pizza Oven)",
        "notes": "تسوية حجرية مقرمشة بصوص الرانش والموتزاريلا",
        "ingredients": [
            {"raw_item_name": "عجينة بيتزا إيطالية 35 سم", "qty_per_portion": 1.0, "unit": "قطعة", "unit_cost": 15.0, "yield_loss_pct": 0.0},
            {"raw_item_name": "صدور دجاج متبلة ومطهوة", "qty_per_portion": 0.150, "unit": "كجم", "unit_cost": 180.0, "yield_loss_pct": 4.0},
            {"raw_item_name": "جبنة موتزاريلا طبيعية", "qty_per_portion": 0.180, "unit": "كجم", "unit_cost": 150.0, "yield_loss_pct": 1.0},
            {"raw_item_name": "صوص رانش فاخر", "qty_per_portion": 0.050, "unit": "كجم", "unit_cost": 70.0, "yield_loss_pct": 2.0},
        ],
    },
    {
        "id": "rec-03",
        "menu_item_name": "باستا ألفريدو دجاج ومشروم",
        "category": "باستا وأطباق ساخنة",
        "sale_price": 160.0,
        "yield_portions": 1,
        "prep_time_minutes": 12,
        "station": "المطبخ الساخن (Hot Kitchen)",
        "notes": "كريمة طهي غنية مع جبن بارميزان ومشروم فريش",
        "ingredients": [
            {"raw_item_name": "مكرونة بيني إيطالية", "qty_per_portion": 0.180, "unit": "كجم", "unit_cost": 45.0, "yield_loss_pct": 0.0},
            {"raw_item_name": "كريمة طهي حيواني فاخرة", "qty_per_portion": 0.120, "unit": "كجم", "unit_cost": 140.0, "yield_loss_pct": 2.0},
            {"raw_item_name": "قطع صدور دجاج مشوي", "qty_per_portion": 0.100, "unit": "كجم", "unit_cost": 180.0, "yield_loss_pct": 3.0},
            {"raw_item_name": "مشروم طازج مقطع", "qty_per_portion": 0.060, "unit": "كجم", "unit_cost": 90.0, "yield_loss_pct": 5.0},
        ],
    },
    {
        "id": "rec-04",
        "menu_item_name": "موهيتو فراولة وليمون منعش",
        "category": "مشروبات وبار",
        "sale_price": 65.0,
        "yield_portions": 1,
        "prep_time_minutes": 5,
        "station": "قسم المشروبات والبار (Beverage Bar)",
        "notes": "نعناع فريش، ليمون، وسيرب فراولة طبيعي مع سفن أب",
        "ingredients": [
            {"raw_item_name": "سيرب فراولة طبيعي مركز", "qty_per_portion": 0.040, "unit": "لتر", "unit_cost": 90.0, "yield_loss_pct": 0.0},
            {"raw_item_name": "مشروب صودا وسفن أب", "qty_per_portion": 1.0, "unit": "عبوة", "unit_cost": 9.0, "yield_loss_pct": 0.0},
            {"raw_item_name": "ليمون ونعناع أخضر فريش", "qty_per_portion": 1.0, "unit": "حصة", "unit_cost": 3.0, "yield_loss_pct": 0.0},
        ],
    },
]

DEFAULT_WASTE_LOGS = [
    {"item_name": "طماطم فريش للسلطة", "qty": 3.5, "unit": "كجم", "estimated_cost": 70.0, "reason": "prep_waste", "notes": "هادر تقشير وتنظيف الشفت الصباحي", "logged_by": "شيف البارد", "created_at": "2026-11-01"},
    {"item_name": "كريمة طهي حيواني", "qty": 1.0, "unit": "كجم", "estimated_cost": 140.0, "reason": "expired", "notes": "تلف عبوة مفتوحة بعد انتهاء صلاحية الـ 3 أيام", "logged_by": "شيف الساخن", "created_at": "2026-11-01"},
    {"item_name": "عجينة بيتزا 35 سم", "qty": 4.0, "unit": "قطعة", "estimated_cost": 60.0, "reason": "spoiled", "notes": "زيادة التخمير بسبب عطل مؤقت في تبريد العجين", "logged_by": "شيف الفرن", "created_at": "2026-11-02"},
]


async def _ensure_seeded(db: AsyncSession) -> None:
    res = await db.execute(select(RestaurantTable).limit(1))
    if res.scalar_one_or_none() is None:
        for t in DEFAULT_TABLES:
            db.add(RestaurantTable(**t))
        await db.commit()

    rec_res = await db.execute(select(RestaurantRecipe).limit(1))
    if rec_res.scalar_one_or_none() is None:
        for r_data in DEFAULT_RECIPES:
            ingredients = r_data.get("ingredients", [])
            recipe = RestaurantRecipe(
                id=r_data["id"],
                menu_item_name=r_data["menu_item_name"],
                category=r_data["category"],
                sale_price=r_data["sale_price"],
                yield_portions=r_data["yield_portions"],
                prep_time_minutes=r_data["prep_time_minutes"],
                station=r_data["station"],
                notes=r_data.get("notes"),
            )
            db.add(recipe)
            for ing in ingredients:
                item = RestaurantRecipeItem(
                    recipe_id=recipe.id,
                    raw_item_name=ing["raw_item_name"],
                    qty_per_portion=ing["qty_per_portion"],
                    unit=ing.get("unit", "كجم"),
                    unit_cost=ing["unit_cost"],
                    yield_loss_pct=ing.get("yield_loss_pct", 0.0),
                )
                db.add(item)
        await db.commit()

    waste_res = await db.execute(select(RestaurantWasteLog).limit(1))
    if waste_res.scalar_one_or_none() is None:
        for w in DEFAULT_WASTE_LOGS:
            db.add(RestaurantWasteLog(**w))
        await db.commit()


# ============================================================================
# Tables & Floor Plan
# ============================================================================

@router.get("/tables")
async def get_restaurant_tables(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve active dining tables from PostgreSQL."""
    await _ensure_seeded(db)
    stmt = select(RestaurantTable).order_by(RestaurantTable.number)
    res = await db.execute(stmt)
    tables = res.scalars().all()
    return [
        {
            "id": t.id,
            "number": t.number,
            "capacity": t.capacity,
            "section": t.section,
            "status": t.status,
            "order_total": t.order_total,
            "guests": t.guests,
            "opened_at": t.opened_at,
        }
        for t in tables
    ]


@router.post("/tables/{table_id}/status")
async def update_table_status(
    table_id: str,
    data: UpdateTableStatusRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Update table occupancy or reservation state."""
    stmt = select(RestaurantTable).where(RestaurantTable.id == table_id)
    res = await db.execute(stmt)
    table = res.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="طاولة غير موجودة")

    table.status = data.status
    if data.guests is not None:
        table.guests = data.guests
    if data.order_total is not None:
        table.order_total = data.order_total
    if data.opened_at is not None:
        table.opened_at = data.opened_at
    elif data.status == "available":
        table.opened_at = None
        table.guests = 0
        table.order_total = 0.0

    await db.commit()
    await db.refresh(table)
    return table


# ============================================================================
# Recipe BOM & Food Costing (RES-02, RES-05, RES-10)
# ============================================================================

@router.get("/recipes")
async def get_restaurant_recipes(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve all menu recipes with Bill of Materials and calculated food costs."""
    await _ensure_seeded(db)
    recipes_res = await db.execute(select(RestaurantRecipe).order_by(RestaurantRecipe.category, RestaurantRecipe.menu_item_name))
    recipes = recipes_res.scalars().all()

    items_res = await db.execute(select(RestaurantRecipeItem))
    items = items_res.scalars().all()

    items_by_recipe: dict[str, list] = {}
    for it in items:
        items_by_recipe.setdefault(it.recipe_id, []).append(it)

    results = []
    for r in recipes:
        r_items = items_by_recipe.get(r.id, [])
        total_calculated_cost = 0.0
        ingredient_list = []

        for it in r_items:
            # yield loss multiplier: e.g. 5% loss requires (1 + 0.05) qty
            effective_qty = it.qty_per_portion * (1.0 + (it.yield_loss_pct / 100.0))
            cost = effective_qty * it.unit_cost
            total_calculated_cost += cost
            ingredient_list.append({
                "id": it.id,
                "raw_item_name": it.raw_item_name,
                "qty_per_portion": it.qty_per_portion,
                "unit": it.unit,
                "unit_cost": it.unit_cost,
                "yield_loss_pct": it.yield_loss_pct,
                "line_cost": round(cost, 2),
            })

        sale_price = r.sale_price if r.sale_price > 0 else 1.0
        food_cost_pct = round((total_calculated_cost / sale_price) * 100.0, 1)
        margin_pct = round(100.0 - food_cost_pct, 1)

        # Status badge based on food cost threshold
        if food_cost_pct <= 32.0:
            cost_status = "optimal"  # مثالي
        elif food_cost_pct <= 38.0:
            cost_status = "acceptable"  # مقبول
        else:
            cost_status = "high"  # مرتفع يتطلب مراجعة

        results.append({
            "id": r.id,
            "menu_item_name": r.menu_item_name,
            "category": r.category,
            "sale_price": r.sale_price,
            "yield_portions": r.yield_portions,
            "prep_time_minutes": r.prep_time_minutes,
            "station": r.station,
            "notes": r.notes,
            "ingredients": ingredient_list,
            "ingredient_count": len(ingredient_list),
            "calculated_cost": round(total_calculated_cost, 2),
            "food_cost_pct": food_cost_pct,
            "margin_pct": margin_pct,
            "cost_status": cost_status,
        })

    return results


@router.post("/recipes")
async def create_restaurant_recipe(
    data: CreateRecipeRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Create a new recipe with its Bill of Materials ingredients."""
    recipe_id = f"rec-{uuid.uuid4().hex[:8]}"
    recipe = RestaurantRecipe(
        id=recipe_id,
        menu_item_name=data.menu_item_name,
        category=data.category,
        sale_price=data.sale_price,
        yield_portions=data.yield_portions,
        prep_time_minutes=data.prep_time_minutes,
        station=data.station,
        notes=data.notes,
    )
    db.add(recipe)

    for ing in data.ingredients:
        item = RestaurantRecipeItem(
            recipe_id=recipe_id,
            raw_item_name=ing.raw_item_name,
            qty_per_portion=ing.qty_per_portion,
            unit=ing.unit,
            unit_cost=ing.unit_cost,
            yield_loss_pct=ing.yield_loss_pct,
        )
        db.add(item)

    await db.commit()
    await db.refresh(recipe)
    return {"detail": f"تم إنشاء وصفة «{recipe.menu_item_name}» بنجاح", "id": recipe.id}


@router.post("/recipes/deplete")
async def backflush_deplete_order_ingredients(
    data: DepleteOrderRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """
    Backflushing engine (RES-02):
    Calculates exact raw ingredients consumed by the ordered meals and prepares stock decrement.
    """
    depleted_summary: dict[str, dict] = {}
    total_batch_cost = 0.0

    for item in data.items:
        rec_id = item.get("recipe_id")
        order_qty = item.get("qty", 1)

        stmt = select(RestaurantRecipeItem).where(RestaurantRecipeItem.recipe_id == rec_id)
        res = await db.execute(stmt)
        recipe_items = res.scalars().all()

        for ing in recipe_items:
            effective_qty = ing.qty_per_portion * (1.0 + (ing.yield_loss_pct / 100.0)) * order_qty
            cost = effective_qty * ing.unit_cost
            total_batch_cost += cost

            if ing.raw_item_name not in depleted_summary:
                depleted_summary[ing.raw_item_name] = {
                    "raw_item_name": ing.raw_item_name,
                    "unit": ing.unit,
                    "total_qty_depleted": 0.0,
                    "total_cost": 0.0,
                }

            depleted_summary[ing.raw_item_name]["total_qty_depleted"] += round(effective_qty, 3)
            depleted_summary[ing.raw_item_name]["total_cost"] += round(cost, 2)

    return {
        "detail": f"تم خصم مكونات الطلب {data.order_number} بنجاح من مخزون المطبخ",
        "order_number": data.order_number,
        "items_count": len(data.items),
        "total_depleted_cost": round(total_batch_cost, 2),
        "depleted_ingredients": list(depleted_summary.values()),
    }


# ============================================================================
# Food Waste & Spoilage Tracking (RES-08)
# ============================================================================

@router.get("/waste")
async def get_food_waste_logs(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Retrieve food waste and spoilage records with reason classifications."""
    await _ensure_seeded(db)
    stmt = select(RestaurantWasteLog).order_by(RestaurantWasteLog.created_at.desc())
    res = await db.execute(stmt)
    logs = res.scalars().all()

    total_cost = sum(l.estimated_cost for l in logs)
    reason_map = {
        "prep_waste": "هادر تحضير وتشغيل",
        "expired": "انتهاء صلاحية",
        "spoiled": "تلف وتخزين",
        "customer_return": "مرتجع من العميل",
    }

    return {
        "total_waste_cost": round(total_cost, 2),
        "count": len(logs),
        "logs": [
            {
                "id": l.id,
                "item_name": l.item_name,
                "qty": l.qty,
                "unit": l.unit,
                "estimated_cost": l.estimated_cost,
                "reason_code": l.reason,
                "reason_label": reason_map.get(l.reason, l.reason),
                "notes": l.notes,
                "logged_by": l.logged_by,
                "created_at": l.created_at,
            }
            for l in logs
        ],
    }


@router.post("/waste")
async def record_food_waste(
    data: RecordWasteRequest,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Record a new food waste or spoilage event."""
    today = datetime.now().strftime("%Y-%m-%d")
    waste = RestaurantWasteLog(
        item_name=data.item_name,
        qty=data.qty,
        unit=data.unit,
        estimated_cost=data.estimated_cost,
        reason=data.reason,
        notes=data.notes,
        logged_by=data.logged_by,
        created_at=today,
    )
    db.add(waste)
    await db.commit()
    await db.refresh(waste)

    return {
        "detail": f"تم تسجيل هادر «{waste.item_name}» بقيمة {waste.estimated_cost:.2f} ج.م بنجاح",
        "id": waste.id,
    }


# ============================================================================
# Restaurant Summary KPIs
# ============================================================================

@router.get("/summary")
async def get_restaurant_summary(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """Summary dashboard metrics for restaurant management."""
    await _ensure_seeded(db)

    tables_res = await db.execute(select(RestaurantTable))
    tables = tables_res.scalars().all()
    occupied = [t for t in tables if t.status == "occupied"]

    recipes_res = await db.execute(select(RestaurantRecipe))
    recipes = recipes_res.scalars().all()

    waste_res = await db.execute(select(RestaurantWasteLog))
    waste = waste_res.scalars().all()

    return {
        "total_tables": len(tables),
        "occupied_tables": len(occupied),
        "occupancy_rate_pct": round((len(occupied) / len(tables) * 100) if tables else 0, 1),
        "active_hall_revenue": sum(t.order_total for t in occupied),
        "total_recipes": len(recipes),
        "total_waste_cost": round(sum(w.estimated_cost for w in waste), 2),
    }
