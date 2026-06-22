# API Specification — Payment Dispute Triage

**Role:** API Designer
**Base path:** `/api`
**Content-Type:** `application/json`
**Timestamps:** ISO-8601
**Currency:** ZAR
**Enum format:** Code form (SCREAMING_SNAKE_CASE) in API; UI maps to labels

---

## Reference Data Endpoints

### GET /api/customers

List mock customers for dropdown/search.

**Response 200:**
```json
{ "customers": [...], "total": number }
```

### GET /api/customers/:id

Single customer by ID.

**Response 200:** Customer object | **404** if not found

### GET /api/transactions

List mock transactions. Optional query: `?customerId=`

**Response 200:**
```json
{ "transactions": [...], "total": number }
```

### GET /api/transactions/:reference

Lookup by transaction reference (for form pre-population).

**Response 200:** Transaction object | **404** if not found

---

## Dispute Endpoints

### POST /api/disputes

Create a new dispute case.

**Request body:**
```json
{
  "customerName": "string (required)",
  "transactionReference": "string (required)",
  "transactionDate": "ISO-8601 date (required, not future)",
  "amount": "number (required, > 0)",
  "paymentType": "CARD_PAYMENT | EFT | INTERNAL_TRANSFER (required)",
  "issueCategory": "DUPLICATE_DEBIT | FAILED_TRANSFER | MISSING_PAYMENT | UNAUTHORIZED_TRANSACTION (required)",
  "description": "string (optional)"
}
```

**Response 201:** Created dispute with computed ageDays, ageBand, priority, recommendedAction, triggeredRuleId, ruleEvaluations.

**Response 400:**
```json
{ "errors": [{ "field": "string", "message": "string" }] }
```

### GET /api/disputes

List disputes. Optional filters: `?status=`, `?priority=`, `?paymentType=`
Sorted: priority desc, then oldest first.

**Response 200:**
```json
{ "disputes": [...], "total": number }
```

### GET /api/disputes/:id

Single dispute by ID.

**Response 200:** Dispute object | **404** if not found

### GET /api/disputes/:id/recommendation

Run the 6 rules (decoupled from persistence).

**Response 200:**
```json
{
  "disputeId": "string",
  "action": "RESOLVE_IMMEDIATELY | INVESTIGATE_FURTHER | ESCALATE | REFER_TO_ANOTHER_TEAM",
  "reason": "string (plain language)",
  "triggeredRuleId": "string",
  "ruleEvaluations": [{ "ruleId": "string", "label": "string", "matched": boolean }],
  "priority": "HIGH | MEDIUM | LOW",
  "ageBand": "RECENT | MODERATE | AGED",
  "generatedAt": "ISO-8601"
}
```

### PATCH /api/disputes/:id/status

Update lifecycle status (extension beyond REQ-01–07).

**Request body:**
```json
{ "status": "OPEN | IN_REVIEW | RESOLVED | CLOSED" }
```

**Response 200:** Updated dispute | **400** invalid transition | **404** not found

---

## Health

### GET /api/health

**Response 200:**
```json
{ "status": "ok", "timestamp": "ISO-8601" }
```

---

## Error Convention

All validation errors return:
```json
{
  "errors": [{ "field": "fieldName", "message": "human-readable message" }]
}
```

Never raw strings. Never HTML. Never stack traces in production.
