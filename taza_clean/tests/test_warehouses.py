import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.warehouse_service import warehouse_service


@pytest.mark.asyncio
async def test_nearest_warehouse_within_40km():
    """
    Test nearest warehouse scan when farmer is within 40 km of an existing facility.
    For instance: Singur, Hooghly (lat: 22.81, lng: 88.23).
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/warehouses/nearest?lat=22.81&lng=88.23")
        assert res.status_code == 200, res.text
        data = res.json()

        assert "locationName" in data
        assert "district" in data
        assert "capacityKg" in data
        assert "currentStockKg" in data
        assert "availableSpaceKg" in data
        assert data["isAvailable"] is True

        # Available space must equal capacity - current stock
        expected_space = data["capacityKg"] - data["currentStockKg"]
        assert data["availableSpaceKg"] == expected_space

        # Distance should be <= 40 km and radius should be 40 km
        assert data["distanceKm"] <= 40.0
        assert data["scannedRadiusKm"] == 40.0
        assert data["scanIterations"] == 1


@pytest.mark.asyncio
async def test_nearest_warehouse_expansion_scan():
    """
    Test incremental 40km radius expansion (40km -> 80km -> 120km...)
    For coordinates located > 40km away from any warehouse (e.g. deep offshore in Bay of Bengal: lat=20.50, lng=88.00).
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/warehouses/nearest?lat=20.50&lng=88.00")
        assert res.status_code == 200, res.text
        data = res.json()

        # The nearest coastal Bengal warehouse should be > 40 km away
        assert data["distanceKm"] > 40.0
        # The scanned radius should be an exact multiple of 40 km
        assert data["scannedRadiusKm"] % 40.0 == 0.0
        assert data["scannedRadiusKm"] >= 80.0
        assert data["scanIterations"] >= 2
        assert data["distanceKm"] <= data["scannedRadiusKm"]
        assert data["availableSpaceKg"] > 0


@pytest.mark.asyncio
async def test_list_all_warehouses():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/warehouses")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "capacityKg" in data[0]
        assert "availableSpaceKg" in data[0]
