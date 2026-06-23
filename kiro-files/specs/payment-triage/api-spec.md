# API Specification — Payment Dispute Triage

**Feature:** `payment-triage`
**Owner role:** API Designer
**Aligned to:** `design.md` §4, `requirements.md` REQ-01–07.

Base path `/api`. All requests/responses are `application/json`. Timestamps are
ISO-8601. Amounts are ZAR numbers. **No authentication** (single ops user
assumed) — there is no `401`. Enum fields use the **code form**; the UI maps to
display labels (`design.md` §2.1). Validation errors return
`400 { "errors": [{ "field": "...", "message": "..." }] }`.

Enum values on the wire:
`paymentType` = `CARD_PAYMENT | EFT | INTERNAL_TRANSFER` ·
`issueCategory` = `DUPLICATE_DEBIT | FAILED_TRANSFER | MISSING_PAYMENT | UNAUTHORIZED_TRANSACTION` ·
`status` (txn) = `COMPLETED | PENDING | FAILED | REVERSED` ·
`priority` = `HIGH | MEDIUM | LOW` · `ageBand` = `RECENT | MODERATE | AGED` ·
`action` = `RESOLVE_IMMEDIATELY | INVESTIGATE_FURTHER | ESCALATE | REFER_TO_ANOTHER_TEAM` ·
`disputeStatus` = `OPEN | IN_REVIEW | RESOLVED | CLOSED`

---

## GET /api/customers

List mock customers for dispute-capture dropdowns and search.

**Query parameters:** none

**Success response (200):**
- customers — array of customer objects (`id`, `name`, `accountNumber`)
- total — number of customers returned

**Error responses:** none expected (always returns the full mock set)

**Example:**

Response:
```json
{
  "customers": [
    { "id": "cust_001", "name": "Amahle Dlamini", "accountNumber": "MOCK-AC-001" },
    { "id": "cust_002", "name": "Sipho Nkosi", "accountNumber": "MOCK-AC-002" }
  ],
  "total": 2
}
```

---

## GET /api/customers/:id

Retrieve a single mock customer by identifier.

**Path parameters:**
- id (string, required) — customer identifier

**Success response (200):**
- id — customer identifier
- name — customer full name
- accountNumber — mock account token (never a real account/card number)

**Error responses:**
- 404 — customer not found

---

## GET /api/transactions

List mock transactions, optionally filtered by customer.

**Query parameters:**
- customerId (string, optional) — return only this customer's transactions

**Success response (200):**
- transactions — array of transaction objects (same shape as `GET /api/transactions/:reference`)
- total — number of transactions matching the filter

**Error responses:**
- 404 — `customerId` supplied but no such customer

---

## GET /api/transactions/:reference

Look up a mock transaction by reference to pre-populate the capture form
(REQ-06.1).

**Path parameters:**
- reference (string, required) — transaction reference

**Success response (200):**
- reference — transaction reference
- customerId — owning customer
- paymentType — `CARD_PAYMENT | EFT | INTERNAL_TRANSFER`
- amount — ZAR
- status — `COMPLETED | PENDING | FAILED | REVERSED`
- description — merchant/counterparty label
- transactionDate — ISO timestamp

**Error responses:**
- 404 — reference not found in mock data (UI then allows manual status selection, REQ-06.2)

**Example:**

Request: `GET /api/transactions/TXN-0042`

Response:
```json
{
  "reference": "TXN-0042",
  "customerId": "cust_001",
  "paymentType": "CARD_PAYMENT",
  "amount": 3200.00,
  "status": "COMPLETED",
  "description": "FreshMart - POS Purchase",
  "transactionDate": "2026-06-19T14:22:00.000Z"
}
```

---

## POST /api/disputes

Capture a payment dispute. Validates input, computes dispute age (from the
**transaction date**), age band, and priority, then persists the case with
`status: OPEN`. The recommendation is produced separately
(`GET /api/disputes/:id/recommendation`) so it is decoupled from display
(REQ-05.5).

**Request body:**
- customerId (string, required) — customer raising the dispute
- transactionReference (string, required) — disputed transaction
- transactionDate (string, required) — ISO date; must not be in the future
- amount (number, required) — disputed amount in ZAR; must be > 0
- paymentType (string, required) — one of the `paymentType` enum
- issueCategory (string, required) — one of the `issueCategory` enum
- transactionStatus (string, required) — one of the `status` enum (pre-populated or manually selected)
- description (string, optional) — free-text detail

**Success response (201):**
- id — dispute identifier
- customerId, transactionReference, paymentType, issueCategory, amount, transactionStatus, description — as supplied
- transactionDate — as supplied
- disputeAge — calendar days from transactionDate to today
- ageBand — `RECENT | MODERATE | AGED`
- priority — `HIGH | MEDIUM | LOW`
- status — `OPEN`
- submittedAt — ISO timestamp

**Error responses:**
- 400 — validation failed: missing/empty mandatory field, non-positive amount, future transactionDate, or unsupported `paymentType`/`issueCategory` value (REQ-01.6, TC-042/043)
- 404 — customerId or transactionReference not found in mock data

**Example:**

Request:
```json
{
  "customerId": "cust_005",
  "transactionReference": "TXN-0091",
  "transactionDate": "2026-05-13T09:00:00.000Z",
  "amount": 45000.00,
  "paymentType": "INTERNAL_TRANSFER",
  "issueCategory": "UNAUTHORIZED_TRANSACTION",
  "transactionStatus": "COMPLETED",
  "description": "I did not authorise this internal transfer."
}
```

Response:
```json
{
  "id": "disp_7f3a1b",
  "customerId": "cust_005",
  "transactionReference": "TXN-0091",
  "paymentType": "INTERNAL_TRANSFER",
  "issueCategory": "UNAUTHORIZED_TRANSACTION",
  "amount": 45000.00,
  "transactionStatus": "COMPLETED",
  "description": "I did not authorise this internal transfer.",
  "transactionDate": "2026-05-13T09:00:00.000Z",
  "disputeAge": 40,
  "ageBand": "AGED",
  "priority": "HIGH",
  "status": "OPEN",
  "submittedAt": "2026-06-22T10:30:00.000Z"
}
```

---

## GET /api/disputes

List captured disputes with optional filters. Sorted by priority descending
(HIGH first), then oldest first.

**Query parameters (all optional):**
- status (string) — `OPEN | IN_REVIEW | RESOLVED | CLOSED`
- priority (string) — `HIGH | MEDIUM | LOW`
- paymentType (string) — one of the `paymentType` enum

**Success response (200):**
- disputes — array of dispute summary objects (same shape as the `POST /api/disputes` response)
- total — number of disputes matching the filters

**Error responses:**
- 400 — invalid filter value (unrecognised status/priority/paymentType)

---

## GET /api/disputes/:id

Retrieve a single captured dispute. `disputeAge` and `priority` are recomputed at
read time.

**Path parameters:**
- id (string, required) — dispute identifier

**Success response (200):**
- Full dispute object (same fields as the `POST /api/disputes` response), with `disputeAge`, `ageBand`, and `priority` recomputed

**Error responses:**
- 404 — dispute not found

---

## GET /api/disputes/:id/recommendation

Generate the triage recommendation using the rules-based engine. The six rules
are evaluated in precedence order; the **first match wins** (REQ-04).

**Path parameters:**
- id (string, required) — dispute identifier

**Success response (200):**
- disputeId — dispute identifier
- action — one of `RESOLVE_IMMEDIATELY | INVESTIGATE_FURTHER | ESCALATE | REFER_TO_ANOTHER_TEAM`
- reason — plain-language explanation of the triggered rule (REQ-05.4)
- triggeredRuleId — e.g. `R3-UNAUTH-HIGHVAL`
- ruleEvaluations — array of `{ ruleId, label, matched }` for all six rules (REQ-05.2)
- priority — `HIGH | MEDIUM | LOW`
- ageBand — `RECENT | MODERATE | AGED`
- generatedAt — ISO timestamp

**Rule precedence:**

| # | ruleId | Condition | action |
|---|--------|-----------|--------|
| 1 | R1-FAILED-RECENT | status FAILED ∧ age RECENT | RESOLVE_IMMEDIATELY |
| 2 | R2-DUP-COMPLETED | DUPLICATE_DEBIT ∧ status COMPLETED | INVESTIGATE_FURTHER |
| 3 | R3-UNAUTH-HIGHVAL | UNAUTHORIZED_TRANSACTION ∧ amount > 10,000 | ESCALATE |
| 4 | R4-MISSING-EFT | MISSING_PAYMENT ∧ EFT | INVESTIGATE_FURTHER |
| 5 | R5-AGED-HIGH | age AGED ∧ priority HIGH | ESCALATE |
| 6 | R6-DEFAULT | no rule matched | REFER_TO_ANOTHER_TEAM |

**Error responses:**
- 404 — dispute not found

**Example:**

Request: `GET /api/disputes/disp_7f3a1b/recommendation`

Response:
```json
{
  "disputeId": "disp_7f3a1b",
  "action": "ESCALATE",
  "reason": "Unauthorized transaction over R10,000 — escalate for review.",
  "triggeredRuleId": "R3-UNAUTH-HIGHVAL",
  "ruleEvaluations": [
    { "ruleId": "R1-FAILED-RECENT", "label": "Failed transaction, recent", "matched": false },
    { "ruleId": "R2-DUP-COMPLETED", "label": "Duplicate debit, completed", "matched": false },
    { "ruleId": "R3-UNAUTH-HIGHVAL", "label": "Unauthorized over R10,000", "matched": true },
    { "ruleId": "R4-MISSING-EFT", "label": "Missing payment, EFT", "matched": false },
    { "ruleId": "R5-AGED-HIGH", "label": "Aged and high priority", "matched": false },
    { "ruleId": "R6-DEFAULT", "label": "No specific rule", "matched": false }
  ],
  "priority": "HIGH",
  "ageBand": "AGED",
  "generatedAt": "2026-06-22T10:31:00.000Z"
}
```

---

## PATCH /api/disputes/:id/status  *(extension — beyond REQ-01–07)*

Update the lifecycle status of a dispute. Borrowed from the uploaded api-spec; not
on the OM critical path.

**Path parameters:**
- id (string, required) — dispute identifier

**Request body:**
- status (string, required) — `OPEN | IN_REVIEW | RESOLVED | CLOSED`

**Success response (200):**
- id — dispute identifier
- status — updated lifecycle status
- priority — recomputed
- disputeAge — recomputed
- submittedAt — original creation timestamp
- lastUpdatedAt — ISO timestamp of this change

**Error responses:**
- 400 — invalid status value
- 404 — dispute not found

---

## GET /api/health

Liveness probe.

**Success response (200):**
- status — `"ok"`

**Error responses:** none
