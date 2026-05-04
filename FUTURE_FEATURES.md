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
