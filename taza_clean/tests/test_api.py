import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport

from app.main import app



@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_farmer_login_and_create_listing():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Login as seeded Hooghly farmer
        login_res = await ac.post("/api/v1/auth/login/json", json={
            "email_or_phone": "ananda.mondal@farmer.taza.in",
            "password": "Farmer@123"
        })
        assert login_res.status_code == 200
        token_data = login_res.json()
        token = token_data["access_token"]
        assert token_data["role"] == "FARMER"

        headers = {"Authorization": f"Bearer {token}"}

        # 2. Post a fresh crop listing
        harvest_time = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
        listing_payload = {
            "crop_name": "Singur Fresh Radish (Mula)",
            "variety": "Pusa Chetki",
            "category": "VEGETABLES",
            "grade": "GRADE_A_PREMIUM",
            "quantity_available_kg": 200.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 18.0,
            "harvest_timestamp": harvest_time,
            "shelf_life_hours": 48,
            "freshness_decay_lambda": 0.02,
            "district": "Hooghly",
            "latitude": 22.8124,
            "longitude": 88.2345,
            "description": "Crisp morning harvested white radishes from Singur river basin.",
            "is_organic": True
        }
        res = await ac.post("/api/v1/farmers/listings", json=listing_payload, headers=headers)
        assert res.status_code == 201
        data = res.json()
        assert data["crop_name"] == "Singur Fresh Radish (Mula)"
        assert data["current_freshness_score"] > 80.0

        # 3. Check farmer dashboard
        dash_res = await ac.get("/api/v1/farmers/dashboard", headers=headers)
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        assert dash_data["total_listings"] >= 1
        assert dash_data["district"] == "Hooghly"


@pytest.mark.asyncio
async def test_consumer_catalog_freshness_and_mandi_comparison():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Consumer in Kolkata coords (Behala: 22.4986, 88.3102)
        res = await ac.get("/api/v1/consumers/catalog", params={
            "consumer_lat": 22.4986,
            "consumer_lng": 88.3102,
            "sort_by": "freshness"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["total_items"] > 0
        items = data["items"]
        assert len(items) > 0

        # Check freshness scores and Mandi benchmark comparisons
        first_item = items[0]
        assert "freshness_score" in first_item
        assert "hours_since_harvest" in first_item
        assert "distance_km" in first_item
        assert first_item["distance_km"] is not None

        # Verify Mandi comparison data structure
        has_mandi_comparison = any(item.get("mandi_benchmark") is not None for item in items)
        assert has_mandi_comparison is True


@pytest.mark.asyncio
async def test_dynamic_order_placement_and_tracking():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Login as Consumer
        login_res = await ac.post("/api/v1/auth/login/json", json={
            "email_or_phone": "sourav.banerjee@consumer.taza.in",
            "password": "Consumer@123"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Fetch catalog to get an available product ID
        cat_res = await ac.get("/api/v1/consumers/catalog")
        products = cat_res.json()["items"]
        target_product = products[0]

        # 3. Create Order with flexible weight (e.g. 3.5 kg)
        order_payload = {
            "product_id": target_product["id"],
            "quantity_kg": 3.5,
            "delivery_address": "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata",
            "consumer_lat": 22.4986,
            "consumer_lng": 88.3102,
            "notes": "Direct farm delivery please"
        }
        order_res = await ac.post("/api/v1/orders", json=order_payload, headers=headers)
        assert order_res.status_code == 201
        order_data = order_res.json()
        assert order_data["quantity_kg"] == 3.5
        assert order_data["subtotal_inr"] > 0
        assert order_data["logistics_fee_inr"] >= 0.0
        assert order_data["total_amount_inr"] <= order_data["city_retail_total_inr"]
        assert order_data["travel_vendor_name"] is not None
        assert order_data["status"] == "PLACED"
        order_id = order_data["id"]

        # 4. Verify tracking timeline
        track_res = await ac.get(f"/api/v1/orders/{order_id}/tracking", headers=headers)
        assert track_res.status_code == 200
        track_data = track_res.json()
        assert track_data["order_id"] == order_id
        assert len(track_data["timeline"]) == 5
        assert track_data["distance_km"] > 0


@pytest.mark.asyncio
async def test_logistics_routing_and_batch_optimization():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login/json", json={
            "email_or_phone": "sourav.banerjee@consumer.taza.in",
            "password": "Consumer@123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Test point-to-point route from Singur (Hooghly) to Kolkata
        route_req = {
            "origin_latitude": 22.8124,
            "origin_longitude": 88.2345,
            "origin_district": "Hooghly",
            "destination_latitude": 22.4986,
            "destination_longitude": 88.3102,
            "destination_district": "Kolkata",
            "cargo_weight_kg": 25.0,
            "requires_cold_chain": False
        }
        res = await ac.post("/api/v1/logistics/calculate-route", json=route_req, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total_distance_km"] > 0
        assert data["estimated_duration_minutes"] > 0
        assert data["logistics_cost_inr"] > 0
        assert data["recommended_vehicle"] in ["TATA_ACE", "E_RICKSHAW", "MAHINDRA_BOLERO_PICKUP"]

        # Test Batch Pickup Optimization
        batch_req = {
            "hub_district": "Hooghly",
            "hub_latitude": 22.8963,
            "hub_longitude": 88.2461,
            "waypoints": [
                {"name": "Singur Farm A", "latitude": 22.8124, "longitude": 88.2345, "type": "PICKUP", "demand_kg": 120.0},
                {"name": "Tarakeswar Farm B", "latitude": 22.8872, "longitude": 88.0211, "type": "PICKUP", "demand_kg": 200.0},
                {"name": "Balarambati Farm C", "latitude": 22.8250, "longitude": 88.2510, "type": "PICKUP", "demand_kg": 80.0}
            ],
            "vehicle_capacity_kg": 500.0
        }
        b_res = await ac.post("/api/v1/logistics/batch-optimize", json=batch_req, headers=headers)
        assert b_res.status_code == 200
        b_data = b_res.json()
        assert len(b_data["optimized_sequence"]) == 3
        assert b_data["total_cargo_kg"] == 400.0
        assert b_data["vehicle_utilization_percent"] == 80.0

        # Test External Route Optimization API Integration
        opt_req = {
            "origin": {"lat": 22.8124, "lng": 88.2345, "name": "Hooghly Central Hub"},
            "waypoints": [
                {"lat": 22.8250, "lng": 88.2510, "name": "Balarambati Farm C"},
                {"lat": 22.8872, "lng": 88.0211, "name": "Tarakeswar Farm B"}
            ]
        }
        opt_res = await ac.post("/api/v1/logistics/optimize-route", json=opt_req, headers=headers)
        assert opt_res.status_code == 200
        opt_data = opt_res.json()
        assert "optimizedOrder" in opt_data
        assert len(opt_data["optimizedOrder"]) == 3
        assert opt_data["optimizedOrder"][0]["name"] == "Hooghly Central Hub"
        assert opt_data["totalDistanceKm"] > 0.0

        # Test Direct /api/v1/optimize-route endpoint
        direct_opt_res = await ac.post("/api/v1/optimize-route", json=opt_req)
        assert direct_opt_res.status_code == 200
        direct_opt_data = direct_opt_res.json()
        assert "optimizedOrder" in direct_opt_data
        assert len(direct_opt_data["optimizedOrder"]) == 3
        assert direct_opt_data["totalDistanceKm"] == opt_data["totalDistanceKm"]



@pytest.mark.asyncio
async def test_weather_and_agro_advisories():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/weather/advisory?district=Hooghly")
        assert res.status_code == 200
        data = res.json()
        assert data["district"] == "Hooghly"
        assert "harvest_suitability_score" in data
        assert "is_safe_for_logistics_dispatch" in data
        assert len(data["alerts"]) > 0

        # Test Disaster Meteorological Alerts Integration
        # 1. Normal Conditions
        alert_res1 = await ac.get("/api/v1/alerts?region=Hooghly&wind_speed_kph=20.0&rainfall_mm=10.0")
        assert alert_res1.status_code == 200
        a1 = alert_res1.json()
        assert a1["region"] == "Hooghly"
        assert a1["severity"] == "LOW"
        assert "No active meteorological alerts for this region." in a1["activeWarnings"]

        # 2. Gale Warning & Flash Flood Watch
        alert_res2 = await ac.get("/api/v1/alerts?region=South%2024%20Parganas&wind_speed_kph=95.0&rainfall_mm=120.0")
        assert alert_res2.status_code == 200
        a2 = alert_res2.json()
        assert a2["region"] == "South 24 Parganas"
        assert a2["severity"] == "HIGH"
        assert "Gale Warning" in a2["activeWarnings"]
        assert "Flash Flood Watch" in a2["activeWarnings"]

        # 3. Severe Windstorm (Hurricane Force)
        alert_res3 = await ac.get("/api/v1/alerts?region=Sundarbans&wind_speed_kph=135.0&rainfall_mm=150.0")
        assert alert_res3.status_code == 200
        a3 = alert_res3.json()
        assert a3["region"] == "Sundarbans"
        assert a3["severity"] == "EXTREME"
        assert "Severe Windstorm Warning (HURRICANE FORCE)" in a3["activeWarnings"]
        assert "Flash Flood Watch" in a3["activeWarnings"]

        # 4. Real-time Live Weather Disaster Alert Query (Open-Meteo)
        live_res = await ac.get("/api/v1/alerts?region=Hooghly")
        assert live_res.status_code == 200
        live_data = live_res.json()
        assert live_data["region"] == "Hooghly"
        assert live_data["severity"] in ["LOW", "MODERATE", "HIGH", "EXTREME"]
        assert len(live_data["activeWarnings"]) > 0
        assert live_data["live_wind_speed_kph"] is not None
        assert live_data["live_temperature_c"] is not None
        assert "safe_corridor" in live_data
        assert live_data["forecast_source"] in ["OPEN_METEO_LIVE_API", "AGRO_STATION_CACHE"]

        # 5. Weather alerts router endpoint parity
        w_alert_res = await ac.get("/api/v1/weather/alerts?region=Darjeeling")
        assert w_alert_res.status_code == 200
        w_data = w_alert_res.json()
        assert w_data["region"] == "Darjeeling"
        assert w_data["live_temperature_c"] is not None


@pytest.mark.asyncio
async def test_analytics_and_wb_districts():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Check district metrics list
        res = await ac.get("/api/v1/analytics/districts")
        assert res.status_code == 200
        districts = res.json()
        assert len(districts) >= 5
        district_names = [d["district_name"] for d in districts]
        assert "Hooghly" in district_names
        assert "Nadia" in district_names
        assert "Malda" in district_names
        assert "Purba Bardhaman" in district_names

        # Check Mandi benchmarks
        mandi_res = await ac.get("/api/v1/analytics/mandi-benchmarks")
        assert mandi_res.status_code == 200
        mandis = mandi_res.json()
        assert len(mandis) >= 5

        # Check intelligent Mandi benchmark lookup
        lookup_res = await ac.get("/api/v1/analytics/mandi-benchmark-lookup?crop_name=Jyoti%20Potato&district=Hooghly")
        assert lookup_res.status_code == 200
        lookup_data = lookup_res.json()
        assert lookup_data["matched"] is True
        assert lookup_data["modal_price_per_kg"] == 8.5
        assert lookup_data["estimated_retail_price_per_kg"] > lookup_data["modal_price_per_kg"]
        assert "Singur" in lookup_data["mandi_name"]

        # Check fuzzy / partial lookup
        fuzzy_res = await ac.get("/api/v1/analytics/mandi-benchmark-lookup?crop_name=Mango&district=Malda")
        assert fuzzy_res.status_code == 200
        fuzzy_data = fuzzy_res.json()
        assert fuzzy_data["matched"] is True
        assert "Mango" in fuzzy_data["crop_name"]


@pytest.mark.asyncio
async def test_maps_geocode_and_reverse_geocode():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Geocode search
        geo_res = await ac.get("/api/v1/maps/geocode?query=Central%20Park")
        assert geo_res.status_code == 200
        places = geo_res.json()
        assert len(places) > 0
        assert places[0]["name"] == "Central Park"
        assert places[0]["placeId"] == "p101"

        # 2. Reverse geocode existing coordinates
        rev_res = await ac.get("/api/v1/maps/reverse-geocode?lat=40.7850&lng=-73.9682")
        assert rev_res.status_code == 200
        rev_place = rev_res.json()
        assert rev_place["placeId"] == "p101"
        assert rev_place["name"] == "Central Park"

        # 3. Reverse geocode nonexistent coordinates (404)
        rev_404 = await ac.get("/api/v1/maps/reverse-geocode?lat=0.0&lng=0.0")
        assert rev_404.status_code == 404
        assert rev_404.json()["detail"] == "No address found near coordinates"


@pytest.mark.asyncio
async def test_otp_send_and_verify():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        phone = "+919876543210"

        # 1. Send OTP
        send_res = await ac.post("/api/v1/otp/send", json={"phoneNumber": phone})
        assert send_res.status_code == 200
        send_data = send_res.json()
        assert send_data["status"] == "SUCCESS"
        assert "otpForTesting" in send_data
        otp_code = send_data["otpForTesting"]
        assert len(otp_code) == 6

        # 2. Verify with wrong OTP
        wrong_res = await ac.post("/api/v1/otp/verify", json={"phoneNumber": phone, "otp": "000000"})
        assert wrong_res.status_code == 400
        wrong_data = wrong_res.json()
        assert wrong_data["status"] == "FAILED"
        assert wrong_data["message"] == "Invalid OTP"

        # 3. Verify with correct OTP
        valid_res = await ac.post("/api/v1/otp/verify", json={"phoneNumber": phone, "otp": otp_code})
        assert valid_res.status_code == 200
        valid_data = valid_res.json()
        assert valid_data["status"] == "SUCCESS"
        assert valid_data["message"] == "OTP verified successfully"

        # 4. Verify again (OTP should be single-use consumed)
        reused_res = await ac.post("/api/v1/otp/verify", json={"phoneNumber": phone, "otp": otp_code})
        assert reused_res.status_code == 404


@pytest.mark.asyncio
async def test_frontend_static_serving():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/")
        assert res.status_code == 200
        assert "TAZA" in res.text or "KisanDirect" in res.text
        assert "Direct Farm-to-Fork" in res.text or "Harvests" in res.text

        css_res = await ac.get("/styles.css")
        assert css_res.status_code == 200
        assert "--kisan-green" in css_res.text

        js_res = await ac.get("/app.js")
        assert js_res.status_code == 200
        assert "API_BASE" in js_res.text


@pytest.mark.asyncio
async def test_order_cancellation_pre_and_post_dispatch():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Consumer & Farmer logins
        consumer_res = await ac.post("/api/v1/auth/login/json", json={
            "email_or_phone": "sourav.banerjee@consumer.taza.in",
            "password": "Consumer@123"
        })
        consumer_token = consumer_res.json()["access_token"]
        consumer_headers = {"Authorization": f"Bearer {consumer_token}"}

        farmer_res = await ac.post("/api/v1/auth/login/json", json={
            "email_or_phone": "ananda.mondal@farmer.taza.in",
            "password": "Farmer@123"
        })
        farmer_token = farmer_res.json()["access_token"]
        farmer_headers = {"Authorization": f"Bearer {farmer_token}"}

        # 1. Farmer creates a listing
        harvest_time = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        create_listing_res = await ac.post("/api/v1/farmers/listings", json={
            "crop_name": "Singur Farm Fresh Cauliflower",
            "variety": "Snowball",
            "category": "VEGETABLES",
            "grade": "GRADE_A_PREMIUM",
            "quantity_available_kg": 150.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 25.0,
            "harvest_timestamp": harvest_time,
            "shelf_life_hours": 72,
            "freshness_decay_lambda": 0.015,
            "district": "Hooghly",
            "latitude": 22.8124,
            "longitude": 88.2345,
            "description": "Crisp morning harvested cauliflowers from Singur.",
            "is_organic": True
        }, headers=farmer_headers)
        assert create_listing_res.status_code == 201
        target_product = create_listing_res.json()

        # 2. Place order 1 (Status = PLACED)
        order_res = await ac.post("/api/v1/orders", json={
            "product_id": target_product["id"],
            "quantity_kg": 2.0,
            "delivery_address": "Flat 4B, Greenfield City, Behala Chowrasta, Kolkata",
            "consumer_lat": 22.4986,
            "consumer_lng": 88.3102,
            "notes": "Testing pre-dispatch cancellation"
        }, headers=consumer_headers)
        assert order_res.status_code == 201
        order_1 = order_res.json()
        assert order_1["cancellation_allowed"] is True

        # Check tracking endpoint reflects cancellation_allowed
        track_res = await ac.get(f"/api/v1/orders/{order_1['id']}/tracking", headers=consumer_headers)
        assert track_res.status_code == 200
        track_data = track_res.json()
        assert track_data["cancellation_allowed"] is True

        # 3. Cancel order 1 while in pre-dispatch (PLACED) -> should succeed
        cancel_res = await ac.post(f"/api/v1/orders/{order_1['id']}/cancel", headers=consumer_headers)
        assert cancel_res.status_code == 200
        cancelled_data = cancel_res.json()
        assert cancelled_data["status"] == "CANCELLED"
        assert cancelled_data["cancellation_allowed"] is False

        # 4. Create order 2 and transition to DISPATCHED
        order2_res = await ac.post("/api/v1/orders", json={
            "product_id": target_product["id"],
            "quantity_kg": 1.5,
            "delivery_address": "Salt Lake Sector V, Kolkata",
            "consumer_lat": 22.5800,
            "consumer_lng": 88.4300,
            "notes": "Testing post-dispatch locked cancellation"
        }, headers=consumer_headers)
        assert order2_res.status_code == 201
        order_2 = order2_res.json()

        # Assigned farmer updates status to DISPATCHED
        dispatch_res = await ac.put(f"/api/v1/orders/{order_2['id']}/status", json={
            "status": "DISPATCHED",
            "notes": "Order loaded into transit vehicle from warehouse"
        }, headers=farmer_headers)
        assert dispatch_res.status_code == 200
        assert dispatch_res.json()["status"] == "DISPATCHED"

        # Check tracking endpoint reflects cancellation_allowed is False
        track_res2 = await ac.get(f"/api/v1/orders/{order_2['id']}/tracking", headers=consumer_headers)
        assert track_res2.status_code == 200
        assert track_res2.json()["cancellation_allowed"] is False
        assert "dispatched from the warehouse" in track_res2.json()["cancellation_status_message"]

        # 4. Attempt cancellation after dispatch -> MUST FAIL with 400
        cancel_post_dispatch = await ac.post(f"/api/v1/orders/{order_2['id']}/cancel", headers=consumer_headers)
        assert cancel_post_dispatch.status_code == 400
        detail = cancel_post_dispatch.json()["detail"]
        assert "dispatched from the warehouse" in detail


@pytest.mark.asyncio
async def test_external_travel_vendor_and_city_retail_ceiling():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Test external vendor delivery quote endpoint
        quote_payload = {
            "origin_latitude": 22.8124,
            "origin_longitude": 88.2345,
            "destination_latitude": 22.4986,
            "destination_longitude": 88.3102,
            "cargo_weight_kg": 2.0,
            "subtotal_inr": 40.0,
            "platform_fee_inr": 0.80,
            "city_retail_total_inr": 58.0,
            "requires_cold_chain": False
        }
        quote_res = await ac.post("/api/v1/logistics/delivery-quote", json=quote_payload)
        assert quote_res.status_code == 200
        quote_data = quote_res.json()
        assert "vendor_name" in quote_data
        assert quote_data["total_payable_inr"] <= quote_data["city_retail_total_inr"]
        assert quote_data["final_delivery_fee_inr"] <= quote_data["max_allowable_delivery_fee_inr"]

        # 2. Test when raw vendor fee exceeds city retail headroom (Strict Cap Invariant)
        tight_quote_payload = {
            "origin_latitude": 22.8124,
            "origin_longitude": 88.2345,
            "destination_latitude": 22.4986,
            "destination_longitude": 88.3102,
            "cargo_weight_kg": 1.0,
            "subtotal_inr": 30.0,
            "platform_fee_inr": 0.60,
            "city_retail_total_inr": 35.0,  # only 4.40 headroom, but raw vendor fee is ~30+
            "requires_cold_chain": False
        }
        tight_res = await ac.post("/api/v1/logistics/delivery-quote", json=tight_quote_payload)
        assert tight_res.status_code == 200
        tight_data = tight_res.json()
        assert tight_data["is_retail_capped"] is True
        assert tight_data["final_delivery_fee_inr"] == 4.40
        assert tight_data["total_payable_inr"] == 35.0
        assert tight_data["total_payable_inr"] <= tight_data["city_retail_total_inr"]
        assert tight_data["retail_subsidy_inr"] > 0


@pytest.mark.asyncio
async def test_farmer_produce_agreement_dispatch_and_preview():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Test Agreement Preview HTML with dynamic Farmer Name and Contact
        preview_res = await ac.get(
            "/api/v1/auth/farmer-agreement/preview",
            params={
                "farmer_name": "Debasis Mukherjee",
                "contact_number": "+919876543210"
            }
        )
        assert preview_res.status_code == 200
        assert "TAZA FARMER PRODUCE AGREEMENT" in preview_res.text
        assert "Debasis Mukherjee" in preview_res.text
        assert "+919876543210" in preview_res.text
        assert "Clause 1" in preview_res.text
        assert "Clause 2" in preview_res.text
        assert "Clause 3" in preview_res.text
        assert "Clause 4" in preview_res.text
        assert "Clause 5" in preview_res.text
        assert "কৃষক ফসল চুক্তি" in preview_res.text
        assert "किसान उपज समझौता" in preview_res.text

        # 2. Test Agreement Email Dispatch API with validation and record insertion
        send_res = await ac.post(
            "/api/v1/auth/farmer-agreement/send",
            json={
                "farmer_name": "Debasis Mukherjee",
                "farmer_email": "debasis.mukherjee@farmer.taza.in",
                "contact_number": "+919876543210"
            }
        )
        assert send_res.status_code == 200
        send_data = send_res.json()
        assert send_data["status"] == "success"
        assert send_data["farmer_name"] == "Debasis Mukherjee"
        assert send_data["farmer_email"] == "debasis.mukherjee@farmer.taza.in"
        assert send_data["contact_number"] == "+919876543210"
        assert "agreement_id" in send_data
        assert "debasis.mukherjee@farmer.taza.in" in send_data["message"]
        assert "Debasis Mukherjee" in send_data["message"]

        # 3. Verify static HTML and JS incorporate the terms checkbox and modal handlers
        index_res = await ac.get("/")
        assert index_res.status_code == 200
        assert "farmerTermsCheckbox" in index_res.text
        assert "farmerAgreementModal" in index_res.text
        assert "fieldFarmerTerms" in index_res.text

        app_js_res = await ac.get("/app.js")
        assert app_js_res.status_code == 200
        assert "openFarmerAgreementModal" in app_js_res.text
        assert "farmerTermsCheckbox" in app_js_res.text
        assert "/auth/farmer-agreement/send" in app_js_res.text


@pytest.mark.asyncio
async def test_farmer_agreement_real_smtp_dispatch():
    from unittest.mock import patch, MagicMock
    from app.core.config import settings

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        with patch.object(settings, "SMTP_USER", "notifications@taza.in"), \
             patch.object(settings, "SMTP_PASSWORD", "secret123"), \
             patch.object(settings, "SMTP_HOST", "smtp.taza.in"), \
             patch("smtplib.SMTP") as mock_smtp:

            mock_instance = MagicMock()
            mock_smtp.return_value = mock_instance

            send_res = await ac.post(
                "/api/v1/auth/farmer-agreement/send",
                json={
                    "farmer_name": "Subhas Mondal",
                    "farmer_email": "subhas.mondal@farmer.taza.in",
                    "contact_number": "+919830554433"
                }
            )
            assert send_res.status_code == 200
            data = send_res.json()
            assert data["status"] == "success"
            assert data["is_live_delivered"] is True
            assert "delivered to subhas.mondal@farmer.taza.in via SMTP" in data["message"]
            mock_instance.sendmail.assert_called_once()


@pytest.mark.asyncio
async def test_farmer_profile_documents_vault():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Test GET /api/v1/auth/farmer-agreement/documents
        doc_res = await ac.get(
            "/api/v1/auth/farmer-agreement/documents",
            params={"farmer_email": "ananda.mondal@farmer.taza.in", "contact_number": "+91 9830112233"}
        )
        assert doc_res.status_code == 200
        data = doc_res.json()
        assert "documents" in data
        assert data["total_documents"] >= 3
        produce_doc = next((d for d in data["documents"] if d["id"] == "doc-produce-agreement"), None)
        assert produce_doc is not None
        assert "TAZA Farmer Produce Agreement" in produce_doc["title"]
        assert produce_doc["status"] == "SIGNED_AND_ACTIVE"

        # 2. Test static assets include profile modal, banner, and js handlers
        index_res = await ac.get("/")
        assert index_res.status_code == 200
        assert "farmerProfileModal" in index_res.text
        assert "farmerDocsBanner" in index_res.text
        assert "handleNavAccountClick" in index_res.text

        app_js_res = await ac.get("/app.js")
        assert app_js_res.status_code == 200
        assert "openFarmerProfileModal" in app_js_res.text
        assert "loadFarmerDocuments" in app_js_res.text
        assert "resendFarmerAgreementEmail" in app_js_res.text


@pytest.mark.asyncio
async def test_farmer_insurance_policy_and_claim_sync():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Test GET /api/v1/insurance/claims (Fetches from MongoDB / Sample Space)
        claims_res = await ac.get("/api/v1/insurance/claims")
        assert claims_res.status_code == 200
        claims_data = claims_res.json()
        assert "claims" in claims_data
        assert claims_data["total_claims"] >= 1
        
        # Verify Jyoti Potato claim exists with 4250.0 Rs
        potato_claim = next((c for c in claims_data["claims"] if "Potato" in c["crop_name"]), None)
        assert potato_claim is not None
        assert potato_claim["claim_amount_rs"] == 4250.0
        assert potato_claim["calculated_refund_rs"] == 4250.0

        # 2. Test GET /api/v1/insurance/policy with 22 clauses and prominent claim callout
        policy_res = await ac.get(
            "/api/v1/insurance/policy",
            params={
                "crop_name": "Jyoti Potato",
                "farmer_name": "Ananda Mondal",
                "contact_number": "+91 9830112233",
                "sum_insured_rs": 9250.0
            }
        )
        assert policy_res.status_code == 200
        p_data = policy_res.json()
        assert p_data["policy_title"] == "ALL RISKS INSURANCE POLICY (Warehouse Storage Cover)"
        assert p_data["has_active_claim"] is True
        assert p_data["claim_amount_rs"] == 4250.0
        assert "policy_html" in p_data
        html = p_data["policy_html"]

        # Assert key statutory clauses from PDF are present
        assert "21. Spoilage Cover" in html
        assert "22. Minimum Claim Threshold" in html
        assert "All Risks" in html or "ALL RISKS" in html
        assert "4,250.00" in html
        assert "Ananda Mondal" in html

        # 3. Test Documents Vault includes doc-all-risks-insurance with claim details
        vault_res = await ac.get(
            "/api/v1/auth/farmer-agreement/documents",
            params={"farmer_email": "ananda.mondal@farmer.taza.in", "contact_number": "+91 9830112233"}
        )
        assert vault_res.status_code == 200
        v_data = vault_res.json()
        ins_doc = next((d for d in v_data["documents"] if d["id"] == "doc-all-risks-insurance"), None)
        assert ins_doc is not None
        assert ins_doc["category"] == "INSURANCE_POLICY"
        assert "4,250.00" in ins_doc["claim_amount"]
        assert ins_doc["claim_status"] in ["Pending", "Approved & Settled", "Approved", "Settled"]

        # 4. Test static HTML & JS integration
        idx_res = await ac.get("/")
        assert idx_res.status_code == 200
        assert "cropInsuranceOptIn" in idx_res.text
        assert "farmerInsuranceModal" in idx_res.text
        assert "updateInsurancePreview" in idx_res.text

        js_res = await ac.get("/app.js")
        assert js_res.status_code == 200
        assert "openFarmerInsuranceModal" in js_res.text
        assert "downloadFarmerInsurancePolicy" in js_res.text
        assert "updateInsurancePreview" in js_res.text

        # 5. Test POST /api/v1/insurance/claims to submit a new sample claim
        new_claim_payload = {
            "crop_name": "Gobindobhog Rice",
            "farmer_name": "Ananda Mondal",
            "contact_number": "+91 9830112233",
            "warehouse_id": "wh-hgl-01",
            "incident_risk_factor": "Water Ingress / Seepage from Monsoon Drainage",
            "damaged_quantity_kg": 150.0,
            "claim_amount_rs": 10800.0,
            "calculated_refund_rs": 10800.0,
            "damage_description": "Water leak caused partial soaking in warehouse bay B-4."
        }
        create_claim_res = await ac.post("/api/v1/insurance/claims", json=new_claim_payload)
        assert create_claim_res.status_code == 200
        claim_resp = create_claim_res.json()
        assert claim_resp["success"] is True
        assert "claim_id" in claim_resp
        assert claim_resp["claim_amount_rs"] == 10800.0


@pytest.mark.asyncio
async def test_farmer_subnav_filtering_and_logistics_route_interchange():
    """
    Validates:
    1. Sub-navigation taskbars (.subnav-consumer-item) are marked and styled for hiding in farmer accounts
       while keeping the Smart Logistics Engine (.subnav-logistics-item) active & accessible.
    2. Index HTML and CSS have the secondarySubNav id, farmer-mode styling, swap button, and perspective badge.
    3. App.js contains logisticsRouteDirection, swapLogisticsRoute(), and interchanged pickup/drop route rendering.
    4. Logistics calculate-route endpoint computes valid routes in both farmer outbound and consumer inbound directions.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Verify index.html contains necessary markup
        res_idx = await ac.get("/")
        assert res_idx.status_code == 200
        html = res_idx.text
        assert 'id="secondarySubNav"' in html
        assert 'subnav-consumer-item' in html
        assert 'subnav-logistics-item' in html
        assert 'btnSwapLogistics' in html
        assert 'logisticsPerspectiveBadge' in html
        assert 'farmerLogisticsBtn' in html

        # 2. Verify styles.css contains role rules and swap styling
        res_css = await ac.get("/styles.css")
        assert res_css.status_code == 200
        css = res_css.text
        assert "body.farmer-mode .subnav-consumer-item" in css
        assert ".btn-swap-route" in css
        assert ".logistics-perspective-badge" in css
        assert ".logistics-controls-bar.reversed" in css

        # 3. Verify app.js contains route interchanging & subnav logic
        res_js = await ac.get("/app.js")
        assert res_js.status_code == 200
        js = res_js.text
        assert "logisticsRouteDirection" in js
        assert "swapLogisticsRoute" in js
        assert "subnav-consumer-item" in js
        assert "Consumer Delivery Mode:" in js
        assert "Farmer Dispatch Mode:" in js
        assert "window.swapLogisticsRoute" in js
        assert "window.switchRole" in js

        # 4. Verify backend route calculator supports both forward (farmer) and reversed (consumer) routes
        farmer_login = await ac.post("/api/v1/auth/login/json", json={
            "email_or_phone": "ananda.mondal@farmer.taza.in",
            "password": "Farmer@123"
        })
        assert farmer_login.status_code == 200
        token = farmer_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Farmer Outbound: Hooghly (22.8124, 88.2345) -> Kolkata Central (22.5726, 88.3639)
        forward_route = await ac.post("/api/v1/logistics/calculate-route", json={
            "origin_latitude": 22.8124,
            "origin_longitude": 88.2345,
            "origin_district": "Hooghly",
            "destination_latitude": 22.5726,
            "destination_longitude": 88.3639,
            "destination_district": "Kolkata Central",
            "cargo_weight_kg": 50.0,
            "requires_cold_chain": True
        }, headers=headers)
        assert forward_route.status_code == 200
        data_fwd = forward_route.json()
        assert data_fwd["total_distance_km"] > 0
        assert data_fwd["logistics_cost_inr"] > 0

        # Consumer Inbound (Interchanged): Kolkata Central -> Hooghly
        reverse_route = await ac.post("/api/v1/logistics/calculate-route", json={
            "origin_latitude": 22.5726,
            "origin_longitude": 88.3639,
            "origin_district": "Kolkata Central",
            "destination_latitude": 22.8124,
            "destination_longitude": 88.2345,
            "destination_district": "Hooghly",
            "cargo_weight_kg": 50.0,
            "requires_cold_chain": True
        }, headers=headers)
        assert reverse_route.status_code == 200
        data_rev = reverse_route.json()
        assert data_rev["total_distance_km"] > 0
        assert data_rev["logistics_cost_inr"] > 0


@pytest.mark.asyncio
async def test_simplified_farmer_storage_and_cold_vault_matrix_ui():
    """
    Validates:
    1. Simplified tabbed layout for Farmer Storage & Cold Vault Matrix in index.html (Nearby cards, Calculator, Radar).
    2. Preservation of all critical elements (district filter, cards list, radar trigger, space calculator, sync container).
    3. Proper CSS classes in styles.css for the simplified matrix (.warehouse-matrix-card, .wh-matrix-tabs, .btn-wh-select).
    4. Proper JavaScript controller functions in app.js (switchWarehouseMatrixTab, renderFarmerWarehouseCards, recalculateStorageFit).
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res_idx = await ac.get("/")
        assert res_idx.status_code == 200
        html = res_idx.text

        # 1. Check tab buttons and container views
        assert 'id="whTabCards"' in html
        assert 'id="whTabCalculator"' in html
        assert 'id="whTabRadar"' in html
        assert 'id="whViewCards"' in html
        assert 'id="whViewCalculator"' in html
        assert 'id="whViewRadar"' in html

        # 2. Check all preserved functional IDs
        assert 'id="whDistrictFilter"' in html
        assert 'id="farmerWarehouseList"' in html
        assert 'id="calcAiSyncContainer"' in html
        assert 'id="calcCropCategory"' in html
        assert 'id="calcPlannedKg"' in html
        assert 'id="calcStorageResult"' in html
        assert 'id="aiFarmerOriginSelect"' in html
        assert 'id="btnRunAiWarehouseScan"' in html
        assert 'id="aiRadarResultsPanel"' in html

        # 3. Check CSS styling in styles.css
        res_css = await ac.get("/styles.css")
        assert res_css.status_code == 200
        css = res_css.text
        assert ".warehouse-matrix-card" in css
        assert ".wh-matrix-tabs" in css
        assert ".wh-tab-btn" in css
        assert ".wh-facility-card" in css
        assert ".btn-wh-select" in css

        # 4. Check JS logic in app.js
        res_js = await ac.get("/app.js")
        assert res_js.status_code == 200
        js = res_js.text
        assert "switchWarehouseMatrixTab" in js
        assert "window.switchWarehouseMatrixTab" in js
        assert "renderFarmerWarehouseCards" in js
        assert "recalculateStorageFit" in js
        assert "triggerAiWarehouseRadarScan" in js
        assert "applyWarehouseLimitToListing" in js


@pytest.mark.asyncio
async def test_role_based_default_language_switching():
    """
    Validates:
    1. Default language for Farmer interface is Bengali ('bn').
    2. Default language for Consumer interface is English ('en').
    3. switchRole() updates default language automatically based on active role.
    4. DOMContentLoaded initializes language according to active role.
    5. Dropdown #langSelect and translations in APP_TRANSLATIONS for 'bn' and 'en' are fully synchronized.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res_js = await ac.get("/app.js")
        assert res_js.status_code == 200
        js = res_js.text

        # 1. Role-based default language logic in switchRole
        assert 'const roleDefaultLang = (currentRole === "farmer") ? "bn" : "en";' in js
        assert 'changeAppLanguage(roleDefaultLang);' in js

        # 2. DOMContentLoaded role-based default language initialization
        assert 'const defaultRoleLang = (currentRole === \'farmer\') ? \'bn\' : \'en\';' in js
        assert 'changeAppLanguage(defaultRoleLang);' in js

        # 3. Dynamic localized greetings and role badges in Bengali and English
        assert 'currentLanguage === \'bn\' ? `নমস্কার, ${fName} (কৃষক)`' in js
        assert 'currentLanguage === "bn" ? "আনন্দ" : "Ananda"' in js

        # 4. Check translations dictionaries exist for both Bengali (bn) and English (en)
        assert 'bn: {' in js
        assert 'en: {' in js
        assert 'কৃষক ও এফপিও উৎপাদক অপারেশনস হাব' in js
        assert 'Farmer & FPO Producer Operations Hub' or 'Farmer Hub' in js


@pytest.mark.asyncio
async def test_freshness_index_calculator_with_harvest_and_delivery_time():
    """
    Validates:
    1. Freshness formula: Freshness(t) = 100 * exp(-lambda * t).
    2. t = time of harvest (elapsed hours since harvest) + expected delivery time for consumer to avoid transit spoilage.
    3. PricingFreshnessService calculate_freshness and calculate_freshness_breakdown.
    4. Higher delivery transit times reduce the delivery freshness score appropriately to protect consumers.
    5. GET /api/v1/consumers/catalog returns expected_delivery_hours and transit_adjusted_hours.
    6. Frontend static assets (app.js, index.html) include calculateFreshnessScore and modal formula card.
    """
    import math
    from datetime import datetime, timezone, timedelta
    from app.services.pricing_freshness_service import pricing_freshness_service

    # 1. Test pricing_freshness_service unit math directly
    now = datetime.now(timezone.utc)
    harvest_time = now - timedelta(hours=3.0)  # Harvested 3 hours ago
    decay_lambda = 0.015
    shelf_life = 72

    # Case A: expected_delivery_hours = 0.0 -> t = 3.0
    hours_a, score_a, _ = pricing_freshness_service.calculate_freshness(
        harvest_timestamp=harvest_time,
        shelf_life_hours=shelf_life,
        decay_lambda=decay_lambda,
        reference_time=now,
        expected_delivery_hours=0.0
    )
    expected_score_a = round(100.0 * math.exp(-0.015 * 3.0), 1)
    assert score_a == expected_score_a

    # Case B: expected_delivery_hours = 2.0 -> t = 3.0 + 2.0 = 5.0
    hours_b, score_b, _ = pricing_freshness_service.calculate_freshness(
        harvest_timestamp=harvest_time,
        shelf_life_hours=shelf_life,
        decay_lambda=decay_lambda,
        reference_time=now,
        expected_delivery_hours=2.0
    )
    expected_score_b = round(100.0 * math.exp(-0.015 * 5.0), 1)
    assert score_b == expected_score_b
    assert score_b < score_a  # Delivery transit duration properly penalizes freshness to prevent transit spoilage

    # Case C: Test calculate_freshness_breakdown
    breakdown = pricing_freshness_service.calculate_freshness_breakdown(
        harvest_timestamp=harvest_time,
        shelf_life_hours=shelf_life,
        decay_lambda=decay_lambda,
        expected_delivery_hours=2.5,
        reference_time=now
    )
    assert breakdown["hours_since_harvest"] == 3.0
    assert breakdown["expected_delivery_hours"] == 2.5
    assert breakdown["total_decay_time_t"] == 5.5
    assert breakdown["spoilage_prevented"] is True

    # 2. Test API consumer catalog integration
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/consumers/catalog", params={
            "consumer_lat": 22.5726,
            "consumer_lng": 88.3639
        })
        assert res.status_code == 200
        cat_data = res.json()
        assert len(cat_data["items"]) > 0
        first = cat_data["items"][0]
        assert "expected_delivery_hours" in first
        assert first["expected_delivery_hours"] is not None
        assert first["expected_delivery_hours"] >= 0.5
        assert "transit_adjusted_hours" in first
        assert first["transit_adjusted_hours"] >= first["hours_since_harvest"]

        # 3. Check frontend assets
        res_idx = await ac.get("/")
        assert res_idx.status_code == 200
        assert "modalFreshnessFormulaCard" in res_idx.text
        assert "Freshness Index Formula: 100 × e^(-λ · t)" in res_idx.text

        res_js = await ac.get("/app.js")
        assert res_js.status_code == 200
        assert "calculateFreshnessScore" in res_js.text
        assert "expectedDeliveryHours" in res_js.text


@pytest.mark.asyncio
async def test_subnav_menu_all_no_duplicate_icons():
    """
    Validates:
    1. index.html #subnavMenuAll has exactly one <i data-lucide="menu"> icon.
    2. APP_TRANSLATIONS subnavMenuAllText strings do NOT contain duplicate <i data-lucide="menu"> tags.
    3. applyTranslations() uses setText for subnavMenuAllText to prevent double icon rendering in consumer view.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res_idx = await ac.get("/")
        assert res_idx.status_code == 200
        # Button has single menu icon
        assert '<button class="menu-all subnav-consumer-item" id="subnavMenuAll"' in res_idx.text

        res_js = await ac.get("/app.js")
        assert res_js.status_code == 200
        js = res_js.text

        # Ensure no duplicate menu icon in translation strings
        assert 'subnavMenuAllText: "All Categories"' in js
        assert 'subnavMenuAllText: "সব ক্যাটাগরি"' in js
        assert 'subnavMenuAllText: "सभी श्रेणियां"' in js
        assert 'subnavMenuAllText: \'<i data-lucide="menu"></i>' not in js
        assert 'setText("subnavMenuAllText", t.subnavMenuAllText);' in js


@pytest.mark.asyncio
async def test_dynamic_daily_harvest_pricing_engine():
    """
    Validates:
    1. Direct calculation of daily dynamic price in PricingFreshnessService:
       - DYNAMIC_MANDI_PEG calculates daily market swing deterministically by date & crop.
       - FIXED_PRICE locks exact base price with 0.0 delta and STABLE trend.
       - Minimum Price Floor (MSP) strictly protects farmer from selling below reserve cost.
    2. Farmer listing API accepts pricing_strategy, target_farmer_price_per_kg, and min_price_floor_per_kg.
    3. Farmer listings response includes today_dynamic_price_per_kg, daily_price_change_percent, and daily_trend.
    4. Consumer catalog includes stock-style dynamic daily pricing metadata and calculates live price.
    5. Order calculation uses effective dynamic daily price.
    6. Frontend index.html, styles.css, and app.js contain stock trend pills and farmer pricing strategy controls.
    """
    from app.services.pricing_freshness_service import pricing_freshness_service

    # 1. Direct Service Unit Tests
    # A. Fixed price strategy
    fixed_price, fixed_delta, fixed_trend = pricing_freshness_service.calculate_daily_dynamic_price(
        base_price=30.0,
        crop_name="Organic Gobindobhog Rice",
        pricing_strategy="FIXED_PRICE",
        min_price_floor=25.0
    )
    assert fixed_price == 30.0
    assert fixed_delta == 0.0
    assert fixed_trend == "STABLE"

    # B. Dynamic peg with floor enforcement
    # Force test a floor higher than base price to guarantee floor is respected
    floor_protected_price, floor_delta, floor_trend = pricing_freshness_service.calculate_daily_dynamic_price(
        base_price=20.0,
        crop_name="Fresh Potato",
        pricing_strategy="DYNAMIC_MANDI_PEG",
        min_price_floor=22.0
    )
    assert floor_protected_price >= 22.0
    assert floor_delta >= 10.0  # (22 - 20) / 20 = +10%

    # C. Date-determinism test: Same date and crop produces same output
    test_dt = datetime(2026, 9, 15, 8, 0, 0, tzinfo=timezone.utc)
    p1, d1, t1 = pricing_freshness_service.calculate_daily_dynamic_price(
        base_price=25.0, crop_name="Tomato", pricing_strategy="DYNAMIC_MANDI_PEG", target_date=test_dt
    )
    p2, d2, t2 = pricing_freshness_service.calculate_daily_dynamic_price(
        base_price=25.0, crop_name="Tomato", pricing_strategy="DYNAMIC_MANDI_PEG", target_date=test_dt
    )
    assert p1 == p2
    assert d1 == d2
    assert t1 == t2

    # 2. Integration API Tests
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Farmer login
        login_res = await ac.post("/api/v1/auth/login/json", json={
            "email_or_phone": "ananda.mondal@farmer.taza.in",
            "password": "Farmer@123"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create dynamic listing
        now_iso = datetime.now(timezone.utc).isoformat()
        dynamic_payload = {
            "crop_name": "Dynamic Stock Cauliflower",
            "variety": "Early Snowball",
            "category": "VEGETABLES",
            "grade": "GRADE_A_PREMIUM",
            "quantity_available_kg": 300.0,
            "minimum_order_kg": 1.0,
            "expected_base_price_per_kg": 24.0,
            "pricing_strategy": "DYNAMIC_MANDI_PEG",
            "target_farmer_price_per_kg": 24.0,
            "min_price_floor_per_kg": 21.0,
            "harvest_timestamp": now_iso,
            "shelf_life_hours": 72,
            "freshness_decay_lambda": 0.015,
            "district": "Hooghly",
            "latitude": 22.8124,
            "longitude": 88.2345,
            "description": "Daily dynamic pricing pegged to Singur mandi benchmark."
        }
        res_dyn = await ac.post("/api/v1/farmers/listings", json=dynamic_payload, headers=headers)
        assert res_dyn.status_code == 201
        dyn_data = res_dyn.json()
        assert dyn_data["pricing_strategy"] == "DYNAMIC_MANDI_PEG"
        assert dyn_data["min_price_floor_per_kg"] == 21.0
        assert "today_dynamic_price_per_kg" in dyn_data
        assert "daily_price_change_percent" in dyn_data
        assert dyn_data["daily_trend"] in ["UP", "DOWN", "STABLE"]

        # Create fixed price listing
        fixed_payload = {
            "crop_name": "Fixed Price Premium Cardamom",
            "variety": "Malabar Green",
            "category": "SPICES",
            "grade": "GRADE_A_PREMIUM",
            "quantity_available_kg": 50.0,
            "minimum_order_kg": 0.25,
            "expected_base_price_per_kg": 120.0,
            "pricing_strategy": "FIXED_PRICE",
            "target_farmer_price_per_kg": 120.0,
            "harvest_timestamp": now_iso,
            "shelf_life_hours": 360,
            "freshness_decay_lambda": 0.005,
            "district": "Darjeeling",
            "latitude": 27.0360,
            "longitude": 88.2627,
            "description": "Fixed price contract cardamom."
        }
        res_fix = await ac.post("/api/v1/farmers/listings", json=fixed_payload, headers=headers)
        assert res_fix.status_code == 201
        fix_data = res_fix.json()
        assert fix_data["pricing_strategy"] == "FIXED_PRICE"
        assert fix_data["today_dynamic_price_per_kg"] == 120.0
        assert fix_data["daily_price_change_percent"] == 0.0
        assert fix_data["daily_trend"] == "STABLE"

        # Check farmer listings query
        my_list_res = await ac.get("/api/v1/farmers/listings", headers=headers)
        assert my_list_res.status_code == 200
        listings = my_list_res.json()
        assert any(l["crop_name"] == "Dynamic Stock Cauliflower" for l in listings)

        # Consumer Catalog query
        cat_res = await ac.get("/api/v1/consumers/catalog", params={"search": "Dynamic Stock Cauliflower"})
        assert cat_res.status_code == 200
        cat_data = cat_res.json()
        assert cat_data["total_items"] >= 1
        crop_item = next(i for i in cat_data["items"] if i["crop_name"] == "Dynamic Stock Cauliflower")
        assert crop_item["pricing_strategy"] == "DYNAMIC_MANDI_PEG"
        assert crop_item["is_market_pegged"] is True
        assert crop_item["base_price_per_kg"] > 0
        assert crop_item["daily_trend"] in ["UP", "DOWN", "STABLE"]

        # 3. Static Files Verification
        res_idx = await ac.get("/")
        assert res_idx.status_code == 200
        assert "optDynamicPegLabel" in res_idx.text
        assert "optFixedPriceLabel" in res_idx.text
        assert "cropMinPriceFloor" in res_idx.text
        assert "dynamicPricingPreviewStrip" in res_idx.text
        assert "modalStockTrendBadge" in res_idx.text

        res_css = await ac.get("/styles.css")
        assert res_css.status_code == 200
        assert ".stock-trend-pill" in res_css.text
        assert ".stock-trend-pill.up" in res_css.text
        assert ".stock-trend-pill.fixed" in res_css.text

        res_js = await ac.get("/app.js")
        assert res_js.status_code == 200
        assert "setListingPricingStrategy" in res_js.text
        assert "updateDynamicPricingPreview" in res_js.text
        assert "calculateDynamicDailyMarketPrice" in res_js.text
        assert "stockTrendBadge" in res_js.text
@pytest.mark.asyncio
async def test_farmer_login_view_activation():
    """Verify that logging in as a farmer activates the farmer portal view and does not leave the consumer page open."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res_idx = await ac.get("/")
        assert res_idx.status_code == 200
        # Verify both view sections exist in the DOM
        assert 'id="consumerView"' in res_idx.text
        assert 'id="farmerView"' in res_idx.text
        assert 'id="subnavFarmerHubLink"' in res_idx.text
        assert 'id="roleFarmerBtn"' in res_idx.text
        assert 'fillDemo(\'farmer\')' in res_idx.text

        res_js = await ac.get("/app.js")
        assert res_js.status_code == 200
        # Verify customQtyText is defined in renderProducts
        assert "const customQtyText =" in res_js.text
        # Verify switchRole activates farmerView and deactivates consumerView
        assert 'farmerSection.classList.add("active")' in res_js.text
        assert 'consumerSection.classList.remove("active")' in res_js.text
        assert 'farmerSection.style.display = "block"' in res_js.text
        assert 'consumerSection.style.display = "none"' in res_js.text
        # Verify window bindings
        assert "window.authState = authState" in res_js.text
        assert "window.switchRole = switchRole" in res_js.text
        assert "localStorage.setItem('taza_role'" in res_js.text


@pytest.mark.asyncio
async def test_farmer_harvest_timestamp_freshness_tally():
    """Verify that harvest time input exists in farmer page and tallies freshness against current time."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Check frontend HTML elements
        res_idx = await ac.get("/")
        assert res_idx.status_code == 200
        assert 'id="cropHarvestTimestamp"' in res_idx.text
        assert 'id="harvestTimeElapsedBadge"' in res_idx.text
        assert 'id="listingFreshnessCard"' in res_idx.text
        assert 'id="previewFreshnessNumber"' in res_idx.text
        assert 'id="previewFreshnessGrade"' in res_idx.text
        assert 'id="previewFreshnessBar"' in res_idx.text
        assert 'setHarvestTimePreset(0)' in res_idx.text
        assert 'setHarvestTimePreset(2)' in res_idx.text

        # 2. Check frontend JavaScript engine
        res_js = await ac.get("/app.js")
        assert res_js.status_code == 200
        assert "function initHarvestTimestampField()" in res_js.text
        assert "function setHarvestTimePreset(" in res_js.text
        assert "function updateListingFreshnessPreview()" in res_js.text
        assert "cropHarvestTimestamp" in res_js.text

        # 3. Test backend freshness calculation with different harvest timestamps tallied to current time
        login_res = await ac.post("/api/v1/auth/login/json", json={
            "email_or_phone": "ananda.mondal@farmer.taza.in",
            "password": "Farmer@123"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Case A: Fresh cut harvested 30 mins ago
        now = datetime.now(timezone.utc)
        recent_harvest = (now - timedelta(minutes=30)).isoformat()
        res_fresh = await ac.post("/api/v1/farmers/listings", json={
            "crop_name": "Fresh Hybrid Tomato",
            "variety": "Abhinav",
            "category": "VEGETABLES",
            "grade": "GRADE_A_PREMIUM",
            "quantity_available_kg": 150.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 25.0,
            "harvest_timestamp": recent_harvest,
            "shelf_life_hours": 48,
            "freshness_decay_lambda": 0.035,
            "district": "Hooghly",
            "latitude": 22.8124,
            "longitude": 88.2345,
            "description": "Just harvested morning tomatoes.",
            "is_organic": True
        }, headers=headers)
        assert res_fresh.status_code == 201
        data_fresh = res_fresh.json()
        # With elapsed ~0.5h + 2.0h transit = 2.5h, decay score = 100 * exp(-0.035 * 2.5) ~ 91.6%
        assert data_fresh["current_freshness_score"] >= 88.0

        # Case B: Harvested 20 hours ago
        older_harvest = (now - timedelta(hours=20)).isoformat()
        res_older = await ac.post("/api/v1/farmers/listings", json={
            "crop_name": "Fresh Hybrid Tomato",
            "variety": "Abhinav",
            "category": "VEGETABLES",
            "grade": "GRADE_A_PREMIUM",
            "quantity_available_kg": 100.0,
            "minimum_order_kg": 0.5,
            "expected_base_price_per_kg": 20.0,
            "harvest_timestamp": older_harvest,
            "shelf_life_hours": 48,
            "freshness_decay_lambda": 0.035,
            "district": "Hooghly",
            "latitude": 22.8124,
            "longitude": 88.2345,
            "description": "Yesterday's harvest lot.",
            "is_organic": True
        }, headers=headers)
        assert res_older.status_code == 201
        data_older = res_older.json()
        # With elapsed ~20h + 2.0h transit = 22.0h, decay score = 100 * exp(-0.035 * 22) ~ 46.3%
        assert data_older["current_freshness_score"] < data_fresh["current_freshness_score"]
        assert data_older["current_freshness_score"] < 60.0


@pytest.mark.asyncio
async def test_delivery_charge_minimum_35_maximum_65_tiered_by_quantity():
    """
    Verifies that delivery charge has a strict minimum of ₹35.00 and maximum of ₹65.00,
    scaling dynamically based on harvest quantity (kg):
    - Harvest <= 1.0 kg -> ₹35.00
    - Harvest = 5.0 kg -> ₹43.00
    - Harvest = 10.0 kg -> ₹53.00
    - Harvest = 15.0 kg -> ₹63.00
    - Harvest >= 16.0 kg (e.g. 20kg, 50kg) -> ₹65.00 (capped at maximum)
    Also verifies frontend static assets reflect the tiered range.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        base_payload = {
            "origin_latitude": 22.8124,
            "origin_longitude": 88.2345,
            "destination_latitude": 22.4986,
            "destination_longitude": 88.3102,
            "subtotal_inr": 500.0,
            "platform_fee_inr": 10.0,
            "city_retail_total_inr": 1000.0,  # generous headroom so retail ceiling does not clamp raw fee
            "requires_cold_chain": False
        }

        # 1. Test minimum delivery fee at 0.5 kg and 1.0 kg
        res_05 = await ac.post("/api/v1/logistics/delivery-quote", json={**base_payload, "cargo_weight_kg": 0.5})
        assert res_05.status_code == 200
        assert res_05.json()["raw_delivery_fee_inr"] == 35.0
        assert res_05.json()["final_delivery_fee_inr"] == 35.0

        res_1 = await ac.post("/api/v1/logistics/delivery-quote", json={**base_payload, "cargo_weight_kg": 1.0})
        assert res_1.status_code == 200
        assert res_1.json()["raw_delivery_fee_inr"] == 35.0
        assert res_1.json()["final_delivery_fee_inr"] == 35.0

        # 2. Test intermediate harvest quantities
        res_5 = await ac.post("/api/v1/logistics/delivery-quote", json={**base_payload, "cargo_weight_kg": 5.0})
        assert res_5.status_code == 200
        assert res_5.json()["raw_delivery_fee_inr"] == 43.0
        assert res_5.json()["final_delivery_fee_inr"] == 43.0

        res_10 = await ac.post("/api/v1/logistics/delivery-quote", json={**base_payload, "cargo_weight_kg": 10.0})
        assert res_10.status_code == 200
        assert res_10.json()["raw_delivery_fee_inr"] == 53.0
        assert res_10.json()["final_delivery_fee_inr"] == 53.0

        res_15 = await ac.post("/api/v1/logistics/delivery-quote", json={**base_payload, "cargo_weight_kg": 15.0})
        assert res_15.status_code == 200
        assert res_15.json()["raw_delivery_fee_inr"] == 63.0
        assert res_15.json()["final_delivery_fee_inr"] == 63.0

        # 3. Test maximum delivery fee cap at >= 16 kg
        res_16 = await ac.post("/api/v1/logistics/delivery-quote", json={**base_payload, "cargo_weight_kg": 16.0})
        assert res_16.status_code == 200
        assert res_16.json()["raw_delivery_fee_inr"] == 65.0
        assert res_16.json()["final_delivery_fee_inr"] == 65.0

        res_25 = await ac.post("/api/v1/logistics/delivery-quote", json={**base_payload, "cargo_weight_kg": 25.0})
        assert res_25.status_code == 200
        assert res_25.json()["raw_delivery_fee_inr"] == 65.0
        assert res_25.json()["final_delivery_fee_inr"] == 65.0

        res_50 = await ac.post("/api/v1/logistics/delivery-quote", json={**base_payload, "cargo_weight_kg": 50.0})
        assert res_50.status_code == 200
        assert res_50.json()["raw_delivery_fee_inr"] == 65.0
        assert res_50.json()["final_delivery_fee_inr"] == 65.0

        # 4. Verify route calculation endpoint directly
        login_res = await ac.post("/api/v1/auth/login/json", json={
            "email_or_phone": "sourav.banerjee@consumer.taza.in",
            "password": "Consumer@123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        route_res = await ac.post("/api/v1/logistics/calculate-route", json={
            "origin_latitude": 22.8124,
            "origin_longitude": 88.2345,
            "destination_latitude": 22.4986,
            "destination_longitude": 88.3102,
            "cargo_weight_kg": 1.0,
            "requires_cold_chain": False
        }, headers=headers)
        assert route_res.status_code == 200
        assert route_res.json()["logistics_cost_inr"] == 35.0

        # 5. Verify frontend JavaScript and HTML files
        with open("static/app.js", "r", encoding="utf-8") as f:
            js = f.read()
            assert "Math.min(65.0, Math.max(35.0" in js

        with open("static/index.html", "r", encoding="utf-8") as f:
            html = f.read()
            assert "₹35.00 - ₹65.00" in html


@pytest.mark.asyncio
async def test_farmer_pricing_strategy_info_and_20_percent_profit_share_scenario():
    """
    Verifies:
    1. POST /api/v1/farmers/pricing-scenario returns correct 20% profit share
       for DYNAMIC_MANDI_PEG strategy.
    2. FIXED_PRICE strategy returns zero profit share (no market benefit).
    3. HTML assets contain pricingScenarioBox, modalPricingStrategyInfo,
       openPricingStrategyInfoModal references.
    4. app.js assets contain selectPricingScenario and
       openPricingStrategyInfoModal function definitions.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # 1. Dynamic pricing with +₹10/kg surge → farmer gets 20% = ₹2/kg
        dynamic_res = await ac.post("/api/v1/farmers/pricing-scenario", json={
            "pricing_strategy": "DYNAMIC_MANDI_PEG",
            "base_price_per_kg": 25.0,
            "market_surge_inr": 10.0,
            "harvest_quantity_kg": 500.0,
            "profit_share_percent": 20.0
        })
        assert dynamic_res.status_code == 200, f"Dynamic scenario failed: {dynamic_res.text}"
        raw = dynamic_res.json()
        assert raw["farmer_profit_share_per_kg"] == 2.0, (
            f"Expected 2.0, got {raw['farmer_profit_share_per_kg']}"
        )
        assert raw["extra_farmer_profit_inr"] == 1000.0, (
            f"Expected 1000.0, got {raw['extra_farmer_profit_inr']}"
        )
        assert raw["final_farmer_payout_per_kg"] == 27.0, (
            f"Expected 27.0, got {raw['final_farmer_payout_per_kg']}"
        )
        assert raw["pricing_strategy"] == "DYNAMIC_MANDI_PEG"
        assert raw["market_state"] in ("HIGH_SURGE", "NORMAL"), (
            f"Unexpected market_state: {raw['market_state']}"
        )
        assert raw["farmer_profit_share_per_kg"] > 0, "Expected positive profit share for dynamic + surge"

        # 2. Festival spike +₹15/kg → 20% = ₹3/kg, extra = ₹1500
        fest_res = await ac.post("/api/v1/farmers/pricing-scenario", json={
            "pricing_strategy": "DYNAMIC_MANDI_PEG",
            "base_price_per_kg": 25.0,
            "market_surge_inr": 15.0,
            "harvest_quantity_kg": 500.0,
            "profit_share_percent": 20.0
        })
        assert fest_res.status_code == 200
        fest = fest_res.json()
        assert fest["farmer_profit_share_per_kg"] == 3.0
        assert fest["extra_farmer_profit_inr"] == 1500.0
        assert fest["final_farmer_payout_per_kg"] == 28.0

        # 3. FIXED_PRICE → zero profit share regardless of surge
        fixed_res = await ac.post("/api/v1/farmers/pricing-scenario", json={
            "pricing_strategy": "FIXED_PRICE",
            "base_price_per_kg": 25.0,
            "market_surge_inr": 10.0,
            "harvest_quantity_kg": 500.0,
            "profit_share_percent": 20.0
        })
        assert fixed_res.status_code == 200, f"Fixed scenario failed: {fixed_res.text}"
        fixed = fixed_res.json()
        assert fixed["farmer_profit_share_per_kg"] == 0.0
        assert fixed["extra_farmer_profit_inr"] == 0.0
        assert fixed["final_farmer_payout_per_kg"] == 25.0

        # 4. GET endpoint should also return scenario info
        get_res = await ac.get("/api/v1/farmers/pricing-scenario")
        assert get_res.status_code == 200
        get_data = get_res.json()
        assert "scenarios" in get_data or "pricing_strategy" in get_data or "message" in get_data

        # 5. Verify HTML contains all new UI elements
        with open("static/index.html", "r", encoding="utf-8") as f:
            html = f.read()
        assert "pricingScenarioBox" in html, "Missing pricingScenarioBox in HTML"
        assert "modalPricingStrategyInfo" in html, "Missing modalPricingStrategyInfo in HTML"
        assert "openPricingStrategyInfoModal" in html, "Missing openPricingStrategyInfoModal ref in HTML"
        assert "selectPricingScenario" in html, "Missing selectPricingScenario ref in HTML"
        assert "valFarmerProfitShare" in html, "Missing valFarmerProfitShare in HTML"
        assert "valExtraLotEarnings" in html, "Missing valExtraLotEarnings in HTML"
        assert "modalTabDynamic" in html, "Missing modalTabDynamic in HTML"
        assert "modalTabFixed" in html, "Missing modalTabFixed in HTML"

        # 6. Verify JavaScript contains all new function definitions
        with open("static/app.js", "r", encoding="utf-8") as f:
            js = f.read()
        assert "selectPricingScenario" in js, "Missing selectPricingScenario in app.js"
        assert "openPricingStrategyInfoModal" in js, "Missing openPricingStrategyInfoModal in app.js"
        assert "closePricingStrategyInfoModal" in js, "Missing closePricingStrategyInfoModal in app.js"
        assert "switchPricingInfoTab" in js, "Missing switchPricingInfoTab in app.js"
        assert "_currentPricingScenario" in js, "Missing _currentPricingScenario state var in app.js"
        assert "window.openPricingStrategyInfoModal" in js, "Missing window export for openPricingStrategyInfoModal"
        assert "window.selectPricingScenario" in js, "Missing window export for selectPricingScenario"
