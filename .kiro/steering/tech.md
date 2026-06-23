---
inclusion: always
---

# Tech — Payment Dispute Triage

> **Base template:** built on **`thandog/node-conf-starter`** — an npm-workspaces
> monorepo (`server/` + `client/`). Clone the starter, drop `.kiro/` in, replace
> the sample endpoints, and build into its structure. The stack below matches the
> starter exactly; the Rules Engine (`server/src/engine/`) is our addition — a
> pure TypeScript module called in-process by the API. Steering is the source of
> truth Kiro follows — update this file first if the stack changes.

## Stack (matches the starter)

| Concern | Choice | Notes |
| --- | --- | --- |
| Repo | **npm workspaces monorepo** | root `package.json` + root scripts; `npm install` sets up both apps |
| Runtime | **Node.js 22 LTS** (pinned via `.nvmrc`), npm 10+ | `nvm use` before install |
| Language | **TypeScript** (strict) | shared strict `tsconfig.json` base; server is **ESM / NodeNext** |
| UI framework | **React 18** (function components + hooks) | `client/` |
| Build/dev (client) | **Vite** | dev server on **5173**, proxies `/api/*` → backend |
| Styling | **Tailwind CSS** | Fixed action/priority/age palette per design §5.4 |
| API | **Node.js + Express** (TypeScript, ESM) | `server/`, listens on **3001**; `routes/` + `middleware/` |
| ORM / DB | **Prisma + SQLite** | schema in **`server/prisma/`**; DB file + generated client git-ignored; no network egress |
| Rules engine | **Pure TS module** | `server/src/engine/`; no Express/Prisma imports |
| Unit/API tests | **Vitest** + Testing Library + **supertest** | per workspace: `server/tests/`, `client/tests/` |
| E2E tests | **Playwright** | `client/e2e/`; `npm run test:e2e` (also an approved MCP) |
| Property tests | **fast-check** | 100+ iterations per property (P1–P7) |
| Lint/format | **ESLint** (flat `eslint.config.mjs`) + Prettier | `npm run lint` / `npm run format` |
| State | React state only (`useState`/`useReducer`) | No global store needed |

## Root scripts (run from repo root, per the starter)

`npm run dev` (both apps) · `npm run build` · `npm start` · `npm test` ·
`npm run test:e2e` · `npm run lint` · `npm run format`. Per-workspace: append
`--workspace=server` or `--workspace=client`. DB: `npm run db:generate` /
`db:migrate` `--workspace=server`.

## Hard constraints

- **No live integrations.** All "integrations" (core banking, card processing)
  are **mock seed data in SQLite**. The DB is a local file — no network egress.
  No `fetch`/`axios` to real external services.
- **Prisma is a library, NOT an MCP.** Do not add a Prisma MCP to `mcp.json`. The
  approved MCP list is fixed (sequential-thinking, serena, aws-mcp,
  atlassian-rovo-mcp, aws-docs, playwright); `gov-mcp-guard` blocks others.
- **Minimal dependencies.** Every dep is scanned by `gov-cve-build-gate` (malware
  blocks, CRITICAL/HIGH warn). Justify additions in a PR.
- **No browser storage** (`localStorage`/`sessionStorage`) — persistence lives in
  SQLite via the API.
- **Node + package manager:** use the repo's lockfile; install only from the
  approved Nexus proxy, never ad-hoc `npx` of untrusted packages.

## Decision path purity

The rules engine must be a **pure, deterministic** module: same dispute input →
same recommendation. No clock reads inside rule evaluation except a single
injected "today" for age-band math (pass it in, don't read `Date.now()` deep in
the logic) so tests are stable.
