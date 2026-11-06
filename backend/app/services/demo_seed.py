"""Tailored demo-data seeding for new tenants.

After the onboarding wizard, a tenant's workspace is populated with a
realistic catalog, parties, opening stock, and two weeks of sales shaped
by their business activity (sector) and declared scale — so the trial
feels like *their* shop, not a generic sandbox.
"""
import random
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.party import Customer, Supplier
from app.models.payment_wallet import PaymentWallet
from app.models.product import Category, Product, Subcategory
from app.models.safe import Safe
from app.models.sale import Sale, SaleItem, SaleMode, SaleStatus
from app.models.sale_payment import SalePayment
from app.models.stock_balance import StockBalance
from app.models.warehouse import Warehouse

rng = random.Random(20260131)

# ── sector catalogs: (category, [products]) — realistic Arabic trade names ──
SECTORS: dict[str, list[tuple[str, list[str]]]] = {
    "retail": [
        ("مواد غذائية وبقالة", ["أرز مصري درجة أولى 1 كجم", "سكر أبيض ناعم 1 كجم", "زيت عباد الشمس 800 مل", "مكرونة فرن 400 جم", "شاي أسود فاخر 250 جم"]),
        ("ألبان وأجبان", ["جبنة بيضاء براميلي 1 كجم", "لبن كامل الدسم 1 لتر", "جبنة رومي قديمة 500 جم", "زبادي طبيعي 105 جم"]),
        ("مشروبات وعصائر", ["عصير برتقال طبيعي 1 لتر", "مياه معدنية 1.5 لتر", "مشروب غازي كانز 330 مل"]),
        ("منظفات وعناية", ["مسحوق غسيل أوتوماتيك 3 كجم", "سائل غسيل أطباق 1 لتر", "صابون يد معقم 120 جم", "مناديل مطبخ رول"]),
    ],
    "restaurant": [
        ("أطباق رئيسية", ["وجبة برجر لحم فاخر دبل", "بيتزا مارجريتا إيطالي وسط", "طاجن مكرونة بشاميل باللحم", "شيش طاووق مشوي مع أرز", "وجبة كرسبي دجاج 4 قطع"]),
        ("مقبلات وسلطات", ["سلطة خضراء طازجة", "بطاطس محمرة كرسبي", "شوربة كريمة بالدجاج", "حلقات بصل مقلية"]),
        ("مشروبات ساخنة", ["قهوة تركي بن محوج", "كابتشينو إيطالي فوم", "شاي كرك بالحليب", "إسبريسو دبل"]),
        ("مشروبات باردة", ["سموذي فراولة طبيعي", "عصير ليمون بالنعناع مثلج", "موهيتو توت منعش", "ميلك شيك شوكولاتة"]),
        ("حلويات", ["تشيز كيك لوتس", "كيك شوكولاتة فادج", "أم علي بالمكسرات"]),
    ],
    "school": [
        ("رسوم دراسية", ["قسط دراسي أول - مرحلة ابتدائية", "قسط دراسي ثاني - مرحلة إعدادية", "رسوم تسجيل وقيد سنوي", "رسوم اشتراك حافلة المدرسة"]),
        ("كتب ومطبوعات", ["كتاب اللغة العربية والخط", "كتاب الرياضيات والعلوم", "مذكرة تدريبات اللغات", "دفتر واجبات مدرسي"]),
        ("زي مدرسي", ["قميص مدرسي قطن مطرز", "بنطلون زي مدرسي كحلي", "جاكيت شتوي بشعار المدرسة"]),
        ("أنشطة ورحلات", ["اشتراك النشاط الرياضي والسباحة", "رحلة مدرسية استكشافية", "دورة حاسب آلي وتطوير"]),
    ],
    "services": [
        ("خدمات استشارية", ["استشارة إدارية وتطوير أعمال", "دراسة جدوى تسويقية", "إعداد خطة تشغيل سنوية"]),
        ("عقود تشغيل وصيانة", ["عقد صيانة شبكات وحواسب", "عقد دعم فني شهري", "تأمين ودعم أنظمة سحابية"]),
        ("خدمات مهنية ومشاريع", ["إشراف هندسي وتنفيذي", "خدمات تسويق وحملات رقمية", "تصميم هوية بصرية متكاملة"]),
    ],
    "healthcare": [
        ("أدوية ومسكنات", ["مسكن باراسيتامول 500 مجم", "مضاد حيوي كبسولات 1 جم", "فيتامين C فوار 1000 مجم", "أقراص استحلاب للحلق"]),
        ("عناية ومستلزمات", ["شاش معقم طبي 10×10", "لاصق جروح طبي علبة", "كحول طبي معقم 70% 500 مل", "جهاز قياس ضغط رقمي"]),
        ("فيتامينات ومكملات", ["أوميجا 3 بلس كبسولات", "فيتامين د 5000 وحدة", "مكمل غذائي كالسيوم وزنك"]),
    ],
    "plumbing": [
        ("خلاطات ومحابس", ["خلاط مربط فراع واحد كروم", "خلاط حوض بيس عصا", "حنف حوض يبس", "حنف بانيو دبلوم", "صنبور سقف مربع", "محبس زاوية ½"]),
        ("مواسير ووصلات", ["ماسورة PVC صرف 4 بوصة", "ماسورة PPR نطفة 25 مم", "كوع PVC 90°", "وصلية بروز ½", "حوامل مواسير", "فلنجة تركية 2 بوصة"]),
        ("أطقم حمامات", ["كورة أرضية نواتنج", "كورة حائط مدمسة", "شنيور أرضي بلاستك", "طقم غسونة خزف", "مغسلة بورسلان أبيض"]),
        ("سخانات", ["سخان كهربائي 50 لتر", "سخان غاز 30 لتر", "سخان فوري 7 كيلو", "منظم حرارة سخان"]),
        ("لاصق وعزل", ["لاصق بلاط بورتلاند", "عزل مائي أسمنتي", "سيليكون شفاف", "شريط عزل لحام", "فوم جوانب"]),
    ],
    "electrical": [
        ("أسلاك وكوابل", ["سلك نحاس 1.5 مم أحمر", "سلك نحاس 2.5 مم أزرق", "كوابل مسلحة 3×2.5", "كرتونة سلك 100 متر"]),
        ("قواطع ولوحات", ["قاطع كهربائي 16 أمبير", "قاطع رئيسي 63 أمبير", "مفتاح لمبة نقطة", "بريزة أرضية دبل", "لوحة تجزيء 12 خط"]),
        ("إضاءة", ["لمبة ليد 9 وات", "لمبة موفرة 14 وات", "كشاف سقف 24 وات", "نيون ليد شريط 5 متر"]),
        ("مراوح وتجهيزات", ["مروحة سقف 56 بوصة", "مروحة حائط 16 بوصة", "جرار تهوية 8 بوصة", "جرس باب كهربائي"]),
    ],
    "tiles": [
        ("بلاط أرضيات", ["بورسلان أرضيات 60×60 بيج", "سيراميك أرضيات 45×45 رمادي", "بورسلان لامع 80×80", "بلاط مقاوم انزلاق 30×30"]),
        ("بلاط حوائط", ["سيراميك حوائط 25×40 أبيض", "ديكور حائط 3D", "سيراميك مطبخ 20×25"]),
        ("جرانيت ورخام", ["جرانيت طبيعي رمادي", "رخام صعيدي مصقول", "درابزين رخام"]),
        ("مواد لصق ولواصق", ["لاصق بلاط أبيض", "جروت رمادي", "تبارك عزل", "مكحول لوني"]),
    ],
    "paint": [
        ("دهانات داخلي", ["بلاستيك مطفي أبيض", "بلاستيك لامع كريمي", "دهان مائي ناعم", "لوكس داخلي فاخر"]),
        ("دهانات خارجي", ["سيلو بلاست رمادي", "دهان واجهات أبيض", "تكسر خشبي بني", "كاتم صدا أسود"]),
        ("معاجين وأساسات", ["معجون أكريليك", "برايمر عزل", "سيلر أساس", "ماسح جدران"]),
        ("أدوات دهان", ["فرشاة 4 بوصة", "رول فرش 9 بوصة", "صينية دهان", "شريط لاصق ورنيش"]),
    ],
}

WALLET_NAMES = ["خزينة الفرع", "محفظة فودافون كاش", "محفظة انستاباي"]
CUSTOMER_NAMES = ["محمد عبد الله", "شركة النهضة للمقاولات", "ورشة السباك الحديثة", "أحمد سيد", "م. كريم فؤاد", "مؤسسة البناء المتين", "حسن إبراهيم", "ورشة الهرم للتكييف", "سمير رمضان", "شركة الأمل للتشطيبات", "مصطفى كامل", "ورشة النور", "عمرو زكي", "مؤسسة الصفوة", "إبراهيم نجيب", "شركة الوفاء", "ياسر عبد العال", "ورشة المعادي الحديثة", "خالد شوقي", "تسنيم للتركيبات"]
SUPPLIER_NAMES = ["شركة الأهرام للتوريدات", "مصنع الدلتا للبلاستك", "الوكيل التجاري الصيني", "مجموعة النيل التجارية", "مستوردون مصر", "مصنع الشرق للمواسير", "الشرق الأوسط للتوريدات", "بيت الخبرة للتوريدات", "النور للاستيراد", "المتحدون للتوريدات", "توكيل تركي", "إمبورت كو"]

BRANCH_NAMES = ["الفرع الرئيسي", "فرع المعادي", "فرع مدينة نصر", "فرع 6 أكتوبر", "فرع مدينة نصر الجديدة"]

# scale → (branches, products, customers, suppliers, sales-14d)
SCALES = {"small": (1, 24, 6, 4, 45), "medium": (3, 60, 12, 7, 110), "large": (5, 110, 20, 10, 200)}

PALETTE_HUES = {
    "slate": 240,
    "cobalt": 250,
    "emerald": 155,
    "amber": 75,
    "monokai": 255,
    "water": 250,
    "copper": 55,
    "midnight": 230,
}


async def seed_demo(db: AsyncSession, tenant_id: uuid.UUID, owner_id: uuid.UUID,
                    sector: str, scale: str, features: list[str]) -> None:
    """Populate a fresh tenant with a believable, sector-tailored workspace."""
    sector = sector if sector in SECTORS else "plumbing"
    n_branches, n_products, n_customers, n_suppliers, n_sales = SCALES.get(scale, SCALES["medium"])
    catalog = SECTORS[sector]
    now = datetime.now(UTC)

    # branches
    warehouses: list[Warehouse] = []
    for i in range(n_branches):
        warehouses.append(Warehouse(
            id=uuid.uuid4(), code=f"WH{i+1}", name=BRANCH_NAMES[i % len(BRANCH_NAMES)],
            warehouse_type="showroom" if i == 0 else "warehouse",
            is_demo=True,
        ))
    db.add_all(warehouses)
    await db.flush()  # FK targets exist before any referencing row

    # catalog
    categories: list[Category] = []
    products: list[Product] = []
    for cat_seq, (cat_name, items) in enumerate(catalog, start=1):
        cat = Category(id=uuid.uuid4(), name=cat_name, code=f"C{cat_seq:02d}", is_demo=True)
        sub = Subcategory(id=uuid.uuid4(), category=cat, name=cat_name, code=f"S{cat_seq:02d}", is_demo=True)
        categories.append(cat)
        for j in range(n_products // len(catalog) + 1):
            if len(products) >= n_products:
                break
            base_name = items[j % len(items)]
            variant = ["", " — جودة أولى", " (عرض خاص)", " — سوق محلي", " — استيراد"][len(products) % 5]
            cost = Decimal(rng.randrange(15, 900))
            retail = (cost * Decimal("1.35")).quantize(Decimal("0.25"))
            products.append(Product(
                id=uuid.uuid4(), subcategory_id=sub.id, name=base_name + variant,
                code=f"P{len(products)+1:04d}", barcode=f"62{rng.randrange(10**11, 10**12)}",
                unit=rng.choice(["عدد", "عدد", "عدد", "متر", "كجم"]),
                retail_price=retail, wholesale_price=(retail * Decimal("0.88")).quantize(Decimal("0.25")),
                cost_price=cost, reorder_point=Decimal(rng.randrange(5, 25)),
                is_active=True, is_demo=True,
            ))
    db.add_all(categories)
    db.add_all(products)

    # parties
    customers = [Customer(id=uuid.uuid4(), name=CUSTOMER_NAMES[i % len(CUSTOMER_NAMES)],
                          phone=f"01{rng.randrange(1, 3)}{rng.randrange(10**8)}", is_cash=(i == 0), is_demo=True)
                 for i in range(n_customers)]
    suppliers = [Supplier(id=uuid.uuid4(), name=SUPPLIER_NAMES[i % len(SUPPLIER_NAMES)],
                          phone=f"02{rng.randrange(10**7)}", type="supplier", is_demo=True)
                 for i in range(n_suppliers)]
    if features and "credit" in features:
        for c in customers[1:4]:
            c.credit_limit = Decimal(rng.randrange(5_000, 50_000))
    db.add_all(customers)
    db.add_all(suppliers)
    await db.flush()

    # treasury
    db.add_all([
        PaymentWallet(id=uuid.uuid4(), name=WALLET_NAMES[0], type="cash", is_demo=True),
        PaymentWallet(id=uuid.uuid4(), name=WALLET_NAMES[1], type="mobile", is_demo=True),
    ])
    db.add(Safe(id=uuid.uuid4(), name="الخزينة الرئيسية", balance=Decimal("25000"), is_demo=True))

    # opening stock (skip — balances start from sales math below; give stock life)
    balances: list[StockBalance] = []
    for w in warehouses:
        for p in products:
            qty = Decimal(rng.randrange(0, 220))
            if rng.random() < 0.12:  # a few real low-stock items for the dashboard
                qty = Decimal(rng.randrange(0, 4))
            balances.append(StockBalance(product_id=p.id, warehouse_id=w.id, qty=qty, is_demo=True))
    db.add_all(balances)

    # two weeks of confirmed sales (cash-heavy, some credit, cancellations sprinkled)
    day_total = {i: Decimal("0") for i in range(14)}
    sales: list[Sale] = []
    payments: list[SalePayment] = []
    for k in range(n_sales):
        days_ago = rng.randrange(0, 14)
        ts = now - timedelta(days=days_ago, hours=rng.randrange(1, 12))
        w = rng.choice(warehouses)
        cust = None if rng.random() < 0.55 else rng.choice(customers)
        is_credit = bool(cust and not cust.is_cash and rng.random() < 0.3)
        n_items = rng.randrange(1, 4)
        picked = rng.sample(products, n_items)
        total = Decimal("0")
        sale = Sale(
            id=uuid.uuid4(), invoice_number=f"INV-{100000 + k + 1}",
            customer_id=cust.id if cust else None, warehouse_id=w.id, cashier_id=owner_id,
            created_by=owner_id, sale_mode=SaleMode.wholesale if (cust and rng.random() < 0.4) else SaleMode.retail,
            status=SaleStatus.cancelled if rng.random() < 0.05 else SaleStatus.confirmed,
            is_credit=is_credit, payment_method="credit" if is_credit else "cash",
            created_at=ts, is_demo=True,
        )
        for p in picked:
            qty = Decimal(rng.randrange(1, 6))
            price = p.retail_price
            total += price * qty
            sale.items.append(SaleItem(
                id=uuid.uuid4(), product_id=p.id, qty=qty, unit_price=price,
                unit_cost=p.cost_price, discount=Decimal("0"), is_demo=True,
            ))
        sale.total = total
        sale.net_total = total
        sale.paid_amount = Decimal("0") if is_credit else total
        if not is_credit:
            payments.append(SalePayment(
                id=uuid.uuid4(), sale_id=sale.id, method="cash", amount=total, created_at=ts, is_demo=True,
            ))
        if sale.status == SaleStatus.confirmed:
            day_total[days_ago] += total
        sales.append(sale)
    db.add_all(sales)
    db.add_all(payments)
    await db.flush()

    if sector == "healthcare":
        try:
            from app.modules.healthcare_clinic.router import _seed_clinic_records
            await _seed_clinic_records(db, str(tenant_id))
        except Exception:
            pass
