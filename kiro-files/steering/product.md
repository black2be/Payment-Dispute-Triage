---
inclusion: always
---

# Product — Payment Dispute Triage

## What we are building

A lightweight internal prototype that lets a **banking operations user** capture a
customer payment dispute and receive a transparent, **rules-based** recommendation
for the next action. One question per case: *given this payment dispute, what is
the most appropriate next step right now?*

## Who uses it

A frontline / back-office **Operations_User** triaging customer payment disputes
one at a time. Not customer-facing.

## The single user journey

The Operations_User captures a dispute in the Dispute_Form → the Triage_Engine
classifies it → the Recommendation_Display shows the recommended action,
priority, age band, and a plain-language explanation of which rule triggered, all
on one screen.

## Recommended actions (the only four outcomes)

- **Resolve Immediately** — safe to action now
- **Investigate Further** — needs more investigation
- **Escalate** — high value, unauthorized, or aged-and-high-priority
- **Refer to Another Team** — default when no specific rule matches

## Scope guardrails (do not cross these)

- **Mock data only** (Triage_Engine). No core banking, card processing, or
  case-management integrations. No real network calls in the engine.
- **Rules-based only.** No AI/ML in the decision path. Every decision must be
  reproducible and explainable from named rules.
- **Small surface.** Payment_Type ∈ {Card Payment, EFT, Internal Transfer}.
  Issue_Category ∈ {Duplicate Debit, Failed Transfer, Missing Payment,
  Unauthorized Transaction}. Transaction_Status ∈ {Completed, Pending, Failed,
  Reversed}.
- **Simple indicators only** for priority (High/Medium/Low) and age band
  (Recent 0–7 / Moderate 8–30 / Aged > 30 days).
- **No PII or PCI.** Mock identifiers only — never real names tied to real
  accounts, card numbers, or personal data.

## What "good" looks like (judging)

Clarity, usability, and a well-scoped working prototype with transparent rules —
not a full end-to-end disputes platform. Favour a clean demo of all four outcomes
over breadth.

## Source artefacts

- Requirements: #[requirements.md](../specs/payment-triage/requirements.md)
- Design: #[design.md](../specs/payment-triage/design.md)
- Tasks: #[tasks.md](../specs/payment-triage/tasks.md)
