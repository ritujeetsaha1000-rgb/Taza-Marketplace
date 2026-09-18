<p align="center">
  <h1 align="center">🌾 TAZA — Farm to Fork, Direct.</h1>
  <p align="center">
    <em>Eliminating middlemen from West Bengal's agricultural supply chain</em>
  </p>
  <p align="center">
    <a href="https://taza-livid.vercel.app">🌐 Live Demo</a> •
    <a href="#-api-reference">📡 API Docs</a> •
    <a href="#-quick-start">🚀 Quick Start</a>
  </p>
</p>

---

## 📌 The Problem

In traditional Indian agricultural supply chains — especially the APMC mandi system in West Bengal hubs like Singur, Bethuadahari, Samsi, and Memari:

- Produce passes through **5–7 layers of middlemen** (dalals, arthiyas, commission agents, wholesalers, local vendors)
- Intermediaries extract **35%–50% retail markups**, leaving farmers with barely **20%–25%** of the consumer rupee
- Fragile produce loses freshness during multi-stage handling, leading to massive post-harvest spoilage

## 💡 The Solution

**TAZA** (also branded as *KisanDirect*) is a direct farm-to-fork e-commerce and green logistics platform that connects **farmers/FPOs** directly with **retail consumers, restaurants, canteens, and bulk institutional buyers** — eliminating all intermediaries.

> **Farmers earn 15%–25% above mandi rates. Consumers save 15%–30% below middleman retail prices.**

---

## ✨ Key Features

| Feature | Description |
|:---|:---|
| 🔐 **Dual-Role RBAC** | Distinct workflows and dashboards for Farmers (default: Bengali) and Consumers (default: English) |
| 🧬 **Biological Freshness Engine** | Real-time exponential decay scoring based on time since harvest and estimated transit time |
| 📊 **Mandi Price Arbitrage** | Cross-references live daily APMC Agmarknet mandi benchmarks for fair pricing |
| 📈 **Dynamic Profit Share** | Farmers can opt for `DYNAMIC_MANDI_PEG` pricing — 20% bonus when wholesale rates surge |
| ⚖️ **Flexible Weight Orders** | Micro-orders (150g) to bulk wholesale sacks (50kg+) with atomic inventory management |
| 🚚 **Green Logistics Engine** | TSP solver with rural Bengal road modeling, allocating E-Rickshaws, Tata Ace EVs, or Reefer Cold Vans |
| 🏭 **AI Warehouse Scanner** | Expanding perimeter search (40km → 1,000km) to find nearest cold storage with capacity |
| 📜 **Trilingual Legal Contracts** | Farmer agreements generated in English, Bengali (বাংলা), and Hindi (हिंदी) with email dispatch |
| 🛡️ **Parametric Crop Insurance** | 22-clause warehouse storage policy with online claim submission and damage refund |
| 🌦️ **Satellite Agro-Advisories** | Open-Meteo weather feeds across all 23 West Bengal districts with disaster alerts |
| ♻️ **4-Tier Zero-Waste System** | Flash clearance → FPO processing → Insurance claims → Bio-composting |
| 💰 **Delivery Price Cap** | Final price (subtotal + delivery + fee) never exceeds city retail mandi price |

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| **Backend** | Python 3.12, FastAPI, Uvicorn (ASGI) |
| **Validation** | Pydantic v2, Pydantic-Settings |
| **Database** | MongoDB (Motor async driver) with Mongomock-Motor fallback |
| **Auth & Security** | JWT (HS256), OAuth2, Bcrypt, Passlib |
| **Payments** | Razorpay SDK (HMAC-SHA256 verification) |
| **Geospatial** | OSRM, Geopy, Haversine math |
| **Weather** | Open-Meteo Satellite API |
| **Email** | SMTP (TLS), Resend API, Brevo API |
| **Frontend** | Vanilla HTML5, CSS3 (Glassmorphism), ES6 JavaScript SPA |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX (35+ test cases) |
| **Deployment** | Vercel Serverless |

---

## 📁 Project Structure

```
taza/
├── api/
│   └── index.py                    # Vercel serverless entrypoint
├── app/
│   ├── main.py                     # FastAPI app, CORS, lifespan events
│   ├── core/
│   │   ├── config.py               # Pydantic settings (.env loading)
│   │   ├── database.py             # Async Motor client + mongomock fallback
│   │   ├── deps.py                 # Dependency injection (auth, role guards)
│   │   └── security.py             # Bcrypt hashing & JWT encode/decode
│   ├── models/                     # MongoDB document models
│   │   ├── user.py                 # User, FarmerProfile, ConsumerProfile
│   │   ├── product.py              # ProductListing, CropCategory, CropGrade
│   │   ├── order.py                # Order, OrderStatus, PaymentStatus
│   │   ├── logistics.py            # RouteLog, VehicleType
│   │   ├── analytics.py            # DistrictMetric, MandiBenchmark
│   │   └── market_farmer.py        # RegisteredFarmer, MarketPrice
│   ├── schemas/                    # Pydantic request/response schemas
│   ├── services/                   # Business logic layer
│   │   ├── pricing_freshness_service.py   # Decay math & mandi arbitrage
│   │   ├── logistics_service.py           # Haversine, OSRM, TSP solver
│   │   ├── warehouse_service.py           # AI proximity scanner
│   │   ├── agreement_service.py           # Trilingual contract generator
│   │   ├── insurance_service.py           # Policy & claims manager
│   │   ├── payment_service.py             # Razorpay integration
│   │   └── weather_service.py             # Satellite feed & alerts
│   ├── routers/                    # API route handlers (14 routers)
│   ├── seeds/                      # Database seeders (West Bengal data)
│   └── data/
│       └── warehouses_db.json      # West Bengal cold storage nodes
├── static/                         # Frontend SPA
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── images/                     # Crop images
├── tests/                          # Pytest integration tests
├── requirements.txt
├── vercel.json
├── .env.example
└── db.py                           # Database seeder script
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** (3.12 recommended)
- **MongoDB** (optional — falls back to in-memory mock automatically)

### 1. Clone & Setup

```bash
git clone https://github.com/<your-username>/taza.git
cd taza

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Key variables in `.env`:

| Variable | Default | Description |
|:---|:---|:---|
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `DATABASE_NAME` | `taza_agri` | Database name |
| `SECRET_KEY` | *(auto-generated)* | JWT signing secret |
| `RAZORPAY_KEY_ID` | *(test key included)* | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | *(test key included)* | Razorpay secret |

### 4. Seed Database

```bash
python db.py
```

> **Note:** If the database is empty, the app auto-seeds on startup.

### 5. Run the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

| URL | Description |
|:---|:---|
| [http://localhost:8000](http://localhost:8000) | Web Application |
| [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger API Docs |
| [http://localhost:8000/redoc](http://localhost:8000/redoc) | ReDoc API Docs |

### 6. Run Tests

```bash
pytest -v
```

---

## 🧪 Demo Accounts

| Role | Email | Password |
|:---|:---|:---|
| 🌾 Farmer | `ananda.mondal@farmer.taza.in` | `Farmer@123` |
| 🌾 FPO Collective | `subhash.ghosh@farmer.taza.in` | `Farmer@123` |
| 🛒 Consumer | `sourav.banerjee@consumer.taza.in` | `Consumer@123` |
| 🏪 Bulk Buyer | `bhojohori.manya@restaurant.taza.in` | `Consumer@123` |

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1`. Interactive docs available at `/docs`.

<details>
<summary><b>🔐 Auth</b> — <code>/api/v1/auth</code></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/register` | Register farmer or consumer |
| POST | `/login` | OAuth2 login → JWT token |
| POST | `/login/json` | JSON body login for SPAs |
| GET | `/me` | Get current user profile |
| POST | `/farmer-agreement/send` | Email trilingual legal contract |
| GET | `/farmer-agreement/preview` | Preview contract (HTML) |

</details>

<details>
<summary><b>🚜 Farmers</b> — <code>/api/v1/farmers</code></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/listings` | Create crop listing |
| GET | `/listings` | View active listings with freshness scores |
| PUT | `/listings/{id}` | Update stock / price |
| DELETE | `/listings/{id}` | Remove listing |
| GET | `/dashboard` | Revenue, orders, harvest batches |
| POST | `/pricing-scenario` | Simulate fixed vs. dynamic pricing |

</details>

<details>
<summary><b>🛒 Consumers</b> — <code>/api/v1/consumers</code></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/catalog` | Browse produce sorted by freshness/distance/price |
| GET | `/listings/{id}` | Detailed listing with mandi comparison |

</details>

<details>
<summary><b>📦 Orders</b> — <code>/api/v1/orders</code></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/` | Create dynamic-weight order (150g–50kg) |
| GET | `/` | List order history |
| GET | `/{id}` | Order details |
| PUT | `/{id}/status` | Advance order status |
| POST | `/{id}/verify-payment` | Verify Razorpay signature |
| POST | `/{id}/cancel` | Cancel (pre-dispatch only) |
| GET | `/{id}/tracking` | Live tracking timeline |

</details>

<details>
<summary><b>🚚 Logistics</b> — <code>/api/v1/logistics</code></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/calculate-route` | Route + vehicle recommendation |
| POST | `/delivery-quote` | Delivery fare (capped at retail price) |
| POST | `/batch-optimize` | Multi-pickup route optimizer |

</details>

<details>
<summary><b>🏭 Warehouses</b> — <code>/api/v1/warehouses</code></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/nearest` | AI proximity scanner (40km expanding) |
| GET | `/` | All storage nodes with occupancy |

</details>

<details>
<summary><b>🛡️ Insurance</b> — <code>/api/v1/insurance</code></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/policy` | Generate 22-clause storage policy |
| GET | `/claims` | List filed claims |
| POST | `/claims` | Submit damage claim |

</details>

<details>
<summary><b>🌦️ Weather & Alerts</b> — <code>/api/v1/weather</code></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/advisory` | Satellite agro-advisory |
| GET | `/district/{name}` | District-specific weather |
| GET | `/alerts` | Disaster alerts (flood, gale, heat) |

</details>

<details>
<summary><b>📊 Analytics</b> — <code>/api/v1/analytics</code></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/districts` | West Bengal district profiles |
| GET | `/mandi-benchmarks` | APMC daily price data |
| GET | `/district-overview/{name}` | Regional production summary |

</details>

<details>
<summary><b>🤝 Market Farmer</b> — <code>/api/v1/market-farmer</code></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/farmers` | Register wholesale farmer |
| GET | `/farmers` | Search by district/crop |
| POST | `/prices` | Record benchmark prices |
| GET | `/arbitrage` | Farmgate savings analysis |

</details>

<details>
<summary><b>📍 Maps & OTP</b></summary>

| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/maps/geocode` | Forward geocoding |
| GET | `/maps/reverse-geocode` | Reverse geocoding |
| POST | `/otp/send` | Send 6-digit OTP |
| POST | `/otp/verify` | Verify OTP |

</details>

---

## 🏗️ Architecture Highlights

- **Zero-Downtime Fallbacks** — If MongoDB is unreachable, the app seamlessly switches to `AsyncMongoMockClient`. If external services (OSRM, Open-Meteo) timeout, local algorithms take over.

- **Biological Decay Math** — Freshness = `100 × e^(-λt)` where λ varies by crop type:
  - 🥬 Leafy greens (Lau Shak): λ = 0.025–0.035 (24–48hr shelf life)
  - 🥔 Tubers (Potato): λ = 0.008–0.012
  - 🌾 Cured grains (Rice, Dal): λ = 0.0005 (1-year shelf life)

- **Smart Order Cancellation** — Allowed during `PLACED` / `CONFIRMED_BY_FARMER` (instant refund). Locked once `DISPATCHED` to protect logistics and perishable integrity.

- **Rural Road Modeling** — Haversine distances adjusted with τ = 1.28 tortuosity factor for Bengal's rural roads.

---

## 🌐 Deployment

Deployed on **Vercel Serverless** via `vercel.json` + `api/index.py`.

**Live URL**: [https://taza-livid.vercel.app](https://taza-livid.vercel.app)

---

## 📄 License

This project is open source. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ for the farmers of West Bengal</strong>
</p>
