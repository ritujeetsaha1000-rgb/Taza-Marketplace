from app.routers.auth import router as auth_router
from app.routers.farmers import router as farmers_router
from app.routers.consumers import router as consumers_router
from app.routers.orders import router as orders_router
from app.routers.logistics import router as logistics_router
from app.routers.weather import router as weather_router
from app.routers.alerts import router as alerts_router
from app.routers.maps import router as maps_router
from app.routers.otp import router as otp_router
from app.routers.routing import router as routing_router
from app.routers.analytics import router as analytics_router
from app.routers.market_farmer import router as market_farmer_router
from app.routers.warehouses import router as warehouses_router
from app.routers.insurance import router as insurance_router

__all__ = [
    "auth_router",
    "farmers_router",
    "consumers_router",
    "orders_router",
    "logistics_router",
    "weather_router",
    "alerts_router",
    "maps_router",
    "otp_router",
    "routing_router",
    "analytics_router",
    "market_farmer_router",
    "warehouses_router",
    "insurance_router",
]

