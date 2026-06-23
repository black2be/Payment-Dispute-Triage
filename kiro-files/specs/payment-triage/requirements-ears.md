# Requirements (EARS Format) — Payment Dispute Triage

**Feature:** `payment-triage`
**Owner role:** Feature Analyst
**Source of truth:** Confluence *Use Case 1* (OM). These EARS statements are the
same content as `requirements.md` (REQ-01–07 + acceptance criteria), expressed in
the team EARS template. OM-area mapping is shown per section.

## 1. Dispute Capture  *(maps to OM REQ-01)*

- REQ-001: The system shall provide a Dispute_Form for capturing customer name, transaction reference, transaction date, transaction amount, Payment_Type, Issue_Category, and an optional description.
- REQ-002: The system shall restrict Payment_Type to Card Payment, EFT, or Internal Transfer.
- REQ-003: The system shall restrict Issue_Category to Duplicate Debit, Failed Transfer, Missing Payment, or Unauthorized Transaction.
- REQ-004: When the Operations_User submits the Dispute_Form, the system shall validate that all mandatory fields are populated.
- REQ-005: If a mandatory field is missing, then the system shall block submission and display an inline error identifying the specific missing field.
- REQ-006: If an unsupported Payment_Type or Issue_Category value is supplied, then the system shall reject it at validation and shall not proceed to triage.

## 2. Dispute Age  *(maps to OM REQ-02)*

- REQ-007: When the Operations_User enters a transaction date, the system shall calculate the Dispute_Age as the number of calendar days between the transaction date and the current date.
- REQ-008: If the transaction date is in the future, then the system shall reject it and display an error stating the date cannot be a future date.
- REQ-009: The system shall classify Dispute_Age into Recent (0–7 days), Moderate (8–30 days), and Aged (more than 30 days).

## 3. Priority Level  *(maps to OM REQ-03)*

- REQ-010: When a dispute is submitted, the system shall evaluate priority rules top-down and apply the highest matching Priority_Level.
- REQ-011: When the transaction amount exceeds 10,000 or the Issue_Category is Unauthorized Transaction, the system shall assign Priority_Level High regardless of other attributes.
- REQ-012: While no High condition is met, the system shall assign Priority_Level Medium when the amount is between 1,000 and 10,000 inclusive and the Dispute_Age band is Moderate or Aged.
- REQ-013: While no High or Medium condition is met, the system shall assign Priority_Level Low when the amount is below 1,000 and the Dispute_Age band is Recent.
- REQ-014: If no specific priority condition is met, then the system shall assign Priority_Level Medium as the default.

## 4. Recommended Action  *(maps to OM REQ-04)*

- REQ-015: When the Transaction_Status is Failed and the Dispute_Age band is Recent, the system shall recommend Resolve Immediately.
- REQ-016: When the Issue_Category is Duplicate Debit and the Transaction_Status is Completed, the system shall recommend Investigate Further.
- REQ-017: When the Issue_Category is Unauthorized Transaction and the transaction amount exceeds 10,000, the system shall recommend Escalate.
- REQ-018: When the Issue_Category is Missing Payment and the Payment_Type is EFT, the system shall recommend Investigate Further.
- REQ-019: When the Dispute_Age band is Aged and the Priority_Level is High, the system shall recommend Escalate.
- REQ-020: If no specific rule matches, then the system shall recommend Refer to Another Team.
- REQ-021: The system shall evaluate action rules in precedence order 1 through 5 so that the first matching rule determines the Recommended_Action and subsequent matches are ignored.

## 5. Display & Reasoning  *(maps to OM REQ-05)*

- REQ-022: When a recommendation is generated, the system shall display the action label (Resolve Immediately, Investigate Further, Escalate, or Refer to Another Team).
- REQ-023: When a recommendation is generated, the system shall display the list of rules evaluated and indicate which rule triggered the recommendation.
- REQ-024: When a recommendation is generated, the system shall display the Priority_Level and Dispute_Age band used in the decision.
- REQ-025: The system shall present the reasoning in plain language that requires no technical knowledge to understand.
- REQ-026: If the Recommendation_Display is unavailable, then the system shall still produce the recommendation and log it independently for later review.

## 6. Mock Data  *(maps to OM REQ-06)*

- REQ-027: When a valid transaction reference is entered, the system shall pre-populate Transaction_Status from the mock transaction dataset.
- REQ-028: If a transaction reference does not match any mock record, then the system shall allow the Operations_User to manually select Transaction_Status from Completed, Pending, Failed, or Reversed.
- REQ-029: The system shall operate the Triage_Engine entirely on mock dispute, customer, and transaction data without connecting to external banking, card processing, or case-management systems.
- REQ-030: Where future integrations are considered, the mock-data restriction shall apply only to the Triage_Engine, and the Dispute_Form UI layer shall not be restricted.

## 7. Summary View  *(maps to OM REQ-07)*

- REQ-031: When a recommendation is generated, the system shall display a summary containing customer name, transaction reference, transaction amount, Payment_Type, Issue_Category, Transaction_Status, Dispute_Age band, and Priority_Level.
- REQ-032: The system shall present the dispute summary and the recommendation on a single screen without requiring navigation to a separate view.

## 8. Governance (cross-cutting, AI SDLC)

- REQ-033: The system shall use mock data only and shall contain no real PII, card numbers (PCI), secrets, or external URLs in source or data.
- REQ-034: The system shall determine triage outcomes only from inspectable, named rules, with no AI/ML in the decision path.
