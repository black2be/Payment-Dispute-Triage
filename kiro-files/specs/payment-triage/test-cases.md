# Test Cases — Payment Dispute Triage

**Feature:** `payment-triage`
**Owner role:** Quality Engineer
**Source:** transcribed from `Test Cases_Triage.docx` into Kiro-readable markdown;
aligned to `requirements.md` REQ-01–07. TC→REQ mapping lives in `test-plan.md`.
User-facing labels are shown (engine/API use the code form per `design.md` §2.1).

---

## Requirement 1: Capture Dispute Details

## TC-001: Capture All Required Dispute Details
- GIVEN the Operations_User is on the Dispute_Form
- WHEN the user captures customer name, transaction reference, transaction date, transaction amount, Payment_Type, Issue_Category, and description
- THEN the Dispute_Form shall allow the details to be entered
- AND the captured details shall be available for submission

## TC-002: Validate Mandatory Fields on Submit
- GIVEN the Operations_User is capturing a payment dispute
- AND all mandatory fields are populated
- WHEN the Operations_User submits the Dispute_Form
- THEN the Dispute_Form shall validate the mandatory fields successfully
- AND the dispute shall be submitted for triage processing

## TC-003: Missing Customer Name Validation
- GIVEN the Operations_User is capturing a payment dispute
- AND the customer name field is blank
- WHEN the Operations_User submits the Dispute_Form
- THEN the Dispute_Form shall block submission
- AND display an inline error identifying customer name as missing

## TC-004: Missing Transaction Reference Validation
- GIVEN the Operations_User is capturing a payment dispute
- AND the transaction reference field is blank
- WHEN the Operations_User submits the Dispute_Form
- THEN the Dispute_Form shall block submission
- AND display an inline error identifying transaction reference as missing

## TC-005: Missing Transaction Date Validation
- GIVEN the Operations_User is capturing a payment dispute
- AND the transaction date field is blank
- WHEN the Operations_User submits the Dispute_Form
- THEN the Dispute_Form shall block submission
- AND display an inline error identifying transaction date as missing

## TC-006: Missing Transaction Amount Validation
- GIVEN the Operations_User is capturing a payment dispute
- AND the transaction amount field is blank
- WHEN the Operations_User submits the Dispute_Form
- THEN the Dispute_Form shall block submission
- AND display an inline error identifying transaction amount as missing

## TC-007: Missing Payment Type Validation
- GIVEN the Operations_User is capturing a payment dispute
- AND the Payment_Type field is not selected
- WHEN the Operations_User submits the Dispute_Form
- THEN the Dispute_Form shall block submission
- AND display an inline error identifying Payment_Type as missing

## TC-008: Missing Issue Category Validation
- GIVEN the Operations_User is capturing a payment dispute
- AND the Issue_Category field is not selected
- WHEN the Operations_User submits the Dispute_Form
- THEN the Dispute_Form shall block submission
- AND display an inline error identifying Issue_Category as missing

## TC-009: Restrict Payment Type Selection
- GIVEN the Operations_User is capturing a payment dispute
- WHEN the user selects a Payment_Type
- THEN the Dispute_Form shall only allow selection of Card Payment, EFT, or Internal Transfer
- AND no unsupported payment types shall be available for selection

## TC-010: Restrict Issue Category Selection
- GIVEN the Operations_User is capturing a payment dispute
- WHEN the user selects an Issue_Category
- THEN the Dispute_Form shall only allow selection of Duplicate Debit, Failed Transfer, Missing Payment, or Unauthorized Transaction
- AND no unsupported issue categories shall be available for selection

---

## Requirement 2: Calculate Dispute Age

## TC-011: Calculate Dispute Age from Transaction Date
- GIVEN the Operations_User enters a valid transaction date
- WHEN the transaction date is captured
- THEN the Triage_Engine shall calculate the Dispute_Age in calendar days
- AND the Dispute_Age shall be the difference between the transaction date and the current date

## TC-012: Reject Future Transaction Date
- GIVEN the Operations_User enters a transaction date later than the current date
- WHEN the date is validated
- THEN the Dispute_Form shall display an error stating the transaction date cannot be a future date
- AND the dispute shall not proceed to triage processing

## TC-013: Classify Recent Dispute Age Band
- GIVEN the transaction date results in a Dispute_Age between 0 and 7 calendar days
- WHEN the Triage_Engine calculates the Dispute_Age
- THEN the Triage_Engine shall classify the Dispute_Age band as "Recent"

## TC-014: Classify Moderate Dispute Age Band
- GIVEN the transaction date results in a Dispute_Age between 8 and 30 calendar days
- WHEN the Triage_Engine calculates the Dispute_Age
- THEN the Triage_Engine shall classify the Dispute_Age band as "Moderate"

## TC-015: Classify Aged Dispute Age Band
- GIVEN the transaction date results in a Dispute_Age greater than 30 calendar days
- WHEN the Triage_Engine calculates the Dispute_Age
- THEN the Triage_Engine shall classify the Dispute_Age band as "Aged"

---

## Requirement 3: Determine Priority Level

## TC-016: Assign High Priority for Amount Greater Than 10,000
- GIVEN a dispute is submitted
- AND the transaction amount is greater than 10,000
- WHEN the Triage_Engine evaluates the priority rules
- THEN the Triage_Engine shall assign Priority_Level "High"
- AND the High priority rule shall take precedence over Medium or Low

## TC-017: Assign High Priority for Unauthorized Transaction
- GIVEN a dispute is submitted
- AND the Issue_Category is "Unauthorized Transaction"
- WHEN the Triage_Engine evaluates the priority rules
- THEN the Triage_Engine shall assign Priority_Level "High"
- AND the priority shall be High regardless of other attributes

## TC-018: High Priority Takes Precedence Over Other Conditions
- GIVEN a dispute has transaction amount greater than 10,000
- AND the Dispute_Age band is Recent
- WHEN the Triage_Engine evaluates the priority rules
- THEN the Triage_Engine shall assign Priority_Level "High"
- AND no lower priority shall override the High result

## TC-019: Assign Medium Priority for Moderate Age and Amount 1,000–10,000
- GIVEN a dispute is submitted
- AND no High priority condition is met
- AND the transaction amount is between 1,000 and 10,000 inclusive
- AND the Dispute_Age band is "Moderate"
- WHEN the Triage_Engine evaluates the priority rules
- THEN the Triage_Engine shall assign Priority_Level "Medium"

## TC-020: Assign Medium Priority for Aged Case and Amount 1,000–10,000
- GIVEN a dispute is submitted
- AND no High priority condition is met
- AND the transaction amount is between 1,000 and 10,000 inclusive
- AND the Dispute_Age band is "Aged"
- WHEN the Triage_Engine evaluates the priority rules
- THEN the Triage_Engine shall assign Priority_Level "Medium"

## TC-021: Assign Low Priority for Recent Dispute Below 1,000
- GIVEN a dispute is submitted
- AND no High or Medium priority condition is met
- AND the transaction amount is below 1,000
- AND the Dispute_Age band is "Recent"
- WHEN the Triage_Engine evaluates the priority rules
- THEN the Triage_Engine shall assign Priority_Level "Low"

## TC-022: Assign Default Medium Priority When No Rule Matches
- GIVEN a dispute is submitted
- AND no High, Medium, or Low priority condition is met
- WHEN the Triage_Engine evaluates the priority rules
- THEN the Triage_Engine shall assign Priority_Level "Medium"
- AND Medium shall be applied as the default priority

---

## Requirement 4: Generate Recommended Action

## TC-023: Recommend Resolve Immediately for Failed Recent Dispute
- GIVEN Transaction_Status is "Failed"
- AND the Dispute_Age band is "Recent"
- WHEN the Triage_Engine evaluates the recommended action rules
- THEN the Triage_Engine shall recommend "Resolve Immediately"
- AND this shall be identified as the triggered rule (R1)

## TC-024: Recommend Investigate Further for Duplicate Debit and Completed
- GIVEN Issue_Category is "Duplicate Debit"
- AND Transaction_Status is "Completed"
- WHEN the Triage_Engine evaluates the recommended action rules
- THEN the Triage_Engine shall recommend "Investigate Further"
- AND this shall be identified as the triggered rule (R2)

## TC-025: Recommend Escalate for Unauthorized Transaction Above 10,000
- GIVEN Issue_Category is "Unauthorized Transaction"
- AND the transaction amount is greater than 10,000
- WHEN the Triage_Engine evaluates the recommended action rules
- THEN the Triage_Engine shall recommend "Escalate"
- AND this shall be identified as the triggered rule (R3)

## TC-026: Recommend Investigate Further for EFT Missing Payment
- GIVEN Issue_Category is "Missing Payment"
- AND Payment_Type is "EFT"
- WHEN the Triage_Engine evaluates the recommended action rules
- THEN the Triage_Engine shall recommend "Investigate Further"
- AND this shall be identified as the triggered rule (R4)

## TC-027: Recommend Escalate for Aged High Priority Dispute
- GIVEN the Dispute_Age band is "Aged"
- AND Priority_Level is "High"
- WHEN the Triage_Engine evaluates the recommended action rules
- THEN the Triage_Engine shall recommend "Escalate"
- AND this shall be identified as the triggered rule (R5)

## TC-028: Recommend Refer to Another Team When No Rule Matches
- GIVEN a dispute does not match any specific recommended action rule
- WHEN the Triage_Engine completes rule evaluation
- THEN the Triage_Engine shall recommend "Refer to Another Team"
- AND this shall be applied as the default action (R6)

## TC-029: Apply Recommendation Rules in Defined Precedence Order
- GIVEN a dispute matches more than one recommended action rule
- WHEN the Triage_Engine evaluates the rules
- THEN the Triage_Engine shall apply rules in precedence order 1 to 5
- AND the first matching rule shall determine the Recommended_Action
- AND subsequent matching rules shall be ignored

## TC-030: Precedence Rule 1 Overrides Later Matching Rules
- GIVEN Transaction_Status is "Failed"
- AND the Dispute_Age band is "Recent"
- AND the dispute also matches a later recommendation rule
- WHEN the Triage_Engine evaluates the rules
- THEN the Triage_Engine shall recommend "Resolve Immediately"
- AND no later rule shall override the recommendation

---

## Requirement 5: Display Recommendation with Reasoning

## TC-031: Display Recommended Action Label
- GIVEN the Triage_Engine has generated a Recommended_Action
- WHEN the recommendation is displayed
- THEN the Recommendation_Display shall show the action label
- AND it shall be one of Resolve Immediately, Investigate Further, Escalate, or Refer to Another Team

## TC-032: Display Evaluated Rules and Triggered Rule
- GIVEN the Triage_Engine has generated a Recommended_Action
- WHEN the recommendation is displayed
- THEN the Recommendation_Display shall show the list of rules evaluated
- AND indicate which rule triggered the recommendation

## TC-033: Display Priority Level and Dispute Age Band
- GIVEN the Triage_Engine has generated a Recommended_Action
- WHEN the recommendation is displayed
- THEN the Recommendation_Display shall show the Priority_Level
- AND show the Dispute_Age band used in the decision

## TC-034: Display Plain Language Reasoning
- GIVEN the Triage_Engine has generated a Recommended_Action
- WHEN the reasoning is displayed
- THEN the Recommendation_Display shall present the reasoning in plain language
- AND it shall be understandable without technical system knowledge

## TC-035: Log Recommendation When Display Component Is Unavailable
- GIVEN the Recommendation_Display is unavailable
- WHEN the Triage_Engine generates a recommendation
- THEN the Triage_Engine shall still produce the recommendation
- AND the recommendation shall be logged independently for later review

---

## Requirement 6: Support Mock Data

## TC-036: Pre-Populate Transaction Status for Valid Reference
- GIVEN the Operations_User enters a valid transaction reference
- AND the reference exists in the mock transaction dataset
- WHEN the Dispute_Form validates the reference
- THEN the Dispute_Form shall pre-populate Transaction_Status from the mock dataset

## TC-037: Allow Manual Transaction Status Selection for Unknown Reference
- GIVEN the Operations_User enters a transaction reference
- AND the reference does not match any record in the mock dataset
- WHEN the Dispute_Form validates the reference
- THEN the Dispute_Form shall allow the user to manually select Transaction_Status
- AND the options shall be Completed, Pending, Failed, or Reversed

## TC-038: Operate Using Mock Data Only
- GIVEN the prototype is being used
- WHEN the Triage_Engine processes a dispute
- THEN the Triage_Engine shall operate entirely on mock dispute, customer, and transaction data
- AND it shall not connect to external banking, card processing, or case-management systems

## TC-039: Mock Data Restriction Applies to Triage Engine Only
- GIVEN the architecture supports future enhancements
- WHEN reviewing mock data restrictions
- THEN the restriction shall apply only to the Triage_Engine
- AND the Dispute_Form UI layer shall not be restricted from future external integrations

---

## Requirement 7: Display Dispute Summary

## TC-040: Display Full Dispute Summary with Recommendation
- GIVEN a Recommended_Action has been generated
- WHEN the Recommendation_Display presents the result
- THEN it shall show a summary with customer name, transaction reference, transaction amount, Payment_Type, Issue_Category, Transaction_Status, Dispute_Age band, and Priority_Level
- AND the Recommended_Action shall be shown with the summary

## TC-041: Display Summary and Recommendation on a Single Screen
- GIVEN a Recommended_Action has been generated
- WHEN the Operations_User views the Recommendation_Display
- THEN the dispute summary and recommendation shall be displayed on a single screen
- AND the user shall not need to navigate to a separate view

---

## Additional Negative and Edge Cases

## TC-042: Invalid Payment Type Injection
- GIVEN an unsupported Payment_Type is injected into the dispute data
- WHEN the Dispute_Form or Triage_Engine validates the dispute
- THEN the system shall reject the unsupported Payment_Type
- AND the dispute shall not proceed with invalid payment data

## TC-043: Invalid Issue Category Injection
- GIVEN an unsupported Issue_Category is injected into the dispute data
- WHEN the Dispute_Form or Triage_Engine validates the dispute
- THEN the system shall reject the unsupported Issue_Category
- AND the dispute shall not proceed with invalid issue category data

## TC-044: Boundary — Recent Age Band at 7 Days
- GIVEN the calculated Dispute_Age is exactly 7 calendar days
- WHEN the Triage_Engine classifies the Dispute_Age
- THEN the Dispute_Age band shall be "Recent"

## TC-045: Boundary — Moderate Age Band at 8 Days
- GIVEN the calculated Dispute_Age is exactly 8 calendar days
- WHEN the Triage_Engine classifies the Dispute_Age
- THEN the Dispute_Age band shall be "Moderate"

## TC-046: Boundary — Moderate Age Band at 30 Days
- GIVEN the calculated Dispute_Age is exactly 30 calendar days
- WHEN the Triage_Engine classifies the Dispute_Age
- THEN the Dispute_Age band shall be "Moderate"

## TC-047: Boundary — Aged Band at 31 Days
- GIVEN the calculated Dispute_Age is 31 calendar days
- WHEN the Triage_Engine classifies the Dispute_Age
- THEN the Dispute_Age band shall be "Aged"

## TC-048: Boundary — High Priority Amount at 10,000.01
- GIVEN the transaction amount is 10,000.01
- WHEN the Triage_Engine evaluates the priority rules
- THEN the Triage_Engine shall assign Priority_Level "High"

## TC-049: Boundary — Medium Priority Amount at 10,000
- GIVEN the transaction amount is 10,000
- AND the Dispute_Age band is "Moderate"
- AND Issue_Category is not "Unauthorized Transaction"
- WHEN the Triage_Engine evaluates the priority rules
- THEN the Triage_Engine shall assign Priority_Level "Medium"

## TC-050: Boundary — Low Priority Amount at 999.99
- GIVEN the transaction amount is 999.99
- AND the Dispute_Age band is "Recent"
- AND no High or Medium condition is met
- WHEN the Triage_Engine evaluates the priority rules
- THEN the Triage_Engine shall assign Priority_Level "Low"

## TC-051: Boundary — Medium Priority Amount at 1,000
- GIVEN the transaction amount is 1,000
- AND the Dispute_Age band is "Moderate"
- AND no High priority condition is met
- WHEN the Triage_Engine evaluates the priority rules
- THEN the Triage_Engine shall assign Priority_Level "Medium"
