# Claude Code Instructions for Strategy-Formulation

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
- **Always test the build before proceeding** - Run `npm run build` or `npx tsc --noEmit` to verify no TypeScript errors
- **Fix type errors across the outcome** - Don't leave TypeScript errors unresolved
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
- **ALWAYS log new features** - When implementing a new feature or functionality, add it to the Features Log page
- **Location:** `app/admin/features-log/page.tsx` - Update the `INITIAL_FEATURES` array
- **Required fields for each feature:**
  - `id`: Unique kebab-case identifier
  - `name`: Short descriptive name
  - `description`: What the feature does
  - `category`: One of 'Foundation' | 'Analysis' | 'Strategy' | 'Settings' | 'UI' | 'Chat' | 'Export' | 'Admin'
  - `dateCreated`: YYYY-MM-DD format
  - `filesModified`: Array of file paths that were changed
  - `tested`: false (default)
  - `status`: 'Not Tested' (default)
  - `notes`: '' (empty, user will fill)
- **This helps the user track and test all features we build**

### 7. Change Review Protocol (Plan Mode)
When entering Plan Mode for a feature or significant change, start by asking the user:

> **BIG CHANGE or SMALL CHANGE?**
> - **BIG CHANGE:** Work through review interactively, one section at a time, with up to 4 top issues per section.
> - **SMALL CHANGE:** Work through review interactively, but limit to 1 key issue per section.

Then review the change through these 4 lenses **in order**, pausing for user feedback after each:

#### Lens 1: Architecture
- Component boundaries and responsibility separation
- Data flow between client/server/API/database (Next.js App Router patterns)
- Prisma query patterns and database access (watch for N+1 queries)
- API route design and security (auth, data validation at boundaries)

#### Lens 2: Code Quality
- Code organization and module structure
- Repeated logic that should be extracted (but only if used 3+ times — avoid premature abstraction)
- Error handling gaps and missing edge cases (call these out explicitly)
- Technical debt being introduced or resolved

#### Lens 3: Testing & Verification
- Does `npx tsc --noEmit` pass?
- Does `npm run build` succeed?
- Are there edge cases in the logic that could break silently?
- For data-driven features: does it handle empty states, nulls, and unexpected input?

#### Lens 4: Performance
- Database query efficiency (Prisma includes, selects, unnecessary fetches)
- Component re-render concerns (large state objects, missing memoization)
- Bundle size impact (large imports, client-side vs server-side boundaries)
- Caching opportunities (static data, repeated API calls)

#### Presenting Issues
For each issue found:
- **Number issues** (1, 2, 3...) and **letter the options** (A, B, C...)
- Always include a "Do nothing" option where reasonable
- For each option: state the effort, risk, and maintenance impact in one line
- **Put the recommended option first** and mark it "(Recommended)"
- Use AskUserQuestion with clearly labeled issue numbers and option letters so the user can respond unambiguously

**Example format:**
```
Issue 1: Component X fetches data on every render
  A) Add useMemo + dependency array (Recommended) — Low effort, no risk
  B) Move fetch to server component — Medium effort, requires restructure
  C) Do nothing — No effort, but will cause lag on large datasets
```

**CRITICAL:** This protocol supplements, not replaces, the alignment rules in sections 1-1c. The review happens *before* any code is written.

---

## Project Context

### Technology Stack
- **Framework:** Next.js 15 (App Router) + React 19
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **AI:** Google Gemini 2.5 Flash
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel

### Key Directories
- `app/` - Next.js pages and API routes
- `lib/ai/prompts/` - AI instruction files (hard-coded for consistency)
- `app/knowledge/` - Knowledge Hub pages
- `components/` - Reusable React components
- `prisma/` - Database schema

### Important Patterns
- **Hard-coded AI Instructions** - AI prompts are intentionally hard-coded in `lib/ai/prompts/instructions/` for consistency across all consultants
- **Knowledge Hub Alignment** - Knowledge pages must stay aligned with AI instructions
- **AI Instructions Page** - `app/knowledge/ai-instructions/page.tsx` displays the coded instructions

---

## Configuration

### GitHub Token for Auto-Push
The GitHub token is stored in `.claude-token` (gitignored) for security.

**Setup:** Create a `.claude-token` file in the project root containing only the token.

**Usage:** When pushing to GitHub, Claude Code will read the token and configure:
```bash
TOKEN=$(cat .claude-token)
git remote set-url origin https://${TOKEN}@github.com/islamsaadany/Strategy-Formulation.git
```

### Database Credentials for Local Development
Database credentials are stored in `.env.local` (gitignored) for security.

**Setup:** Create a `.env.local` file in the project root with your Neon credentials:
```env
DATABASE_URL=postgresql://neondb_owner:...@ep-silent-forest-....us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:...@ep-silent-forest-....us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Get credentials from:**
- Neon Console: https://console.neon.tech → Your Project → Connection Details
- Or copy from Vercel: Project Settings → Environment Variables

**Usage:** Claude Code can run database operations:
```bash
npx prisma db push      # Sync schema to database
npx prisma migrate deploy  # Run migrations
npx prisma studio       # Open database GUI
```

### Build Commands
```bash
npm run dev          # Start development server
npm run build        # Full build (requires DB connection)
npx tsc --noEmit     # TypeScript check only (no DB needed)
```

---

## Common Tasks

### UI Version Tracking (MANDATORY)
When making ANY UI change to a component file:
1. **Before editing**, copy the current file to `ui-versions/<component-name>/<YYYY-MM-DD>_<short-description>.tsx`
2. **After editing**, the new version is the live file — the snapshot in `ui-versions/` is the rollback point
3. This allows reverting to any previous UI design when sessions lose context
4. **Folder structure example:**
   ```
   ui-versions/
     CompetitiveGuidedView/
       2026-02-13_original-factor-cards.tsx
       2026-02-13_restored-gap-analysis.tsx
     CorporateGuidedView/
       2026-02-13_zone-fix.tsx
   ```

### Before Committing
1. Run `npx tsc --noEmit` to check for TypeScript errors
2. Review all changed files
3. Ensure no sensitive data is being committed

### Bug Fixing Workflow (MANDATORY)
When fixing bugs from the Testing Log/Bugs tab:

1. **Read bugs** from API: `GET https://ffntstrategycopilot.vercel.app/api/claude/features?type=bugs&key=claude-dev-key-2026`
2. **Fix the code** - Make necessary changes
3. **Commit & push** - Standard git workflow
4. **Resolve bugs via API** - For each bug fixed, call:
   ```bash
   curl -X PATCH "https://ffntstrategycopilot.vercel.app/api/claude/features?key=claude-dev-key-2026" \
     -H "Content-Type: application/json" \
     -d '{"id": "<bug-id>", "status": "RESOLVED"}'
   ```

**This triggers the workflow:** Bug resolved → Feature returns to Testing Log for re-testing

**CRITICAL:** Do NOT skip step 4. Bugs must be resolved via API to complete the workflow cycle.

**For standalone bugs (featureId is null):**
When a bug was created from scratch (not from Testing Log) and has no linked feature:
1. Fix the bug as normal
2. **Create a new feature entry** in `INITIAL_FEATURES` array in `app/admin/features-log/tabs/TestingLogTab.tsx`
3. Resolve the bug via API
4. The new feature will appear in Testing Log for user to verify

### Before Merging to Main (MANDATORY)
1. **Update PROJECT_DETAILS.md** - Document all new features, API endpoints, and significant changes
2. **Update this CLAUDE.md** - If any new patterns, rules, or workflows were established
3. **Verify all documentation is current** - Ensures nothing is lost and future sessions have full context

### After Making Changes to AI Instructions
1. Update the corresponding Knowledge Hub page
2. Update the AI Instructions display page if needed
3. Verify alignment across all three locations

### When Modifying the Capabilities Framework
- Files to keep aligned:
  - `lib/ai/prompts/instructions/capabilities.ts` (source of truth)
  - `lib/ai/prompts/strategies/capabilities.ts` (prompt builder)
  - `app/knowledge/capabilities/page.tsx` (Knowledge Hub)
  - `app/knowledge/ai-instructions/page.tsx` (display page)

### Periodic Alignment Check (Proactive)
**When:** Periodically during sessions, especially before merging to main or when user requests.

**Purpose:** Ensure Knowledge Hub pages and AI Instructions page stay synchronized with the source code.

**What to compare:**
1. **AI Instructions Code** (source of truth) - `lib/ai/prompts/instructions/`
2. **AI Instructions Page** (display page) - `app/knowledge/ai-instructions/page.tsx`
3. **Knowledge Hub Pages** - `app/knowledge/*/page.tsx`

**Key Areas to Check:**
- **Capabilities Framework:**
  - Fundamental distinction (reactive vs proactive)
  - Input sources (5), Categories (6), Structure elements (7)
  - Naming guidelines, Count recommendations, Discipline priorities
- **Other Strategic Frameworks:**
  - IFE/EFE scoring criteria, IE Matrix definitions
  - Competitive strategy factors, Directional strategy categories
  - Any methodology or framework content

**Process:**
1. Read the AI Instructions code files
2. Compare with what's displayed on the AI Instructions page
3. Compare with what's documented in Knowledge Hub
4. **Report discrepancies to user** with:
   - What differs
   - Where it differs (which files)
   - Recommendation for alignment
5. **Wait for user direction** before making changes

**CRITICAL:** Do NOT auto-fix discrepancies. Always align with user first on how to resolve.

---

## Current Framework Summary

### Capabilities 3-Option Framework
- **Option 1: Core Capabilities** - REACTIVE (gap-closing enablers)
- **Option 2: Internal Pillars** - PROACTIVE (transformation initiatives)
- **Option 3: Cross-Cutting Enablers** - Support layer

### Unified Structure (Both Options)
- 5 Input Sources
- 6 Categories
- 7-Element Structure (Name, Description, Category, Key Measures, Key Tactics, Owner, Rationale)

---

*Last Updated: January 2026*
