---
inclusion: always
---

# Structure — Payment Dispute Triage

## Directory layout

```
payment-triage/
├── .kiro/
│   ├── steering/            # product, tech, structure, conventions, governance, *-standards
│   ├── specs/payment-triage/  # requirements.md, design.md, tasks.md
│   ├── hooks/               # *.kiro.hook automation
│   └── skills/              # reusable instruction packages
├── prisma/
│   ├── schema.prisma        # Customer, Transaction, DisputeCase + enums (design §2.2)
│   └── seed.ts              # 15–20 mock transactions + customers (no PII/PCI)
├── server/                  # Node.js + Express (TypeScript)
│   └── src/
│       ├── engine/          # PURE TypeScript — no Express, no Prisma, no React
│       │   ├── types.ts     # enums (code form) + DisputeInput, TriageResult, RuleEvaluation
│       │   ├── constants.ts # HIGH_AMOUNT, LOW_AMOUNT, AGE_RECENT_MAX, AGE_MODERATE_MAX
│       │   ├── ageCalculator.ts
│       │   ├── priorityCalculator.ts
│       │   ├── actionRecommender.ts  # rules R1…R6, first match wins
│       │   ├── validation.ts
│       │   └── triage.ts    # triage(input, today) -> TriageResult (orchestrator)
│       ├── routes/          # Express routers (/api/disputes, /api/transactions)
│       ├── controllers/     # validate → triage → Prisma persist
│       ├── db.ts            # Prisma client + lookupTransaction
│       └── app.ts           # Express app
├── client/                  # React + Vite + Tailwind
│   └── src/
│       ├── components/
│       │   ├── DisputeForm.tsx
│       │   ├── DisputeSummary.tsx
│       │   ├── RecommendationPanel.tsx
│       │   └── App.tsx      # submit → POST /api/disputes → single screen
│       ├── labels.ts        # enum code ↔ display label map (design §2.1)
│       ├── api.ts           # fetch wrappers for the REST endpoints
│       └── main.tsx
└── tests/
    ├── engine/*.test.ts     # age, priority, action (P1–P7), worked examples A–G
    ├── api/*.test.ts        # supertest integration
    └── components/*.test.tsx
```

## Layering rule (enforced by review)

`engine/` is pure and imports **nothing** from Express, Prisma, or React. Flow is
one way: `client → API (controllers) → engine + Prisma`. Controllers may use
Prisma; the engine never does. The engine is the only place triage logic lives.

## Naming conventions

- **Files:** components `PascalCase.tsx`; engine/data `camelCase.ts`; tests
  `*.test.ts(x)` mirroring the unit under test.
- **Types/enums:** `PascalCase` type names. **DB + API use the code form**
  (`RESOLVE_IMMEDIATELY`, `UNAUTHORIZED_TRANSACTION`, `COMPLETED`); the **UI maps
  to display labels** via `client/src/labels.ts` (`"Resolve Immediately"`, …).
  One mapping, used everywhere — never hand-format a label inline. (design §2.1)
- **Rule IDs:** stable as in `design.md` §3.3 (`R1-FAILED-RECENT` …
  `R6-DEFAULT`). Never renumber — tests and the rule-evaluation list depend on
  them.

## One concept per file

Each rule's predicate, label, and `reason` template live together in
`actionRecommender.ts`. Thresholds (`HIGH_AMOUNT`, `LOW_AMOUNT`,
`AGE_RECENT_MAX`, `AGE_MODERATE_MAX`) live only in `constants.ts` — never inline a
magic number.
