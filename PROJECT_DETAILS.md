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
        check-alerts/route.ts     ← GET — Vercel cron: check alerts (daily, 8 AM UTC)
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

1. **Vercel Cron Job** hits `GET /api/cron/check-alerts` once daily at 8 AM UTC (configured in `vercel.json`)
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
- [x] Custom app icon (blue $ with green arrow SVG favicon)
- [x] Single-user authentication (JWT + env-based credentials)
- [ ] Loading states, error states, empty states (partially done)
- [ ] Toast notifications for triggered alerts
- [ ] Responsive design (mobile-friendly)
- [x] Deploy to Vercel (full-stack)
- [ ] Run Prisma migrations on production Neon DB

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

## 13. Expert Agent (Multi-Tab Halal Investment Advisor)

**Added:** April 12, 2026 — Initial Halal options trading advisor
**Updated:** May 4, 2026 — Split into 3 tabs: Options, US Stocks, Crypto

The Expert page now has **3 tabs**, each with its own AI agent persona, system prompt, knowledge base, and dedicated watchlist:

| Tab | Agent | Scope |
|-----|-------|-------|
| **Options** | HALAL-OPT | Halal-compliant US stock options strategies (existing — unchanged) |
| **US Stocks** | HALAL-EQUITY | Halal-screened US stock purchase recommendations (Analyze + Discover modes) |
| **Crypto** | HALAL-CRYPTO | Halal-acceptable cryptocurrency purchase recommendations (Analyze + Discover modes) |

Each tab shares: streaming chat UI, portfolio context toggle, scholarly Halal screening, and a category-scoped watchlist. Switching tabs swaps the chat session, the system prompt loaded by the API, and the watchlist filter.

### Original Options scope (HALAL-OPT)

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
- `Watchlist` (id, symbol, name, **category**, addedAt) — composite unique constraint on `(symbol, category)`. Category is an enum: `options | us_stocks | crypto`. Existing rows default to `options`.

### New tabs (May 4, 2026): US Stocks + Crypto

**Files added:**
- `components/expert/ExpertTabs.tsx` — top-level tab switcher (Options / US Stocks / Crypto)
- `lib/expert/us-stocks-system-prompt.txt` — HALAL-EQUITY agent system prompt
- `lib/expert/Knowledge Base for a Halal US Stock Purchase Agent.md` — full deep-research KB for US Stocks expert (replaces interim placeholder, activated 2026-05-04)
- `lib/expert/crypto-system-prompt.txt` — HALAL-CRYPTO agent system prompt
- `lib/expert/Knowledge Base for a Halal Crypto Purchase Advisor.md` — full deep-research KB for Crypto expert (replaces interim placeholder, activated 2026-05-04)
- `prisma/migrations/20260504_add_watchlist_category/migration.sql` — adds `WatchlistCategory` enum + `category` column to `watchlist`

**Files modified:**
- `app/(app)/expert/page.tsx` — wraps content in tabs, passes mode to children
- `components/expert/ChatInterface.tsx` — accepts `mode` prop, sends it in request body, swaps welcome message + placeholder per mode, scopes chat session per mode
- `components/expert/WatchlistPanel.tsx` — accepts `category` prop, filters API calls by category
- `app/api/expert/chat/route.ts` — reads `mode` from request body, loads the right system prompt + KB, filters watchlist by mode's category
- `app/api/expert/watchlist/route.ts` — accepts `category` query/body parameter for GET/POST/DELETE
- `lib/expert-prompts.ts` — refactored to multi-mode loader (per-mode system prompt + KB files)
- `lib/types.ts` — added `WatchlistCategory` and `ExpertMode` types; added `category` to `WatchlistItem`
- `prisma/schema.prisma` — added `WatchlistCategory` enum, `category` field, changed unique constraint to `(symbol, category)`
- `tsconfig.json` — excluded `ui-versions/` from type-checking (snapshot folder)

**API behavior changes:**
- `POST /api/expert/chat` — now accepts `mode: "options" | "us-stocks" | "crypto"` in body (defaults to `options`)
- `GET/POST/DELETE /api/expert/watchlist` — now accepts `category` parameter (defaults to `options`)

**Halal compliance approach across tabs:**
- US Stocks: AAOIFI Standard 21 + Zoya/Musaffa/IdealRatings cross-check, sector exclusions, debt/interest ratio thresholds
- Crypto: Conservative — defaults to stricter scholarly view; flags scholarly debate on PoS staking, stablecoins, DeFi tokens; instant-avoid list for memecoins, lending protocols, privacy coins

**Note on KBs:** As of 2026-05-04, the full deep-research KBs are active for all three tabs. The interim placeholder files (`us-stocks-kb.txt`, `crypto-kb.txt`) have been removed; `lib/expert-prompts.ts` now loads the full `.md` knowledge base files directly.

**Chat persistence & resilience (2026-05-04):**
- **Per-mode localStorage history** — Each Expert mode (Options / US Stocks / Crypto) keeps its own chat history in `localStorage` under `expert-chat-{mode}-v1`. Survives page navigation, reload, and tab switches within the Expert page. Only cleared by the explicit "Clear" button.
- **All three chat panes stay mounted** — `app/(app)/expert/page.tsx` renders all three `ChatInterface` instances and toggles visibility via CSS (`hidden`/`flex`). Switching tabs no longer aborts an in-flight stream.
- **Welcome message as empty-state** — Welcome only shows when the user has not yet sent a message in that mode. Once a real exchange exists, welcome is hidden.
- **Improved typing indicator** — Three bouncing purple dots inside an assistant bubble while the request is submitted but no tokens have arrived yet; hands off to streaming text as soon as the first chunk lands.
- **Inline error banner with retry** — Failed requests show a red error card with an actionable hint (e.g., "API key rejected — verify GOOGLE_GENERATIVE_AI_API_KEY") and a "Retry last message" button instead of an empty assistant bubble.
- **Server-side error enrichment** — `app/api/expert/chat/route.ts` now prechecks that the active provider's API key is set and returns a 503 with a clear setup message if missing. Provider auth/rate-limit/timeout errors are translated into actionable hints before being returned to the client.
- **Background generation across page navigation** — Not implemented (deferred). When the user leaves `/expert` entirely, the in-flight stream aborts; partial tokens are preserved in localStorage so the user can retry. See FUTURE_FEATURES.md for the planned server-side stream-relay solution.

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

## 14. Known Limitations & Future Enhancements

**Current Limitations:**
- EGP P&L uses current exchange rate (not historical rate at purchase)
- EGX stock coverage on Yahoo Finance is limited to major stocks
- Price alerts are one-shot (trigger once, then deactivate)
- Performance chart needs a few days of snapshots to be useful
- Vercel Cron Jobs require a Vercel deployment (won't run in local dev)
- Price alert checking runs once daily (8 AM UTC) due to Vercel Hobby plan limits — ideally should run every 5 minutes

**Future Enhancements:**
- **Frequent price alert checking (every 5 min)** — Requires Vercel Pro plan or an external scheduler to run `/api/cron/check-alerts` at higher frequency
- WebSocket for real-time price updates
- Email/Telegram notifications for price alerts
- CSV import/export of portfolio
- Multiple portfolios support
- Historical exchange rate storage for accurate EGP P&L
- Server Components for data-heavy pages (reduce client JS bundle)

---

## 15. Average Down Analyzer

**Added:** May 4, 2026

A rule-based portfolio analyzer that flags positions where the current market price is below the user's avg cost or lowest individual purchase, and recommends whether averaging down makes sense. No AI calls — pure math on stored purchase data + live prices.

**Where it lives:**
- TopBar gets a new button (trending-down icon) next to the refresh button
- Click opens a modal with summary stats + a list of recommendations sorted by actionability

**Buckets and thresholds:**
| Bucket | Trigger | Recommendation |
|---|---|---|
| `below_lowest` | Current < lowest individual purchase | Strongest averaging-down signal |
| `good_dip` | 5-25% below avg cost | Good averaging-down opportunity |
| `deep_dip` | >25% below avg cost | Verify thesis before adding (large drawdown warning) |
| `small_dip` | 0-5% below avg cost | Within noise — wait for deeper dip |
| `above_avg` | Current >= avg cost | No averaging case |

**Files added:**
- `lib/average-down-analyzer.ts` — pure-function analyzer (`analyzeInvestments`)
- `lib/chart-helpers.ts` — shared price/quantity unit-conversion helpers (used by analyzer + chart modal)
- `components/dashboard/AverageDownAnalyzerModal.tsx` — modal UI with summary strip + filter tabs (Actionable / All) + recommendation cards

**Files modified:**
- `components/layout/TopBar.tsx` — added analyzer button + modal mount

**Future:** AI-powered version planned (see `FUTURE_FEATURES.md`).

---

## 16. Asset Detail Modal — Redesign

**Updated:** May 4, 2026

The modal that opens when clicking a pie-chart slice or summary-table row was redesigned:

**Behavior changes:**
- **Bigger** — width grew from 480px to 800px to fit new content
- **Asset-type tabs** at the top — only types user owns (so a portfolio without EGX won't show an EGX tab). Switch between Gold / Silver / Crypto / US Stocks / EGX without closing the modal.
- **Drill-down dropdown** for multi-asset types — when on Crypto / US Stocks / EGX (which can hold multiple individual assets), a dropdown next to the chart-tab buttons lets the user switch between "Aggregate" and any individual asset. Single-asset types (Gold / Silver) skip the dropdown.
- **Lowest-purchase reference line** added (green dashed) alongside avg-cost (red dashed) and current-price (orange dashed).
- **Click-to-toggle legend** — clicking any legend item below the chart shows/hides that line or marker.

**Bug fixes:**
- **Purchase dots now plot at user's actual purchase price** (previously plotted at market price on the purchase date — visually inconsistent with the avg-cost line). For metals bought in grams, prices are converted to USD per troy ounce to match the chart axis.
- **Y-axis tick formatter** — `formatAxisValue` now uses 1 decimal place for K/M values when below 10K (so `4500` shows as `4.5K`, not `5K`), eliminating duplicate adjacent ticks.

**Files added:**
- `components/dashboard/AssetDetailModal.tsx` — new dedicated modal component (extracted from inline `AssetMiniChartPopupWrapper`)
- `lib/chart-helpers.ts` — shared unit-conversion helpers

**Files modified:**
- `components/dashboard/AllocationPieChart.tsx` — removed inline popup, imports new modal, passes full investments + egpRate
- `lib/formatters.ts` — fixed `formatAxisValue` rounding

---

## 17. Historical EGP rate + metal purity per investment

**Added:** May 4, 2026

To make P&L, avg-cost, and chart purchase markers accurate, every investment can now store the **exchange rate at purchase time** and the **metal purity** (gold karat / silver fineness). Without these, the system falls back to current EGP rate and assumes pure-grade metal — which makes purchase dots drift below the spot price line on the asset detail chart.

**Schema additions to `Investment`:**
| Field | Type | Notes |
|---|---|---|
| `purchaseExchangeRate` | Float? | EGP per USD on the purchase day; null = use current rate |
| `purityPercent` | Float? | 0-100 (24K=100, 21K=87.5, 925=92.5); null = treat as pure |

Migration: `prisma/migrations/20260504_add_purchase_rate_purity/migration.sql`. Both columns are nullable so existing rows continue working unchanged.

**Conversion logic updated:**
- `lib/chart-helpers.ts` — uses stored `purchaseExchangeRate` when present, falls back to `egpRate` arg; divides by `purityPercent / 100` so 21K-gold dots line up with 24K spot price.
- `lib/enrich.ts` — same logic applied to P&L computation. Quantity is also adjusted by purity for value calculations.
- `app/api/analysis/value-history/route.ts` — applies purity in portfolio-value-over-time calculation.

**Investment form (`components/investments/InvestmentForm.tsx`):**
- New **Karat / Fineness dropdown** for gold (24K / 22K / 21K / 18K / 14K) and silver (.999 / .925 / .916 / .800).
- New **"Exchange rate at purchase"** field, only shown when purchase currency is EGP. Includes an **Auto-fill** button that fetches the historical USD/EGP rate from Frankfurter for the selected purchase date.

**New API endpoints:**
| Route | Purpose |
|---|---|
| `GET /api/market/historical-egp-rate?date=YYYY-MM-DD` | Returns historical USD/EGP rate via Frankfurter (free, ECB-based). Cached 24h. |
| `POST /api/admin/backfill-historical-rates` | One-shot job: walks every EGP-denominated investment with no stored rate, fetches Frankfurter rate for its purchase date, persists it. Body `{dryRun: true}` for a no-write preview. |

**To backfill existing investments after applying the migration:**
```bash
curl -X POST https://your-app.vercel.app/api/admin/backfill-historical-rates \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'   # preview first
```

**Caveat:** Frankfurter uses ECB/official rates. If you transacted at a parallel-market rate (Egyptian black market in early 2024 was significantly different), the auto-filled rate will be off — manually edit the field after the form fetches it.

---

## 18. Asset Detail Modal — Date range selector + pre-window snap + downsampling

**Added:** May 4, 2026

**Date range selector:** above the chart, choose **90D / 3M / 6M / 1Y / All** (default 90D). The selector controls the price-history fetch window. "All" fetches all stored history.

**Pre-window snap with label:** Purchase markers whose date falls before the chart's leftmost visible date are **snapped to the leftmost edge** and rendered with a small amber color + a tiny date label (e.g. `← Nov 25`) so it's clear the dot was pulled in. They no longer pretend to be in-window.

**Downsampling:** When the chart would have more than `DOWNSAMPLE_THRESHOLD` (180) points (e.g. selecting "All" on a portfolio with daily history going back years), the chart **down-samples to weekly averages** to keep rendering responsive. Below the threshold the daily resolution is preserved.

**Updated period support:** `app/api/analysis/price-history/route.ts` and `app/api/analysis/value-history/route.ts` now accept `3m`, `6m`, `1y`, and `all` periods (in addition to existing `7d`, `30d`, `90d`).

---

## 19. Mobile + Tablet Responsive Layout

**Added:** May 25, 2026

The whole app is now responsive across phone, tablet, and desktop. Desktop UI is unchanged at ≥1024px; only smaller viewports get new layouts.

**Breakpoints used:** `sm` (≥640px), `md` (≥768px), `lg` (≥1024px)

### Phase 1 — Navigation shell

- **Mobile (<768px):** sidebar hidden by default; top header bar with hamburger button, app name, and refresh icon. Tapping hamburger slides sidebar in from the left as an overlay with a dark backdrop. Body scroll is locked while drawer is open. Drawer auto-closes on route change.
- **Tablet (768-1023px):** existing collapsible icon-only sidebar; mobile header NOT shown.
- **Desktop (≥1024px):** unchanged.
- Added `viewport` meta to root layout for proper mobile scaling.

**Files added:**
- `components/layout/AppShell.tsx` — client wrapper managing nav state (drawer open, collapsed)
- `components/layout/MobileHeader.tsx` — phone-only top header with hamburger + refresh

**Files modified:**
- `app/layout.tsx` — added viewport metadata
- `app/(app)/layout.tsx` — wraps children in `<AppShell>` instead of inline `<Sidebar>` + `<main>`
- `components/layout/Sidebar.tsx` — refactored to accept `mobileOpen`/`onCloseMobile`/`collapsed`/`onToggleCollapsed` props; renders as fixed overlay drawer on mobile, sticky aside on md+

### Phase 2 — Page layouts

- **InvestmentTable + AlertsPage:** added card-list view (`md:hidden`) for phones; existing table preserved at `md:block`. Each card shows asset/symbol, qty, prices, value, P&L, and edit/delete actions.
- **All modals** (Investment Form, Asset Detail, Average Down, Alert Form, Split Detection): full-screen on phones (no rounded corners, fills viewport), normal modal at sm+. Close button enlarged for touch (p-2).
- **InvestmentForm:** all `grid-cols-2` field rows changed to `grid-cols-1 sm:grid-cols-2` so fields stack on phones.
- **AssetDetailModal:** drill-down row (tabs + symbol picker + period selector) stacks vertically on phones.
- **AverageDownAnalyzerModal:** summary strip changes from 3-col to 1-col on phones; recommendation card stats from 3-col to 2-col.
- **AnalysisPage:** filter dropdowns full-width on phones; period selector wraps.
- **ExpertPage:** watchlist becomes a slide-in left drawer on phones (toggled via a button shown only on mobile); chat takes full width.
- **Dashboard cards:** smaller padding (`p-4 sm:p-6`) and smaller headings (`text-xl sm:text-2xl`) on phones.
- **Asset type filter + Expert tabs:** horizontal scroll on phones to prevent wrap/overlap.

### Phase 3 — Polish

- **Chart heights** scale down on phones: Allocation 260→220px, Performance 280→220px, Asset Detail 320→240px, Analysis charts 300→240px / 350→260px.
- **Touch targets:** modal close buttons, mobile card action buttons, and watchlist remove buttons enlarged to ≥40px tap area. Mobile menu icons use `-ml-2`/`-mr-2` to extend tap area to the edge.
- **Watchlist remove button on mobile** is now always visible (was hover-only on desktop).

**Files modified across all phases:**
- Layout: `app/layout.tsx`, `app/(app)/layout.tsx`, `components/layout/Sidebar.tsx`
- Pages: `app/(app)/page.tsx`, `app/(app)/investments/page.tsx`, `app/(app)/alerts/page.tsx`, `app/(app)/analysis/page.tsx`, `app/(app)/expert/page.tsx`
- Dashboard: `PortfolioValueCard.tsx`, `AllocationPieChart.tsx`, `PerformanceLineChart.tsx`, `TopMovers.tsx`, `AssetDetailModal.tsx`, `AverageDownAnalyzerModal.tsx`
- Investments: `InvestmentTable.tsx`, `InvestmentForm.tsx`, `AssetTypeFilter.tsx`
- Expert: `ChatInterface.tsx`, `WatchlistPanel.tsx`, `ExpertTabs.tsx`
- Common: `SplitDetectionModal.tsx`

All originals snapshotted to `ui-versions/` per project rule.

---

## 20. Expert (US Stocks) — Structured Recommendation Cards

**Added:** May 26, 2026

The US Stocks Expert tab previously rendered long markdown blobs for every recommendation. Now, when the HALAL-EQUITY agent recommends a stock (Analyze or Discover mode), it emits a structured `<recommendation>` JSON block per stock, and the frontend renders each block as a rich card with a live mini chart instead of plain text.

**What the user sees per stock:**
- Ticker + company name + green/amber/red Halal status badge
- Live current price (from `/api/market/price`) + 1-day change derived from history
- Verdict chip (BUY / WAIT / etc) + Conviction chip (HIGH/MOD/LOW) + position-size badge
- Mini area chart with 1M / 3M / 6M / 1Y period selector
  - Dashed reference lines for entry zone (indigo), 12-month target (green), and stop (red)
- 3-column price ladder: Entry / Target (+%) / Stop (-%)
- One-line summary in a blue-bordered callout
- "Understand more ▾" expander — reveals sector, screening source, full "why", target rationale, stop rationale, risks (3-5), catalysts (3-5), purification note
- Footer disclaimer: "Levels suggested by AI on {date}; verify against current price."

**Streaming-safe parsing:** `MessageBubble` parses `<recommendation>...</recommendation>` blocks out of the assistant text. Unclosed blocks (still streaming) are hidden until the closing tag arrives — users never see half-written JSON. Malformed JSON falls back to showing the raw block. Prose around the blocks renders as markdown as before.

**Scope:** US Stocks tab only. Options and Crypto tabs unchanged (their agents still emit markdown). Same pattern can be applied to those tabs in a later pass.

**Files added:**
- `components/expert/RecommendationCard.tsx` — card component with mini chart + expander
- `ui-versions/MessageBubble/2026-05-26_before-recommendation-cards.tsx` — pre-change snapshot

**Files modified:**
- `lib/expert/us-stocks-system-prompt.txt` — added STRUCTURED RECOMMENDATION FORMAT section requiring `<recommendation>` JSON blocks; removed the "display disclaimer at start" instruction (the UI banner already covers this)
- `components/expert/MessageBubble.tsx` — splits assistant content into prose segments + recommendation cards; widens bubble width when cards are present
- `app/api/analysis/price-history/route.ts` — new "by ticker" mode (`?ticker=MSFT&assetType=us_stock&period=3m`) that fetches live history via `getHistoricalPrices` for tickers the user doesn't own, so the chart works on any recommended stock

**API behavior change:**
- `GET /api/analysis/price-history` now supports two modes:
  - Existing: `?symbols=BTC,GOLD&period=30d` (DB-backed, owned assets)
  - New: `?ticker=MSFT&assetType=us_stock&period=3m` (live, any ticker)
- Period values supported across both modes: `7d`, `30d`, `90d`, `1m`, `3m`, `6m`, `1y`, `all`

---

*Last Updated: May 26, 2026 — Expert (US Stocks) structured recommendation cards with mini chart + expander*

---

## 21. Expert (US Stocks) — Live-price tool + stale-level safeguards

**Added:** May 26, 2026

**Problem:** The recommendation cards from section 20 surfaced a real failure: the HALAL-EQUITY agent has no live market data, so it quoted training-data prices for entry/target/stop levels. Example: JNJ card showed live price ~$234 (correct), but the AI's target was $170 and stop $140 (both stale, from when JNJ was $148-152 in early 2024). The card also showed "↑-27.5%" (sign-confused arrow) when the math went negative.

**Fix has three layers — defense in depth:**

**Layer 1 — Live-price tool (root cause fix)**
- The chat route now exposes a `get_current_price(ticker, assetType)` tool to the AI agent via the AI SDK's tool-use API
- System prompt mandates the agent call this tool BEFORE quoting any entry/target/stop for any ticker, in both Analyze and Discover modes
- `streamText` now uses `stopWhen: stepCountIs(5)` so the model can make multiple tool calls (e.g. 3-5 tickers in Discover mode) before producing the final recommendation
- The tool calls `getCurrentPrice` from `lib/market-data.ts`, which uses the same Yahoo Finance / CoinGecko cache the rest of the app relies on (5-min TTL)
- Tool errors are returned to the model rather than thrown, so a failed price fetch never breaks the response — the model is instructed to surface the failure to the user instead of fabricating a price

**Layer 2 — Stale-levels sanity-check banner (safety net)**
- `RecommendationCard.tsx` now compares the AI's quoted levels against the live current price
- Shows an amber warning banner at the top of the card when any of these hold:
  - 12-month target is below current price
  - Current price is >20% above entry zone top or >20% below entry zone bottom
  - Stop loss is above current price
- Catches cases where the model ignores the tool-use instruction or the tool fails silently

**Layer 3 — Arrow sign fix (display bug)**
- Target's % delta now shows `↑+X.X%` in green for upside, `↓-X.X%` in red for downside (when AI levels disagree with reality)
- Stop's % delta shows `↓-X.X%` in red for normal downside, `↑+X.X%` in amber when stop is above current (anomaly)

**Files modified:**
- `app/api/expert/chat/route.ts` — adds `get_current_price` tool definition + `stepCountIs(5)` stop condition
- `lib/expert/us-stocks-system-prompt.txt` — adds mandatory "LIVE PRICE TOOL" section requiring the agent to call the tool before quoting any level
- `components/expert/RecommendationCard.tsx` — adds stale-levels banner + fixes arrow sign logic

**Dependencies:** Reuses existing `ai` (v6) and `zod` (v4) packages — no new installs.

**Scope:** US Stocks tab only. The tool is available on all expert modes via the same route, but only the US Stocks system prompt currently mandates its use. Apply the same pattern to Options and Crypto tabs in a follow-up.

**Limitation:** Tool calls add a roundtrip per ticker. For 3-stock Discover mode, expect ~1-3s extra latency from the price fetches (cached after first hit within 5 min). Stays well within the 60s Vercel Hobby ceiling.

---

*Last Updated: May 26, 2026 — Live-price tool wired into Expert (US Stocks) + stale-level safeguards*
