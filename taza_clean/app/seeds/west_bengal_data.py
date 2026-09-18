"""
West Bengal Agricultural Dataset:
Pre-seeded district profiles, agro-climatic zones, baseline yields,
harvest seasons, top crops, and Mandi APMC benchmarks.
"""

WEST_BENGAL_DISTRICTS = [
    {
        "district_name": "Hooghly",
        "state": "West Bengal",
        "soil_type": "Gangetic Alluvial & Silty Loam",
        "annual_rainfall_mm": 1550.0,
        "agro_climatic_zone": "Lower Gangetic Plain (Zone III)",
        "primary_crops": [
            {"name": "Jyoti Potato", "category": "TUBERS", "variety": "Kufri Jyoti", "yield_kg_per_acre": 10500},
            {"name": "Chandramukhi Potato", "category": "TUBERS", "variety": "Kufri Chandramukhi", "yield_kg_per_acre": 9200},
            {"name": "Aman Rice (Paddy)", "category": "GRAINS_PADDY", "variety": "Swarna (MTU 7029)", "yield_kg_per_acre": 2100},
            {"name": "Tossa Jute", "category": "CASH_CROPS", "variety": "JRO-524", "yield_kg_per_acre": 1400},
            {"name": "Pointed Gourd (Potol)", "category": "VEGETABLES", "variety": "Swarna Alaukik", "yield_kg_per_acre": 4800}
        ],
        "harvest_seasons": [
            {"season": "Rabi", "period": "January - March", "crops": ["Potato", "Mustard", "Boro Paddy"]},
            {"season": "Kharif", "period": "July - November", "crops": ["Aman Paddy", "Jute"]},
            {"season": "Zaid / Summer", "period": "April - June", "crops": ["Sesame", "Vegetables"]}
        ],
        "baseline_yield_per_acre_kg": 9800.0,
        "cold_storage_capacity_tonnes": 485000.0,
        "active_fpos_count": 18,
        "centroid_lat": 22.8963,
        "centroid_lng": 88.2461
    },
    {
        "district_name": "Purba Bardhaman",
        "state": "West Bengal",
        "soil_type": "Old Alluvial Clay & Clay Loam (Rice Bowl of Bengal)",
        "annual_rainfall_mm": 1400.0,
        "agro_climatic_zone": "Lower Gangetic Plain (Zone III)",
        "primary_crops": [
            {"name": "Gobindobhog Aromatic Rice", "category": "GRAINS_PADDY", "variety": "GI Heritage Aromatic", "yield_kg_per_acre": 1600},
            {"name": "Minikit Rice", "category": "GRAINS_PADDY", "variety": "IET-4786 (Shatabdi)", "yield_kg_per_acre": 2400},
            {"name": "Jyoti Potato", "category": "TUBERS", "variety": "Kufri Jyoti", "yield_kg_per_acre": 11000},
            {"name": "Yellow Mustard", "category": "CASH_CROPS", "variety": "B-9 (Binoy)", "yield_kg_per_acre": 650}
        ],
        "harvest_seasons": [
            {"season": "Kharif", "period": "November - December", "crops": ["Aman Rice", "Gobindobhog Rice"]},
            {"season": "Rabi", "period": "February - April", "crops": ["Boro Rice", "Potato", "Mustard"]}
        ],
        "baseline_yield_per_acre_kg": 7200.0,
        "cold_storage_capacity_tonnes": 390000.0,
        "active_fpos_count": 22,
        "centroid_lat": 23.2324,
        "centroid_lng": 87.8615
    },
    {
        "district_name": "Nadia",
        "state": "West Bengal",
        "soil_type": "Recent Gangetic Alluvium (High Organic Loam)",
        "annual_rainfall_mm": 1450.0,
        "agro_climatic_zone": "New Alluvial Zone (Zone IV)",
        "primary_crops": [
            {"name": "Pointed Gourd (Potol)", "category": "VEGETABLES", "variety": "Dandali Green", "yield_kg_per_acre": 5200},
            {"name": "Cauliflower", "category": "VEGETABLES", "variety": "Pusa Snowball", "yield_kg_per_acre": 8500},
            {"name": "Green Bullet Chili", "category": "SPICES", "variety": "Bullet / Suryamukhi", "yield_kg_per_acre": 3400},
            {"name": "Muktakeshi Brinjal", "category": "VEGETABLES", "variety": "Muktakeshi Purple", "yield_kg_per_acre": 7800},
            {"name": "Banana (Martaman)", "category": "FRUITS", "variety": "Martaman / Champa", "yield_kg_per_acre": 14000}
        ],
        "harvest_seasons": [
            {"season": "Year-Round Vegetable Cycle", "period": "Continuous", "crops": ["Brinjal", "Chili", "Gourd", "Greens"]},
            {"season": "Rabi Winter", "period": "December - February", "crops": ["Cauliflower", "Cabbage", "Peas"]}
        ],
        "baseline_yield_per_acre_kg": 6800.0,
        "cold_storage_capacity_tonnes": 110000.0,
        "active_fpos_count": 26,
        "centroid_lat": 23.4710,
        "centroid_lng": 88.5565
    },
    {
        "district_name": "Malda",
        "state": "West Bengal",
        "soil_type": "Tal & Diara Alluvial Belt",
        "annual_rainfall_mm": 1420.0,
        "agro_climatic_zone": "Old Alluvial Zone (Zone II)",
        "primary_crops": [
            {"name": "Fazli Mango", "category": "FRUITS", "variety": "Malda GI Fazli", "yield_kg_per_acre": 6500},
            {"name": "Himsagar Mango", "category": "FRUITS", "variety": "Malda Himsagar (Khirsapati)", "yield_kg_per_acre": 5800},
            {"name": "Langra Mango", "category": "FRUITS", "variety": "Malda Langra", "yield_kg_per_acre": 5200},
            {"name": "Mulberry Silk", "category": "CASH_CROPS", "variety": "Nistari / Mulberry Leaf", "yield_kg_per_acre": 900},
            {"name": "Tossa Jute", "category": "CASH_CROPS", "variety": "JRO-204", "yield_kg_per_acre": 1500}
        ],
        "harvest_seasons": [
            {"season": "Mango Harvest", "period": "May - July", "crops": ["Gopalbhog", "Himsagar", "Langra", "Fazli"]},
            {"season": "Kharif Jute", "period": "July - October", "crops": ["Jute", "Paddy"]}
        ],
        "baseline_yield_per_acre_kg": 5400.0,
        "cold_storage_capacity_tonnes": 95000.0,
        "active_fpos_count": 14,
        "centroid_lat": 25.0108,
        "centroid_lng": 88.1411
    },
    {
        "district_name": "Murshidabad",
        "state": "West Bengal",
        "soil_type": "Rarh Laterite (West) & Gangetic Alluvial (East)",
        "annual_rainfall_mm": 1380.0,
        "agro_climatic_zone": "Lower Gangetic Plain (Zone III)",
        "primary_crops": [
            {"name": "Tossa Jute", "category": "CASH_CROPS", "variety": "Golden Fibre JRO-524", "yield_kg_per_acre": 1650},
            {"name": "Muzaffarpur / Bombai Litchi", "category": "FRUITS", "variety": "Bombai Litchi", "yield_kg_per_acre": 4200},
            {"name": "Sharbati Wheat", "category": "GRAINS_PADDY", "variety": "PBW-343", "yield_kg_per_acre": 1800},
            {"name": "Green Gram (Moong)", "category": "PULSES", "variety": "Samrat Moong", "yield_kg_per_acre": 550}
        ],
        "harvest_seasons": [
            {"season": "Kharif Jute & Litchi", "period": "May - August", "crops": ["Litchi", "Jute"]},
            {"season": "Rabi Pulse & Wheat", "period": "November - March", "crops": ["Wheat", "Moong", "Mustard"]}
        ],
        "baseline_yield_per_acre_kg": 4600.0,
        "cold_storage_capacity_tonnes": 145000.0,
        "active_fpos_count": 16,
        "centroid_lat": 24.1759,
        "centroid_lng": 88.2802
    },
    {
        "district_name": "Darjeeling",
        "state": "West Bengal",
        "soil_type": "Hilly Humus-Rich Brown Forest Acidic Soil",
        "annual_rainfall_mm": 2600.0,
        "agro_climatic_zone": "Eastern Himalayan Hilly Zone (Zone I)",
        "primary_crops": [
            {"name": "Darjeeling Organic Orthodox Tea", "category": "CASH_CROPS", "variety": "First Flush / Second Flush FTGFOP", "yield_kg_per_acre": 600},
            {"name": "Darjeeling Mandarin Orange", "category": "FRUITS", "variety": "Darjeeling Mandarin (Sweet Acid)", "yield_kg_per_acre": 3500},
            {"name": "Large Cardamom (Alainchi)", "category": "SPICES", "variety": "Ramsey / Varlangey", "yield_kg_per_acre": 450},
            {"name": "Ginger (Garubathan)", "category": "SPICES", "variety": "Nadia / Gorubathan Special", "yield_kg_per_acre": 3200}
        ],
        "harvest_seasons": [
            {"season": "First Flush Tea", "period": "March - May", "crops": ["Orthodox Tea"]},
            {"season": "Orange & Ginger", "period": "November - January", "crops": ["Mandarin Orange", "Cardamom"]}
        ],
        "baseline_yield_per_acre_kg": 2100.0,
        "cold_storage_capacity_tonnes": 18000.0,
        "active_fpos_count": 9,
        "centroid_lat": 27.0410,
        "centroid_lng": 88.2663
    }
]

MANDI_BENCHMARKS = [
    # --- Tubers & Roots ---
    {
        "district_name": "Hooghly",
        "mandi_name": "Singur Regulated Market APMC",
        "crop_name": "Jyoti Potato",
        "variety": "Kufri Jyoti",
        "category": "TUBERS",
        "modal_price_per_kg": 8.50,
        "min_price_per_kg": 7.00,
        "max_price_per_kg": 10.00,
        "arrival_quantity_tonnes": 140.0,
        "source_agency": "Agmarknet WB Dept of Agri Marketing"
    },
    {
        "district_name": "Hooghly",
        "mandi_name": "Tarakeswar APMC",
        "crop_name": "Chandramukhi Potato",
        "variety": "Kufri Chandramukhi",
        "category": "TUBERS",
        "modal_price_per_kg": 12.50,
        "min_price_per_kg": 11.00,
        "max_price_per_kg": 15.00,
        "arrival_quantity_tonnes": 85.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Nadia",
        "mandi_name": "Ranaghat Sub-Division APMC",
        "crop_name": "Sweet Potato (Ranga Aloo)",
        "variety": "Red Alluvial",
        "category": "TUBERS",
        "modal_price_per_kg": 22.00,
        "min_price_per_kg": 18.00,
        "max_price_per_kg": 26.00,
        "arrival_quantity_tonnes": 30.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "North 24 Parganas",
        "mandi_name": "Barasat Krishak Bazar",
        "crop_name": "Taro Root (Gathi Kochu)",
        "variety": "Desi Kochu",
        "category": "TUBERS",
        "modal_price_per_kg": 25.00,
        "min_price_per_kg": 20.00,
        "max_price_per_kg": 30.00,
        "arrival_quantity_tonnes": 25.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Nadia",
        "mandi_name": "Krishnanagar APMC",
        "crop_name": "Elephant Foot Yam (Ol Kochu)",
        "variety": "Kovvur Desi",
        "category": "TUBERS",
        "modal_price_per_kg": 28.00,
        "min_price_per_kg": 22.00,
        "max_price_per_kg": 34.00,
        "arrival_quantity_tonnes": 20.0,
        "source_agency": "Agmarknet WB"
    },

    # --- Fresh Vegetables ---
    {
        "district_name": "Nadia",
        "mandi_name": "Bethuadahari Krishak Bazar",
        "crop_name": "Pointed Gourd (Potol)",
        "variety": "Dandali Green",
        "category": "VEGETABLES",
        "modal_price_per_kg": 48.00,
        "min_price_per_kg": 40.00,
        "max_price_per_kg": 56.00,
        "arrival_quantity_tonnes": 35.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Nadia",
        "mandi_name": "Ranaghat Sub-Division APMC",
        "crop_name": "Cauliflower (Phool Gobhi)",
        "variety": "Pusa Snowball",
        "category": "VEGETABLES",
        "modal_price_per_kg": 16.00,
        "min_price_per_kg": 13.00,
        "max_price_per_kg": 20.00,
        "arrival_quantity_tonnes": 60.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Hooghly",
        "mandi_name": "Sheoraphuli Regulated Market",
        "crop_name": "Cabbage (Bandha Gobhi)",
        "variety": "Golden Acre",
        "category": "VEGETABLES",
        "modal_price_per_kg": 12.00,
        "min_price_per_kg": 9.00,
        "max_price_per_kg": 15.00,
        "arrival_quantity_tonnes": 50.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Hooghly",
        "mandi_name": "Singur Regulated Market APMC",
        "crop_name": "Fresh Hybrid Tomato",
        "variety": "Pusa Ruby / Abhinav",
        "category": "VEGETABLES",
        "modal_price_per_kg": 48.00,
        "min_price_per_kg": 40.00,
        "max_price_per_kg": 56.00,
        "arrival_quantity_tonnes": 75.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Murshidabad",
        "mandi_name": "Beldanga Krishak Bazar",
        "crop_name": "Red Onion (Peyaj)",
        "variety": "Nasik Red / Sukh Sagar",
        "category": "VEGETABLES",
        "modal_price_per_kg": 42.00,
        "min_price_per_kg": 35.00,
        "max_price_per_kg": 50.00,
        "arrival_quantity_tonnes": 110.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Nadia",
        "mandi_name": "Ranaghat Sub-Division APMC",
        "crop_name": "Muktakeshi Brinjal (Begun)",
        "variety": "Muktakeshi Purple",
        "category": "VEGETABLES",
        "modal_price_per_kg": 55.00,
        "min_price_per_kg": 45.00,
        "max_price_per_kg": 65.00,
        "arrival_quantity_tonnes": 40.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Hooghly",
        "mandi_name": "Singur Regulated Market APMC",
        "crop_name": "Fresh Bottle Gourd Greens (Lau Shak)",
        "variety": "Desi Tender Leaves",
        "category": "VEGETABLES",
        "modal_price_per_kg": 42.00,
        "min_price_per_kg": 35.00,
        "max_price_per_kg": 50.00,
        "arrival_quantity_tonnes": 20.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Hooghly",
        "mandi_name": "Singur Regulated Market APMC",
        "crop_name": "Ladyfinger (Bhindi / Dherosh)",
        "variety": "Arka Anamika",
        "category": "VEGETABLES",
        "modal_price_per_kg": 24.00,
        "min_price_per_kg": 19.00,
        "max_price_per_kg": 29.00,
        "arrival_quantity_tonnes": 30.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Purba Bardhaman",
        "mandi_name": "Memari Regulated Market",
        "crop_name": "Green Tender Peas (Motor Shuti)",
        "variety": "Arkel Green",
        "category": "VEGETABLES",
        "modal_price_per_kg": 36.00,
        "min_price_per_kg": 30.00,
        "max_price_per_kg": 44.00,
        "arrival_quantity_tonnes": 25.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Nadia",
        "mandi_name": "Bethuadahari Krishak Bazar",
        "crop_name": "Bitter Gourd (Karela / Uchhe)",
        "variety": "Pusa Do Mausami",
        "category": "VEGETABLES",
        "modal_price_per_kg": 28.00,
        "min_price_per_kg": 22.00,
        "max_price_per_kg": 34.00,
        "arrival_quantity_tonnes": 20.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Hooghly",
        "mandi_name": "Tarakeswar APMC",
        "crop_name": "Bottle Gourd (Lau)",
        "variety": "Pusa Summer Prolific",
        "category": "VEGETABLES",
        "modal_price_per_kg": 14.00,
        "min_price_per_kg": 10.00,
        "max_price_per_kg": 18.00,
        "arrival_quantity_tonnes": 45.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Nadia",
        "mandi_name": "Ranaghat Sub-Division APMC",
        "crop_name": "Ridge Gourd (Jhinge)",
        "variety": "Pusa Nasdar",
        "category": "VEGETABLES",
        "modal_price_per_kg": 24.00,
        "min_price_per_kg": 19.00,
        "max_price_per_kg": 29.00,
        "arrival_quantity_tonnes": 25.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Purba Bardhaman",
        "mandi_name": "Kalna APMC",
        "crop_name": "Sweet Pumpkin (Kumro)",
        "variety": "Arka Chandan",
        "category": "VEGETABLES",
        "modal_price_per_kg": 12.00,
        "min_price_per_kg": 9.00,
        "max_price_per_kg": 16.00,
        "arrival_quantity_tonnes": 65.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "South 24 Parganas",
        "mandi_name": "Baruipur Krishak Bazar",
        "crop_name": "Fresh Spinach (Palong Shak)",
        "variety": "All Green",
        "category": "VEGETABLES",
        "modal_price_per_kg": 14.00,
        "min_price_per_kg": 10.00,
        "max_price_per_kg": 18.00,
        "arrival_quantity_tonnes": 15.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "South 24 Parganas",
        "mandi_name": "Baruipur Krishak Bazar",
        "crop_name": "Crisp Salad Cucumber (Shosha)",
        "variety": "Poinsette / Local Green",
        "category": "VEGETABLES",
        "modal_price_per_kg": 16.00,
        "min_price_per_kg": 12.00,
        "max_price_per_kg": 21.00,
        "arrival_quantity_tonnes": 35.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Darjeeling",
        "mandi_name": "Siliguri Regulated Market APMC",
        "crop_name": "Green Bell Capsicum (Shimla Mirch)",
        "variety": "California Wonder",
        "category": "VEGETABLES",
        "modal_price_per_kg": 55.00,
        "min_price_per_kg": 45.00,
        "max_price_per_kg": 65.00,
        "arrival_quantity_tonnes": 18.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Darjeeling",
        "mandi_name": "Kurseong Hill Market",
        "crop_name": "Fresh Orange Carrot (Gajar)",
        "variety": "Pusa Rudhira",
        "category": "VEGETABLES",
        "modal_price_per_kg": 55.00,
        "min_price_per_kg": 45.00,
        "max_price_per_kg": 65.00,
        "arrival_quantity_tonnes": 22.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Hooghly",
        "mandi_name": "Singur Regulated Market APMC",
        "crop_name": "White Radish (Mula)",
        "variety": "Pusa Chetki",
        "category": "VEGETABLES",
        "modal_price_per_kg": 11.00,
        "min_price_per_kg": 8.00,
        "max_price_per_kg": 14.00,
        "arrival_quantity_tonnes": 40.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Darjeeling",
        "mandi_name": "Siliguri Regulated Market APMC",
        "crop_name": "French Beans",
        "variety": "Contender",
        "category": "VEGETABLES",
        "modal_price_per_kg": 38.00,
        "min_price_per_kg": 30.00,
        "max_price_per_kg": 46.00,
        "arrival_quantity_tonnes": 15.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Bankura",
        "mandi_name": "Kotulpur APMC",
        "crop_name": "Tender Drumsticks (Sojne Danta)",
        "variety": "PKM-1 Desi",
        "category": "VEGETABLES",
        "modal_price_per_kg": 45.00,
        "min_price_per_kg": 35.00,
        "max_price_per_kg": 55.00,
        "arrival_quantity_tonnes": 12.0,
        "source_agency": "Agmarknet WB"
    },

    # --- Fruits ---
    {
        "district_name": "Malda",
        "mandi_name": "English Bazar Regulated Market",
        "crop_name": "Himsagar Mango",
        "variety": "Khirsapati GI",
        "category": "FRUITS",
        "modal_price_per_kg": 55.00,
        "min_price_per_kg": 45.00,
        "max_price_per_kg": 65.00,
        "arrival_quantity_tonnes": 95.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Malda",
        "mandi_name": "English Bazar Regulated Market",
        "crop_name": "Langra Mango",
        "variety": "Malda Langra GI",
        "category": "FRUITS",
        "modal_price_per_kg": 45.00,
        "min_price_per_kg": 38.00,
        "max_price_per_kg": 55.00,
        "arrival_quantity_tonnes": 70.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Malda",
        "mandi_name": "Samsi APMC",
        "crop_name": "Fazli Mango",
        "variety": "Malda Fazli Large",
        "category": "FRUITS",
        "modal_price_per_kg": 35.00,
        "min_price_per_kg": 28.00,
        "max_price_per_kg": 42.00,
        "arrival_quantity_tonnes": 110.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Malda",
        "mandi_name": "English Bazar Regulated Market",
        "crop_name": "Gopalbhog Mango",
        "variety": "Gopalbhog Premium",
        "category": "FRUITS",
        "modal_price_per_kg": 60.00,
        "min_price_per_kg": 50.00,
        "max_price_per_kg": 70.00,
        "arrival_quantity_tonnes": 40.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Murshidabad",
        "mandi_name": "Baharampur Krishak Bazar",
        "crop_name": "Amrapali Mango",
        "variety": "Amrapali Hybrid",
        "category": "FRUITS",
        "modal_price_per_kg": 48.00,
        "min_price_per_kg": 40.00,
        "max_price_per_kg": 58.00,
        "arrival_quantity_tonnes": 30.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Darjeeling",
        "mandi_name": "Kurseong Hill Market",
        "crop_name": "Darjeeling Mandarin Orange",
        "variety": "Grade A Sweet",
        "category": "FRUITS",
        "modal_price_per_kg": 75.00,
        "min_price_per_kg": 60.00,
        "max_price_per_kg": 90.00,
        "arrival_quantity_tonnes": 20.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Darjeeling",
        "mandi_name": "Siliguri Regulated Market APMC",
        "crop_name": "Crisp Red Apple",
        "variety": "Royal Delicious Grade A",
        "category": "FRUITS",
        "modal_price_per_kg": 140.00,
        "min_price_per_kg": 120.00,
        "max_price_per_kg": 160.00,
        "arrival_quantity_tonnes": 45.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Malda",
        "mandi_name": "English Bazar Regulated Market",
        "crop_name": "Sweet Lime (Mousambi)",
        "variety": "Nagpur Juicy Sweet Lime",
        "category": "FRUITS",
        "modal_price_per_kg": 35.00,
        "min_price_per_kg": 30.00,
        "max_price_per_kg": 40.00,
        "arrival_quantity_tonnes": 30.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Nadia",
        "mandi_name": "Ranaghat Sub-Division APMC",
        "crop_name": "Bengal Martaman Banana",
        "variety": "Martaman / Champa",
        "category": "FRUITS",
        "modal_price_per_kg": 35.00,
        "min_price_per_kg": 30.00,
        "max_price_per_kg": 40.00,
        "arrival_quantity_tonnes": 60.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Purba Bardhaman",
        "mandi_name": "Memari Regulated Market",
        "crop_name": "Ruby Pomegranate (Bedana)",
        "variety": "Bhagwa Sweet Ruby",
        "category": "FRUITS",
        "modal_price_per_kg": 150.00,
        "min_price_per_kg": 130.00,
        "max_price_per_kg": 175.00,
        "arrival_quantity_tonnes": 25.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Murshidabad",
        "mandi_name": "Baharampur Krishak Bazar",
        "crop_name": "Bombai Litchi",
        "variety": "GI Bombai Litchi",
        "category": "FRUITS",
        "modal_price_per_kg": 68.00,
        "min_price_per_kg": 55.00,
        "max_price_per_kg": 80.00,
        "arrival_quantity_tonnes": 40.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "South 24 Parganas",
        "mandi_name": "Baruipur Krishak Bazar",
        "crop_name": "Baruipur Sweet Guava (Peyara)",
        "variety": "Allahabad Safeda / Baruipur Special",
        "category": "FRUITS",
        "modal_price_per_kg": 28.00,
        "min_price_per_kg": 22.00,
        "max_price_per_kg": 35.00,
        "arrival_quantity_tonnes": 50.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Hooghly",
        "mandi_name": "Singur Regulated Market APMC",
        "crop_name": "Raw Green Papaya (Pepe)",
        "variety": "Ranchi Special / Red Lady",
        "category": "FRUITS",
        "modal_price_per_kg": 14.00,
        "min_price_per_kg": 10.00,
        "max_price_per_kg": 18.00,
        "arrival_quantity_tonnes": 30.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Darjeeling",
        "mandi_name": "Bidhannagar APMC",
        "crop_name": "Queen Sweet Pineapple",
        "variety": "Giant Kew / Queen",
        "category": "FRUITS",
        "modal_price_per_kg": 32.00,
        "min_price_per_kg": 25.00,
        "max_price_per_kg": 40.00,
        "arrival_quantity_tonnes": 35.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "South 24 Parganas",
        "mandi_name": "Canning Krishak Bazar",
        "crop_name": "Sundarbans Watermelon (Tormuj)",
        "variety": "Sugar Baby / Black Diamond",
        "category": "FRUITS",
        "modal_price_per_kg": 15.00,
        "min_price_per_kg": 11.00,
        "max_price_per_kg": 19.00,
        "arrival_quantity_tonnes": 80.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "North 24 Parganas",
        "mandi_name": "Habra Krishak Bazar",
        "crop_name": "Raw Tender Jackfruit (Enchor)",
        "variety": "Khaja Kathal",
        "category": "FRUITS",
        "modal_price_per_kg": 20.00,
        "min_price_per_kg": 15.00,
        "max_price_per_kg": 25.00,
        "arrival_quantity_tonnes": 40.0,
        "source_agency": "Agmarknet WB"
    },

    # --- Grains, Rice, Paddy & Pulses ---
    {
        "district_name": "Purba Bardhaman",
        "mandi_name": "Memari Regulated Market",
        "crop_name": "Gobindobhog Rice",
        "variety": "GI Certified Unpolished Aromatic",
        "category": "GRAINS_PADDY",
        "modal_price_per_kg": 68.00,
        "min_price_per_kg": 60.00,
        "max_price_per_kg": 76.00,
        "arrival_quantity_tonnes": 45.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Purba Bardhaman",
        "mandi_name": "Kalna APMC",
        "crop_name": "Minikit Rice",
        "variety": "Shatabdi Premium",
        "category": "GRAINS_PADDY",
        "modal_price_per_kg": 32.00,
        "min_price_per_kg": 28.00,
        "max_price_per_kg": 36.00,
        "arrival_quantity_tonnes": 120.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Hooghly",
        "mandi_name": "Singur Regulated Market APMC",
        "crop_name": "Swarna Rice (Paddy)",
        "variety": "MTU 7029",
        "category": "GRAINS_PADDY",
        "modal_price_per_kg": 24.00,
        "min_price_per_kg": 21.00,
        "max_price_per_kg": 27.00,
        "arrival_quantity_tonnes": 90.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Purba Bardhaman",
        "mandi_name": "Memari Regulated Market",
        "crop_name": "Ratna Boro Rice",
        "variety": "Ratna Fine",
        "category": "GRAINS_PADDY",
        "modal_price_per_kg": 26.00,
        "min_price_per_kg": 22.00,
        "max_price_per_kg": 30.00,
        "arrival_quantity_tonnes": 80.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Murshidabad",
        "mandi_name": "Kandi APMC",
        "crop_name": "Sharbati Wheat",
        "variety": "PBW-343 Golden",
        "category": "GRAINS_PADDY",
        "modal_price_per_kg": 22.00,
        "min_price_per_kg": 19.00,
        "max_price_per_kg": 25.00,
        "arrival_quantity_tonnes": 60.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Malda",
        "mandi_name": "Samsi APMC",
        "crop_name": "Yellow Feed Maize (Corn)",
        "variety": "HQPM-1 Hybrid",
        "category": "GRAINS_PADDY",
        "modal_price_per_kg": 18.00,
        "min_price_per_kg": 15.00,
        "max_price_per_kg": 21.00,
        "arrival_quantity_tonnes": 70.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Murshidabad",
        "mandi_name": "Baharampur Krishak Bazar",
        "crop_name": "Green Gram (Moong Dal)",
        "variety": "Samrat Desi Moong",
        "category": "GRAINS_PADDY",
        "modal_price_per_kg": 75.00,
        "min_price_per_kg": 68.00,
        "max_price_per_kg": 84.00,
        "arrival_quantity_tonnes": 25.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Nadia",
        "mandi_name": "Ranaghat Sub-Division APMC",
        "crop_name": "Red Lentil (Masoor Dal)",
        "variety": "HUL-57",
        "category": "GRAINS_PADDY",
        "modal_price_per_kg": 68.00,
        "min_price_per_kg": 60.00,
        "max_price_per_kg": 76.00,
        "arrival_quantity_tonnes": 30.0,
        "source_agency": "Agmarknet WB"
    },

    # --- Spices & Cash Crops ---
    {
        "district_name": "Nadia",
        "mandi_name": "Beldanga Krishak Bazar",
        "crop_name": "Green Bullet Chili (Kacha Lanka)",
        "variety": "Suryamukhi / Bullet",
        "category": "SPICES",
        "modal_price_per_kg": 48.00,
        "min_price_per_kg": 38.00,
        "max_price_per_kg": 58.00,
        "arrival_quantity_tonnes": 35.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Darjeeling",
        "mandi_name": "Gorubathan APMC",
        "crop_name": "Fresh Mountain Ginger (Ada)",
        "variety": "Gorubathan Special",
        "category": "SPICES",
        "modal_price_per_kg": 105.00,
        "min_price_per_kg": 90.00,
        "max_price_per_kg": 120.00,
        "arrival_quantity_tonnes": 25.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Nadia",
        "mandi_name": "Ranaghat Sub-Division APMC",
        "crop_name": "White Garlic (Rosun)",
        "variety": "Yamuna Safed",
        "category": "SPICES",
        "modal_price_per_kg": 140.00,
        "min_price_per_kg": 120.00,
        "max_price_per_kg": 160.00,
        "arrival_quantity_tonnes": 20.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Nadia",
        "mandi_name": "Krishnanagar APMC",
        "crop_name": "Raw Turmeric (Kacha Haldi)",
        "variety": "Sugandham",
        "category": "SPICES",
        "modal_price_per_kg": 55.00,
        "min_price_per_kg": 45.00,
        "max_price_per_kg": 68.00,
        "arrival_quantity_tonnes": 15.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Purba Bardhaman",
        "mandi_name": "Memari Regulated Market",
        "crop_name": "Yellow Mustard (Shorshe)",
        "variety": "Binoy (B-9)",
        "category": "SPICES",
        "modal_price_per_kg": 52.00,
        "min_price_per_kg": 45.00,
        "max_price_per_kg": 60.00,
        "arrival_quantity_tonnes": 40.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Darjeeling",
        "mandi_name": "Kurseong Hill Market",
        "crop_name": "Large Cardamom (Alainchi)",
        "variety": "Ramsey / Varlangey",
        "category": "SPICES",
        "modal_price_per_kg": 850.00,
        "min_price_per_kg": 750.00,
        "max_price_per_kg": 980.00,
        "arrival_quantity_tonnes": 5.0,
        "source_agency": "Spices Board / Agmarknet WB"
    },
    {
        "district_name": "Hooghly",
        "mandi_name": "Singur Regulated Market APMC",
        "crop_name": "Coriander Seeds (Dhone)",
        "variety": "Pant Haritima",
        "category": "SPICES",
        "modal_price_per_kg": 70.00,
        "min_price_per_kg": 60.00,
        "max_price_per_kg": 82.00,
        "arrival_quantity_tonnes": 12.0,
        "source_agency": "Agmarknet WB"
    },
    {
        "district_name": "Murshidabad",
        "mandi_name": "Baharampur Krishak Bazar",
        "crop_name": "Tossa Golden Jute",
        "variety": "JRO-524 Grade 1",
        "category": "CASH_CROPS",
        "modal_price_per_kg": 48.00,
        "min_price_per_kg": 42.00,
        "max_price_per_kg": 54.00,
        "arrival_quantity_tonnes": 75.0,
        "source_agency": "Jute Corporation of India / Agmarknet"
    }
]
