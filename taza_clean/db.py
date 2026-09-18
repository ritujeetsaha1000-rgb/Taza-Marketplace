"""
Database Seeder Script for TAZA Agri-Tech Platform (MongoDB Backend)
Populates West Bengal agricultural profiles, Mandi benchmarks, demo farmers,
consumers, and live crop listings with realistic harvest timestamps.
"""

import asyncio
from datetime import datetime, timedelta, timezone, date

from app.core.database import get_db, init_db, get_next_sequence_value
from app.core.security import get_password_hash
from app.models.user import UserRole, BuyerType
from app.models.product import CropCategory, CropGrade
from app.models.market_farmer import SubGroupEnum
from app.seeds.west_bengal_data import WEST_BENGAL_DISTRICTS, MANDI_BENCHMARKS


async def seed_database():
    print("[INIT] Ensuring MongoDB Database Indexes...")
    await init_db()
    database = await get_db()

    # 1. Seed West Bengal District Agricultural Metrics
    print("[DATA] Seeding West Bengal District Agricultural Metrics...")
    for dist in WEST_BENGAL_DISTRICTS:
        existing = await database["district_metrics"].find_one({"district_name": dist["district_name"]})
        if not existing:
            dist_id = await get_next_sequence_value(database, "district_id")
            doc = {
                "id": dist_id,
                "district_name": dist["district_name"],
                "state": dist["state"],
                "soil_type": dist["soil_type"],
                "annual_rainfall_mm": dist["annual_rainfall_mm"],
                "agro_climatic_zone": dist["agro_climatic_zone"],
                "primary_crops": dist["primary_crops"],
                "harvest_seasons": dist["harvest_seasons"],
                "baseline_yield_per_acre_kg": dist["baseline_yield_per_acre_kg"],
                "cold_storage_capacity_tonnes": dist["cold_storage_capacity_tonnes"],
                "active_fpos_count": dist["active_fpos_count"],
                "centroid_lat": dist["centroid_lat"],
                "centroid_lng": dist["centroid_lng"]
            }
            await database["district_metrics"].insert_one(doc)
    print(f"[OK] Loaded {len(WEST_BENGAL_DISTRICTS)} West Bengal district profiles.")

    # 2. Seed Mandi APMC Price Benchmarks
    print("[DATA] Seeding Mandi APMC Benchmark Prices...")
    for mb in MANDI_BENCHMARKS:
        existing = await database["mandi_benchmarks"].find_one({
            "district_name": mb["district_name"],
            "crop_name": mb["crop_name"]
        })
        if not existing:
            mb_id = await get_next_sequence_value(database, "mandi_benchmark_id")
            doc = {
                "id": mb_id,
                "district_name": mb["district_name"],
                "mandi_name": mb["mandi_name"],
                "crop_name": mb["crop_name"],
                "category": mb.get("category"),
                "variety": mb.get("variety"),
                "modal_price_per_kg": mb["modal_price_per_kg"],
                "min_price_per_kg": mb["min_price_per_kg"],
                "max_price_per_kg": mb["max_price_per_kg"],
                "arrival_quantity_tonnes": mb["arrival_quantity_tonnes"],
                "reported_date": str(date.today()),
                "source_agency": mb["source_agency"]
            }
            await database["mandi_benchmarks"].insert_one(doc)
        else:
            await database["mandi_benchmarks"].update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "mandi_name": mb["mandi_name"],
                    "category": mb.get("category"),
                    "variety": mb.get("variety"),
                    "modal_price_per_kg": mb["modal_price_per_kg"],
                    "min_price_per_kg": mb["min_price_per_kg"],
                    "max_price_per_kg": mb["max_price_per_kg"],
                    "arrival_quantity_tonnes": mb["arrival_quantity_tonnes"],
                    "reported_date": str(date.today()),
                    "source_agency": mb["source_agency"]
                }}
            )
    print(f"[OK] Loaded & Synced {len(MANDI_BENCHMARKS)} Mandi price benchmarks.")

    # 3. Seed Demo Farmers across West Bengal hubs
    print("[DATA] Seeding Demo Farmers & FPOs...")
    demo_farmers = [
        {
            "email": "ananda.mondal@farmer.taza.in",
            "phone": "+919830112201",
            "name": "Ananda Mondal",
            "role": UserRole.FARMER,
            "profile": {
                "district": "Hooghly",
                "block": "Singur",
                "village": "Balarambati",
                "farm_size_acres": 3.5,
                "kisan_credit_card_no": "KCC-WB-HG-8841",
                "latitude": 22.8124,
                "longitude": 88.2345,
                "fpo_affiliation": "Singur Agro Producers Co-operative",
                "primary_crops": "Jyoti Potato, Chandramukhi, Jute"
            }
        },
        {
            "email": "pranab.biswas@farmer.taza.in",
            "phone": "+919830112202",
            "name": "Pranab Biswas",
            "role": UserRole.FARMER,
            "profile": {
                "district": "Nadia",
                "block": "Ranaghat I",
                "village": "Habibpur",
                "farm_size_acres": 2.2,
                "kisan_credit_card_no": "KCC-WB-ND-3329",
                "latitude": 23.1812,
                "longitude": 88.5821,
                "fpo_affiliation": "Nadia Green Produce Collective",
                "primary_crops": "Pointed Gourd (Potol), Cauliflower, Bottle Gourd"
            }
        },
        {
            "email": "subhash.ghosh@farmer.taza.in",
            "phone": "+919830112203",
            "name": "Subhash Ghosh (FPO Lead)",
            "role": UserRole.FPO,
            "profile": {
                "district": "Purba Bardhaman",
                "block": "Memari II",
                "village": "Satgachia",
                "farm_size_acres": 8.0,
                "kisan_credit_card_no": "KCC-WB-BD-9912",
                "latitude": 23.1645,
                "longitude": 88.1189,
                "fpo_affiliation": "Bardhaman Rice & Grain Growers Sangh",
                "primary_crops": "Gobindobhog Rice, Minikit Paddy, Mustard"
            }
        },
        {
            "email": "tapas.sarkar@farmer.taza.in",
            "phone": "+919830112204",
            "name": "Tapas Sarkar",
            "role": UserRole.FARMER,
            "profile": {
                "district": "Malda",
                "block": "English Bazar",
                "village": "Kotwali",
                "farm_size_acres": 4.5,
                "kisan_credit_card_no": "KCC-WB-ML-4410",
                "latitude": 25.0021,
                "longitude": 88.1342,
                "fpo_affiliation": "Malda Mango & Silk Growers FPO",
                "primary_crops": "Himsagar Mango, Fazli, Langra, Litchi"
            }
        }
    ]

    farmer_user_map = {}
    now_utc = datetime.now(timezone.utc)

    for df in demo_farmers:
        existing = await database["users"].find_one({"email": df["email"]})
        if not existing:
            user_id = await get_next_sequence_value(database, "user_id")
            prof_data = df["profile"]
            farmer_prof = {
                "id": user_id,
                "user_id": user_id,
                "district": prof_data["district"],
                "block": prof_data["block"],
                "village": prof_data["village"],
                "farm_size_acres": prof_data["farm_size_acres"],
                "kisan_credit_card_no": prof_data["kisan_credit_card_no"],
                "latitude": prof_data["latitude"],
                "longitude": prof_data["longitude"],
                "fpo_affiliation": prof_data["fpo_affiliation"],
                "primary_crops": prof_data["primary_crops"],
                "rating": 4.9,
                "total_sales_kg": 1200.0,
            }
            user_doc = {
                "id": user_id,
                "email": df["email"],
                "phone": df["phone"],
                "hashed_password": get_password_hash("Farmer@123"),
                "full_name": df["name"],
                "role": df["role"].value if hasattr(df["role"], "value") else df["role"],
                "is_active": True,
                "is_verified": True,
                "created_at": now_utc,
                "updated_at": now_utc,
                "farmer_profile": farmer_prof,
                "consumer_profile": None,
            }
            await database["users"].insert_one(user_doc)
            farmer_user_map[df["email"]] = user_doc
        else:
            farmer_user_map[df["email"]] = existing

    print(f"[OK] Demo Farmers and FPO leads registered.")

    # 4. Seed Demo Consumers & Bulk Buyers
    print("[DATA] Seeding Demo Consumers & Bulk Buyers...")
    demo_consumers = [
        {
            "email": "sourav.banerjee@consumer.taza.in",
            "phone": "+919830223301",
            "name": "Sourav Banerjee",
            "buyer_type": BuyerType.INDIVIDUAL,
            "profile": {
                "delivery_address": "Flat 4B, Greenfield City, Behala Chowrasta",
                "district": "Kolkata",
                "pincode": "700061",
                "latitude": 22.4986,
                "longitude": 88.3102
            }
        },
        {
            "email": "bhojohori.manya@restaurant.taza.in",
            "phone": "+919830223302",
            "name": "Bhojohorir Rannaghar (Chef Arindam)",
            "buyer_type": BuyerType.RESTAURANT,
            "profile": {
                "delivery_address": "Sector V, Salt Lake, Near College More",
                "district": "North 24 Parganas",
                "pincode": "700091",
                "latitude": 22.5801,
                "longitude": 88.4312,
                "gstin": "19AABCU9603R1ZM"
            }
        }
    ]

    for dc in demo_consumers:
        existing = await database["users"].find_one({"email": dc["email"]})
        if not existing:
            user_id = await get_next_sequence_value(database, "user_id")
            prof_data = dc["profile"]
            consumer_prof = {
                "id": user_id,
                "user_id": user_id,
                "buyer_type": dc["buyer_type"].value if hasattr(dc["buyer_type"], "value") else dc["buyer_type"],
                "delivery_address": prof_data["delivery_address"],
                "district": prof_data["district"],
                "pincode": prof_data["pincode"],
                "latitude": prof_data["latitude"],
                "longitude": prof_data["longitude"],
                "gstin": prof_data.get("gstin"),
            }
            user_doc = {
                "id": user_id,
                "email": dc["email"],
                "phone": dc["phone"],
                "hashed_password": get_password_hash("Consumer@123"),
                "full_name": dc["name"],
                "role": UserRole.CONSUMER.value,
                "is_active": True,
                "is_verified": True,
                "created_at": now_utc,
                "updated_at": now_utc,
                "farmer_profile": None,
                "consumer_profile": consumer_prof,
            }
            await database["users"].insert_one(user_doc)

    print(f"[OK] Demo Consumers registered.")

    # 5. Seed Crop Listings with realistic harvest timestamps
    print("[DATA] Seeding Crop Listings with Live Freshness Timestamps...")
    sample_listings = [
        {
            "farmer_email": "pranab.biswas@farmer.taza.in",
            "crop_name": "Red Onion (Peyaj)",
            "variety": "Nasik Red / Sukh Sagar",
            "category": CropCategory.VEGETABLES,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 600.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 42.00,
            "harvest_timestamp": now_utc - timedelta(hours=5),
            "shelf_life_hours": 168,
            "freshness_decay_lambda": 0.008,
            "district": "Nadia",
            "latitude": 23.1812,
            "longitude": 88.5821,
            "description": "Crisp dried red onions with pungent aroma, fresh from Nadia alluvial belt.",
            "is_organic": False,
            "image_url": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=60"
        },
        {
            "farmer_email": "tapas.sarkar@farmer.taza.in",
            "crop_name": "Fresh Mountain Ginger (Ada)",
            "variety": "Gorubathan Organic Special",
            "category": CropCategory.SPICES,
            "grade": CropGrade.ORGANIC_CERTIFIED,
            "quantity_available_kg": 150.0,
            "minimum_order_kg": 0.25,
            "expected_base_price_per_kg": 105.00,
            "harvest_timestamp": now_utc - timedelta(hours=10),
            "shelf_life_hours": 240,
            "freshness_decay_lambda": 0.005,
            "district": "Darjeeling",
            "latitude": 25.0021,
            "longitude": 88.1342,
            "description": "Aromatic juicy mountain ginger harvested at Gorubathan hill slopes.",
            "is_organic": True,
            "image_url": "/images/ginger.webp"
        },
        {
            "farmer_email": "pranab.biswas@farmer.taza.in",
            "crop_name": "White Garlic (Rosun)",
            "variety": "Yamuna Safed Grade A",
            "category": CropCategory.SPICES,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 200.0,
            "minimum_order_kg": 0.25,
            "expected_base_price_per_kg": 140.00,
            "harvest_timestamp": now_utc - timedelta(hours=12),
            "shelf_life_hours": 360,
            "freshness_decay_lambda": 0.004,
            "district": "Nadia",
            "latitude": 23.1812,
            "longitude": 88.5821,
            "description": "Tight-clove pungent white garlic bulbs, sundried naturally.",
            "is_organic": False,
            "image_url": "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&auto=format&fit=crop&q=60"
        },
        {
            "farmer_email": "ananda.mondal@farmer.taza.in",
            "crop_name": "Fresh Hybrid Tomato",
            "variety": "Pusa Ruby / Abhinav",
            "category": CropCategory.VEGETABLES,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 400.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 48.00,
            "harvest_timestamp": now_utc - timedelta(hours=3),
            "shelf_life_hours": 72,
            "freshness_decay_lambda": 0.018,
            "district": "Hooghly",
            "latitude": 22.8124,
            "longitude": 88.2345,
            "description": "Firm, vine-ripened red hybrid tomatoes harvested at dawn in Singur.",
            "is_organic": True,
            "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=60"
        },
        {
            "farmer_email": "tapas.sarkar@farmer.taza.in",
            "crop_name": "Crisp Red Apple",
            "variety": "Royal Delicious Grade A",
            "category": CropCategory.FRUITS,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 300.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 145.00,
            "harvest_timestamp": now_utc - timedelta(hours=18),
            "shelf_life_hours": 240,
            "freshness_decay_lambda": 0.007,
            "district": "Darjeeling",
            "latitude": 25.0021,
            "longitude": 88.1342,
            "description": "Juicy sweet crisp red apples from North Bengal hill orchards.",
            "is_organic": True,
            "image_url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=60"
        },
        {
            "farmer_email": "pranab.biswas@farmer.taza.in",
            "crop_name": "Muktakeshi Eggplant (Begun)",
            "variety": "Muktakeshi Deep Purple",
            "category": CropCategory.VEGETABLES,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 250.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 55.00,
            "harvest_timestamp": now_utc - timedelta(hours=4),
            "shelf_life_hours": 60,
            "freshness_decay_lambda": 0.022,
            "district": "Nadia",
            "latitude": 23.1812,
            "longitude": 88.5821,
            "description": "Glossy seedless tender brinjal, ideal for authentic Bengali begun bhaja.",
            "is_organic": True,
            "image_url": "/images/brinjal.jpg"
        },
        {
            "farmer_email": "ananda.mondal@farmer.taza.in",
            "crop_name": "Chandramukhi Potato",
            "variety": "Kufri Chandramukhi Royal",
            "category": CropCategory.TUBERS,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 700.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 13.00,
            "harvest_timestamp": now_utc - timedelta(hours=8),
            "shelf_life_hours": 120,
            "freshness_decay_lambda": 0.012,
            "district": "Hooghly",
            "latitude": 22.8124,
            "longitude": 88.2345,
            "description": "Soft-boiling creamy Chandramukhi potatoes, beloved across Bengal households.",
            "is_organic": True,
            "image_url": "/images/chandramukhi_potato.jpg"
        },
        {
            "farmer_email": "ananda.mondal@farmer.taza.in",
            "crop_name": "Jyoti Potato",
            "variety": "Kufri Jyoti Fresh Harvest",
            "category": CropCategory.TUBERS,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 900.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 8.50,
            "harvest_timestamp": now_utc - timedelta(hours=3),
            "shelf_life_hours": 120,
            "freshness_decay_lambda": 0.012,
            "district": "Hooghly",
            "latitude": 22.8124,
            "longitude": 88.2345,
            "description": "Unwashed farm-gate fresh Singur Jyoti potatoes straight from red alluvial soil.",
            "is_organic": False,
            "image_url": "/images/jyoti_potato.webp"
        },
        {
            "farmer_email": "pranab.biswas@farmer.taza.in",
            "crop_name": "Pointed Gourd (Potol)",
            "variety": "Dandali Tender Green",
            "category": CropCategory.VEGETABLES,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 180.0,
            "minimum_order_kg": 0.25,
            "expected_base_price_per_kg": 48.00,
            "harvest_timestamp": now_utc - timedelta(hours=4),
            "shelf_life_hours": 48,
            "freshness_decay_lambda": 0.024,
            "district": "Nadia",
            "latitude": 23.1812,
            "longitude": 88.5821,
            "description": "Tender crisp green pointed gourds harvested at morning dew in Ranaghat.",
            "is_organic": True,
            "image_url": "/images/potol.webp"
        },
        {
            "farmer_email": "tapas.sarkar@farmer.taza.in",
            "crop_name": "Fresh Orange Carrot (Gajar)",
            "variety": "Pusa Rudhira Sweet",
            "category": CropCategory.VEGETABLES,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 220.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 55.00,
            "harvest_timestamp": now_utc - timedelta(hours=6),
            "shelf_life_hours": 96,
            "freshness_decay_lambda": 0.015,
            "district": "Darjeeling",
            "latitude": 25.0021,
            "longitude": 88.1342,
            "description": "Crunchy sweet mountain carrots rich in beta carotene.",
            "is_organic": True,
            "image_url": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=60"
        },
        {
            "farmer_email": "tapas.sarkar@farmer.taza.in",
            "crop_name": "Green Bell Capsicum (Shimla Mirch)",
            "variety": "California Wonder Crisp",
            "category": CropCategory.VEGETABLES,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 160.0,
            "minimum_order_kg": 0.25,
            "expected_base_price_per_kg": 55.00,
            "harvest_timestamp": now_utc - timedelta(hours=5),
            "shelf_life_hours": 72,
            "freshness_decay_lambda": 0.020,
            "district": "Darjeeling",
            "latitude": 25.0021,
            "longitude": 88.1342,
            "description": "Thick-walled crunchy green capsicum harvested in polyhouse shade.",
            "is_organic": True,
            "image_url": "/images/capsicum.webp"
        },
        {
            "farmer_email": "tapas.sarkar@farmer.taza.in",
            "crop_name": "Sweet Lime / Mousambi (Pack of 4)",
            "variety": "Nagpur Juicy Sweet Lime",
            "category": CropCategory.FRUITS,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 200.0,
            "minimum_order_kg": 1.0,
            "expected_base_price_per_kg": 35.00,
            "harvest_timestamp": now_utc - timedelta(hours=14),
            "shelf_life_hours": 168,
            "freshness_decay_lambda": 0.010,
            "district": "Malda",
            "latitude": 25.0021,
            "longitude": 88.1342,
            "description": "Juice-packed fresh sweet limes (mousambi), naturally ripened without ethylene gas.",
            "is_organic": True,
            "image_url": "/images/mousambi.webp"
        },
        {
            "farmer_email": "pranab.biswas@farmer.taza.in",
            "crop_name": "Bengal Martaman Banana (Kola)",
            "variety": "Martaman GI Heritage (12 pcs / Dozen)",
            "category": CropCategory.FRUITS,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 300.0,
            "minimum_order_kg": 1.0,
            "expected_base_price_per_kg": 35.00,
            "harvest_timestamp": now_utc - timedelta(hours=10),
            "shelf_life_hours": 96,
            "freshness_decay_lambda": 0.016,
            "district": "Nadia",
            "latitude": 23.1812,
            "longitude": 88.5821,
            "description": "Naturally tree-ripened fragrant Martaman bananas, 12 pieces per dozen bunch.",
            "is_organic": True,
            "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=60"
        },
        {
            "farmer_email": "subhash.ghosh@farmer.taza.in",
            "crop_name": "Ruby Pomegranate (Bedana)",
            "variety": "Bhagwa Sweet Ruby",
            "category": CropCategory.FRUITS,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 180.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 155.00,
            "harvest_timestamp": now_utc - timedelta(hours=16),
            "shelf_life_hours": 240,
            "freshness_decay_lambda": 0.007,
            "district": "Purba Bardhaman",
            "latitude": 23.1645,
            "longitude": 88.1189,
            "description": "Glossy red pomegranate filled with sweet, soft-seeded ruby arils.",
            "is_organic": True,
            "image_url": "/images/pomegranate.webp"
        },
        {
            "farmer_email": "ananda.mondal@farmer.taza.in",
            "crop_name": "Fresh Bottle Gourd Greens (Lau Shak)",
            "variety": "Desi Tender Organic Leaves",
            "category": CropCategory.VEGETABLES,
            "grade": CropGrade.ORGANIC_CERTIFIED,
            "quantity_available_kg": 120.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 42.00,
            "harvest_timestamp": now_utc - timedelta(hours=2),
            "shelf_life_hours": 36,
            "freshness_decay_lambda": 0.035,
            "district": "Hooghly",
            "latitude": 22.8124,
            "longitude": 88.2345,
            "description": "Tender leafy greens and shoots of bottle gourd, harvested 2 hours before delivery.",
            "is_organic": True,
            "image_url": "/images/laushak.webp"
        },
        {
            "farmer_email": "subhash.ghosh@farmer.taza.in",
            "crop_name": "Aromatic Gobindobhog Rice (গোবিন্দভোগ চাল)",
            "variety": "GI Certified Heritage Aromatic Short Grain",
            "category": CropCategory.GRAINS_PADDY,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 1500.0,
            "minimum_order_kg": 1.0,
            "expected_base_price_per_kg": 85.00,
            "harvest_timestamp": now_utc - timedelta(hours=24),
            "shelf_life_hours": 8760,
            "freshness_decay_lambda": 0.0005,
            "district": "Purba Bardhaman",
            "latitude": 23.1645,
            "longitude": 88.1189,
            "description": "Premium GI-tagged fragrant Gobindobhog rice from Burdwan paddy fields.",
            "is_organic": True,
            "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=60"
        },
        {
            "farmer_email": "subhash.ghosh@farmer.taza.in",
            "crop_name": "Minikit Parboiled Rice (মিনিকিট চাল)",
            "variety": "Premium Double Boiled Polish-Free White",
            "category": CropCategory.GRAINS_PADDY,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 2500.0,
            "minimum_order_kg": 2.0,
            "expected_base_price_per_kg": 38.00,
            "harvest_timestamp": now_utc - timedelta(hours=48),
            "shelf_life_hours": 8760,
            "freshness_decay_lambda": 0.0005,
            "district": "Purba Bardhaman",
            "latitude": 23.1645,
            "longitude": 88.1189,
            "description": "Daily staple long-grain parboiled Minikit rice, direct from farm mills.",
            "is_organic": False,
            "image_url": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=60"
        },
        {
            "farmer_email": "pranab.biswas@farmer.taza.in",
            "crop_name": "Golden Sona Moong Dal (সোনা মুগ ডাল)",
            "variety": "Unpolished High-Protein Golden Yellow",
            "category": CropCategory.PULSES,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 450.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 105.00,
            "harvest_timestamp": now_utc - timedelta(hours=36),
            "shelf_life_hours": 8760,
            "freshness_decay_lambda": 0.0006,
            "district": "Nadia",
            "latitude": 23.1812,
            "longitude": 88.5821,
            "description": "Aromatic unpolished golden yellow moong dal with zero artificial polish.",
            "is_organic": True,
            "image_url": "/images/moong_dal.webp"
        },
        {
            "farmer_email": "tapas.sarkar@farmer.taza.in",
            "crop_name": "Desi Red Lentils / Musur Dal (মুসুর ডাল)",
            "variety": "Desi Bengal Split Unpolished Masoor",
            "category": CropCategory.PULSES,
            "grade": CropGrade.GRADE_A_PREMIUM,
            "quantity_available_kg": 600.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 82.00,
            "harvest_timestamp": now_utc - timedelta(hours=30),
            "shelf_life_hours": 8760,
            "freshness_decay_lambda": 0.0006,
            "district": "Murshidabad",
            "latitude": 24.1759,
            "longitude": 88.2802,
            "description": "Protein-rich native split red lentils directly sourced from farmer co-operatives.",
            "is_organic": True,
            "image_url": "/images/masoor_dal.jpg"
        }
    ]

    for sl in sample_listings:
        farmer = farmer_user_map.get(sl["farmer_email"])
        if not farmer:
            continue

        existing_listing = await database["product_listings"].find_one({
            "farmer_id": farmer["id"],
            "crop_name": sl["crop_name"]
        })

        if not existing_listing:
            prod_id = await get_next_sequence_value(database, "product_id")
            doc = {
                "id": prod_id,
                "farmer_id": farmer["id"],
                "crop_name": sl["crop_name"],
                "variety": sl["variety"],
                "category": sl["category"].value if hasattr(sl["category"], "value") else sl["category"],
                "grade": sl["grade"].value if hasattr(sl["grade"], "value") else sl["grade"],
                "quantity_available_kg": sl["quantity_available_kg"],
                "minimum_order_kg": sl["minimum_order_kg"],
                "expected_base_price_per_kg": sl["expected_base_price_per_kg"],
                "harvest_timestamp": sl["harvest_timestamp"],
                "shelf_life_hours": sl["shelf_life_hours"],
                "freshness_decay_lambda": sl["freshness_decay_lambda"],
                "district": sl["district"],
                "latitude": sl["latitude"],
                "longitude": sl["longitude"],
                "description": sl["description"],
                "is_organic": sl["is_organic"],
                "is_available": True,
                "image_url": sl.get("image_url"),
                "created_at": now_utc,
                "updated_at": now_utc
            }
            await database["product_listings"].insert_one(doc)
        else:
            await database["product_listings"].update_one(
                {"_id": existing_listing["_id"]},
                {"$set": {
                    "expected_base_price_per_kg": sl["expected_base_price_per_kg"],
                    "variety": sl["variety"],
                    "description": sl["description"],
                    "image_url": sl.get("image_url"),
                    "updated_at": now_utc
                }}
            )

    print("[OK] Sample Crop Listings successfully loaded.")

    # 6. Seed Sample Market Prices (APMC Benchmark Reference)
    print("[DATA] Seeding Sample Market Prices...")
    sample_market_prices = [
        {"district_name": "Hooghly", "crop_name": "Jyoti Potato", "sub_group": SubGroupEnum.VEGETABLES, "average_price_inr": 1500.0, "unit": "Quintal"},
        {"district_name": "Hooghly", "crop_name": "Pointed Gourd (Potol)", "sub_group": SubGroupEnum.VEGETABLES, "average_price_inr": 2600.0, "unit": "Quintal"},
        {"district_name": "Purba Bardhaman", "crop_name": "Gobindobhog Rice", "sub_group": SubGroupEnum.GRAINS, "average_price_inr": 6800.0, "unit": "Quintal"},
        {"district_name": "Purba Bardhaman", "crop_name": "Minikit Paddy", "sub_group": SubGroupEnum.GRAINS, "average_price_inr": 2100.0, "unit": "Quintal"},
        {"district_name": "Malda", "crop_name": "Himsagar Mango", "sub_group": SubGroupEnum.FRUITS, "average_price_inr": 5500.0, "unit": "Quintal"},
        {"district_name": "Nadia", "crop_name": "Cauliflower", "sub_group": SubGroupEnum.VEGETABLES, "average_price_inr": 1600.0, "unit": "Quintal"},
        {"district_name": "Murshidabad", "crop_name": "Litchi (Muzaffarpur/Bombai)", "sub_group": SubGroupEnum.FRUITS, "average_price_inr": 6800.0, "unit": "Quintal"},
    ]

    for mp in sample_market_prices:
        existing = await database["market_prices"].find_one({
            "district_name": mp["district_name"],
            "crop_name": mp["crop_name"]
        })
        if not existing:
            mp_id = await get_next_sequence_value(database, "market_price_id")
            doc = {
                "id": mp_id,
                "district_name": mp["district_name"],
                "crop_name": mp["crop_name"],
                "sub_group": mp["sub_group"].value if hasattr(mp["sub_group"], "value") else mp["sub_group"],
                "average_price_inr": mp["average_price_inr"],
                "unit": mp["unit"]
            }
            await database["market_prices"].insert_one(doc)
        else:
            await database["market_prices"].update_one(
                {"_id": existing["_id"]},
                {"$set": {"average_price_inr": mp["average_price_inr"]}}
            )
    print(f"[OK] Loaded {len(sample_market_prices)} sample market average prices.")

    # 7. Seed Sample Registered Farmers with Offered Crops
    print("[DATA] Seeding Sample Registered Farmers & Offered Crops...")
    sample_farmers_data = [
        {
            "farmer_name": "Ramesh Chandra Das",
            "contact_number": "+919876543210",
            "district_name": "Hooghly",
            "village_or_block": "Singur, Balarambati",
            "offered_crops": [
                {"id": 1, "crop_name": "Jyoti Potato", "sub_group": SubGroupEnum.VEGETABLES.value, "available_quantity": 2500.0, "expected_price_per_unit": 22.50},
                {"id": 2, "crop_name": "Green Pointed Gourd", "sub_group": SubGroupEnum.VEGETABLES.value, "available_quantity": 300.0, "expected_price_per_unit": 34.00}
            ]
        },
        {
            "farmer_name": "Bikash Malakar",
            "contact_number": "+919812345678",
            "district_name": "Nadia",
            "village_or_block": "Ranaghat Block I",
            "offered_crops": [
                {"id": 1, "crop_name": "Fazli Mango", "sub_group": SubGroupEnum.FRUITS.value, "available_quantity": 800.0, "expected_price_per_unit": 60.00},
                {"id": 2, "crop_name": "Cauliflower Snowball", "sub_group": SubGroupEnum.VEGETABLES.value, "available_quantity": 600.0, "expected_price_per_unit": 21.00}
            ]
        },
        {
            "farmer_name": "Subhash Ghosh",
            "contact_number": "+919830334403",
            "district_name": "Purba Bardhaman",
            "village_or_block": "Memari II",
            "offered_crops": [
                {"id": 1, "crop_name": "Gobindobhog Rice", "sub_group": SubGroupEnum.GRAINS.value, "available_quantity": 1500.0, "expected_price_per_unit": 85.00}
            ]
        }
    ]

    for fd in sample_farmers_data:
        existing = await database["registered_farmers"].find_one({"contact_number": fd["contact_number"]})
        if not existing:
            rf_id = await get_next_sequence_value(database, "registered_farmer_id")
            doc = {
                "id": rf_id,
                "farmer_name": fd["farmer_name"],
                "contact_number": fd["contact_number"],
                "district_name": fd["district_name"],
                "village_or_block": fd["village_or_block"],
                "registered_at": now_utc,
                "offered_crops": fd["offered_crops"]
            }
            await database["registered_farmers"].insert_one(doc)

    # 8. Seed Initial Realistic Orders for Farmer Dashboards and Consumer My Orders
    print("[DATA] Seeding Diverse Demo Orders for Consumers & Farmers...")
    sourav = await database["users"].find_one({"email": "sourav.banerjee@consumer.taza.in"})
    bhojohori = await database["users"].find_one({"email": "bhojohori.manya@restaurant.taza.in"})

    all_listings = await database["product_listings"].find().to_list(length=50)
    listing_by_name = {l["crop_name"].lower(): l for l in all_listings}

    def find_listing(keyword):
        for name, doc in listing_by_name.items():
            if keyword in name:
                return doc
        return all_listings[0] if all_listings else None

    if sourav and all_listings:
        rice_item = find_listing("gobindobhog") or find_listing("rice")
        potol_item = find_listing("pointed gourd") or find_listing("potol")
        mango_item = find_listing("himsagar") or find_listing("mango")
        dal_item = find_listing("lentil") or find_listing("masoor") or find_listing("dal")
        banana_item = find_listing("banana")
        potato_item = find_listing("jyoti potato") or find_listing("potato")

        demo_orders_seed = []
        
        if rice_item:
            qty = 10.0
            price = rice_item.get("expected_base_price_per_kg", 85.0)
            sub = round(qty * price, 2)
            demo_orders_seed.append({
                "order_number": "TZ-WB-8841GBR",
                "consumer_id": sourav["id"],
                "farmer_id": rice_item["farmer_id"],
                "product_id": rice_item["id"],
                "quantity_kg": qty,
                "unit_price_inr": price,
                "subtotal_inr": sub,
                "platform_fee_inr": round(sub * 0.02, 2),
                "logistics_fee_inr": 0.0,
                "total_amount_inr": round(sub * 1.02, 2),
                "delivery_address": "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata - 700061",
                "delivery_district": "Kolkata",
                "delivery_pincode": "700061",
                "consumer_lat": 22.4986,
                "consumer_lng": 88.3102,
                "payment_method": "ONLINE_RAZORPAY",
                "payment_status": "PAID",
                "status": "IN_TRANSIT",
                "estimated_delivery_at": now_utc + timedelta(hours=2),
                "created_at": now_utc - timedelta(hours=3),
                "updated_at": now_utc - timedelta(hours=1),
            })

        if potol_item:
            qty = 4.0
            price = potol_item.get("expected_base_price_per_kg", 48.0)
            sub = round(qty * price, 2)
            demo_orders_seed.append({
                "order_number": "TZ-WB-7732PTL",
                "consumer_id": sourav["id"],
                "farmer_id": potol_item["farmer_id"],
                "product_id": potol_item["id"],
                "quantity_kg": qty,
                "unit_price_inr": price,
                "subtotal_inr": sub,
                "platform_fee_inr": round(sub * 0.02, 2),
                "logistics_fee_inr": 0.0,
                "total_amount_inr": round(sub * 1.02, 2),
                "delivery_address": "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata - 700061",
                "delivery_district": "Kolkata",
                "delivery_pincode": "700061",
                "consumer_lat": 22.4986,
                "consumer_lng": 88.3102,
                "payment_method": "ONLINE_RAZORPAY",
                "payment_status": "PAID",
                "status": "CONFIRMED_BY_FARMER",
                "estimated_delivery_at": now_utc + timedelta(hours=4),
                "created_at": now_utc - timedelta(hours=4),
                "updated_at": now_utc - timedelta(hours=2),
            })

        if mango_item:
            qty = 5.0
            price = mango_item.get("expected_base_price_per_kg", 65.0)
            sub = round(qty * price, 2)
            demo_orders_seed.append({
                "order_number": "TZ-WB-6519MNG",
                "consumer_id": sourav["id"],
                "farmer_id": mango_item["farmer_id"],
                "product_id": mango_item["id"],
                "quantity_kg": qty,
                "unit_price_inr": price,
                "subtotal_inr": sub,
                "platform_fee_inr": round(sub * 0.02, 2),
                "logistics_fee_inr": 0.0,
                "total_amount_inr": round(sub * 1.02, 2),
                "delivery_address": "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata - 700061",
                "delivery_district": "Kolkata",
                "delivery_pincode": "700061",
                "consumer_lat": 22.4986,
                "consumer_lng": 88.3102,
                "payment_method": "ONLINE_RAZORPAY",
                "payment_status": "PAID",
                "status": "DELIVERED",
                "estimated_delivery_at": now_utc - timedelta(days=1),
                "created_at": now_utc - timedelta(days=2),
                "updated_at": now_utc - timedelta(days=1),
            })

        if dal_item:
            qty = 3.0
            price = dal_item.get("expected_base_price_per_kg", 110.0)
            sub = round(qty * price, 2)
            demo_orders_seed.append({
                "order_number": "TZ-WB-5542DAL",
                "consumer_id": sourav["id"],
                "farmer_id": dal_item["farmer_id"],
                "product_id": dal_item["id"],
                "quantity_kg": qty,
                "unit_price_inr": price,
                "subtotal_inr": sub,
                "platform_fee_inr": round(sub * 0.02, 2),
                "logistics_fee_inr": 0.0,
                "total_amount_inr": round(sub * 1.02, 2),
                "delivery_address": "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata - 700061",
                "delivery_district": "Kolkata",
                "delivery_pincode": "700061",
                "consumer_lat": 22.4986,
                "consumer_lng": 88.3102,
                "payment_method": "ONLINE_RAZORPAY",
                "payment_status": "PAID",
                "status": "DELIVERED",
                "estimated_delivery_at": now_utc - timedelta(days=2),
                "created_at": now_utc - timedelta(days=3),
                "updated_at": now_utc - timedelta(days=2),
            })

        if potato_item and bhojohori:
            qty = 50.0
            price = potato_item.get("expected_base_price_per_kg", 18.5)
            sub = round(qty * price, 2)
            demo_orders_seed.append({
                "order_number": "TZ-WB-9021MUM",
                "consumer_id": bhojohori["id"],
                "farmer_id": potato_item["farmer_id"],
                "product_id": potato_item["id"],
                "quantity_kg": qty,
                "unit_price_inr": price,
                "subtotal_inr": sub,
                "platform_fee_inr": round(sub * 0.02, 2),
                "logistics_fee_inr": 0.0,
                "total_amount_inr": round(sub * 1.02, 2),
                "delivery_address": "Sector V, Salt Lake, Kolkata - 700091",
                "delivery_district": "North 24 Parganas",
                "delivery_pincode": "700091",
                "consumer_lat": 22.5801,
                "consumer_lng": 88.4312,
                "payment_method": "ONLINE_RAZORPAY",
                "payment_status": "PAID",
                "status": "CONFIRMED_BY_FARMER",
                "estimated_delivery_at": now_utc + timedelta(hours=3),
                "created_at": now_utc - timedelta(hours=2),
                "updated_at": now_utc - timedelta(hours=1),
            })

        for o in demo_orders_seed:
            existing_ord = await database["orders"].find_one({"order_number": o["order_number"]})
            if not existing_ord:
                ord_id = await get_next_sequence_value(database, "order_id")
                o["id"] = ord_id
                await database["orders"].insert_one(o)
        print(f"[OK] {len(demo_orders_seed)} diverse demo orders seeded across multiple crops.")

    print("[OK] Sample Registered Farmers & Offered Crops successfully seeded.")
    print("[SUCCESS] MongoDB Database seeding complete! TAZA backend is ready for production & local execution.")


if __name__ == "__main__":
    asyncio.run(seed_database())