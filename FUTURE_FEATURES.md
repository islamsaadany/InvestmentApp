# Future Features

> Tracked but not yet implemented. Each entry should describe the user-facing intent, the rough scope, and any prerequisites.

---

## Average Down Analyzer — AI-Powered Mode

**Current state:** Rule-based analyzer is shipped (May 4, 2026). It computes percentage below avg cost / lowest purchase per asset and classifies each position into buckets (`below_lowest`, `good_dip`, `deep_dip`, `small_dip`, `above_avg`).

**Future enhancement:** Add an "Get AI opinion" button on each flagged recommendation card that:
1. Sends the position context (purchase history, current price, recent price action, asset type, sector) to Claude via `/api/expert/chat` with a dedicated system prompt.
2. Returns a contextual recommendation that goes beyond the rule-based math — e.g., flags broken thesis, suggests position-size limits, factors in macro environment.
3. Streams response into a side-panel within the analyzer modal (or expandable card section).

**Why deferred:** Rule-based is fast, free, and covers the 80% case. AI version costs tokens per analysis and adds latency. Keep the rule-based default; layer AI on demand.

**Prerequisites:**
- Reuse the multi-mode prompt loader from `lib/expert-prompts.ts` — add a new mode `"averager"` with its own system prompt + KB.
- Decide whether the AI call should batch all flagged positions or run per-position.

**Files to touch when implementing:**
- `lib/expert-prompts.ts` — add `"averager"` mode + load corresponding files
- `lib/expert/averager-system-prompt.txt` — new
- `lib/expert/averager-kb.txt` — new (could reuse the US Stocks / Crypto KBs depending on asset type)
- `components/dashboard/AverageDownAnalyzerModal.tsx` — add per-card "Get AI opinion" button + streaming panel
- `app/api/expert/chat/route.ts` — already supports modes, just route by `"averager"`

---

## Expert Chat — Database-Backed History (cross-device sync)

**Current state:** Chat history persists per browser via `localStorage` (shipped May 4, 2026). Each Expert mode (Options / US Stocks / Crypto) has its own history; survives navigation and reload. Limit: tied to the browser — clearing site data or switching device wipes it.

**Future enhancement:** Persist chat history server-side so it follows the user across devices and survives `localStorage` clears.

**Why deferred:** localStorage covers the 95% case (single-user app, single browser). DB persistence adds schema, migration, a load API call on mount, and accidental-leak surface for sensitive prompts.

**Prerequisites:**
- New Prisma model `ChatMessage` (or `ChatSession` + `ChatMessage`) with fields: `id`, `mode`, `role`, `content`, `createdAt`.
- Migration plus indexes on `(mode, createdAt)`.
- API routes: `GET /api/expert/history?mode=...`, `POST /api/expert/history` (append), `DELETE /api/expert/history?mode=...`.
- Decide retention policy (cap at N messages or N days?).

**Files to touch:**
- `prisma/schema.prisma` — add the model
- `app/api/expert/history/route.ts` — new
- `components/expert/ChatInterface.tsx` — swap localStorage hooks for fetch-on-mount + append-on-message
- Keep localStorage as an offline cache (option 1C in the original plan)

---

## Expert Chat — Background Generation (survives leaving the app)

**Current state:** When the user navigates away from `/expert` mid-stream, the React component unmounts and the in-flight stream is aborted. Partial assistant tokens received before unmount are saved to localStorage; the user can retry or continue. Tab-switching *within* `/expert` (Options ↔ US Stocks ↔ Crypto) keeps streams alive because all three panes stay mounted.

**Future enhancement:** Allow the AI agent to keep generating even after the user closes the browser tab, then show the completed answer when they return.

**Why deferred:** Complex. The streaming relay needs server-side persistence of every chunk, idempotent reconnection logic on the client, and a way to attribute streams to a session/user without auth.

**Two implementation paths:**

- **Path B — Client-side keep-alive:** Move the fetch into a singleton outside React lifecycle so it survives `/expert` unmount. Effort: ~1 hr. Limit: still dies when the browser tab closes.
- **Path C — Server-side stream relay (full solution):** Server saves streamed tokens to DB as they arrive; client reconnects to a `GET /api/expert/chat/stream/{id}` endpoint and replays from where it left off. Effort: ~3-4 hrs. Survives full browser close, network drops, and device switches.

**Prerequisites for Path C:**
- The DB persistence work above (depends on `ChatMessage` model)
- A `streamId` column on the assistant message and an "is-complete" flag
- SSE or text-stream endpoint to resume an in-flight stream
- AbortController plumbing so a cancelled stream stops generating tokens server-side

---
