# Test Plan & Traceability — Payment Dispute Triage

**Feature:** `payment-triage`
**Owner role:** Quality Engineer
**Source:** uploaded `Test Cases_Triage.docx` (TC-001–TC-051), verified against
`requirements.md` (REQ-01–07) and `design.md`.
**Status:** Aligned — all 51 cases map to the OM canonical spec.

The test cases were authored against the OM requirements, so they align with the
current spec. This file records the mapping and where each case is automated.

---

## Coverage by requirement

| REQ | Test cases | Automated in |
| --- | --- | --- |
| REQ-01 Capture | TC-001…010, 042, 043 | `validation.test.ts` (P6), `DisputeForm.test.tsx`, API integration |
| REQ-02 Age | TC-011…015, 044…047 | `ageCalculator.test.ts` (P1/P2 + boundaries) |
| REQ-03 Priority | TC-016…022, 048…051 | `priorityCalculator.test.ts` (P3 + boundaries) |
| REQ-04 Action | TC-023…030 | `actionRecommender.test.ts` (P4/P5 + worked examples A–G) |
| REQ-05 Display | TC-031…035 | `RecommendationPanel.test.tsx`, recommendation-endpoint test |
| REQ-06 Mock data | TC-036…039 | `lookupTransaction` (P7), API integration |
| REQ-07 Summary | TC-040, 041 | `DisputeSummary.test.tsx`, end-to-end |

---

## Detailed mapping

| TC | Title (abbrev.) | REQ / AC | Notes |
| --- | --- | --- | --- |
| TC-001 | Capture all required details | REQ-01.1 | |
| TC-002 | Validate mandatory on submit | REQ-01.2 | |
| TC-003 | Missing customer name | REQ-01.3 | |
| TC-004 | Missing transaction reference | REQ-01.3 | |
| TC-005 | Missing transaction date | REQ-01.3 | |
| TC-006 | Missing transaction amount | REQ-01.3 | |
| TC-007 | Missing Payment_Type | REQ-01.3 | |
| TC-008 | Missing Issue_Category | REQ-01.3 | |
| TC-009 | Restrict Payment_Type options | REQ-01.4 | Card Payment / EFT / Internal Transfer |
| TC-010 | Restrict Issue_Category options | REQ-01.5 | 4 categories |
| TC-011 | Age from transaction date | REQ-02.1 | from **transaction date** (not submission) |
| TC-012 | Reject future date | REQ-02.2 | |
| TC-013 | Recent band | REQ-02.3 | 0–7 |
| TC-014 | Moderate band | REQ-02.3 | 8–30 |
| TC-015 | Aged band | REQ-02.3 | >30 |
| TC-016 | High for amount > 10,000 | REQ-03.2 | |
| TC-017 | High for Unauthorized | REQ-03.2 | confirms unauthorised = HIGH |
| TC-018 | High precedence over others | REQ-03.1 | |
| TC-019 | Medium — Moderate, 1k–10k | REQ-03.3 | |
| TC-020 | Medium — Aged, 1k–10k | REQ-03.3 | |
| TC-021 | Low — Recent, < 1,000 | REQ-03.4 | |
| TC-022 | Default Medium | REQ-03.5 | |
| TC-023 | Resolve — Failed + Recent | REQ-04.1 (R1) | |
| TC-024 | Investigate — Dup + Completed | REQ-04.2 (R2) | |
| TC-025 | Escalate — Unauth > 10,000 | REQ-04.3 (R3) | |
| TC-026 | Investigate — Missing + EFT | REQ-04.4 (R4) | |
| TC-027 | Escalate — Aged + High | REQ-04.5 (R5) | |
| TC-028 | Refer — default | REQ-04.6 (R6) | |
| TC-029 | Apply precedence 1→5 | REQ-04.7 | |
| TC-030 | Rule 1 overrides later | REQ-04.7 | |
| TC-031 | Show action label | REQ-05.1 | one of the 4 actions |
| TC-032 | Show evaluated + triggered rule | REQ-05.2 | |
| TC-033 | Show priority + age band | REQ-05.3 | |
| TC-034 | Plain-language reasoning | REQ-05.4 | |
| TC-035 | Log when display unavailable | REQ-05.5 | decoupled recommendation endpoint |
| TC-036 | Pre-populate status (valid ref) | REQ-06.1 | |
| TC-037 | Manual status (unknown ref) | REQ-06.2 | Completed/Pending/Failed/Reversed |
| TC-038 | Engine on mock data only | REQ-06.3 | |
| TC-039 | Mock restriction engine-only | REQ-06.4 | |
| TC-040 | Full summary + recommendation | REQ-07.1 | 8 summary fields + action |
| TC-041 | Single-screen | REQ-07.2 | no navigation |
| TC-042 | Reject injected Payment_Type | REQ-01.6 | enum-membership validation |
| TC-043 | Reject injected Issue_Category | REQ-01.6 | enum-membership validation |
| TC-044 | Age boundary 7 → Recent | REQ-02.3 | |
| TC-045 | Age boundary 8 → Moderate | REQ-02.3 | |
| TC-046 | Age boundary 30 → Moderate | REQ-02.3 | |
| TC-047 | Age boundary 31 → Aged | REQ-02.3 | |
| TC-048 | Amount 10,000.01 → High | REQ-03.2 | |
| TC-049 | Amount 10,000 + Moderate → Medium | REQ-03.3 | inclusive upper bound |
| TC-050 | Amount 999.99 + Recent → Low | REQ-03.4 | |
| TC-051 | Amount 1,000 + Moderate → Medium | REQ-03.3 | inclusive lower bound |

---

## Alignment notes

- **Fully aligned.** Every TC binds to an existing REQ/AC and matches the design's
  thresholds and bands exactly (verified at the 7/8/30/31-day and
  999.99/1,000/10,000/10,000.01 boundaries).
- **One spec strengthening triggered by these tests:** REQ-01.6 + `validate()`
  enum-membership check was added so TC-042/043 have a binding acceptance
  criterion (server-side rejection of injected enum values).
- **Confirms earlier decisions:** TC-011 (age from transaction date) and TC-017
  (unauthorised = High) match OM and contradict the rejected `api-spec` —
  reinforcing that OM remains canonical.
- **Worked examples A–G** (design §3.4) supplement TC-023…030 as a determinism
  oracle and should run in the same suite.
