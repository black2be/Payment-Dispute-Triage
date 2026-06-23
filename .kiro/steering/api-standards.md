---
inclusion: manual
---

# API standards (load with #api-standards)

The API is **Node.js + Express** (TypeScript, **ESM/NodeNext**), REST/JSON, per
`design.md` §4, in the `node-conf-starter` `server/` workspace. Code lives in
`server/src/routes/` + `server/src/middleware/`; the Rules Engine
(`server/src/engine/`) runs **in-process** — no separate service, no network hop.
The server listens on **port 3001**; the Vite dev client proxies `/api/*` to it.
Keep the starter's `/health` and `/api/health` liveness endpoints.

## Endpoints (do not drift from design §4)

| Method + path | Purpose | REQ |
| --- | --- | --- |
| `GET /api/customers` · `/:id` | Mock customers (dropdowns) | REQ-01/06 |
| `GET /api/transactions` · `/:reference` | List / lookup-to-pre-populate | REQ-01/06 |
| `POST /api/disputes` | Validate → compute age/ageBand/priority → persist (`OPEN`) → `201` | REQ-01/02/03 |
| `GET /api/disputes` · `/:id` | List (filters) / stored case | REQ-05.5/07 |
| `GET /api/disputes/:id/recommendation` | Run the 6 OM rules (decoupled) → action + reason + `ruleEvaluations` + priority + ageBand | REQ-04/05 |
| `PATCH /api/disputes/:id/status` *(extension)* | Lifecycle OPEN/IN_REVIEW/RESOLVED/CLOSED | beyond REQ |
| `GET /api/health` | Liveness | — |

**Canonical vocabulary is OM:** four actions (Resolve Immediately, Investigate
Further, Escalate, Refer to Another Team), Transaction_Status `COMPLETED` (not
`SETTLED`), dispute age from the **transaction date**. The uploaded api-spec's
5 issue types / 7 actions / age-from-submission are **not** used — only its
endpoint additions were borrowed. Recommendation is **decoupled** from creation
(separate GET), satisfying REQ-05.5.

## Rules

- **Route handler flow:** `validate(input)` → if errors `400 { errors:[{field,message}] }`
  → `triage(input, today)` → persist via Prisma → return result. Error-handling
  **middleware** formats failures; never throw raw strings to the client.
- **Future transaction date → `400`** (REQ-02.2). Missing mandatory field → `400`
  naming the field (REQ-01.3).
- **Enums on the wire use the code form** (`RESOLVE_IMMEDIATELY`, …); the client
  maps to labels. Amounts are ZAR numbers — never format currency in the API.
- The engine is **pure** — routes/middleware own all I/O (Prisma, req/res). The
  engine imports neither Express nor Prisma.
- **No network egress.** SQLite is a local file; all "integrations" are seed data.
- **Determinism:** `POST /api/disputes` with identical input + same `today`
  yields the same recommendation.
- Validate and sanitise all request input at the controller boundary.
