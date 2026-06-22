---
inclusion: always
---

# Tech — Payment Dispute Triage

> **Stack decision (changeable):** chosen to match the governance hook set
> (ESLint, Vitest, TypeScript strict) and a client-side, mock-only prototype.
> If the team prefers plain HTML/JS, update this file first — steering is the
> source of truth Kiro follows.

## Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Language | **TypeScript** (strict) | `strict: true`, no implicit `any` |
| UI framework | **React 18** (function components + hooks) | No class components |
| Build/dev | **Vite** | Fast dev server, static build output |
| Styling | **Tailwind CSS** | Utility classes; fixed badge/chip palette per design §5.3 |
| Tests | **Vitest** + Testing Library | Unit + integration tests |
| Property tests | **fast-check** | 100+ iterations per property (Properties 1–7) |
| Lint/format | **ESLint** + Prettier | Enforced on save via hooks |
| Styling | Tailwind **or** CSS Modules (TBD) | Fixed action/priority/age palette per design §5.5 |
| State | React state only (`useState`/`useReducer`) | No global store needed at this size |
| Backend | **None** | Client-side only; mock dataset bundled; engine is pure functions |

## Hard constraints

- **No network/runtime data calls.** The "API" in `design.md` is implemented as
  in-memory functions with identical shapes. No `fetch`/`axios` to real services.
- **No new MCP servers** beyond the AI SDLC approved list (sequential-thinking,
  serena, aws-mcp, atlassian-rovo-mcp, aws-docs, playwright). `gov-mcp-guard`
  enforces this.
- **Minimal dependencies.** Every dependency is scanned by `gov-cve-build-gate`
  (malware blocks, CRITICAL/HIGH warn). Prefer the standard library and the stack
  above; justify any addition in a PR.
- **No browser storage** (`localStorage`/`sessionStorage`) — session-only memory.
- **Node + package manager:** use the repo's lockfile; install only from the
  approved Nexus proxy, never ad-hoc `npx` of untrusted packages.

## Decision path purity

The rules engine must be a **pure, deterministic** module: same dispute input →
same recommendation. No clock reads inside rule evaluation except a single
injected "today" for age-band math (pass it in, don't read `Date.now()` deep in
the logic) so tests are stable.
