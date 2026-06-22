# UI Specification — Payment Dispute Triage

**Role:** UI/UX Designer
**Framework:** React 18 + Vite + Tailwind CSS
**Pattern:** Single-screen flow, no navigation

---

## Screen Flow

```
DisputeForm ──submit──▶ POST /api/disputes ──▶ DisputeSummary + RecommendationPanel
     ▲                                                  │ (same screen)
     └──────────────── edit & re-submit ◀───────────────┘
```

---

## Components

### DisputeForm (REQ-01, REQ-06)

**Purpose:** Capture all dispute details.

**Fields:**
| Field | Type | Validation |
|-------|------|------------|
| Customer name | Text input | Required |
| Transaction reference | Text input | Required; on match → pre-populates status |
| Transaction date | Date picker | Required; no future dates |
| Amount | Number input | Required; > 0 |
| Payment_Type | Dropdown | Required; Card Payment, EFT, Internal Transfer |
| Issue_Category | Dropdown | Required; Duplicate Debit, Failed Transfer, Missing Payment, Unauthorized Transaction |
| Transaction_Status | Dropdown | Auto-populated on ref match; manual on miss (Completed, Pending, Failed, Reversed) |
| Description | Textarea | Optional |

**Behaviour:**
- On transaction reference blur/change: call `GET /api/transactions/:reference`
- If found → auto-populate Transaction_Status (disabled dropdown)
- If not found → enable manual Transaction_Status dropdown (REQ-06.2)
- Inline, field-level validation errors name the specific missing field (REQ-01.3)

---

### DisputeSummary (REQ-07)

**Purpose:** Display all dispute attributes after submission.

**Shows:** Customer name, transaction reference, amount, Payment_Type, Issue_Category, Transaction_Status, age band, priority.

---

### RecommendationPanel (REQ-05)

**Purpose:** Display the recommended action with full reasoning.

**Shows:**
- Action label (coloured badge + text)
- Priority badge (High/Medium/Low)
- Age band badge (Recent/Moderate/Aged)
- Plain-language reason explaining why this rule triggered
- All 6 rules evaluated, with the triggered one highlighted

**Colour Palette:**
| Action | Colour |
|--------|--------|
| Resolve Immediately | Green |
| Investigate Further | Amber |
| Escalate | Red |
| Refer to Another Team | Blue |

| Priority | Colour |
|----------|--------|
| High | Red |
| Medium | Amber |
| Low | Grey |

| Age Band | Colour |
|----------|--------|
| Aged | Red |
| Moderate | Amber |
| Recent | Green |

**Accessibility:** Colour is always paired with a text label — never colour alone.

---

### App (REQ-04, REQ-07)

**Purpose:** Orchestrate the flow.

**Behaviour:**
1. Render DisputeForm
2. On submit → POST /api/disputes
3. On success → render DisputeSummary + RecommendationPanel on same screen
4. User can edit and re-submit

---

## Labels

All enum values displayed via a single `labels.ts` mapping (code → display label). Never hand-format inline.
