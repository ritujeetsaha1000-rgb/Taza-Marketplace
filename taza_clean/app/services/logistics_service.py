import math
import httpx
from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings
from app.models.logistics import VehicleType
from app.schemas.logistics import (
    RouteCalculationResponse,
    RouteSegment,
    WaypointLocation,
    BatchPickupDropoffResponse,
    RouteOptimizeLocation,
    RouteOptimizeRequest,
    RouteOptimizeResponse,
    VendorDeliveryQuoteResponse,
)


class LogisticsService:
    """Production logistics routing engine with OSRM integration and geodesic fallbacks."""

    ROAD_TORTUOSITY_FACTOR = 1.28  # Accounts for Bengal state highways and rural bypasses
    
    # Emission factor in kg CO2 per km for vehicle types
    CARBON_EMISSION_FACTORS = {
        VehicleType.E_RICKSHAW: 0.02,
        VehicleType.E_TRUCK_3W: 0.04,
        VehicleType.TATA_ACE: 0.18,
        VehicleType.MAHINDRA_BOLERO_PICKUP: 0.24,
        VehicleType.REEFER_COLD_VAN: 0.32,
    }

    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Great-circle distance between two points on the Earth."""
        r = 6371.0  # Earth's radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c

    def determine_vehicle(
        self,
        distance_km: float,
        cargo_weight_kg: float,
        requires_cold_chain: bool,
        preferred_vehicle: Optional[VehicleType] = None
    ) -> VehicleType:
        if preferred_vehicle:
            return preferred_vehicle
        if requires_cold_chain:
            return VehicleType.REEFER_COLD_VAN
        if distance_km <= 15.0 and cargo_weight_kg <= 150.0:
            return VehicleType.E_RICKSHAW
        if distance_km <= 60.0 and cargo_weight_kg <= 750.0:
            return VehicleType.TATA_ACE
        return VehicleType.MAHINDRA_BOLERO_PICKUP

    async def calculate_route(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        cargo_weight_kg: float = 10.0,
        requires_cold_chain: bool = False,
        preferred_vehicle: Optional[VehicleType] = None
    ) -> RouteCalculationResponse:
        """
        Attempts to query OSRM public engine. Falls back to geospatial spatial model on network failure.
        """
        straight_km = self.haversine_distance_km(origin_lat, origin_lng, dest_lat, dest_lng)
        estimated_road_km = max(1.0, round(straight_km * self.ROAD_TORTUOSITY_FACTOR, 2))
        
        # Default fallback estimate (approx 35 km/h average speed in suburban/rural WB)
        duration_minutes = round((estimated_road_km / 35.0) * 60.0 + 10.0, 1)
        
        service_provider = "HAVERSINE_SPATIAL_MODEL"
        turn_by_turn: List[RouteSegment] = [
            RouteSegment(
                step_number=1,
                instruction="Pickup from farm-gate storage hub",
                distance_km=0.0,
                duration_minutes=5.0
            ),
            RouteSegment(
                step_number=2,
                instruction="Transit along state connecting corridor",
                distance_km=estimated_road_km,
                duration_minutes=duration_minutes - 10.0
            ),
            RouteSegment(
                step_number=3,
                instruction="Final drop-off at consumer delivery address",
                distance_km=0.0,
                duration_minutes=5.0
            )
        ]
        geometry_geojson = None

        # Try OSRM routing
        try:
            url = f"{settings.OSRM_BASE_URL}/route/v1/driving/{origin_lng},{origin_lat};{dest_lng},{dest_lat}?overview=simplified&steps=true"
            async with httpx.AsyncClient(timeout=3.5) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("code") == "Ok" and data.get("routes"):
                        route = data["routes"][0]
                        estimated_road_km = round(route["distance"] / 1000.0, 2)
                        duration_minutes = round(route["duration"] / 60.0, 1)
                        geometry_geojson = route.get("geometry")
                        service_provider = "OSRM_ENGINE"
        except Exception:
            # Fallback is already initialized
            pass

        vehicle = self.determine_vehicle(
            estimated_road_km, cargo_weight_kg, requires_cold_chain, preferred_vehicle
        )
        
        # Calculate fair shared logistics cost based on weight tier and corridor distance
        # Delivery charge: minimum ₹35.0 and maximum ₹65.0 depending on quantity of the harvest
        if cargo_weight_kg < 20.0:
            # Pro-rated shared consumer green delivery (<18h cold-chain corridor)
            # Minimum ₹35.0 and Maximum ₹65.0 based on harvest quantity (weight in kg)
            weight_tier_fee = round(settings.MIN_DELIVERY_FARE_INR + max(0.0, cargo_weight_kg - 1.0) * 2.0, 2)
            logistics_cost = min(settings.MAX_DELIVERY_FARE_INR, max(settings.MIN_DELIVERY_FARE_INR, weight_tier_fee))
            if requires_cold_chain:
                logistics_cost = min(settings.MAX_DELIVERY_FARE_INR, round(logistics_cost * 1.15, 2))
        else:
            # Dedicated freight transport tier
            logistics_cost = round(
                settings.BASE_DELIVERY_FARE_INR + (estimated_road_km * settings.PER_KM_RATE_INR * min(1.0, max(0.25, cargo_weight_kg / 500.0))), 2
            )
            if requires_cold_chain:
                logistics_cost = round(logistics_cost * 1.35, 2)

        carbon_factor = self.CARBON_EMISSION_FACTORS.get(vehicle, 0.20)
        estimated_carbon = round(estimated_road_km * carbon_factor, 2)
        diesel_carbon = round(estimated_road_km * 0.28, 2)
        carbon_savings = max(0.0, round(((diesel_carbon - estimated_carbon) / max(0.01, diesel_carbon)) * 100.0, 1))

        return RouteCalculationResponse(
            origin={"latitude": origin_lat, "longitude": origin_lng},
            destination={"latitude": dest_lat, "longitude": dest_lng},
            total_distance_km=estimated_road_km,
            estimated_duration_minutes=duration_minutes,
            recommended_vehicle=vehicle,
            logistics_cost_inr=logistics_cost,
            estimated_carbon_kg=estimated_carbon,
            carbon_savings_percent_vs_diesel=carbon_savings,
            route_geometry_geojson={"type": "LineString", "coordinates": geometry_geojson} if isinstance(geometry_geojson, list) else None,
            turn_by_turn_summary=turn_by_turn,
            service_provider=service_provider
        )

    async def calculate_vendor_delivery_quote(
        self,
        subtotal_inr: float,
        city_retail_total_inr: float,
        cargo_weight_kg: float = 2.5,
        origin_lat: float = 22.8124,
        origin_lng: float = 88.2345,
        dest_lat: float = 22.4986,
        dest_lng: float = 88.3102,
        platform_fee_inr: Optional[float] = None,
        requires_cold_chain: bool = False,
        vendor_name: str = "Bengal Rural Travel Express (External Fleet)"
    ) -> VendorDeliveryQuoteResponse:
        """
        External Travel Vendor Delivery Quoting Engine:
        - Quotes dynamic logistics fee from external travel vendor based on weight and road distance.
        - STRICT GUARANTEE: Under any circumstances, Total Order Price (or Delivery Fee)
          MUST NOT exceed the City Mandi Retail benchmark.
        - If subtotal + platform_fee + raw_vendor_fee > city_retail_total, the delivery fee
          is strictly capped down to max(0, city_retail_total - subtotal - platform_fee).
        """
        route = await self.calculate_route(
            origin_lat=origin_lat,
            origin_lng=origin_lng,
            dest_lat=dest_lat,
            dest_lng=dest_lng,
            cargo_weight_kg=cargo_weight_kg,
            requires_cold_chain=requires_cold_chain
        )
        
        if platform_fee_inr is None:
            platform_fee_inr = round(subtotal_inr * (settings.PLATFORM_COMMISSION_PERCENT / 100.0), 2)
            
        # Ensure raw delivery fee obeys minimum ₹35.0 and maximum ₹65.0 depending on harvest quantity
        raw_delivery_fee = min(settings.MAX_DELIVERY_FARE_INR, max(settings.MIN_DELIVERY_FARE_INR, round(route.logistics_cost_inr, 2)))
        
        # Calculate city retail ceiling
        # Under NO circumstances can subtotal + platform_fee + delivery_fee exceed city_retail_total!
        base_order_cost = round(subtotal_inr + platform_fee_inr, 2)
        max_allowable_delivery_fee = max(0.0, round(city_retail_total_inr - base_order_cost, 2))
        
        is_retail_capped = raw_delivery_fee > max_allowable_delivery_fee
        final_delivery_fee = min(raw_delivery_fee, max_allowable_delivery_fee)
        retail_subsidy = round(raw_delivery_fee - final_delivery_fee, 2) if is_retail_capped else 0.0
        
        total_payable = round(base_order_cost + final_delivery_fee, 2)
        # Strict sanity invariant: total_payable <= city_retail_total_inr
        if total_payable > city_retail_total_inr:
            final_delivery_fee = max(0.0, round(city_retail_total_inr - base_order_cost, 2))
            total_payable = round(base_order_cost + final_delivery_fee, 2)
            is_retail_capped = True
            retail_subsidy = round(raw_delivery_fee - final_delivery_fee, 2)

        consumer_savings = max(0.0, round(city_retail_total_inr - total_payable, 2))
        
        if is_retail_capped:
            guarantee_message = (
                f"🛡️ City Retail Guarantee Applied: External travel delivery fee capped at ₹{final_delivery_fee:.2f} "
                f"(₹{retail_subsidy:.2f} subsidy). Your total (₹{total_payable:.2f}) is guaranteed <= City Retail (₹{city_retail_total_inr:.2f})."
            )
        else:
            guarantee_message = (
                f"✅ Verified Fair-Trade Travel Rate: External delivery fee ₹{final_delivery_fee:.2f}. "
                f"Total payable (₹{total_payable:.2f}) saves ₹{consumer_savings:.2f} compared to City Mandi Retail (₹{city_retail_total_inr:.2f})."
            )

        return VendorDeliveryQuoteResponse(
            vendor_name=vendor_name,
            vehicle_type=route.recommended_vehicle,
            distance_km=route.total_distance_km,
            raw_delivery_fee_inr=raw_delivery_fee,
            max_allowable_delivery_fee_inr=max_allowable_delivery_fee,
            final_delivery_fee_inr=final_delivery_fee,
            is_retail_capped=is_retail_capped,
            retail_subsidy_inr=retail_subsidy,
            subtotal_inr=subtotal_inr,
            platform_fee_inr=platform_fee_inr,
            total_payable_inr=total_payable,
            city_retail_total_inr=city_retail_total_inr,
            consumer_savings_inr=consumer_savings,
            guarantee_message=guarantee_message
        )

    def optimize_batch_route(
        self,
        hub_lat: float,
        hub_lng: float,
        waypoints: List[WaypointLocation],
        vehicle_capacity_kg: float = 500.0
    ) -> BatchPickupDropoffResponse:
        """
        Nearest Neighbor sequencing heuristic for multi-stop agricultural dispatch.
        """
        unvisited = list(waypoints)
        ordered: List[WaypointLocation] = []
        cur_lat, cur_lng = hub_lat, hub_lng
        total_dist = 0.0
        total_cargo = 0.0

        while unvisited:
            next_idx = 0
            min_dist = float("inf")
            for i, wp in enumerate(unvisited):
                dist = self.haversine_distance_km(cur_lat, cur_lng, wp.latitude, wp.longitude)
                if dist < min_dist:
                    min_dist = dist
                    next_idx = i

            closest_wp = unvisited.pop(next_idx)
            ordered.append(closest_wp)
            total_dist += min_dist * self.ROAD_TORTUOSITY_FACTOR
            total_cargo += closest_wp.demand_kg
            cur_lat, cur_lng = closest_wp.latitude, closest_wp.longitude

        # Return to hub distance
        return_dist = self.haversine_distance_km(cur_lat, cur_lng, hub_lat, hub_lng) * self.ROAD_TORTUOSITY_FACTOR
        total_dist = round(total_dist + return_dist, 2)
        total_duration = round((total_dist / 32.0) * 60.0 + (len(waypoints) * 12.0), 1)
        utilization = min(100.0, round((total_cargo / max(1.0, vehicle_capacity_kg)) * 100.0, 1))
        est_cost = round(settings.BASE_DELIVERY_FARE_INR * 2.0 + (total_dist * settings.PER_KM_RATE_INR), 2)

        return BatchPickupDropoffResponse(
            optimized_sequence=ordered,
            total_route_distance_km=total_dist,
            total_duration_minutes=total_duration,
            total_cargo_kg=round(total_cargo, 2),
            vehicle_utilization_percent=utilization,
            estimated_total_cost_inr=est_cost
        )

    async def optimize_external_route(
        self,
        origin: RouteOptimizeLocation,
        waypoints: List[RouteOptimizeLocation]
    ) -> RouteOptimizeResponse:
        """
        Integrates with external Spring Boot Route Optimization REST API (/api/v1/optimize-route).
        Falls back to local Nearest Neighbor distance heuristic if service is unavailable.
        """
        payload = {
            "origin": {"lat": origin.lat, "lng": origin.lng, "name": origin.name or ""},
            "waypoints": [{"lat": wp.lat, "lng": wp.lng, "name": wp.name or ""} for wp in waypoints]
        }

        # Attempt external service call
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(
                    settings.ROUTE_OPTIMIZATION_SERVICE_URL,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                if res.status_code == 200:
                    data = res.json()
                    return RouteOptimizeResponse(
                        optimizedOrder=[
                            RouteOptimizeLocation(
                                lat=item["lat"],
                                lng=item["lng"],
                                name=item.get("name", "")
                            )
                            for item in data.get("optimizedOrder", [])
                        ],
                        totalDistanceKm=round(float(data.get("totalDistanceKm", 0.0)), 4)
                    )
        except Exception:
            # Fallback to local heuristic
            pass

        # Local execution matching Controller algorithm
        unvisited = list(waypoints)
        route: List[RouteOptimizeLocation] = [origin]
        current = origin
        total_distance = 0.0

        while len(unvisited) > 0:
            nearest_index = -1
            min_distance = float("inf")

            for i, loc in enumerate(unvisited):
                dist = self.haversine_distance_km(current.lat, current.lng, loc.lat, loc.lng)
                if dist < min_distance:
                    min_distance = dist
                    nearest_index = i

            if nearest_index != -1:
                total_distance += min_distance
                current = unvisited.pop(nearest_index)
                route.append(current)

        return RouteOptimizeResponse(
            optimizedOrder=route,
            totalDistanceKm=round(total_distance, 4)
        )


logistics_service = LogisticsService()
