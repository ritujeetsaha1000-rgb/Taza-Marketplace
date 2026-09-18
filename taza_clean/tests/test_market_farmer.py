import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_register_farmer_camel_case():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "farmerName": "Ramesh Chandra",
            "contactNumber": "+919876543210",
            "districtName": "Hooghly",
            "villageOrBlock": "Singur Block",
            "offeredCrops": [
                {
                    "cropName": "Jyoti Potato",
                    "subGroup": "Vegetables",
                    "availableQuantity": 1500,
                    "expectedPricePerUnit": 22.5
                },
                {
                    "cropName": "Gobindobhog Rice",
                    "subGroup": "Grains",
                    "availableQuantity": 500,
                    "expectedPricePerUnit": 95.0
                }
            ]
        }
        res = await ac.post("/api/v1/market-farmer/farmers", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["farmer_name"] == "Ramesh Chandra"
        assert data["contact_number"] == "+919876543210"
        assert data["district_name"] == "Hooghly"
        assert data["village_or_block"] == "Singur Block"
        assert len(data["offered_crops"]) == 2
        assert data["offered_crops"][0]["crop_name"] == "Jyoti Potato"
        assert data["offered_crops"][0]["sub_group"] == "Vegetables"
        assert data["offered_crops"][0]["available_quantity"] == 1500.0


@pytest.mark.asyncio
async def test_register_farmer_snake_case():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "farmer_name": "Bikash Malakar",
            "contact_number": "+919812345678",
            "district_name": "Nadia",
            "village_or_block": "Ranaghat",
            "offered_crops": [
                {
                    "crop_name": "Fazli Mango",
                    "sub_group": "Fruits",
                    "available_quantity": 800,
                    "expected_price_per_unit": 60.0
                }
            ]
        }
        res = await ac.post("/api/v1/market-farmer/farmers", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["farmer_name"] == "Bikash Malakar"
        assert data["district_name"] == "Nadia"
        assert len(data["offered_crops"]) == 1
        assert data["offered_crops"][0]["crop_name"] == "Fazli Mango"
        assert data["offered_crops"][0]["sub_group"] == "Fruits"


@pytest.mark.asyncio
async def test_list_and_filter_registered_farmers():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Filter by district
        res = await ac.get("/api/v1/market-farmer/farmers?district=Hooghly")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 1
        assert any(f["farmer_name"] == "Ramesh Chandra" for f in data)

        # Filter by sub_group
        res_fruits = await ac.get("/api/v1/market-farmer/farmers?sub_group=Fruits")
        assert res_fruits.status_code == 200
        data_fruits = res_fruits.json()
        assert len(data_fruits) >= 1
        assert any(f["farmer_name"] == "Bikash Malakar" for f in data_fruits)


@pytest.mark.asyncio
async def test_record_and_query_market_prices():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "districtName": "Hooghly",
            "cropName": "Jyoti Potato",
            "subGroup": "Vegetables",
            "averagePriceINR": 2150.0,
            "unit": "Quintal"
        }
        res = await ac.post("/api/v1/market-farmer/prices", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["district_name"] == "Hooghly"
        assert data["crop_name"] == "Jyoti Potato"
        assert data["average_price_inr"] == 2150.0
        assert data["unit"] == "Quintal"

        price_id = data["id"]

        # Get single price
        res_single = await ac.get(f"/api/v1/market-farmer/prices/{price_id}")
        assert res_single.status_code == 200
        assert res_single.json()["id"] == price_id

        # Query price list with filters
        res_list = await ac.get("/api/v1/market-farmer/prices?district_name=Hooghly&crop_name=Potato")
        assert res_list.status_code == 200
        prices = res_list.json()
        assert len(prices) >= 1
        assert any(p["crop_name"] == "Jyoti Potato" for p in prices)


@pytest.mark.asyncio
async def test_price_arbitrage():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/market-farmer/arbitrage?district_name=Hooghly&crop_name=Potato")
        assert res.status_code == 200
        data = res.json()
        assert "total_comparisons" in data
        assert len(data["comparisons"]) >= 1
        comp = data["comparisons"][0]
        assert "farmer_expected_price_per_kg" in comp
        assert "market_average_price_per_kg" in comp
        assert comp["farmer_vs_market_status"] in ["COMPETITIVE_BELOW_MARKET", "ABOVE_MARKET", "MARKET_BENCHMARK_UNAVAILABLE"]

