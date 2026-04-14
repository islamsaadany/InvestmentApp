# Investment Portfolio Tracker — Project Details

> A web app for tracking investments across multiple asset classes with live market data, P&L tracking, charts, and price alerts.

---

## 1. Overview

**Purpose:** Track investments in Gold, Silver, Crypto, US Stocks, and Egyptian (EGX) Stocks. Fetch live market prices, calculate profit/loss, and display portfolio value in both USD and EGP.

**Key Features:**
- Multi-asset portfolio tracking (5 asset classes)
- Live market data from free APIs (Yahoo Finance, CoinGecko)
- Historical price tracking with backfill and incremental sync
- Profit & Loss tracking per investment and overall
- Dual currency display (USD & EGP) with live exchange rate
- Gold/Silver weight conversion (grams ↔ troy ounces)
- Charts: Pie chart (allocation), Area chart (performance), Analysis charts (market price + portfolio value)
- Analysis page with asset-level drill-down, entry point markers, and multi-select filters
- Mini chart popup on allocation pie chart click
- Price alerts with background monitoring
- Portfolio snapshots for historical performance
- Expert AI agent for Halal options trading recommendations
- Single-user JWT authentication

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
| Crypto historical | Yahoo Finance (`SOL-USD`, `XRP-USD`, etc.) | CoinGecko range API | USD per coin |
| US Stocks | Yahoo Finance chart API | — | USD per share |
| EGX Stocks | Yahoo Finance (`.CA` suffix) | — | EGP per share |
| Gold | Yahoo Finance `GC=F` (futures) | metalpriceapi.com | USD per troy ounce |
| Silver | Yahoo Finance `SI=F` (futures) | metalpriceapi.com | USD per troy ounce |
| USD/EGP Rate | exchangerate-api.com | Hardcoded fallback (50.0) | — |

**Caching:** In-memory cache with 5-minute TTL (30 min for exchange rate).

**Historical Price Storage:** Daily prices stored in `asset_price_history` table. Backfilled via `POST /api/market/backfill`, incrementally synced via `POST /api/market/sync`. Crypto symbols are mapped from CoinGecko IDs (e.g., `solana` → `SOL-USD`, `ripple` → `XRP-USD`) for Yahoo Finance historical fetches.

---

## 4. Database Schema (Prisma)

Schema defined in `prisma/schema.prisma`. Uses `@map()` directives to keep snake_case column names in the database while using camelCase in TypeScript.

**Enums:**
- `AssetType`: `gold`, `silver`, `crypto`, `us_stock`, `egx_stock`
- `WeightUnit`: `grams`, `ounces`
- `ValuationMode`: `live`, `manual`

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
| valuationMode | ValuationMode | default "live" | valuation_mode | "live" (market price) or "manual" (user-set value) |
| currentValue | Float? | optional | current_value | Manual valuation amount (used when valuationMode = "manual") |
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

### Model: `Watchlist` → table `watchlist`

| Field | Type | Constraints | DB Column | Notes |
|-------|------|-------------|-----------|-------|
| id | Int | PK, autoincrement | id | |
| symbol | String | VarChar(20), unique | symbol | Ticker symbol |
| name | String? | VarChar(200) | name | Human-readable name |
| addedAt | DateTime | default now() | added_at | |

### Model: `AssetPriceHistory` → table `asset_price_history`

| Field | Type | Constraints | DB Column | Notes |
|-------|------|-------------|-----------|-------|
| id | Int | PK, autoincrement | id | |
| symbol | String | VarChar(50) | symbol | Store symbol (e.g., "GOLD", "SILVER", "BTC", "AAPL") |
| assetType | AssetType | required | asset_type | |
| priceUsd | Float | required | price_usd | Daily closing price in USD |
| recordedDate | DateTime | Date type | recorded_date | Indexed; unique with symbol |

**Indexes:** `(symbol, recordedDate)` unique composite, `recordedDate`, `symbol`

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
POST   /api/market/backfill                     → Full historical price backfill (deletes + re-fetches all)
POST   /api/market/sync                        → Lightweight incremental sync (fills missing days only)
```

### Analysis
```
GET    /api/analysis/assets                     → List unique assets for filter dropdowns
GET    /api/analysis/price-history?symbols=BTC,GOLD&period=30d → Daily market price history
GET    /api/analysis/value-history?assetType=crypto&symbol=BTC&period=30d → Daily portfolio value history
```

### Authentication
```
POST   /api/auth/login                          → Login (sets JWT session cookie)
POST   /api/auth/logout                         → Logout (clears session cookie)
```

### Cron Jobs (Vercel)
```
GET    /api/cron/check-alerts                   → Check & trigger price alerts (daily, 8 AM UTC)
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
    layout.tsx                      ← Root layout (html/body shell)
    globals.css                     ← Tailwind imports & global styles
    icon.svg                        ← App favicon (blue $ with green arrow)
    (app)/                          ← Route group: authenticated pages
      layout.tsx                    ← App layout (Sidebar, providers, Toaster)
      page.tsx                      ← Dashboard page (/)
      investments/
        page.tsx                    ← Investments page (/investments)
      alerts/
        page.tsx                    ← Alerts page (/alerts)
      analysis/
        page.tsx                    ← Analysis page (/analysis)
      expert/
        page.tsx                    ← Expert AI page (/expert)
    (auth)/                         ← Route group: unauthenticated pages
      layout.tsx                    ← Auth layout (minimal, no sidebar)
      login/
        page.tsx                    ← Login page (/login)
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
        backfill/route.ts          ← POST full historical price backfill
        sync/route.ts              ← POST lightweight incremental price sync
      analysis/
        assets/route.ts            ← GET unique asset list for filters
        price-history/route.ts     ← GET daily market price history
        value-history/route.ts     ← GET daily portfolio value history
      cron/
        check-alerts/route.ts     ← GET — Vercel cron: check alerts (daily, 8 AM UTC)
        snapshot/route.ts          ← GET — Vercel cron: daily snapshot (11 PM)
      auth/
        login/route.ts             ← POST login (sets JWT session cookie)
        logout/route.ts            ← POST logout (clears session cookie)
      expert/
        chat/route.ts              ← POST streaming AI chat
        watchlist/route.ts         ← GET/POST/DELETE watchlist items
      health/route.ts              ← GET health check

  middleware.ts                     ← JWT auth middleware (protects all non-public routes)

  components/
    providers/
      QueryProvider.tsx             ← TanStack Query client provider
      CurrencyProvider.tsx          ← Currency preference context (localStorage)
    layout/
      Sidebar.tsx                   ← Dark blue sidebar with nav, collapse toggle, refresh button
      TopBar.tsx                    ← (Legacy, kept for reference)
    dashboard/
      PortfolioValueCard.tsx        ← Total value + P&L (big number)
      AllocationPieChart.tsx        ← Pie chart + sortable table + mini chart popup on click
      PerformanceLineChart.tsx      ← Area chart with purchase markers & hover tooltips
      TopMovers.tsx                 ← Best/worst performing assets (top 10)
    investments/
      InvestmentTable.tsx           ← Sortable table with live data
      InvestmentForm.tsx            ← Form for create/edit (dynamic by asset type, brokerage mode)
      AssetTypeFilter.tsx           ← Filter tabs
    expert/
      ChatInterface.tsx             ← Chat UI with streaming, portfolio toggle
      MessageBubble.tsx             ← Message display component
      WatchlistPanel.tsx            ← Watchlist sidebar panel (dark blue theme)
    common/
      CurrencyDisplay.tsx           ← Renders amount in USD/EGP/both
      ProfitLossIndicator.tsx       ← Green/Red with arrow + percentage
      LoadingSpinner.tsx
      EmptyState.tsx

  lib/
    db.ts                           ← Prisma client singleton (Neon adapter)
    auth.ts                         ← JWT auth utilities (sign, verify, cookie management)
    market-data.ts                  ← Price fetching + historical data (CoinGecko, Yahoo Finance, metals, forex)
    enrich.ts                       ← P&L enrichment logic
    formatters.ts                   ← Currency, date, number, axis formatting + niceYDomain
    constants.ts                    ← Asset type labels, colors, symbol maps
    types.ts                        ← TypeScript interfaces (includes ValuationMode)
    ai-provider.ts                  ← Multi-provider AI abstraction (Anthropic/Google/OpenAI)
    expert-prompts.ts               ← Expert agent system prompt + KB loader
    expert/
      kb.txt                        ← Halal options trading Knowledge Base
      system-prompt.txt             ← HALAL-OPT agent system prompt

  scripts/                          ← Data import utilities
    crypto-data.tsv                 ← Crypto transaction data (TSV format)
    crypto-inserts.sql              ← Generated SQL inserts for crypto transactions
    generate-crypto-sql.js          ← Script to convert TSV → SQL inserts

  ui-versions/                      ← UI snapshot rollback points (see CLAUDE.md)

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

1. **Vercel Cron Job** hits `GET /api/cron/check-alerts` once daily at 8 AM UTC (configured in `vercel.json`)
2. Queries all alerts where `isActive = true AND isTriggered = false` via Prisma
3. Fetches current prices (batching where possible)
4. If `condition == "above"` and `price >= target`, or `condition == "below"` and `price <= target`:
   - Sets `isTriggered = true`
5. For alerts with `currency == "EGP"`, converts USD price to EGP before comparing
6. Frontend polls for triggered alerts every 30 seconds, shows toast notifications via `react-hot-toast`

---

## 9. Charts Specification

### Allocation Pie Chart + Sortable Table
- **Data:** `GET /api/portfolio/allocation` + enriched investments
- **Segments:** One per asset type
- **Colors:** Gold=#FFD700, Silver=#C0C0C0, Crypto=#F7931A, US Stocks=#4CAF50, EGX=#1976D2
- **Table:** Sortable by asset name, allocation %, value, P&L% — with row numbers
- **Currency toggle:** USD/EGP within the card
- **Click interaction:** Clicking a pie segment or table row opens a **mini chart popup** with:
  - "Market Price" tab — historical price chart for the asset type
  - "My Value" tab — portfolio value chart for the asset type
  - Purchase entry markers (red dots) with average cost reference line and current price line
  - Hover tooltips showing purchase details (quantity, price, date)
  - Nice rounded Y-axis via `niceYDomain()`

### Performance Line Chart (Dashboard)
- **Data:** `GET /api/analysis/value-history?period=...` (switched from snapshots to value-history API)
- **X-axis:** Date (MMM DD)
- **Y-axis:** Portfolio value in selected currency (clean ticks via `niceYDomain`)
- **Period selector:** 7D, 30D, 90D, 1Y, ALL
- **Style:** Area chart with gradient fill
- **Purchase markers:** Red dots on purchase dates with hover tooltips showing investment name, quantity, and purchase price
- **Carry-forward logic:** Weekend/holiday gaps filled with last known price to avoid chart dips

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
- [x] Define schema (Investment, PriceAlert, PortfolioSnapshot, Watchlist, AssetPriceHistory models)
- [x] Configure Tailwind CSS 4, ESLint

### Phase 2: API Routes & Core Logic
- [x] Investment CRUD API routes (`app/api/investments/`)
- [x] Market data service (`lib/market-data.ts`) — live + historical prices
- [x] P&L enrichment logic (`lib/enrich.ts`)
- [x] Portfolio API routes (summary, allocation, performance, snapshot)
- [x] Alert API routes (CRUD + deactivate)
- [x] Market data API routes (price, exchange rate, batch, backfill, sync)
- [x] Analysis API routes (assets, price-history, value-history)
- [x] Vercel cron routes for alerts & snapshots

### Phase 3: Frontend — Layout & Dashboard
- [x] Root layout with Sidebar, providers (route groups: `(app)` + `(auth)`)
- [x] Dashboard page with PortfolioValueCard, AllocationPieChart, PerformanceLineChart, TopMovers
- [x] CurrencyProvider context (localStorage-backed)
- [x] QueryProvider (TanStack Query)
- [x] Dark blue Sidebar redesign with collapse toggle and refresh button

### Phase 4: Frontend — CRUD & Alerts
- [x] Investments page with table, filters, form (incl. EGX brokerage mode)
- [x] Alerts page
- [x] Common components (CurrencyDisplay, ProfitLossIndicator, LoadingSpinner, EmptyState)

### Phase 5: Polish & Deploy
- [x] Custom app icon (blue $ with green arrow SVG favicon)
- [x] Single-user authentication (JWT + env-based credentials + middleware)
- [ ] Loading states, error states, empty states (partially done)
- [ ] Toast notifications for triggered alerts
- [ ] Responsive design (mobile-friendly)
- [x] Deploy to Vercel (full-stack)
- [ ] Run Prisma migrations on production Neon DB

### Phase 6: Analysis & Historical Data
- [x] `AssetPriceHistory` model + migration for daily price storage
- [x] Historical price backfill API (`/api/market/backfill`)
- [x] Incremental price sync API (`/api/market/sync`)
- [x] Analysis page with Market Price and My Value chart tabs
- [x] Multi-select asset type and symbol filters (checkbox style)
- [x] Entry point markers (purchases) on charts with avg cost + current price lines
- [x] Mini chart popup on AllocationPieChart click
- [x] Performance chart switched from snapshots to value-history (carry-forward logic)
- [x] Purchase date markers with hover tooltips on performance chart
- [x] Crypto historical price fix: CoinGecko ID → Yahoo Finance symbol mapping

### Phase 7: Expert Agent
- [x] Expert page with chat interface and watchlist panel
- [x] Multi-provider AI support (Anthropic, Google, OpenAI)
- [x] Halal options trading Knowledge Base

---

## 12. Deployment

### Full-Stack (Vercel)
- **Platform:** Vercel (recommended — handles both frontend and API routes)
- **Build:** `npm run build` (Next.js handles everything)
- **Env vars:** `DATABASE_URL`, `AUTH_USERNAME`, `AUTH_PASSWORD`, `AUTH_SECRET`
- **Cron Jobs:** Defined in `vercel.json` — alert checking (daily, 8 AM UTC) and daily snapshots (11 PM UTC)
- **Prisma:** Generated client is bundled at build time; run `npx prisma generate` in build step

### Database
- **Neon PostgreSQL** (serverless, free tier available)
- **Connection:** Use `?sslmode=require` in connection strings
- **Driver:** `@neondatabase/serverless` pool with `@prisma/adapter-neon`

---

## 13. Analysis Page & Historical Price Tracking

**Added:** April 14, 2026

**What it is:** A dedicated Analysis page (`/analysis`) for visualizing asset price trends and portfolio value over time, backed by a stored historical price database.

### Historical Price Infrastructure

- **`AssetPriceHistory` table** — Stores daily closing prices per symbol (e.g., `GOLD`, `SILVER`, `BTC`, `AAPL`), indexed by `(symbol, recordedDate)` unique composite
- **Backfill API** (`POST /api/market/backfill`) — Full historical backfill from 1 month before the earliest purchase date to today. Deletes existing data per symbol and re-fetches. Also backfills `PortfolioSnapshot` records.
- **Sync API** (`POST /api/market/sync`) — Lightweight incremental sync called by the Refresh button. Only fetches missing days since the last recorded date per symbol. Also creates a daily portfolio snapshot.
- **Symbol mapping** — Gold → `GOLD`, Silver → `SILVER`, crypto uses ticker symbol (BTC, SOL, XRP). Historical crypto data fetched from Yahoo Finance (`SOL-USD`, `XRP-USD`) with CoinGecko fallback.

### Analysis Page Features

- **Two chart tabs:**
  - **Market Price** — Line chart of raw market prices from `asset_price_history`, with entry point markers (red dots at purchase dates), average cost reference line, and current price line
  - **My Value** — Area chart showing portfolio value over time (price × quantity), accounting for when each investment was purchased (`purchaseDate` or `createdAt`)
- **Filters:**
  - Asset type multi-select (checkbox style for Gold, Silver, Crypto, US Stocks, EGX)
  - Symbol multi-select (populated from user's actual investments)
  - Period selector: 7D, 30D, 90D, 1Y, ALL
- **Auto-backfill** — If no price history data exists when the page loads, automatically triggers a full backfill with a toast notification
- **Carry-forward logic** — Weekend/holiday gaps filled with last known price to prevent chart dips

### Files Created
- `app/(app)/analysis/page.tsx` — Analysis page component
- `app/api/analysis/assets/route.ts` — Unique asset list for filter dropdowns
- `app/api/analysis/price-history/route.ts` — Daily market price history
- `app/api/analysis/value-history/route.ts` — Daily portfolio value history with carry-forward
- `app/api/market/backfill/route.ts` — Full historical price backfill
- `app/api/market/sync/route.ts` — Incremental price sync
- `prisma/migrations/20260414_add_asset_price_history/migration.sql`

### Files Modified
- `prisma/schema.prisma` — Added `AssetPriceHistory` model, `ValuationMode` enum
- `lib/market-data.ts` — Added `getHistoricalPrices()`, `getYahooHistoricalPrices()`, `getCoinGeckoHistoricalPrices()`, crypto symbol mapping (`COIN_YAHOO_MAP`)
- `lib/formatters.ts` — Added `formatAxisValue()`, `niceYDomain()` helpers
- `components/layout/Sidebar.tsx` — Added "Analysis" nav link with BarChart3 icon
- `components/dashboard/PerformanceLineChart.tsx` — Switched from snapshots to value-history API, added purchase markers + hover tooltips
- `components/dashboard/AllocationPieChart.tsx` — Added mini chart popup on click, sortable table with row numbers, avg cost + current price lines

---

## 14. UI Redesign & Dashboard Enhancements

**Added:** April 11–14, 2026

### Sidebar Redesign
- Dark blue theme (`bg-slate-900`) replacing the original light sidebar
- Collapse toggle (hamburger icon) — collapses to icon-only 16px width
- Refresh button integrated into sidebar (triggers `/api/market/sync` + invalidates TanStack Query cache)
- Visual feedback during refresh (spinning icon + toast notifications)
- Logout button at bottom
- Nav links: Dashboard, Investments, Alerts, Analysis, Expert

### Dashboard Changes
- **PortfolioValueCard** — Always shows EGP as primary, USD as secondary
- **AllocationPieChart** — Currency toggle (USD/EGP) within card, sortable table with row numbers and P&L%, clickable segments open mini chart popup
- **PerformanceLineChart** — Uses value-history API instead of snapshots, purchase date markers (red dots), hover tooltips with purchase details
- **TopMovers** — Expanded to top 10, aggregated by symbol

### EGX Brokerage Portfolio Mode
- **InvestmentForm** — Added "Individual / Brokerage" toggle for EGX stocks
  - Individual mode: standard live market price tracking
  - Brokerage mode: sets `valuationMode = "manual"`, user enters `currentValue` directly
- **Investment model** — Added `valuationMode` (live/manual) and `currentValue` fields

### Route Groups
- `(app)/` — Authenticated pages with Sidebar layout
- `(auth)/` — Login page with minimal layout (no sidebar)
- `middleware.ts` — JWT verification on all non-public routes

---

## 15. Expert Agent (Halal Options Trading Advisor)

**Added:** April 12, 2026

**What it is:** An AI-powered Expert page that provides Halal-compliant US stock options trading recommendations using the HALAL-OPT trading agent framework.

**Features:**
- Chat-style interface with streaming AI responses (Claude Opus by default)
- Full Knowledge Base covering options fundamentals, Greeks, IV analysis, 18+ strategies, macro inputs, technical analysis, Halal screening (AAOIFI standards), risk management, and a 9-step decision framework
- Watchlist management (persisted in DB) — add/remove tickers for the agent to prioritize
- Portfolio-aware context — toggle to include existing investments in AI analysis
- Multi-provider support — switch between Anthropic (Claude), Google (Gemini), or OpenAI (GPT) via `.env` config
- Standardized recommendation output format with trade setup, risk levels, exit conditions

**Files created:**
- `app/(app)/expert/page.tsx` — Expert page (hybrid: watchlist panel + chat)
- `app/api/expert/chat/route.ts` — AI chat streaming API route
- `app/api/expert/watchlist/route.ts` — Watchlist CRUD (GET, POST, DELETE)
- `components/expert/ChatInterface.tsx` — Chat UI with streaming, portfolio toggle
- `components/expert/MessageBubble.tsx` — Message display component
- `components/expert/WatchlistPanel.tsx` — Watchlist sidebar panel
- `lib/ai-provider.ts` — Multi-provider abstraction (Anthropic/Google/OpenAI)
- `lib/expert-prompts.ts` — System prompt + KB loader with caching
- `lib/expert/kb.txt` — Full Halal options trading Knowledge Base
- `lib/expert/system-prompt.txt` — HALAL-OPT agent system prompt

**Files modified:**
- `components/layout/Sidebar.tsx` — Added "Expert" nav link with Brain icon
- `lib/types.ts` — Added `WatchlistItem`, `ChatMessage` types
- `prisma/schema.prisma` — Added `Watchlist` model

**Database model added:**
- `Watchlist` (id, symbol, name, addedAt) with unique constraint on symbol

**Dependencies added:**
- `ai` (Vercel AI SDK core)
- `@ai-sdk/react` (React hooks)
- `@ai-sdk/anthropic` (Claude provider)
- `@ai-sdk/google` (Gemini provider)
- `@ai-sdk/openai` (OpenAI/GPT provider)

**Environment variables (add to `.env`):**
```
AI_PROVIDER=anthropic          # or 'google' or 'openai'
ANTHROPIC_API_KEY=sk-ant-...   # Required if provider is anthropic
# GOOGLE_GENERATIVE_AI_API_KEY=...  # Required if provider is google
# OPENAI_API_KEY=...                # Required if provider is openai
AI_MODEL=claude-opus-4-20250514    # Optional: override default model
```

**API Endpoints:**
```
POST /api/expert/chat              → Streaming AI chat (sends messages, returns streamed text)
GET  /api/expert/watchlist         → List watchlist items
POST /api/expert/watchlist         → Add ticker to watchlist
DELETE /api/expert/watchlist?symbol=AAPL → Remove from watchlist
```

---

## 16. Known Limitations & Future Enhancements

**Current Limitations:**
- EGP P&L uses current exchange rate (not historical rate at purchase)
- EGX stock coverage on Yahoo Finance is limited to major stocks
- Price alerts are one-shot (trigger once, then deactivate)
- Vercel Cron Jobs require a Vercel deployment (won't run in local dev)
- Price alert checking runs once daily (8 AM UTC) due to Vercel Hobby plan limits — ideally should run every 5 minutes
- Silver "My Value" chart may match Market Price shape when only a single purchase exists (constant quantity)
- Crypto historical data quality depends on Yahoo Finance symbol mapping (CoinGecko IDs like `solana`/`ripple` must map correctly)

**Known Data Issues (as of April 14, 2026):**
- Crypto `asset_price_history` may contain bad data for symbols stored as CoinGecko IDs (`solana`, `ripple`). Fix: delete crypto history and re-run backfill (now maps to `SOL-USD`, `XRP-USD` for Yahoo Finance)
- Silver `purchaseDate` may be NULL in the database even when set in the UI — verify via Neon SQL console
- Value-history chart for single-purchase assets will always mirror market price shape (value = price × constant quantity)

**Future Enhancements:**
- **Frequent price alert checking (every 5 min)** — Requires Vercel Pro plan or an external scheduler to run `/api/cron/check-alerts` at higher frequency
- WebSocket for real-time price updates
- Email/Telegram notifications for price alerts
- CSV import/export of portfolio
- Multiple portfolios support
- Historical exchange rate storage for accurate EGP P&L
- Server Components for data-heavy pages (reduce client JS bundle)
- Historical EGP rate in value-history calculations (currently uses live rate for all dates)

---

*Last Updated: April 14, 2026 — Added Analysis page, historical price tracking, UI redesigns, and known data issues*
