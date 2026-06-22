---
inclusion: manual
---

# API standards (load with #api-standards)

The API is **Node.js + Express**, REST/JSON, per `design.md` §4. The Rules Engine
runs **in-process** inside controllers — no separate service, no network hop.

## Endpoints (do not drift from design §4)

| Method + path | Purpose | REQ |
| --- | --- | --- |
| `GET /api/transactions/:reference` | Mock lookup → `200 MockTransaction` or `404` | REQ-06 |
| `POST /api/disputes` | Validate → `triage()` → persist DisputeCase → `201 { caseId, ...TriageResult }` | REQ-01/04/05 |
| `GET /api/disputes/:id` | Stored case incl. `ruleEvaluations` + reason | REQ-05/07 |
| `GET /api/disputes` | List stored cases | REQ-05.5 |
| `GET /api/health` | Liveness | — |

## Rules

- **Controller flow:** `validate(input)` → if errors `400 { errors:[{field,message}] }`
  → `triage(input, today)` → persist via Prisma → return result. Never throw raw
  strings to the client.
- **Future transaction date → `400`** (REQ-02.2). Missing mandatory field → `400`
  naming the field (REQ-01.3).
- **Enums on the wire use the code form** (`RESOLVE_IMMEDIATELY`, …); the client
  maps to labels. Amounts are ZAR numbers — never format currency in the API.
- The engine is **pure** — controllers own all I/O (Prisma, req/res). The engine
  imports neither Express nor Prisma.
- **No network egress.** SQLite is a local file; all "integrations" are seed data.
- **Determinism:** `POST /api/disputes` with identical input + same `today`
  yields the same recommendation.
- Validate and sanitise all request input at the controller boundary.
