---
inclusion: always
---

# Tech — Payment Dispute Triage

> **Architecture:** 3-tier per `architecture.md` (Doc 1). React + Vite + Tailwind
> client → Node/Express API → SQLite + Prisma store. The Rules Engine is a pure
> TypeScript module called in-process by the API. Steering is the source of truth
> Kiro follows — update this file first if the stack changes.

## Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Language | **TypeScript** (strict) | `strict: true`, no implicit `any` — client + server |
| UI framework | **React 18** (function components + hooks) | No class components |
| Build/dev (client) | **Vite** | Fast dev server |
| Styling | **Tailwind CSS** | Fixed action/priority/age palette per design §5.4 |
| API | **Node.js + Express** (TypeScript) | REST/JSON; routes → controllers → triage |
| ORM / DB | **Prisma + SQLite** | Local file DB; seed scripts; no network egress |
| Rules engine | **Pure TS module** | In-process in the API; no Express/Prisma imports |
| Tests | **Vitest** + Testing Library + **supertest** | Unit + API integration |
| Property tests | **fast-check** | 100+ iterations per property (P1–P7) |
| Lint/format | **ESLint** + Prettier | Enforced on save via hooks |
| State | React state only (`useState`/`useReducer`) | No global store needed |

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
