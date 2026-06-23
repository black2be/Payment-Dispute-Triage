# UI Specification — Payment Dispute Triage

**Feature:** `payment-triage`
**Owner role:** UI/UX Designer
**Aligned to:** `design.md` §5, `requirements.md` REQ-01–07, the `frontend-design`
skill palette. Written to the team UI Specification Template.

The core journey lives on **one screen** (REQ-07.2): the Capture panel and the
Result panel sit side by side (stacked on small screens). The Disputes List is an
optional extension built on the borrowed list/lifecycle endpoints.

---

# Screen Specifications

## Screen: Dispute Capture (DisputeForm)

**Purpose:** The Operations_User captures a customer payment dispute so the
Triage_Engine has enough information to recommend a next action.

**Layout:**
- Panel header: "Capture dispute"
- Customer field — searchable select sourced from `GET /api/customers`
- Transaction reference — text input with lookup on blur
- Transaction date — date picker (no future dates)
- Transaction amount — numeric input, ZAR prefix
- Payment_Type — dropdown (Card Payment / EFT / Internal Transfer)
- Issue_Category — dropdown (Duplicate Debit / Failed Transfer / Missing Payment / Unauthorized Transaction)
- Transaction_Status — read-only when pre-populated; becomes a manual dropdown if the reference has no match
- Description — free-text textarea (optional)
- Primary action: "Triage dispute" button (bottom-right of panel)

**Data displayed:**
- Customer: name (from mock customers), `customerId` as value
- Transaction_Status: `Completed / Pending / Failed / Reversed` — pre-filled from `GET /api/transactions/:reference`
- Amount: ZAR, thousands-separated (e.g. R12 500.00)
- Dropdown options come from the enum label map (`labels.ts`)

**Interactions:**
- Enter/blur a valid transaction reference → pre-populate Transaction_Status (and amount/type) from mock data (REQ-06.1)
- Reference not found → Transaction_Status switches to a manual dropdown (REQ-06.2)
- Submit with a missing mandatory field → block submission, inline error names the specific field (REQ-01.3)
- Enter a future transaction date → inline error "Transaction date cannot be in the future" (REQ-02.2)
- Select an unsupported value (injected) → rejected at validation, dispute does not proceed (REQ-01.6 / TC-042-043)
- Click "Triage dispute" → `POST /api/disputes` then `GET /api/disputes/:id/recommendation`; Result panel renders

**States:**
- Empty: clean form, Result panel shows placeholder "Capture a dispute to see the recommended next step."
- Loading: "Triage dispute" button shows a spinner and is disabled while the request is in flight; customer select shows a shimmer until mock customers load
- Error: lookup failure shows "Couldn't reach the mock data store — enter status manually." next to the reference field; submit failure shows an inline banner "Unable to triage right now. Try again." (form values retained)

---

## Screen: Triage Recommendation (DisputeSummary + RecommendationPanel)

**Purpose:** The Operations_User sees the recommended next action with transparent
reasoning, on the same screen as the captured dispute (REQ-05, REQ-07).

**Layout:**
- Action banner — large action label in its semantic colour (full-width of the panel)
- Badge row — Priority badge + Dispute_Age band badge
- Reason line — one-sentence plain-language explanation
- Dispute summary card — the captured fields, read-only
- Rule-evaluation list — all six rules, the triggered one highlighted
- (Extension) Status control — set lifecycle status via `PATCH /api/disputes/:id/status`

**Data displayed:**
- Recommended_Action: one of Resolve Immediately (green) / Investigate Further (amber) / Escalate (red) / Refer to Another Team (blue)
- Priority_Level: High (red) / Medium (amber) / Low (grey)
- Dispute_Age band: Recent (green) / Moderate (amber) / Aged (red) — with day count
- Reason: plain language (e.g. "Failed transaction raised within 7 days — safe to resolve immediately.")
- Summary fields: Customer name, Transaction reference, Amount (ZAR), Payment_Type, Issue_Category, Transaction_Status, Dispute_Age band, Priority_Level (REQ-07.1)
- Rule list: each rule's label + matched/not-matched (✓ / –), triggered rule emphasised

**Interactions:**
- Result appears automatically after a successful triage (no navigation — REQ-07.2)
- Hover/focus a rule row → show its condition tooltip
- (Extension) Change status → `PATCH /api/disputes/:id/status`, badge updates in place
- "New dispute" → reset the Capture panel and clear the Result

**States:**
- Empty: placeholder card "Capture a dispute to see the recommended next step."
- Loading: skeleton action banner + badge shimmer while `GET /:id/recommendation` resolves
- Error: "Couldn't generate a recommendation for this dispute. Retry." with a Retry button (re-calls the recommendation endpoint); the dispute is still saved

---

## Screen: Disputes List (extension)

**Purpose:** The Operations_User reviews previously captured disputes and their
recommendations. Built on the borrowed `GET /api/disputes` + lifecycle endpoints;
beyond the OM REQ-01–07 critical path.

**Layout:**
- Header: "Disputes"
- Action bar: "New dispute" button (primary, top-right) → opens the Capture screen
- Filter bar: Status, Priority, Payment_Type dropdowns
- Table: one row per dispute

**Data displayed:**
- Customer name, Transaction reference, Amount (ZAR), Payment_Type, Issue_Category, Priority badge, Dispute_Age band badge, Recommended_Action chip, Status, Submitted date
- Sorted priority descending (High first), then oldest first

**Interactions:**
- Click "New dispute" → Capture screen
- Click a row → opens that dispute's Recommendation screen (`GET /api/disputes/:id` + `/recommendation`)
- Change a filter → re-query `GET /api/disputes?status=&priority=&paymentType=`
- Update a row's status → `PATCH /api/disputes/:id/status`, badge updates without refresh

**States:**
- Empty: "No disputes captured yet. Create your first one."
- Loading: skeleton/shimmer rows on the table
- Error: "Unable to load disputes. Try again."

---

## Cross-screen rules

- **Colour is never the only signal** — every badge/chip shows its text label.
- **Enum → label → colour** routes through one `labels.ts` map; no inline labels or hex.
- **Accessibility:** labelled inputs, `aria-invalid` + `aria-describedby` on errors,
  visible focus, `aria-live="polite"` on the Result panel, contrast ≥ 4.5:1.
- **No PII/PCI** in placeholder or sample data; amounts in ZAR; no external CDN/font calls.
