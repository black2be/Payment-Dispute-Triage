# Architecture — Payment Dispute Triage

**Role:** Architect
**Pattern:** 3-tier (Client → API → Data Store)

---

## System Diagram

```
┌──────────────── Client (React + Vite + Tailwind) ─────────────────────────────┐
│   DisputeForm   │   DisputeSummary   │   RecommendationPanel   │   App         │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │ REST / JSON (fetch)
                                ▼
┌──────────────────────── API Layer (Node.js + Express) ────────────────────────┐
│  routes → controllers → validation → triage()                                  │
│  Rules Engine (pure TypeScript, in-process)                                     │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │ Prisma Client
                                ▼
┌──────────────────────── Data Store (SQLite via Prisma) ───────────────────────┐
│   Customer   │   Transaction   │   DisputeCase   (seeded mock data)            │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Decisions

1. **Rules Engine is pure TypeScript** — called in-process by API controllers. No
   network hop, no Express/Prisma imports. Same input + same `today` → same output.

2. **SQLite via Prisma** — zero infrastructure, local file DB. No network egress.
   Future PostgreSQL migration = connection-string change only.

3. **Persistence satisfies REQ-05.5** — recommendations are stored even if the
   display is unavailable.

4. **No authentication** — single ops user assumed; auth would obscure the triage
   flow during evaluation.

5. **Named constants** — all thresholds (HIGH_AMOUNT, LOW_AMOUNT, AGE_RECENT_MAX,
   AGE_MODERATE_MAX) live in one file, adjustable without touching rule logic.

---

## Data Model

### Customer
| Field | Type |
|-------|------|
| id | Int (PK) |
| name | String |
| accountNumber | String (mock token, no real PCI) |

### Transaction
| Field | Type |
|-------|------|
| id | Int (PK) |
| customerId | FK → Customer |
| reference | String (unique) |
| paymentType | Enum: CARD_PAYMENT, EFT, INTERNAL_TRANSFER |
| amount | Float |
| currency | String (ZAR) |
| status | Enum: COMPLETED, PENDING, FAILED, REVERSED |
| transactionDate | DateTime |

### DisputeCase
| Field | Type |
|-------|------|
| id | Int (PK) |
| customerId | FK → Customer |
| transactionId | FK → Transaction |
| paymentType | Enum |
| issueCategory | Enum: DUPLICATE_DEBIT, FAILED_TRANSFER, MISSING_PAYMENT, UNAUTHORIZED_TRANSACTION |
| amount | Float |
| description | String (optional) |
| reportedAt | DateTime |
| ageDays | Int |
| ageBand | Enum: RECENT, MODERATE, AGED |
| priority | Enum: HIGH, MEDIUM, LOW |
| recommendedAction | Enum: RESOLVE_IMMEDIATELY, INVESTIGATE_FURTHER, ESCALATE, REFER_TO_ANOTHER_TEAM |
| triggeredRuleId | String |
| ruleEvaluations | JSON |
| status | Enum: OPEN, IN_REVIEW, RESOLVED, CLOSED |

---

## Layering Rule

```
engine/ imports NOTHING from Express, Prisma, or React.
Flow: client → API controllers → engine + Prisma
Controllers own all I/O. Engine owns all triage logic.
```

---

## Constraints

- Mock data only — no live integrations
- Rules-based only — no AI/ML
- No PII/PCI — mock identifiers only
- No browser storage — persistence via API + SQLite
- Deterministic — inject `today`, no Date.now() in engine
