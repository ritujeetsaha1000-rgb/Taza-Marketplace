import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import init_db, get_db
from db import seed_database
from app.routers import (
    auth_router,
    farmers_router,
    consumers_router,
    orders_router,
    logistics_router,
    weather_router,
    alerts_router,
    maps_router,
    otp_router,
    routing_router,
    analytics_router,
    market_farmer_router,
    warehouses_router,
    insurance_router,
)



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed if empty
    await init_db()
    database = await get_db()
    listing_count = await database["product_listings"].count_documents({})
    if listing_count == 0:
        print("[AUTO-SEED] Database empty on startup. Populating sample data...")
        await seed_database()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
# 🌾 TAZA - Direct Farm-to-Table & Logistics Optimization Backend

A high-performance, modular backend architecture connecting farmers and FPOs in **West Bengal, India** directly with consumers and bulk buyers.

## Key Features & Modular Services:
* 🔐 **/auth**: Role-Based Dual Profile Authentication (Farmer & Consumer).
* 🚜 **/farmers**: Farmgate crop listings with mandatory harvest timestamps, stock tracking, and outbound order dashboards.
* 🛒 **/consumers**: Real-time Catalog with biological freshness decay scoring, geospatial proximity filtering, and Mandi APMC price arbitrage comparisons.
* 📦 **/orders**: Flexible dynamic weight purchasing ($150\\text{g}$ to $50\\text{kg}+$), logistics fee calculations, and live fulfillment tracking.
* 🚚 **/logistics**: Route optimization engine integrating OSRM and geodesic road models, vehicle assignment, and carbon footprint reduction tracking.
* 🌦️ **/weather**: Agro-meteorological live advisories (Open-Meteo) with flood/waterlogging/heatwave risk flags.
* 📊 **/analytics**: Pre-seeded district production profiles (Hooghly, Purba Bardhaman, Nadia, Malda, Murshidabad, etc.) and Mandi benchmark prices.
""",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(farmers_router, prefix=settings.API_V1_STR)
app.include_router(consumers_router, prefix=settings.API_V1_STR)
app.include_router(orders_router, prefix=settings.API_V1_STR)
app.include_router(logistics_router, prefix=settings.API_V1_STR)
app.include_router(weather_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(maps_router, prefix=settings.API_V1_STR)
app.include_router(otp_router, prefix=settings.API_V1_STR)
app.include_router(routing_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(market_farmer_router, prefix=settings.API_V1_STR)
app.include_router(warehouses_router, prefix=settings.API_V1_STR)
app.include_router(insurance_router, prefix=settings.API_V1_STR)



@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "environment": settings.ENVIRONMENT
    }


@app.get("/api-info", tags=["System"])
async def api_info():
    return {
        "platform": settings.PROJECT_NAME,
        "version": "1.0.0",
        "status": "online",
        "region": "West Bengal, India",
        "documentation": "/docs"
    }


# Mount Static Files (Frontend UI)
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
