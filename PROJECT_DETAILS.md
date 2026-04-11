# Investment Portfolio Tracker — Project Details

> A web app for tracking investments across multiple asset classes with live market data, P&L tracking, charts, and price alerts.

---

## 1. Overview

**Purpose:** Track investments in Gold, Silver, Crypto, US Stocks, and Egyptian (EGX) Stocks. Fetch live market prices, calculate profit/loss, and display portfolio value in both USD and EGP.

**Key Features:**
- Multi-asset portfolio tracking (5 asset classes)
- Live market data from free APIs
- Profit & Loss tracking per investment and overall
- Dual currency display (USD & EGP) with live exchange rate
- Gold/Silver weight conversion (grams ↔ troy ounces)
- Charts: Pie chart (allocation), Line chart (performance over time)
- Price alerts with background monitoring
- Portfolio snapshots for historical performance

---

## 2. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Backend** | Python + FastAPI (async) | REST API with auto-generated Swagger docs |
| **Frontend** | React 19 + TypeScript (Vite) | SPA with modern tooling |
| **Database** | PostgreSQL (Neon serverless) | Async via SQLAlchemy + asyncpg |
| **ORM** | SQLAlchemy 2.0 (async) | Declarative models |
| **Migrations** | Alembic | Schema versioning |
| **Charts** | Recharts | Pie, Line, Area charts |
| **State Mgmt** | TanStack Query (React Query) v5 | Server-state caching |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Forms** | React Hook Form + Zod | Validation |
| **HTTP Client** | Axios (frontend), httpx (backend) | |
| **Scheduler** | APScheduler | Background alert checking & snapshots |
| **Icons** | Lucide React | |

---

## 3. Market Data Sources

| Asset Type | Primary Source | Fallback | Price Unit |
|-----------|---------------|----------|------------|
| Crypto (BTC, ETH, altcoins) | CoinGecko free API | — | USD per coin |
| US Stocks | yfinance (`Ticker.fast_info`) | — | USD per share |
| EGX Stocks | yfinance (`.CA` suffix) | — | EGP per share |
| Gold | yfinance `GC=F` (futures) | metalpriceapi.com | USD per troy ounce |
| Silver | yfinance `SI=F` (futures) | metalpriceapi.com | USD per troy ounce |
| USD/EGP Rate | exchangerate-api.com | Hardcoded fallback (50.0) | — |

**Caching:** In-memory cache with 5-minute TTL (30 min for exchange rate).

---

## 4. Database Schema

### Table: `investments`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, auto-increment | |
| name | VARCHAR(200) | NOT NULL | Human-readable name |
| symbol | VARCHAR(50) | NOT NULL | Ticker/ID ("BTC", "AAPL", "COMI.CA") |
| asset_type | ENUM | NOT NULL | gold, silver, crypto, us_stock, egx_stock |
| quantity | FLOAT | NOT NULL | Amount held |
| purchase_price | FLOAT | NOT NULL | Price per unit at purchase |
| purchase_currency | VARCHAR(10) | DEFAULT "USD" | "USD" or "EGP" |
| purchase_date | TIMESTAMP | NULLABLE | When asset was bought |
| weight_unit | ENUM | NULLABLE | For gold/silver: "grams" or "ounces" |
| notes | VARCHAR(500) | NULLABLE | User notes |
| created_at | TIMESTAMP | server_default=now() | |
| updated_at | TIMESTAMP | server_default=now() | |

### Table: `price_alerts`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK | |
| symbol | VARCHAR(50) | NOT NULL | |
| asset_type | ENUM | NOT NULL | |
| target_price | FLOAT | NOT NULL | Price threshold |
| condition | VARCHAR(10) | NOT NULL | "above" or "below" |
| currency | VARCHAR(10) | DEFAULT "USD" | Currency of target_price |
| is_triggered | BOOLEAN | DEFAULT FALSE | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | server_default=now() | |

### Table: `portfolio_snapshots`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK | |
| total_value_usd | FLOAT | NOT NULL | |
| total_value_egp | FLOAT | NOT NULL | |
| snapshot_date | TIMESTAMP | server_default=now() | Indexed |

---

## 5. API Endpoints

### Health
```
GET  /                                          → Health check
```

### Investments CRUD
```
POST   /api/investments/                        → Create investment
GET    /api/investments/                         → List investments (filter: asset_type, skip, limit)
GET    /api/investments/{id}                     → Get single investment (enriched with live P&L)
PUT    /api/investments/{id}                     → Update investment
DELETE /api/investments/{id}                     → Delete investment
```

### Portfolio
```
GET    /api/portfolio/summary                   → Full portfolio summary with P&L
GET    /api/portfolio/allocation                 → Asset allocation breakdown (for pie chart)
GET    /api/portfolio/performance?period=30d     → Historical snapshots (for line chart)
POST   /api/portfolio/snapshot                   → Force a portfolio snapshot
```

### Price Alerts
```
POST   /api/alerts/                             → Create price alert
GET    /api/alerts/                             → List alerts (filter: is_active, is_triggered)
GET    /api/alerts/{id}                         → Get alert with current price
DELETE /api/alerts/{id}                         → Delete alert
PUT    /api/alerts/{id}/deactivate              → Deactivate alert
```

### Market Data
```
GET    /api/market/price/{asset_type}/{symbol}  → Get live price (USD & EGP)
GET    /api/market/exchange-rate                → Get USD/EGP rate
GET    /api/market/prices/batch?symbols=...     → Batch price lookup
```

---

## 6. Backend File Structure

```
backend/
  .env.example
  .env                              (gitignored — Neon credentials)
  requirements.txt
  alembic.ini
  alembic/
    env.py
    versions/
      001_initial_schema.py
  app/
    __init__.py
    main.py                         ← FastAPI app, CORS, lifespan, router registration
    config.py                       ← Pydantic settings
    database.py                     ← Async engine, session, Base, init_db
    models.py                       ← SQLAlchemy models (Investment, PriceAlert, PortfolioSnapshot)
    schemas.py                      ← Pydantic request/response schemas
    market_data.py                  ← Price fetching (CoinGecko, yfinance, metals, forex)
    dependencies.py                 ← Shared FastAPI dependencies
    routers/
      __init__.py
      investments.py                ← CRUD + enriched portfolio data
      portfolio.py                  ← Summary, allocation, snapshots
      alerts.py                     ← Price alert CRUD + status
      market.py                     ← Live prices, exchange rate
    services/
      __init__.py
      investment_service.py         ← Investment business logic + P&L enrichment
      portfolio_service.py          ← Aggregation, allocation, snapshots
      alert_service.py              ← Alert checking logic
      market_service.py             ← Orchestrates market_data calls
      scheduler.py                  ← APScheduler background tasks
```

---

## 7. Frontend File Structure

```
frontend/
  index.html
  package.json
  vite.config.ts
  tailwind.config.ts
  .env                              (VITE_API_URL=http://localhost:8000)
  src/
    main.tsx                        ← ReactDOM, QueryClientProvider, Router
    App.tsx                         ← Layout + Routes
    index.css                       ← Tailwind imports

    api/
      client.ts                     ← Axios instance with baseURL
      investments.ts                ← API functions for investments
      portfolio.ts                  ← API functions for portfolio
      alerts.ts                     ← API functions for alerts
      market.ts                     ← API functions for market data

    hooks/
      useInvestments.ts             ← TanStack Query hooks for investments
      usePortfolio.ts               ← Hooks for summary, allocation, performance
      useAlerts.ts                  ← Hooks for alerts
      useMarketData.ts              ← Hooks for live prices
      useCurrency.ts                ← Currency preference toggle

    components/
      layout/
        AppShell.tsx                ← Sidebar + TopBar + content area
        Sidebar.tsx                 ← Navigation links
        TopBar.tsx                  ← Currency toggle, exchange rate, refresh

      dashboard/
        PortfolioValueCard.tsx      ← Total value + P&L (big number)
        AllocationPieChart.tsx      ← Recharts PieChart by asset type
        PerformanceLineChart.tsx    ← Recharts LineChart over time
        RecentAlerts.tsx            ← Recently triggered alerts
        TopMovers.tsx               ← Best/worst performing assets

      investments/
        InvestmentTable.tsx         ← Sortable table with live data
        InvestmentRow.tsx           ← Single row
        AddInvestmentModal.tsx      ← Modal form for creating
        EditInvestmentModal.tsx     ← Modal form for editing
        InvestmentForm.tsx          ← Shared form (dynamic by asset type)
        AssetTypeFilter.tsx         ← Filter tabs

      alerts/
        AlertList.tsx               ← Table of all alerts
        AddAlertModal.tsx           ← Modal form for creating
        AlertBadge.tsx              ← Status indicator

      common/
        CurrencyDisplay.tsx         ← Renders amount in USD/EGP/both
        ProfitLossIndicator.tsx     ← Green/Red with arrow + percentage
        LoadingSpinner.tsx
        EmptyState.tsx
        ConfirmDialog.tsx
        WeightUnitSelect.tsx        ← Grams/Ounces selector

    pages/
      DashboardPage.tsx             ← Composes dashboard widgets
      InvestmentsPage.tsx           ← Investment list + CRUD
      AlertsPage.tsx                ← Alert management

    lib/
      formatters.ts                 ← Currency, date, number formatting
      constants.ts                  ← Asset type labels, colors, symbol maps
      types.ts                      ← TypeScript interfaces

    context/
      CurrencyContext.tsx           ← Global currency preference (localStorage)
```

---

## 8. P&L Calculation Logic

```
For each investment:
  1. Fetch current_price_usd from market data API

  2. For gold/silver with weight_unit == "grams":
     effective_quantity_oz = quantity / 31.1035
     current_value_usd = current_price_usd × effective_quantity_oz

  3. For gold/silver with weight_unit == "ounces":
     current_value_usd = current_price_usd × quantity

  4. For crypto/stocks:
     current_value_usd = current_price_usd × quantity

  5. total_cost = purchase_price × quantity (in purchase currency)

  6. If purchase_currency == "EGP":
     total_cost_usd = total_cost / usd_to_egp_rate
  Else:
     total_cost_usd = total_cost

  7. profit_loss_usd = current_value_usd - total_cost_usd
  8. profit_loss_pct = (profit_loss_usd / total_cost_usd) × 100
  9. current_value_egp = current_value_usd × usd_to_egp_rate
```

**Note:** For EGP-denominated purchases, P&L uses the current exchange rate, not the historical rate at purchase time.

---

## 9. Price Alerts Mechanism

1. **APScheduler** runs `check_alerts()` every 5 minutes in the background
2. Queries all alerts where `is_active = True AND is_triggered = False`
3. Fetches current prices (batching where possible)
4. If `condition == "above"` and `price >= target`, or `condition == "below"` and `price <= target`:
   - Sets `is_triggered = True`
5. For alerts with `currency == "EGP"`, converts USD price to EGP before comparing
6. Frontend polls for triggered alerts every 30 seconds, shows toast notifications

---

## 10. Charts Specification

### Allocation Pie Chart
- **Data:** `GET /api/portfolio/allocation`
- **Segments:** One per asset type
- **Colors:** Gold=#FFD700, Silver=#C0C0C0, Crypto=#F7931A, US Stocks=#4CAF50, EGX=#1976D2
- **Tooltip:** Asset name, USD/EGP value, percentage

### Performance Line Chart
- **Data:** `GET /api/portfolio/performance?period=30d`
- **X-axis:** Date (MMM DD)
- **Y-axis:** Portfolio value in selected currency
- **Period selector:** 7D, 30D, 90D, 1Y, ALL
- **Style:** Line with gradient fill (area chart)
- **Reference line:** Total cost basis (dashed) for visual P&L

---

## 11. EGX Stock Symbol Mapping

Common Egyptian stocks on yfinance (`.CA` suffix for Cairo Exchange):

| Common Name | yfinance Symbol |
|------------|----------------|
| CIB | COMI.CA |
| Eastern Company | EAST.CA |
| Elsewedy Electric | SWDY.CA |
| Telecom Egypt | ETEL.CA |
| EFG Hermes | HRHO.CA |
| TMG Holding | TMGH.CA |
| Fawry | FWRY.CA |
| Palm Hills | PHDC.CA |
| Abu Qir Fertilizers | ABUK.CA |

---

## 12. Implementation Phases

### Phase 1: Backend Core
- [ ] `main.py` — FastAPI app, CORS, lifespan, health check
- [ ] Alembic setup + initial migration
- [ ] `services/investment_service.py` — CRUD + P&L enrichment
- [ ] `routers/investments.py` — Full CRUD endpoints
- [ ] `routers/market.py` — Live price endpoints
- [ ] Test via Swagger UI at `/docs`

### Phase 2: Portfolio & Alerts Backend
- [ ] `services/portfolio_service.py` — Summary, allocation, snapshots
- [ ] `routers/portfolio.py` — Portfolio endpoints
- [ ] `services/alert_service.py` — Alert checking
- [ ] `routers/alerts.py` — Alert CRUD
- [ ] `services/scheduler.py` — Background tasks
- [ ] Integrate scheduler into `main.py` lifespan

### Phase 3: Frontend Setup & Dashboard
- [ ] Initialize Vite + React + TypeScript project
- [ ] Install deps (Tailwind, Recharts, TanStack Query, React Router, Axios, etc.)
- [ ] API client + TypeScript types
- [ ] App shell (Sidebar, TopBar, routing)
- [ ] Dashboard: PortfolioValueCard, AllocationPieChart, PerformanceLineChart

### Phase 4: Frontend CRUD & Alerts
- [ ] InvestmentsPage with table + filters
- [ ] Add/Edit Investment modals with dynamic forms
- [ ] AlertsPage with list and create modal
- [ ] CurrencyDisplay, ProfitLossIndicator components

### Phase 5: Polish & Deploy
- [ ] Loading states, error states, empty states
- [ ] Toast notifications for triggered alerts
- [ ] Responsive design (mobile-friendly)
- [ ] Deploy backend (Railway/Render/Fly.io)
- [ ] Deploy frontend (Vercel)
- [ ] Run Alembic migration on production Neon DB

---

## 13. Deployment

### Backend
- **Platform:** Railway, Render, or Fly.io
- **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Env vars:** `DATABASE_URL`, `DATABASE_URL_SYNC`, `CORS_ORIGINS`

### Frontend
- **Platform:** Vercel or Netlify
- **Build:** `npm run build` → output: `dist/`
- **Env vars:** `VITE_API_URL` pointing to backend URL

### Database
- **Neon PostgreSQL** (serverless, free tier available)
- **Connection:** Use `?sslmode=require` in connection strings

---

## 14. Known Limitations & Future Enhancements

**Current Limitations:**
- EGP P&L uses current exchange rate (not historical rate at purchase)
- EGX stock coverage on Yahoo Finance is limited to major stocks
- Price alerts are one-shot (trigger once, then deactivate)
- Performance chart needs a few days of snapshots to be useful

**Future Enhancements:**
- WebSocket for real-time price updates
- Email/Telegram notifications for price alerts
- CSV import/export of portfolio
- Multiple portfolios support
- Historical exchange rate storage for accurate EGP P&L
- Redis cache for multi-worker deployments
- Authentication/user accounts

---

*Last Updated: April 2026*
