# Requirements — Payment Dispute Triage

**Feature:** `payment-triage`
**Source of truth:** Confluence — *Use Case 1: Intelligent Triage of Customer
Payment Disputes* (space OM, Value Added Services). This file mirrors that
document; if they ever diverge, Confluence wins.
**Owner roles:** Feature Analyst (requirements), Quality Engineer (acceptance criteria)
**Status:** Aligned to OM canonical

---

## Introduction

An internal prototype that helps banking **Operations_Users** triage and route
customer payment disputes. The system captures dispute details, applies
transparent business rules based on transaction status, amount, dispute age, and
issue type, and recommends the most appropriate next action. Goal: reduce
resolution time, improve decision consistency, and guide staff through a clear
single-journey workflow.

**Analysis decisions (carried from source):**
1. Priority rules evaluate top-down, **highest match wins**.
2. Action rules use **first-match-wins** precedence.
3. Recommendation generation is **decoupled** from display.
4. The mock-data restriction applies **only to the Triage_Engine**.

### Glossary

| Term | Definition |
| --- | --- |
| **Triage_Engine** | Rules-based component that evaluates dispute attributes and determines the recommended action |
| **Dispute_Form** | UI component where operations users capture and submit dispute details |
| **Recommendation_Display** | UI component that presents the recommended action and reasoning |
| **Operations_User** | Banking staff member handling customer payment disputes |
| **Payment_Type** | Card Payment, EFT, or Internal Transfer |
| **Issue_Category** | Duplicate Debit, Failed Transfer, Missing Payment, or Unauthorized Transaction |
| **Recommended_Action** | Resolve Immediately, Investigate Further, Escalate, or Refer to Another Team |
| **Transaction_Status** | Completed, Pending, Failed, or Reversed |
| **Dispute_Age** | Calendar days between the transaction date and the date the dispute is captured |
| **Dispute_Age band** | Recent (0–7), Moderate (8–30), Aged (> 30) |
| **Priority_Level** | High, Medium, or Low |

---

## Requirement 1 — Capture payment dispute details (REQ-01)

**User Story:** As an Operations_User, I want to capture all relevant dispute
details in a single form, so that the system has enough information to recommend
a next action.

### Acceptance Criteria

1. THE Dispute_Form SHALL allow entry of customer name, transaction reference,
   transaction date, transaction amount, Payment_Type, Issue_Category, and a
   free-text description.
2. WHEN the Operations_User submits the Dispute_Form, THE Dispute_Form SHALL
   validate that all mandatory fields (customer name, transaction reference,
   transaction date, transaction amount, Payment_Type, Issue_Category) are
   populated.
3. IF a mandatory field is missing, THEN THE Dispute_Form SHALL display an inline
   error identifying the specific missing field.
4. THE Dispute_Form SHALL restrict Payment_Type to Card Payment, EFT, or Internal
   Transfer.
5. THE Dispute_Form SHALL restrict Issue_Category to Duplicate Debit, Failed
   Transfer, Missing Payment, or Unauthorized Transaction.
6. IF an unsupported Payment_Type or Issue_Category value is supplied (e.g.
   injected via the API, bypassing the dropdown), THEN the system SHALL reject it
   at the validation boundary and SHALL NOT proceed to triage. *(Covers TC-042,
   TC-043.)*

---

## Requirement 2 — Calculate dispute age (REQ-02)

**User Story:** As an Operations_User, I want the system to calculate the age of
the dispute automatically, so that time-sensitive cases are identified without
manual effort.

### Acceptance Criteria

1. WHEN the Operations_User enters a transaction date, THE Triage_Engine SHALL
   calculate Dispute_Age as the number of calendar days between the transaction
   date and the current date.
2. IF the transaction date is in the future, THEN THE Dispute_Form SHALL display
   an error stating the transaction date cannot be a future date.
3. THE Triage_Engine SHALL classify Dispute_Age into three bands: **Recent (0–7
   days)**, **Moderate (8–30 days)**, **Aged (more than 30 days)**.

---

## Requirement 3 — Determine priority level (REQ-03)

**User Story:** As an Operations_User, I want each dispute assigned a priority,
so that I can focus on the most urgent cases first.

**Clarification:** Priority rules are evaluated High → Medium → Low; the highest
matching level wins. High conditions (amount > 10,000 OR Unauthorized
Transaction) always take precedence.

### Acceptance Criteria

1. WHEN a dispute is submitted, THE Triage_Engine SHALL evaluate priority rules in
   order High → Low, applying the highest matching Priority_Level.
2. THE Triage_Engine SHALL assign **High** when the transaction amount exceeds
   10,000 OR the Issue_Category is Unauthorized Transaction, regardless of other
   attributes.
3. WHEN no High condition is met, THE Triage_Engine SHALL assign **Medium** when
   the amount is between 1,000 and 10,000 inclusive AND the Dispute_Age band is
   Moderate or Aged.
4. WHEN no High or Medium condition is met, THE Triage_Engine SHALL assign **Low**
   when the amount is below 1,000 AND the Dispute_Age band is Recent.
5. IF none of the above conditions are met, THEN THE Triage_Engine SHALL assign
   **Medium** as the default.

---

## Requirement 4 — Generate recommended action (REQ-04)

**User Story:** As an Operations_User, I want a clear recommended next action for
each dispute, so that I can handle cases consistently and efficiently.

**Clarification:** Rules are evaluated in precedence order 1→5. The **first**
matching rule determines the action; later matches are ignored — deterministic,
single output.

### Acceptance Criteria (precedence order)

1. WHEN Transaction_Status is **Failed** AND Dispute_Age band is **Recent**, THE
   Triage_Engine SHALL recommend **Resolve Immediately**.
2. WHEN Issue_Category is **Duplicate Debit** AND Transaction_Status is
   **Completed**, THE Triage_Engine SHALL recommend **Investigate Further**.
3. WHEN Issue_Category is **Unauthorized Transaction** AND amount > 10,000, THE
   Triage_Engine SHALL recommend **Escalate**.
4. WHEN Issue_Category is **Missing Payment** AND Payment_Type is **EFT**, THE
   Triage_Engine SHALL recommend **Investigate Further**.
5. WHEN Dispute_Age band is **Aged** AND Priority_Level is **High**, THE
   Triage_Engine SHALL recommend **Escalate**.
6. IF no specific rule matches, THEN THE Triage_Engine SHALL recommend **Refer to
   Another Team**.
7. THE Triage_Engine SHALL evaluate rules 1→5 in order so the first match wins and
   subsequent matches are ignored.

---

## Requirement 5 — Display recommendation with reasoning (REQ-05)

**User Story:** As an Operations_User, I want to see the reasoning behind the
recommended action, so that I can understand and trust the decision.

### Acceptance Criteria

1. WHEN a Recommended_Action is generated, THE Recommendation_Display SHALL show
   the action label (Resolve Immediately, Investigate Further, Escalate, or Refer
   to Another Team).
2. WHEN a Recommended_Action is generated, THE Recommendation_Display SHALL show
   the list of rules evaluated and indicate which rule triggered the
   recommendation.
3. WHEN a Recommended_Action is generated, THE Recommendation_Display SHALL show
   the Priority_Level and Dispute_Age band used in the decision.
4. THE Recommendation_Display SHALL present the reasoning in plain language
   requiring no technical knowledge.
5. THE Triage_Engine SHALL generate recommendations independently of the
   Recommendation_Display, so that IF the display is unavailable the
   recommendation is still produced and logged for later review.

---

## Requirement 6 — Support mock data for prototype (REQ-06)

**User Story:** As an Operations_User, I want the system to use realistic mock
data, so that I can evaluate behaviour without live banking integrations.

### Acceptance Criteria

1. THE Dispute_Form SHALL pre-populate Transaction_Status from a mock transaction
   dataset when a valid transaction reference is entered.
2. WHEN a transaction reference does not match any mock record, THE Dispute_Form
   SHALL allow the user to manually select a Transaction_Status from Completed,
   Pending, Failed, or Reversed.
3. THE Triage_Engine SHALL operate entirely on mock dispute, customer, and
   transaction data without connecting to external banking, card processing, or
   case-management systems.
4. THE mock-data restriction SHALL apply only to the Triage_Engine; the
   Dispute_Form UI layer is not restricted from external connections in future
   integrations.

---

## Requirement 7 — Display dispute summary (REQ-07)

**User Story:** As an Operations_User, I want a summary of the captured dispute
alongside the recommendation, so that I can review all details in one view.

### Acceptance Criteria

1. WHEN a Recommended_Action is generated, THE Recommendation_Display SHALL show a
   summary containing customer name, transaction reference, transaction amount,
   Payment_Type, Issue_Category, Transaction_Status, Dispute_Age band, and
   Priority_Level.
2. THE Recommendation_Display SHALL present the summary and the recommendation on
   a single screen without navigation to a separate view.

---

## Cross-cutting — Governance (AI SDLC)

These do not alter the functional requirements above; they constrain how the
prototype is built under the AI SDLC framework.

- Mock data only; no real PII, card numbers (PCI), secrets, or external URLs in
  source or data. *(Enforced by `gov-pre-tool-use-audit`.)*
- Decision logic is rules-based and inspectable — no AI/ML in the decision path.
- Dependencies pass the CVE/malware gate (`gov-cve-build-gate`).
- Each commit references a valid, assigned Jira ticket.

---

## Traceability (Quality Engineer)

| Requirement | Verified by |
| --- | --- |
| REQ-01 Capture | Validation completeness (Property 6) + form unit tests |
| REQ-02 Age | Age calculation (Property 1), future-date rejection (Property 2) |
| REQ-03 Priority | Priority assignment incl. evaluation order (Property 3) |
| REQ-04 Action | Determinism (Property 4), rule precedence (Property 5) + worked examples A–G |
| REQ-05 Display | RecommendationPanel unit tests; engine-independent-of-display test |
| REQ-06 Mock data | Mock lookup (Property 7); not-found manual-status test |
| REQ-07 Summary | DisputeSummary unit test; single-screen integration test |
