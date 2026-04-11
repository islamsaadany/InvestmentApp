# Claude Code Instructions for InvestmentApp

> This file is automatically read by Claude Code at the start of each session.
> It contains project-specific instructions, guidelines, and configuration.

---

## Working Guidelines

### 1. CRITICAL: Never Act Without Alignment
- **NEVER implement features or make significant changes without explicit user confirmation**
- **When user says "let's align first" - STOP and discuss before any implementation**
- **Always present the plan/structure and wait for confirmation before coding**
- **If uncertain about requirements, ASK - do not assume**
- **This rule is NON-NEGOTIABLE**

### 1b. CRITICAL: Align Before Every Fix or Change
- **Before implementing ANY fix or change, explain what you plan to do in simple non-technical words**
- **Wait for the user to confirm before writing any code**
- **If there are multiple approaches, present them as options with a clear recommendation**
- **Never redesign, restyle, or restructure anything that wasn't explicitly asked for**
- **Stick to exactly what was requested — no extra "improvements" or visual changes**
- **If a fix requires touching something the user didn't mention, flag it and ask first**
- **This applies to every single fix, no matter how small**

### 1c. CRITICAL: UI Changes Require Explicit Approval
- **NEVER change any UI design, layout, styling, or visual element without explicit user approval**
- **This includes: colors, borders, spacing, card designs, labels, icons, section order, font sizes — EVERYTHING visual**
- **If a bug fix or feature requires a UI change, describe the visual change separately and get approval**
- **When restoring a design, match the original EXACTLY — do not "improve" or "modernize" it**
- **After ANY UI change, save a snapshot of the changed file to `ui-versions/` folder (see UI Version Tracking below)**
- **This rule exists because previous sessions have accidentally reverted agreed-upon designs**

### 2. Think Before Acting
- **Don't follow commands blindly** - Always analyze requests and challenge if something seems incorrect or could cause issues
- **Align before action** - If there's any ambiguity or potential risk, discuss with the user before proceeding
- **Consider implications** - Think through the downstream effects of any change before implementing

### 3. Quality Assurance
- **Always test the build before proceeding** - Run `npm run build` to verify no errors
- **Fix errors across the codebase** - Don't leave TypeScript errors unresolved
- **Test implications of changes** - Ensure changes don't break existing functionality
- **Verify before committing** - Check that all modified files are working correctly

### 3b. Engineering Preferences (Overrides Defaults)
These preferences override Claude Code's default behavior:
- **DRY: Flag repetition aggressively** — If logic is repeated 3+ times, extract it. If repeated twice, flag it to the user as a candidate for extraction. Do not silently leave duplication.
- **Edge cases: Handle more, not fewer** — Err on the side of covering edge cases (nulls, empty states, unexpected input, boundary conditions). Thoughtfulness over speed. This takes priority over "keep it minimal."
- **Aim for "engineered enough"** — Not under-engineered (fragile, hacky, no error handling) and not over-engineered (premature abstraction, unnecessary complexity, features nobody asked for). When in doubt, ask.
- **Explicit over clever** — Prefer readable, obvious code over compact/clever solutions.

### 4. Git Workflow
- **CRITICAL: Only 2 branches allowed:**
  1. `main` - Production/stable branch
  2. Session-coded branch (e.g., `claude/fix-xxx-sessionId`) - Development branch
- **NO separate "development" branch** - Use the session-coded branch for all development
- **Development** - All work should be committed to the session-coded branch (the one you're on when session starts)
- **Merge to main** - When work is complete and verified, merge to main and push
- **Use the provided GitHub token** for pushing (see Configuration section below)
- **Commit with descriptive messages** - Explain what and why, not just what changed
- **Clean up stale branches** - Delete old session branches that are no longer needed

### 5. Communication
- **Be proactive about potential issues** - Flag concerns before they become problems
- **Explain reasoning** - When suggesting changes, explain the rationale
- **Ask clarifying questions** - Better to ask than to assume incorrectly

### 6. Feature Logging (MANDATORY)
- **ALWAYS log new features** - When implementing a new feature or functionality, document it in `PROJECT_DETAILS.md`
- **Update the Features section** with:
  - Feature name and description
  - Files modified
  - Date added
- **This helps the user track and test all features we build**

### 7. Change Review Protocol (Plan Mode)
When entering Plan Mode for a feature or significant change, start by asking the user:

> **BIG CHANGE or SMALL CHANGE?**
> - **BIG CHANGE:** Work through review interactively, one section at a time, with up to 4 top issues per section.
> - **SMALL CHANGE:** Work through review interactively, but limit to 1 key issue per section.

Then review the change through these 4 lenses **in order**, pausing for user feedback after each:

#### Lens 1: Architecture
- Component boundaries and responsibility separation (server vs client components)
- Data flow between React components → Next.js API routes → Prisma → Neon PostgreSQL
- Prisma query patterns (watch for N+1 queries, use `include`/`select` efficiently)
- API route design and security (auth, data validation at boundaries)

#### Lens 2: Code Quality
- Code organization and module structure
- Repeated logic that should be extracted (but only if used 3+ times — avoid premature abstraction)
- Error handling gaps and missing edge cases (call these out explicitly)
- Technical debt being introduced or resolved

#### Lens 3: Testing & Verification
- Does `npm run build` succeed without errors?
- Do API routes return correct responses?
- Are there edge cases in the logic that could break silently?
- For data-driven features: does it handle empty states, nulls, and unexpected input?

#### Lens 4: Performance
- Database query efficiency (Prisma `select`/`include`, unnecessary fetches)
- React component re-render concerns (large state objects, missing memoization)
- API response times (market data caching, batch requests)
- Caching opportunities (price data TTL, exchange rates)

#### Presenting Issues
For each issue found:
- **Number issues** (1, 2, 3...) and **letter the options** (A, B, C...)
- Always include a "Do nothing" option where reasonable
- For each option: state the effort, risk, and maintenance impact in one line
- **Put the recommended option first** and mark it "(Recommended)"
- Use AskUserQuestion with clearly labeled issue numbers and option letters so the user can respond unambiguously

**Example format:**
```
Issue 1: Market data API called on every page render
  A) Add 5-min in-memory cache (Recommended) — Low effort, no risk
  B) Add Redis cache layer — Medium effort, requires Redis setup
  C) Do nothing — No effort, but will hit API rate limits
```

**CRITICAL:** This protocol supplements, not replaces, the alignment rules in sections 1-1c. The review happens *before* any code is written.

---

## Project Context

### About
**Investment Portfolio Tracker** — A web app for tracking investments across multiple asset classes (Gold, Silver, Crypto, US Stocks, Egyptian Stocks) with live market data, P&L tracking, charts, and price alerts. Displays portfolio value in both USD and EGP.

### Technology Stack
- **Framework:** Next.js 16 (App Router) — full-stack (API routes + React frontend)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon serverless) + Prisma 7 (with `@prisma/adapter-neon`)
- **Market Data:** yfinance (stocks), CoinGecko (crypto), free metals/forex APIs
- **Charts:** Recharts
- **Styling:** Tailwind CSS 4
- **State Management:** TanStack Query (React Query) v5
- **Forms:** React Hook Form + Zod
- **Scheduling:** Vercel Cron Jobs (via `vercel.json`)

### Key Directories
- `app/` - Next.js App Router (pages + API routes)
  - `app/page.tsx` - Dashboard page
  - `app/investments/page.tsx` - Investments page
  - `app/alerts/page.tsx` - Alerts page
  - `app/api/` - API route handlers (replaces backend)
    - `app/api/investments/` - Investment CRUD routes
    - `app/api/portfolio/` - Portfolio summary, allocation, performance, snapshot routes
    - `app/api/alerts/` - Alert CRUD routes
    - `app/api/market/` - Live price & exchange rate routes
    - `app/api/cron/` - Vercel cron job handlers (check-alerts, snapshot)
  - `app/generated/prisma/` - Generated Prisma client (auto-generated, do not edit)
- `components/` - Reusable React components
  - `components/layout/` - Sidebar, TopBar
  - `components/dashboard/` - Portfolio cards, charts, top movers
  - `components/investments/` - Investment table, form, filters
  - `components/common/` - CurrencyDisplay, ProfitLossIndicator, LoadingSpinner, EmptyState
  - `components/providers/` - QueryProvider, CurrencyProvider
- `lib/` - Shared utilities and server-side logic
  - `lib/db.ts` - Prisma client singleton (Neon serverless adapter)
  - `lib/market-data.ts` - Market data fetching service
  - `lib/enrich.ts` - P&L enrichment logic
  - `lib/formatters.ts` - Currency, date, number formatting
  - `lib/constants.ts` - Asset type labels, colors, symbol maps
  - `lib/types.ts` - TypeScript interfaces
- `prisma/` - Prisma schema and migrations
  - `prisma/schema.prisma` - Database schema (Investment, PriceAlert, PortfolioSnapshot)

### Asset Types Supported
- **Gold** — tracked in grams or troy ounces, price per troy ounce in USD
- **Silver** — tracked in grams or troy ounces, price per troy ounce in USD
- **Crypto** — BTC, ETH, and various altcoins via CoinGecko
- **US Stocks** — via yfinance (NYSE, NASDAQ symbols)
- **EGX Stocks** — Egyptian Exchange stocks via yfinance (e.g., `COMI.CA`)

### Important Patterns
- **App Router** — All pages use Next.js App Router (`app/` directory); API routes use `route.ts` handlers
- **Prisma + Neon** — Database accessed via Prisma client with `@prisma/adapter-neon` for serverless compatibility; singleton pattern in `lib/db.ts`
- **Server/Client split** — API routes and `lib/` run server-side; components in `components/` are client components (`"use client"`) where interactivity is needed
- **Price caching** — In-memory cache with 5-min TTL to avoid API rate limits
- **Dual currency** — All values computed in both USD and EGP using live exchange rate
- **Weight conversion** — Gold/silver seamlessly convert between grams and troy ounces
- **Vercel Cron** — Background tasks (alert checking daily at 8 AM UTC, daily snapshots at 11 PM UTC) handled via Vercel Cron Jobs defined in `vercel.json`. Alert frequency limited by Hobby plan — see PROJECT_DETAILS.md for future upgrade plan

---

## Configuration

### GitHub Token for Auto-Push
The GitHub token is stored in `.claude-token` (gitignored) for security.

**Setup:** Create a `.claude-token` file in the project root containing only the token.

**Usage:** When pushing to GitHub, Claude Code will read the token and configure:
```bash
TOKEN=$(cat .claude-token)
git remote set-url origin https://${TOKEN}@github.com/islamsaadany/InvestmentApp.git
```

### Database Credentials
Database credentials are stored in `.env` at the project root (gitignored) for security.

**Setup:** Create a `.env` file in the project root with your Neon credentials:
```env
DATABASE_URL=postgresql://neondb_owner:...@ep-xxx.us-east-1.aws.neon.tech/investmentdb?sslmode=require
```

**Get credentials from:**
- Neon Console: https://console.neon.tech → Your Project → Connection Details

### Build & Run Commands
```bash
npm install                        # Install dependencies
npx prisma generate                # Generate Prisma client
npx prisma migrate dev             # Run database migrations (development)
npm run dev                        # Start Next.js dev server (port 3000)
npm run build                      # Production build
npm run start                      # Start production server
npm run lint                       # Run ESLint
```

---

## Common Tasks

### UI Version Tracking (MANDATORY)
When making ANY UI change to a React component file:
1. **Before editing**, copy the current file to `ui-versions/<component-name>/<YYYY-MM-DD>_<short-description>.tsx`
2. **After editing**, the new version is the live file — the snapshot in `ui-versions/` is the rollback point
3. This allows reverting to any previous UI design when sessions lose context
4. **Folder structure example:**
   ```
   ui-versions/
     Dashboard/
       2026-04-09_initial-layout.tsx
     InvestmentForm/
       2026-04-09_original-form.tsx
   ```

### Before Committing
1. Verify the app builds without errors: `npm run build`
2. Review all changed files
3. Ensure no sensitive data is being committed (no `.env`, no API keys)

### Before Merging to Main (MANDATORY)
1. **Update PROJECT_DETAILS.md** - Document all new features, API endpoints, and significant changes
2. **Update this CLAUDE.md** - If any new patterns, rules, or workflows were established
3. **Verify all documentation is current** - Ensures nothing is lost and future sessions have full context

---

*Last Updated: April 11, 2026 — Migrated to Next.js 16 + Prisma 7 stack*
