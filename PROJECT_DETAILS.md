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
| **Framework** | Next.js 16 (App Router) | Full-stack — API routes + React frontend |
| **Language** | TypeScript | End-to-end type safety |
| **Runtime** | React 19 | Server & client components |
| **Database** | PostgreSQL (Neon serverless) | Via `@neondatabase/serverless` driver |
| **ORM** | Prisma 7 | With `@prisma/adapter-neon` for serverless |
| **Migrations** | Prisma Migrate | Schema versioning via `prisma/schema.prisma` |
| **Charts** | Recharts | Pie, Line, Area charts |
| **State Mgmt** | TanStack Query (React Query) v5 | Server-state caching |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Forms** | React Hook Form + Zod | Validation |
| **HTTP Client** | Axios (client-side API calls) | |
| **Scheduler** | Vercel Cron Jobs | Background alert checking & snapshots via `vercel.json` |
| **Notifications** | react-hot-toast | Toast notifications |
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

## 4. Database Schema (Prisma)

Schema defined in `prisma/schema.prisma`. Uses `@map()` directives to keep snake_case column names in the database while using camelCase in TypeScript.

**Enums:**
- `AssetType`: `gold`, `silver`, `crypto`, `us_stock`, `egx_stock`
- `WeightUnit`: `grams`, `ounces`

### Model: `Investment` → table `investments`

| Field | Type | Constraints | DB Column | Notes |
|-------|------|-------------|-----------|-------|
| id | Int | PK, autoincrement | id | |
| name | String | VarChar(200) | name | Human-readable name |
| symbol | String | VarChar(50) | symbol | Ticker/ID ("BTC", "AAPL", "COMI.CA") |
| assetType | AssetType | required | asset_type | Indexed |
| quantity | Float | required | quantity | Amount held |
| purchasePrice | Float | required | purchase_price | Price per unit at purchase |
| purchaseCurrency | String | default "USD", VarChar(10) | purchase_currency | "USD" or "EGP" |
| purchaseDate | DateTime? | optional | purchase_date | When asset was bought |
| weightUnit | WeightUnit? | optional | weight_unit | For gold/silver: "grams" or "ounces" |
| notes | String? | VarChar(500) | notes | User notes |
| createdAt | DateTime | default now() | created_at | |
| updatedAt | DateTime | @updatedAt | updated_at | Auto-updated by Prisma |

### Model: `PriceAlert` → table `price_alerts`

| Field | Type | Constraints | DB Column | Notes |
|-------|------|-------------|-----------|-------|
| id | Int | PK, autoincrement | id | |
| symbol | String | VarChar(50) | symbol | |
| assetType | AssetType | required | asset_type | |
| targetPrice | Float | required | target_price | Price threshold |
| condition | String | VarChar(10) | condition | "above" or "below" |
| currency | String | default "USD", VarChar(10) | currency | Currency of target_price |
| isTriggered | Boolean | default false | is_triggered | |
| isActive | Boolean | default true | is_active | Indexed (composite with isTriggered) |
| createdAt | DateTime | default now() | created_at | |

### Model: `PortfolioSnapshot` → table `portfolio_snapshots`

| Field | Type | Constraints | DB Column | Notes |
|-------|------|-------------|-----------|-------|
| id | Int | PK, autoincrement | id | |
| totalValueUsd | Float | required | total_value_usd | |
| totalValueEgp | Float | required | total_value_egp | |
| snapshotDate | DateTime | default now() | snapshot_date | Indexed |

---

## 5. API Endpoints (Next.js API Routes)

All API routes are defined as `route.ts` files under `app/api/`.

### Investments CRUD
```
POST   /api/investments                         → Create investment
GET    /api/investments                         → List investments (filter: asset_type, skip, limit)
GET    /api/investments/[id]                    → Get single investment (enriched with live P&L)
PUT    /api/investments/[id]                    → Update investment
DELETE /api/investments/[id]                    → Delete investment
```

### Portfolio
```
GET    /api/portfolio/summary                   → Full portfolio summary with P&L
GET    /api/portfolio/allocation                → Asset allocation breakdown (for pie chart)
GET    /api/portfolio/performance?period=30d    → Historical snapshots (for line chart)
POST   /api/portfolio/snapshot                  → Force a portfolio snapshot
```

### Price Alerts
```
POST   /api/alerts                              → Create price alert
GET    /api/alerts                              → List alerts (filter: is_active, is_triggered)
GET    /api/alerts/[id]                         → Get alert with current price
DELETE /api/alerts/[id]                         → Delete alert
PUT    /api/alerts/[id]/deactivate              → Deactivate alert
```

### Market Data
```
GET    /api/market/price/[assetType]/[symbol]   → Get live price (USD & EGP)
GET    /api/market/exchange-rate                → Get USD/EGP rate
GET    /api/market/prices/batch?symbols=...     → Batch price lookup
```

### Cron Jobs (Vercel)
```
GET    /api/cron/check-alerts                   → Check & trigger price alerts (every 5 min)
GET    /api/cron/snapshot                       → Take daily portfolio snapshot (11 PM daily)
```

---

## 6. Project File Structure

```
InvestmentApp/
  .env                              (gitignored — DATABASE_URL for Neon)
  package.json                      ← Dependencies & scripts
  next.config.ts                    ← Next.js configuration
  tsconfig.json                     ← TypeScript configuration
  postcss.config.mjs                ← PostCSS (Tailwind)
  eslint.config.mjs                 ← ESLint configuration
  vercel.json                       ← Vercel cron job definitions
  prisma.config.ts                  ← Prisma config (datasource URL from env)

  prisma/
    schema.prisma                   ← Database schema (models, enums, indexes)
    migrations/                     ← Prisma migration files

  app/
    layout.tsx                      ← Root layout (Sidebar, TopBar, providers)
    globals.css                     ← Tailwind imports & global styles
    page.tsx                        ← Dashboard page (/)
    investments/
      page.tsx                      ← Investments page (/investments)
    alerts/
      page.tsx                      ← Alerts page (/alerts)
    generated/
      prisma/                       ← Auto-generated Prisma client (do not edit)

    api/
      investments/
        route.ts                    ← GET (list) + POST (create)
        [id]/
          route.ts                  ← GET + PUT + DELETE by ID
      portfolio/
        summary/route.ts           ← GET portfolio summary with P&L
        allocation/route.ts        ← GET asset allocation breakdown
        performance/route.ts       ← GET historical snapshots
        snapshot/route.ts          ← POST force snapshot
      alerts/
        route.ts                    ← GET (list) + POST (create)
        [id]/
          route.ts                  ← GET + DELETE by ID
          deactivate/route.ts      ← PUT deactivate alert
      market/
        price/
          [assetType]/
            [symbol]/route.ts      ← GET live price
        exchange-rate/route.ts     ← GET USD/EGP rate
        prices/
          batch/route.ts           ← GET batch price lookup
      cron/
        check-alerts/route.ts     ← GET — Vercel cron: check alerts (every 5 min)
        snapshot/route.ts          ← GET — Vercel cron: daily snapshot (11 PM)

  components/
    providers/
      QueryProvider.tsx             ← TanStack Query client provider
      CurrencyProvider.tsx          ← Currency preference context (localStorage)
    layout/
      Sidebar.tsx                   ← Navigation links
      TopBar.tsx                    ← Currency toggle, exchange rate, refresh
    dashboard/
      PortfolioValueCard.tsx        ← Total value + P&L (big number)
      AllocationPieChart.tsx        ← Recharts PieChart by asset type
      PerformanceLineChart.tsx      ← Recharts LineChart over time
      TopMovers.tsx                 ← Best/worst performing assets
    investments/
      InvestmentTable.tsx           ← Sortable table with live data
      InvestmentForm.tsx            ← Form for create/edit (dynamic by asset type)
      AssetTypeFilter.tsx           ← Filter tabs
    common/
      CurrencyDisplay.tsx           ← Renders amount in USD/EGP/both
      ProfitLossIndicator.tsx       ← Green/Red with arrow + percentage
      LoadingSpinner.tsx
      EmptyState.tsx

  lib/
    db.ts                           ← Prisma client singleton (Neon adapter)
    market-data.ts                  ← Price fetching (CoinGecko, yfinance, metals, forex)
    enrich.ts                       ← P&L enrichment logic
    formatters.ts                   ← Currency, date, number formatting
    constants.ts                    ← Asset type labels, colors, symbol maps
    types.ts                        ← TypeScript interfaces

  public/                           ← Static assets (SVGs, favicon)
```

---

## 7. P&L Calculation Logic

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

## 8. Price Alerts Mechanism

1. **Vercel Cron Job** hits `GET /api/cron/check-alerts` every 5 minutes (configured in `vercel.json`)
2. Queries all alerts where `isActive = true AND isTriggered = false` via Prisma
3. Fetches current prices (batching where possible)
4. If `condition == "above"` and `price >= target`, or `condition == "below"` and `price <= target`:
   - Sets `isTriggered = true`
5. For alerts with `currency == "EGP"`, converts USD price to EGP before comparing
6. Frontend polls for triggered alerts every 30 seconds, shows toast notifications via `react-hot-toast`

---

## 9. Charts Specification

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

## 10. EGX Stock Symbol Mapping

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

## 11. Implementation Phases

### Phase 1: Project Setup & Database
- [x] Initialize Next.js 16 with App Router + TypeScript
- [x] Set up Prisma 7 with Neon serverless adapter
- [x] Define schema (Investment, PriceAlert, PortfolioSnapshot models)
- [x] Configure Tailwind CSS 4, ESLint

### Phase 2: API Routes & Core Logic
- [x] Investment CRUD API routes (`app/api/investments/`)
- [x] Market data service (`lib/market-data.ts`)
- [x] P&L enrichment logic (`lib/enrich.ts`)
- [x] Portfolio API routes (summary, allocation, performance, snapshot)
- [x] Alert API routes (CRUD + deactivate)
- [x] Market data API routes (price, exchange rate, batch)
- [x] Vercel cron routes for alerts & snapshots

### Phase 3: Frontend — Layout & Dashboard
- [x] Root layout with Sidebar, TopBar, providers
- [x] Dashboard page with PortfolioValueCard, AllocationPieChart, PerformanceLineChart, TopMovers
- [x] CurrencyProvider context (localStorage-backed)
- [x] QueryProvider (TanStack Query)

### Phase 4: Frontend — CRUD & Alerts
- [x] Investments page with table, filters, form
- [x] Alerts page
- [x] Common components (CurrencyDisplay, ProfitLossIndicator, LoadingSpinner, EmptyState)

### Phase 5: Polish & Deploy
- [ ] Loading states, error states, empty states (partially done)
- [ ] Toast notifications for triggered alerts
- [ ] Responsive design (mobile-friendly)
- [ ] Deploy to Vercel (full-stack)
- [ ] Run Prisma migrations on production Neon DB

---

## 12. Deployment

### Full-Stack (Vercel)
- **Platform:** Vercel (recommended — handles both frontend and API routes)
- **Build:** `npm run build` (Next.js handles everything)
- **Env vars:** `DATABASE_URL` (Neon connection string)
- **Cron Jobs:** Defined in `vercel.json` — alert checking (every 5 min) and daily snapshots
- **Prisma:** Generated client is bundled at build time; run `npx prisma generate` in build step

### Database
- **Neon PostgreSQL** (serverless, free tier available)
- **Connection:** Use `?sslmode=require` in connection strings
- **Driver:** `@neondatabase/serverless` pool with `@prisma/adapter-neon`

---

## 13. Known Limitations & Future Enhancements

**Current Limitations:**
- EGP P&L uses current exchange rate (not historical rate at purchase)
- EGX stock coverage on Yahoo Finance is limited to major stocks
- Price alerts are one-shot (trigger once, then deactivate)
- Performance chart needs a few days of snapshots to be useful
- Vercel Cron Jobs require a Vercel deployment (won't run in local dev)

**Future Enhancements:**
- WebSocket for real-time price updates
- Email/Telegram notifications for price alerts
- CSV import/export of portfolio
- Multiple portfolios support
- Historical exchange rate storage for accurate EGP P&L
- Authentication/user accounts
- Server Components for data-heavy pages (reduce client JS bundle)

---

*Last Updated: April 11, 2026 — Migrated from FastAPI + Vite to Next.js 16 + Prisma 7*
