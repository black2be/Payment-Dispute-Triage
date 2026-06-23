---
inclusion: always
---

# Structure — Payment Dispute Triage

## Directory layout (npm-workspaces monorepo — `node-conf-starter`)

Build into the starter's structure. `.kiro/` (and the `kiro-files/` mirror) sit at
the repo root alongside `server/` and `client/`.

```
Payment-Dispute-Triage/
├── .kiro/                       # steering, specs/payment-triage, hooks, skills
├── server/                      # Express backend (TypeScript, ESM / NodeNext)
│   ├── src/
│   │   ├── index.ts             # server entry point (was app.ts)
│   │   ├── routes/              # Express routers (/api/disputes, /api/transactions, /api/customers, /health)
│   │   ├── middleware/          # error handling, validation wiring
│   │   ├── engine/              # PURE TypeScript — no Express, no Prisma, no React
│   │   │   ├── types.ts         # enums (code form) + DisputeInput, TriageResult, RuleEvaluation
│   │   │   ├── constants.ts     # HIGH_AMOUNT, LOW_AMOUNT, AGE_RECENT_MAX, AGE_MODERATE_MAX
│   │   │   ├── ageCalculator.ts
│   │   │   ├── priorityCalculator.ts
│   │   │   ├── actionRecommender.ts  # rules R1…R6, first match wins
│   │   │   ├── validation.ts
│   │   │   └── triage.ts        # triage(input, today) -> TriageResult (orchestrator)
│   │   └── db.ts                # Prisma client + lookupTransaction
│   ├── prisma/
│   │   ├── schema.prisma        # Customer, Transaction, DisputeCase + enums (design §2.2)
│   │   └── seed.ts              # 15–20 mock transactions + customers (no PII/PCI)
│   ├── tests/                   # Vitest: engine (P1–P7, worked examples A–G) + supertest API
│   └── tsconfig.json            # emits runnable JS to dist/ (NodeNext)
├── client/                      # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── DisputeForm.tsx
│   │   │   ├── DisputeSummary.tsx
│   │   │   ├── RecommendationPanel.tsx
│   │   │   └── App.tsx          # submit → POST /api/disputes → GET /:id/recommendation → single screen
│   │   ├── labels.ts            # enum code ↔ display label map (design §2.1)
│   │   ├── api.ts               # fetch wrappers (Vite proxies /api/* → :3001)
│   │   └── main.tsx
│   ├── tests/                   # Vitest + Testing Library component tests
│   ├── e2e/                     # Playwright end-to-end tests
│   └── tsconfig.json            # type-check only (Vite bundles)
├── tsconfig.json                # shared, strict compiler base
├── .nvmrc                       # Node 22 LTS
├── eslint.config.mjs            # flat ESLint config
├── .prettierrc.json / .prettierignore
├── .gitignore                   # node_modules, dist, *.db, .DS_Store
└── package.json                 # npm workspaces + root scripts
```

## Layering rule (enforced by review)

`engine/` is pure and imports **nothing** from Express, Prisma, or React. Flow is
one way: `client → server routes/middleware → engine + Prisma`. Routes/middleware
may use Prisma; the engine never does. The engine is the only place triage logic
lives.

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
