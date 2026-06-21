# Scam-Ba

Is it a scam? Describe an online buying or selling deal and Scam-Ba estimates how
likely it is to be a scam — grounded in patterns from real marketplace scams.

Pick a side (two floating bubbles: **buying** or **selling**), describe the
situation and tap any red flags that apply, and you get a 0–100 scam-risk score,
a verdict, the signals that stood out, similar known scams, and what to do next.
The whole screen tints green → amber → red with the verdict.

## Stack

- **Frontend** — React + Vite + TypeScript (`frontend/`)
- **Backend** — NestJS + TypeScript (`backend/`)
- **Analysis** — a retrieve-then-reason pipeline: a scam-story knowledge base
  (RAG; Postgres + pgvector in production) feeds either an offline heuristic
  scorer or Anthropic Claude.

Monorepo via npm workspaces.

## Quick start

```bash
npm install
npm run dev          # backend on :3000/api, frontend on :5173 (proxies /api)
```

Open http://localhost:5173. It runs fully offline with the deterministic
heuristic engine — no API key or database required.

To use the Claude-powered analyzer instead, copy `.env.example` to `.env` and set
`ANTHROPIC_API_KEY`. To back retrieval with real pgvector, `npm run db:up`.

See [CLAUDE.md](./CLAUDE.md) for architecture and development details.

## Note on the knowledge base

The seed scam patterns in `backend/src/knowledge/scam-stories.seed.json` are
**composite/illustrative** — grounded in real, well-documented marketplace scam
types, not real named victims. Replace them with verified stories before
presenting Scam-Ba as authoritative. Output is an estimate, not financial or
legal advice.
