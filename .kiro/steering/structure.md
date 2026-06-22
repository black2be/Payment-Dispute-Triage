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
├── src/
│   ├── engine/              # pure TypeScript logic (no React, no I/O)
│   │   ├── types.ts         # enums + DisputeInput, TriageResult, RuleEvaluation, MockTransaction
│   │   ├── constants.ts     # HIGH_AMOUNT, LOW_AMOUNT, AGE_RECENT_MAX, AGE_MODERATE_MAX
│   │   ├── ageCalculator.ts # calculateAge, classifyAgeBand
│   │   ├── priorityCalculator.ts # determinePriority
│   │   ├── actionRecommender.ts  # recommend() — rules R1…R6, first match wins
│   │   ├── validation.ts    # validate() — field-level errors
│   │   └── triage.ts        # triage(input, today) -> TriageResult (orchestrator)
│   ├── data/
│   │   └── mockTransactions.ts  # 15–20 records + MockDataService.lookupTransaction
│   ├── components/          # React components
│   │   ├── DisputeForm.tsx
│   │   ├── DisputeSummary.tsx
│   │   ├── RecommendationPanel.tsx
│   │   └── App.tsx          # orchestration, single screen
│   └── main.tsx
├── tests/
│   ├── engine/*.test.ts     # age, priority, action (Properties 1–7), worked examples A–G
│   └── components/*.test.tsx
└── index.html
```

## Layering rule (enforced by review)

`engine/` and `data/` must **not** import from `components/`. React imports flow
one way: `components → engine/data`. The engine never imports React.

## Naming conventions

- **Files:** components `PascalCase.tsx`; engine/data `camelCase.ts`; tests
  `*.test.ts(x)` mirroring the unit under test.
- **Types/enums:** `PascalCase` type names; **string-union values verbatim** from
  the glossary (`'Resolve Immediately'`, `'Aged'`, `'Unauthorized Transaction'`,
  `'Completed'`) so engine, data, UI, and tests align.
- **Rule IDs:** stable as in `design.md` §3.3 (`R1-FAILED-RECENT` …
  `R6-DEFAULT`). Never renumber — tests and the rule-evaluation list depend on
  them.

## One concept per file

Each rule's predicate, label, and `reason` template live together in
`actionRecommender.ts`. Thresholds (`HIGH_AMOUNT`, `LOW_AMOUNT`,
`AGE_RECENT_MAX`, `AGE_MODERATE_MAX`) live only in `constants.ts` — never inline a
magic number.
