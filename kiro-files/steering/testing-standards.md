---
inclusion: fileMatch
fileMatchPattern: "**/*.test.{ts,tsx}"
---

# Testing standards

Loaded automatically when a test file is open. Per the `node-conf-starter`
layout: Vitest unit/component tests in `server/tests/` and `client/tests/`;
Playwright e2e in `client/e2e/`. fast-check for property tests (100+ iterations).
Run `npm test` (both workspaces) and `npm run test:e2e`.

## Engine property tests (`server/tests/*.test.ts`)

- **P1 age calculation** — for any past/present date, age = calendar days and the
  band (Recent 0–7 / Moderate 8–30 / Aged > 30) is correct. _(REQ-02)_
- **P2 future-date rejection** — any future date throws. _(REQ-02)_
- **P3 priority assignment** — matches High → Medium → Low → default Medium, with
  High (amount > 10,000 OR Unauthorized) always winning. _(REQ-03)_
- **P4 action determinism** — exactly one action per input, never zero/multiple.
  _(REQ-04)_
- **P5 rule precedence** — action equals the first matching rule R1→R6. _(REQ-04)_
- **P6 validation completeness** — any incomplete subset of mandatory fields is
  rejected and each missing field named. _(REQ-01)_
- **P7 mock lookup** — ref in dataset → its record; ref not in dataset → `null`.
  _(REQ-06)_
- **Worked examples:** table-driven over design §3.5 cases A–G; each reproduces
  the documented priority + triggered rule + action.
- **Purity:** same input + same `today` evaluated twice → deeply-equal output.
- **Boundary cases (TC-044…051):** age 7/8/30/31 days → Recent/Moderate/Moderate/
  Aged; amount 999.99/1,000/10,000/10,000.01 → Low/Medium/Medium/High. Assert
  these exact boundaries.
- **Enum injection (TC-042/043):** `validate()` rejects an unsupported
  `paymentType`/`issueCategory` with a field error; triage is never reached.

## API integration tests (`server/tests/*.test.ts`, supertest)

- `GET /api/transactions/:reference`: hit returns the record; miss returns 404.
- `POST /api/disputes`: persists the case with correct priority/age; the
  recommendation endpoint returns the correct action for cases A–G, and
  `GET /api/disputes/:id` returns the stored case with `ruleEvaluations`.
- Future transaction date → 400; missing/invalid-enum field → 400 naming the field.
- Use a throwaway SQLite test DB; reset between tests. No network.

## Component tests (`client/tests/*.test.tsx`, Vitest + Testing Library)

- DisputeForm: required-field + future-date + positive-amount validation;
  dropdowns have the correct options; mock pre-populates Transaction_Status, and
  manual status selection appears when the reference has no match.
- RecommendationPanel: action label, priority + age badges, plain-language
  reason, and the full rule-evaluation list with the triggered rule highlighted.
- DisputeSummary + App: summary and recommendation render on one screen.

## End-to-end (`client/e2e/*.spec.ts`, Playwright)

- Submit a dispute through the UI → verify the recommended action, reasoning, and
  single-screen summary; confirm the case persisted via the API. Playwright starts
  the client dev server automatically; run `npm run test:e2e`.

## Conventions

- Arrange–Act–Assert; one behaviour per test; descriptive names
  (`recommends Escalate for unauthorized over 10,000`).
- No network, no timers, no uncontrolled randomness — inject `today` for age math
  (fast-check arbitraries are fine for property inputs).
- Comment each test with the REQ id / property number it covers.
- Keep the suite green: a task is not done until its tests pass
  (`gov-post-task-test`).
