# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Scam-Ba is a web app that estimates how likely an online buying/selling situation is a scam. The user picks a role (two floating bubbles: buying or selling), describes the deal and taps quick "red flag" chips, and gets a 0–100 scam-risk score, a verdict (safe / caution / scam), matched signals, similar real-scam examples, and advice. The whole screen tints green→amber→red with the verdict.

## Commands

Run from the repo root. It's an **npm workspaces** monorepo (`frontend`, `backend`).

```bash
npm install                              # install all workspaces
npm run dev                              # run backend (watch) + frontend (Vite) together
npm run dev:backend                      # NestJS only, http://localhost:3000/api
npm run dev:frontend                     # Vite only, http://localhost:5173 (proxies /api -> :3000)
npm run build                            # build backend then frontend
npm test                                 # backend Jest suite
npm run lint                             # typecheck both workspaces (tsc --noEmit)
npm run db:up / npm run db:down          # start/stop Postgres+pgvector (only needed for real RAG)
```

Backend-scoped:

```bash
npm run build --workspace=backend
npm run test  --workspace=backend
npm run test  --workspace=backend -- heuristic-analyzer        # one file
npm run test  --workspace=backend -- -t "clear buying scam"    # one test by name
node backend/dist/main.js                                       # run a production build (honors PORT)
```

**Switch the analysis engine:** with no env, the backend uses the offline heuristic. Set `ANTHROPIC_API_KEY` (optionally `ANTHROPIC_MODEL`, default `claude-opus-4-8`) to switch to the Claude analyzer. `GET /api/health` reports which engine is active. See `.env.example`.

## Architecture — the big picture

### Analysis pipeline (backend, the part worth understanding)

`POST /api/analyze` → `AnalysisController` → `AnalysisService.analyze()`, which is a two-stage **retrieve-then-reason** pipeline with deliberate seams:

1. **Retrieve (RAG seam):** `KnowledgeService.retrieve(query, role)` returns the most relevant known scams. Today it's in-memory keyword overlap over a seed JSON; **this is the single place pgvector plugs in** — embed the query, ANN-search a `scam_stories` table. Nothing else changes.
2. **Reason (analyzer seam):** if `ANTHROPIC_API_KEY` is set, `ClaudeAnalyzer` (structured outputs via `output_config.format`) grounds Claude on the retrieved stories; otherwise `heuristicAnalyze()` runs. The heuristic is also the **fallback** if Claude throws, so the app always answers.

Both analyzers return the same `AnalyzeResult` (`backend/src/analysis/analysis.types.ts`).

The **heuristic scorer** (`heuristic-analyzer.ts` + `text.util.ts`) is a pure, deterministic function: it matches the user's text/chips against each knowledge-base entry's `redFlags` (`phraseMatches`), scores with diminishing returns plus a high-signal token lexicon, and clamps to 3–97. Verdict thresholds are `CAUTION_THRESHOLD` (30) and `SCAM_THRESHOLD` (66), exported and shared with the Claude analyzer. Because it's pure, it's unit-tested directly (`heuristic-analyzer.spec.ts`) — no Nest bootstrapping.

### Knowledge base

`backend/src/knowledge/scam-stories.seed.json` holds 28 scam-pattern records (`source: "composite-illustrative"` — grounded in real, well-documented marketplace scam types, not invented victims). Production should ingest **verified** real stories plus embeddings into Postgres/pgvector (`docker-compose.yml` provisions it). The frontend's quick-signal chips are deliberately worded to contain the same keywords as the records' `redFlags`, so chip selections reliably match.

### Frontend flow & design system

`App.tsx` is a 3-step state machine: `RoleBubbles` → `Questionnaire` → `Result`. The shell's background tint is derived from the verdict (`lib/verdict.ts`); `api.ts` calls `/api/analyze`; follow-up questions re-call the same endpoint with the prior turn folded into the description.

The visual language is **reused from `design_handoff_collectible_district/`** — a high-fidelity design handoff for an unrelated dark, Apple-calm *card marketplace*. That folder is **reference only, not the product**; its tokens are recreated in `frontend/src/styles/tokens.css`, and its `price/up` green (`#30D158`) / `price/down` red (`#FF453A`) became Scam-Ba's safe/scam colors.

### Contract is duplicated by hand

`frontend/src/types.ts` mirrors `backend/src/analysis/analysis.types.ts`. Keep them in sync when changing the response shape; a shared package is the natural next step.

## Gotchas (non-obvious, already hit and resolved)

- **TypeScript 6 is installed.** The backend `tsconfig.json` sets `"ignoreDeprecations": "6.0"` (for `moduleResolution: "node"`) and an explicit `"rootDir"`; `baseUrl` was removed. Don't reintroduce `baseUrl`.
- **Do not enable `incremental` in the backend tsconfig.** `nest build` runs `deleteOutDir`, but the incremental `tsconfig.build.tsbuildinfo` lives *outside* `dist` and survives it — so the next build sees "no changes" and emits an empty `dist` (no `main.js`). It's intentionally off.
- **`@types/*` are hoisted to the repo-root `node_modules/@types`.** The backend tsconfig therefore sets `"typeRoots": ["./node_modules/@types", "../node_modules/@types"]` and `"types": ["node", "jest"]`; without this, Jest globals (`describe`/`it`/`expect`) don't resolve.
- **Frontend needs `src/vite-env.d.ts`** (`/// <reference types="vite/client" />`) for `import.meta.env` and CSS side-effect imports to typecheck.
- **The seed JSON must reach `dist`.** `backend/nest-cli.json` has `assets: ["**/*.json"]`; `KnowledgeService` imports the JSON, so a missing copy breaks runtime.
- **Port 3000 / proxy.** Backend defaults to `PORT=3000` and the Vite dev proxy targets `:3000`. If 3000 is taken, set `PORT` and update the proxy target in `frontend/vite.config.ts` to match.
- **Dev-only advisory:** `npm audit` flags a moderate `js-yaml` DoS via the `jest` toolchain; the only fix is a breaking `ts-jest` downgrade, so it's intentionally left as-is.
