# Requirements — Payment Dispute Triage (EARS format)

**Role:** Business Analyst
**Source:** Use Case 1 — Intelligent Triage of Customer Payment Disputes (OM)

---

## REQ-01: Capture payment dispute details

**User Story:** As an Operations_User, I want to capture all relevant dispute
details in a single form, so that the system has enough information to recommend
a next action.

**EARS:**

1. THE Dispute_Form SHALL allow entry of: customer name, transaction reference,
   transaction date, transaction amount, Payment_Type, Issue_Category, and
   free-text description.
2. WHEN the user submits, THE system SHALL validate all mandatory fields are
   populated.
3. IF a mandatory field is missing, THEN THE system SHALL display an inline error
   identifying the specific field.
4. THE Dispute_Form SHALL restrict Payment_Type to: Card Payment, EFT, Internal
   Transfer.
5. THE Dispute_Form SHALL restrict Issue_Category to: Duplicate Debit, Failed
   Transfer, Missing Payment, Unauthorized Transaction.
6. IF an unsupported enum value is supplied via the API, THEN the system SHALL
   reject it at the validation boundary (400) and SHALL NOT proceed to triage.

---

## REQ-02: Calculate dispute age

**User Story:** As an Operations_User, I want the system to calculate the age of
the dispute automatically, so that time-sensitive cases are identified.

**EARS:**

1. WHEN a transaction date is provided, THE system SHALL calculate Dispute_Age as
   calendar days between transaction date and current date.
2. IF the transaction date is in the future, THEN THE system SHALL reject with an
   error.
3. THE system SHALL classify Dispute_Age into bands: Recent (0–7 days), Moderate
   (8–30 days), Aged (>30 days).

---

## REQ-03: Determine priority level

**User Story:** As an Operations_User, I want each dispute assigned a priority,
so that I can focus on the most urgent cases first.

**EARS:**

1. WHEN a dispute is submitted, THE system SHALL evaluate priority rules High →
   Low, applying the highest matching level.
2. High: amount > 10,000 OR Issue_Category = Unauthorized Transaction.
3. Medium: 1,000 ≤ amount ≤ 10,000 AND age band ∈ {Moderate, Aged}.
4. Low: amount < 1,000 AND age band = Recent.
5. Default: Medium (if no condition matches).

---

## REQ-04: Generate recommended action

**User Story:** As an Operations_User, I want a clear recommended next action for
each dispute.

**EARS (first match wins):**

1. WHEN status = Failed AND age band = Recent → Resolve Immediately.
2. WHEN category = Duplicate Debit AND status = Completed → Investigate Further.
3. WHEN category = Unauthorized Transaction AND amount > 10,000 → Escalate.
4. WHEN category = Missing Payment AND type = EFT → Investigate Further.
5. WHEN age band = Aged AND priority = High → Escalate.
6. Default → Refer to Another Team.

---

## REQ-05: Display recommendation with reasoning

**User Story:** As an Operations_User, I want to see the reasoning behind the
recommended action.

**EARS:**

1. THE display SHALL show the action label.
2. THE display SHALL show the list of rules evaluated and which one triggered.
3. THE display SHALL show Priority_Level and Dispute_Age band.
4. THE display SHALL present reasoning in plain language.
5. THE engine SHALL generate recommendations independently of the display.

---

## REQ-06: Support mock data for prototype

**User Story:** As an Operations_User, I want the system to use realistic mock
data.

**EARS:**

1. THE form SHALL pre-populate Transaction_Status from mock data when a valid
   reference is entered.
2. WHEN a reference doesn't match, THE form SHALL allow manual status selection.
3. THE engine SHALL operate entirely on mock data without external connections.
4. The mock-data restriction applies only to the engine.

---

## REQ-07: Display dispute summary

**User Story:** As an Operations_User, I want a summary alongside the
recommendation.

**EARS:**

1. THE display SHALL show: customer name, transaction reference, amount,
   Payment_Type, Issue_Category, Transaction_Status, age band, and priority.
2. THE summary and recommendation SHALL appear on a single screen without
   navigation.
