# Test Cases — Payment Dispute Triage

**Role:** Test Architect
**Source:** Requirements REQ-01–07, Design §3.4 worked examples

---

## Property-Based Tests (fast-check, 100+ iterations)

| ID | Property | Covers |
|----|----------|--------|
| P1 | Age calculation: days between transaction date and today is always ≥ 0 | REQ-02 |
| P2 | Future-date rejection: transaction date > today always throws | REQ-02 |
| P3 | Priority assignment: High conditions always override Medium/Low | REQ-03 |
| P4 | Action determinism: same input + same today → same action | REQ-04 |
| P5 | Rule precedence: R1 conditions always beat R2–R6 | REQ-04 |
| P6 | Validation completeness: missing any mandatory field → error | REQ-01 |
| P7 | Mock lookup: known reference → record; unknown → null | REQ-06 |

---

## Worked Examples (table-driven, cases A–G)

| Case | Type | Category | Amount | Status | Age (days) | Expected Priority | Expected Rule | Expected Action |
|------|------|----------|--------|--------|------------|-------------------|---------------|-----------------|
| A | Card Payment | Unauthorized Transaction | 3,200 | Completed | 3 | High | R6-DEFAULT | Refer to Another Team |
| B | EFT | Failed Transfer | 8,000 | Failed | 2 | Medium | R1-FAILED-RECENT | Resolve Immediately |
| C | EFT | Missing Payment | 12,500 | Pending | 10 | High | R4-MISSING-EFT | Investigate Further |
| D | Card Payment | Duplicate Debit | 600 | Completed | 1 | Low | R2-DUP-COMPLETED | Investigate Further |
| E | Internal Transfer | Unauthorized Transaction | 45,000 | Completed | 40 | High | R3-UNAUTH-HIGHVAL | Escalate |
| F | Card Payment | Missing Payment | 20,000 | Reversed | 35 | High | R5-AGED-HIGH | Escalate |
| G | Internal Transfer | Failed Transfer | 5,000 | Completed | 15 | Medium | R6-DEFAULT | Refer to Another Team |

---

## Validation Test Cases

| ID | Input | Expected |
|----|-------|----------|
| TC-001 | All mandatory fields populated | Pass validation |
| TC-002 | Customer name empty | 400 error, field: customerName |
| TC-003 | Transaction reference empty | 400 error, field: transactionReference |
| TC-004 | Transaction date empty | 400 error, field: transactionDate |
| TC-005 | Amount empty | 400 error, field: amount |
| TC-006 | Amount ≤ 0 | 400 error, field: amount |
| TC-007 | Transaction date in future | 400 error, field: transactionDate |
| TC-042 | Unsupported Payment_Type via API | 400 error, rejected at boundary |
| TC-043 | Unsupported Issue_Category via API | 400 error, rejected at boundary |

---

## API Integration Tests (supertest)

| ID | Endpoint | Scenario | Expected |
|----|----------|----------|----------|
| API-01 | GET /api/transactions/:ref | Known reference | 200 + transaction data |
| API-02 | GET /api/transactions/:ref | Unknown reference | 404 |
| API-03 | POST /api/disputes | Valid dispute | 201 + persisted with correct age/priority |
| API-04 | POST /api/disputes | Missing field | 400 + field-level error |
| API-05 | POST /api/disputes | Future date | 400 |
| API-06 | GET /api/disputes/:id/recommendation | Cases A–G | Correct action per worked examples |
| API-07 | PATCH /api/disputes/:id/status | Valid transition | 200 |

---

## Component Tests

| ID | Component | Assertion |
|----|-----------|-----------|
| UI-01 | DisputeForm | All fields render with correct dropdowns |
| UI-02 | DisputeForm | Inline validation on missing fields |
| UI-03 | DisputeSummary | All attributes displayed |
| UI-04 | RecommendationPanel | Action label + rule list + triggered rule highlighted |
| UI-05 | RecommendationPanel | Plain-language reason renders |
