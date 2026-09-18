# 🌾 TAZA - Production-Ready Agri-Tech Direct Commerce & Logistics Platform

An enterprise-grade, modular backend architecture built with **Python (FastAPI)**, **MongoDB with Motor (Async)**, and **Geospatial Logistics Intelligence**, designed to eliminate agricultural middlemen by connecting farmers and FPOs directly with consumers and bulk buyers across **West Bengal, India**.

---

## 🏛️ Architecture Overview

```mermaid
graph TD
    Client[Web & Mobile Applications] --> Gateway[FastAPI API Gateway]

    subgraph Service Layer
        Gateway --> Auth["/api/v1/auth<br/>(Dual RBAC JWT)"]
        Gateway --> Farmers["/api/v1/farmers<br/>(Listings, Dashboard, Relay)"]
        Gateway --> Consumers["/api/v1/consumers<br/>(Catalog, Freshness & Mandi Comp)"]
        Gateway --> Orders["/api/v1/orders<br/>(Dynamic Weights 150g-50kg)"]
        Gateway --> Logistics["/api/v1/logistics<br/>(OSRM / Geodesic Routing)"]
        Gateway --> Weather["/api/v1/weather<br/>(Open-Meteo Agro Alerts)"]
        Gateway --> Analytics["/api/v1/analytics<br/>(WB District Yields & Mandis)"]
        Gateway --> MarketFarmer["/api/v1/market-farmer<br/>(Farmer Offerings & Arbitrage)"]
    end

    subgraph Intelligence & Integration Engines
        Logistics --> LogisticsEngine[Logistics Engine & Vehicle Allocator]
        Weather --> WeatherEngine[Agro-Meteorology Risk Engine]
        Consumers --> PricingEngine[Freshness & Mandi Arbitrage Engine]
        Orders --> PaymentGateway[Razorpay Sandbox Gateway Hook]
        Orders --> SMSRelay[Msg91 / Twilio SMS Relay Hook]
    end

    subgraph Persistence Layer
        DB[(MongoDB via Async Motor Client)]
    end

    Service Layer --> DB
```

---

## 📂 Project Structure

```
TAZA/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI application entrypoint, CORS, lifespan
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                    # Pydantic Settings (.env configuration with MONGO_URI)
│   │   ├── database.py                  # Motor async MongoDB client, index setup & auto-increment sequences
│   │   ├── security.py                  # Bcrypt password hashing & JWT token handling
│   │   └── deps.py                      # FastAPI Dependency Injection (Auth, Roles, MongoDB)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                      # User, FarmerProfile, ConsumerProfile (Dual RBAC)
│   │   ├── product.py                   # ProductListing with harvest timestamps & coordinates
│   │   ├── order.py                     # Order & dynamic weight lifecycle models
│   │   ├── logistics.py                 # RouteLog, VehicleType, RouteStatus
│   │   ├── analytics.py                 # DistrictMetric, MandiBenchmark
│   │   └── market_farmer.py             # RegisteredFarmer, OfferedCrop, MarketPrice (Mongoose dual schema)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py                      # Registration, login, and JWT token schemas
│   │   ├── farmer.py                    # Crop listing, dashboard, and relay schemas
│   │   ├── consumer.py                  # Proximity catalog search & Mandi comparison schemas
│   │   ├── order.py                     # Dynamic weight order & tracking schemas
│   │   ├── logistics.py                 # OSRM route & batch optimization schemas
│   │   ├── weather.py                   # Agro-meteorology advisories & weather alerts
│   │   └── analytics.py                 # WB district yield & benchmark price schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── pricing_freshness_service.py # Biological freshness decay & Mandi arbitrage math
│   │   ├── logistics_service.py         # Haversine, road tortuosity, OSRM & batch sequencing
│   │   ├── weather_service.py           # Open-Meteo live integration & agro flood/heat warnings
│   │   ├── payment_service.py           # Razorpay order generation & HMAC signature verification
│   │   └── notification_service.py      # Msg91 / Twilio direct contact relay simulation
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                      # /api/v1/auth
│   │   ├── farmers.py                   # /api/v1/farmers
│   │   ├── consumers.py                 # /api/v1/consumers
│   │   ├── orders.py                    # /api/v1/orders
│   │   ├── logistics.py                 # /api/v1/logistics
│   │   ├── weather.py                   # /api/v1/weather
│   │   └── analytics.py                 # /api/v1/analytics
│   └── seeds/
│       ├── __init__.py
│       ├── west_bengal_data.py          # District agricultural datasets (Hooghly, Nadia, Malda, etc.)
│       └── db.py                        # Seed module
├── tests/
│   ├── __init__.py
│   └── test_api.py                      # Comprehensive pytest test suite for all endpoints
├── .env.example                         # Environment configuration template
├── db.py                                # Root executable database seeder script
├── pytest.ini                           # Pytest configuration
├── requirements.txt                     # Backend dependencies
└── README.md                            # Complete architecture & API documentation
```

---

## 🔬 Core Algorithms & Mathematical Foundations

### 1. Biological Freshness Decay Engine
Farmgate produce loses nutritional value and moisture exponentially following harvest. TAZA models real-time freshness as:

$$\text{FreshnessScore}(t) = \max\left(0, \min\left(100, 100 \times e^{-\lambda \cdot t}\right)\right)$$

where:
* $t = t_{\text{elapsed}} + t_{\text{delivery}}$ is the total decay time in hours, incorporating **time elapsed since harvest** plus **expected delivery transit time to the consumer** to proactively avoid and eliminate harvest spoilage during transit.
* $\lambda$ is the crop-specific degradation coefficient (e.g., $\lambda = 0.025$ for fragile greens/pointed gourd, $\lambda = 0.008$ for hardy potatoes, $\lambda = 0.0001$ for cured paddy/grains).
* Produce past its `shelf_life_hours` receives an additional penalty.

### 2. Mandi APMC Price Arbitrage Engine
Middlemen in traditional West Bengal APMC mandis (Singur, Bethuadahari, Samsi) add a $35\text{--}50\%$ markup, whereas the farmer receives a steep deduction. TAZA benchmarks against live daily Agmarknet modal prices:

$$\text{ConsumerSavings}(\%) = \frac{\text{RetailMandiPrice} - \text{PlatformPrice}}{\text{RetailMandiPrice}} \times 100$$
$$\text{FarmerGain}(\%) = \frac{\text{PlatformPrice} - \text{FarmgateAPMCPrice}}{\text{MandiModalPrice}} \times 100$$

### 3. Geospatial Routing & Green Logistics Engine
Calculates great-circle Haversine distances scaled by Bengal's empirical road network tortuosity factor ($\tau = 1.28$):

$$d = 2 R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right) \times 1.28$$

* Recommends green vehicle fleets (`E_RICKSHAW`, `TATA_ACE`, `REEFER_COLD_VAN`).
* Computes carbon emissions ($\text{kg CO}_2$) and fuel savings percentage compared to conventional diesel trucking.

---

## 🌾 Pre-Seeded West Bengal District Agricultural Profiles

The platform is pre-configured with agricultural and agro-climatic profiles for major agricultural belts of West Bengal:

| District | Agro-Climatic Zone | Primary Crops | Soil Type | Cold Storage (Tonnes) |
| :--- | :--- | :--- | :--- | :--- |
| **Hooghly** | Lower Gangetic Plain | Jyoti & Chandramukhi Potato, Aman Rice, Jute, Pointed Gourd | Gangetic Alluvial & Silty Loam | 485,000 |
| **Purba Bardhaman** | Lower Gangetic Plain (Rice Bowl) | GI Gobindobhog Rice, Minikit Paddy, Mustard, Potato | Old Alluvial Clay & Loam | 390,000 |
| **Nadia** | New Alluvial Zone | Pointed Gourd (Potol), Cauliflower, Green Chili, Muktakeshi Brinjal | Recent Gangetic Alluvium | 110,000 |
| **Malda** | Old Alluvial Zone | GI Fazli Mango, GI Himsagar Mango, Mulberry Silk, Jute | Tal & Diara Alluvial Belt | 95,000 |
| **Murshidabad** | Lower Gangetic Plain | Golden Tossa Jute, Bombai Litchi, Sharbati Wheat, Moong | Rarh Laterite & Gangetic Alluvium | 145,000 |
| **Darjeeling** | Eastern Himalayan Hilly Zone | Organic Orthodox Tea, Mandarin Orange, Large Cardamom | Acidic Brown Forest Soil | 18,000 |

---

## 🚀 Quick Start Guide

### 1. Prerequisites & Environment Setup
```bash
# Clone or navigate to the project directory
cd TAZA

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env configuration
cp .env.example .env
```

### 2. Seed Database
Execute the pre-built seed script to create tables and populate West Bengal districts, mandi benchmarks, demo farmers, consumers, and crop listings:
```bash
python db.py
```

### 3. Run Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive API documentation will be available at:
* **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 4. Run Automated Test Suite
```bash
pytest -v
```

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Farmer (Hooghly)** | `ananda.mondal@farmer.taza.in` | `Farmer@123` | Singur Potato & Jute Farmer |
| **Farmer (Nadia)** | `pranab.biswas@farmer.taza.in` | `Farmer@123` | Ranaghat Pointed Gourd & Veggies |
| **FPO Collective (Bardhaman)** | `subhash.ghosh@farmer.taza.in` | `Farmer@123` | Memari Gobindobhog Rice Collective |
| **Farmer (Malda)** | `tapas.sarkar@farmer.taza.in` | `Farmer@123` | English Bazar Himsagar/Fazli Mangoes |
| **Consumer (Kolkata)** | `sourav.banerjee@consumer.taza.in` | `Consumer@123` | Individual buyer in Behala |
| **Bulk Buyer (Salt Lake)** | `bhojohori.manya@restaurant.taza.in` | `Consumer@123` | Restaurant chain procurement |

---

## 📡 API Endpoint Reference

### 🔐 1. Authentication (`/api/v1/auth`)
* `POST /api/v1/auth/register` — Register Farmer or Consumer with nested specialized profile.
* `POST /api/v1/auth/login` — OAuth2 compatible form login.
* `POST /api/v1/auth/login/json` — JSON body login for SPAs/Mobile apps.
* `GET /api/v1/auth/me` — Retrieve current authenticated user profile.

### 🚜 2. Farmer Endpoints (`/api/v1/farmers`)
* `POST /api/v1/farmers/listings` — Create crop listing with mandatory `harvest_timestamp`, quantity (kg), base price, and farm coordinates.
* `GET /api/v1/farmers/listings` — List farmer's crops with real-time freshness degradation score.
* `PUT /api/v1/farmers/listings/{id}` — Update available stock or price.
* `DELETE /api/v1/farmers/listings/{id}` — Mark listing unavailable.
* `GET /api/v1/farmers/dashboard` — Farmer dashboard with outgoing orders, revenue, and active listings.
* `POST /api/v1/farmers/relay-contact/{order_id}` — Generate secure masked relay token and trigger SMS notification.

### 🛒 3. Consumer Endpoints (`/api/v1/consumers`)
* `GET /api/v1/consumers/catalog` — Filter catalog by district proximity, freshness score (hours since harvest), organic flag, and Mandi benchmark comparison.
* `GET /api/v1/consumers/listings/{id}` — Detailed crop listing view with Mandi price arbitrage analysis.

### 📦 4. Order Management (`/api/v1/orders`)
* `POST /api/v1/orders` — Create dynamic order supporting flexible weights ($150\text{g}$ to $50\text{kg}+$); computes subtotal, $2\%$ platform fee, and dynamic logistics cost.
* `GET /api/v1/orders` — List orders for current user.
* `GET /api/v1/orders/{id}` — Retrieve order detail.
* `PUT /api/v1/orders/{id}/status` — Progress order lifecycle (`PLACED` $\rightarrow$ `CONFIRMED_BY_FARMER` $\rightarrow$ `DISPATCHED` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `DELIVERED`).
* `POST /api/v1/orders/{id}/verify-payment` — Razorpay HMAC payment signature verification.
* `GET /api/v1/orders/{id}/tracking` — Real-time tracking timeline, delivery window ETA, and driver relay status.

### 🚚 5. Logistics Engine (`/api/v1/logistics`)
* `POST /api/v1/logistics/calculate-route` — OSRM/Geodesic point-to-point route, vehicle recommendation (`E_RICKSHAW`, `TATA_ACE`, `REEFER_COLD_VAN`), and carbon savings.
* `POST /api/v1/logistics/batch-optimize` — Multi-stop pickup/drop-off heuristic for district farm clusters.

### 🌦️ 6. Weather Advisories (`/api/v1/weather`)
* `GET /api/v1/weather/advisory?district=Hooghly` — Live Open-Meteo agro-meteorology analysis, flood/heatwave risk detection, and harvest suitability score.
* `GET /api/v1/weather/district/{district_name}` — District-specific advisory lookup.

### 📊 7. Agricultural Analytics (`/api/v1/analytics`)
* `GET /api/v1/analytics/districts` — Full West Bengal district baseline yields and soil profiles.
* `GET /api/v1/analytics/districts/{name}` — Specific district profile and crop calendar.
* `GET /api/v1/analytics/mandi-benchmarks` — Official APMC Mandi daily modal prices.
* `GET /api/v1/analytics/district-overview/{name}` — Regional production throughput and savings summary.

### 🌾 8. Farmer Crop Offerings & Market Intelligence (`/api/v1/market-farmer`)
* `POST /api/v1/market-farmer/farmers` — Register farmer and offered crop catalog with quantity & expected prices (supports `camelCase` & `snake_case`).
* `GET /api/v1/market-farmer/farmers` — List & search registered farmers by district, crop name, or sub-group (`Grains`, `Vegetables`, `Fruits`).
* `GET /api/v1/market-farmer/farmers/{id}` — Retrieve registered farmer profile by ID.
* `POST /api/v1/market-farmer/prices` — Record market average benchmark prices (INR per Quintal/unit).
* `GET /api/v1/market-farmer/prices` — List & filter market prices across districts and crops.
* `GET /api/v1/market-farmer/arbitrage` — Compare farmer expected prices against district market averages to compute farmgate savings vs. market benchmarks.

