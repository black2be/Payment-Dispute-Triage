---
name: react-page-from-ui-spec
description: Generate a React + TypeScript component from a UI spec section in design.md, following project steering. Use when scaffolding DisputeForm, DisputeSummary, RecommendationPanel, or App.
---

# Create a React component from the UI spec

Reusable instruction package for building one component from `design.md` §5,
consistent with `.kiro/steering/`.

## Inputs

- The target component: **DisputeForm**, **DisputeSummary**,
  **RecommendationPanel**, or **App**.
- `#[design.md](../../specs/payment-triage/design.md)` §5 for the spec.
- Steering: `tech.md`, `structure.md`, `conventions.md` (loaded as `always`).

## Steps

1. **Read the spec** for the target in design §5 — fields, indicators, flow, and
   which REQ it satisfies (REQ-01, REQ-05, REQ-06, REQ-07).
2. **Place files** per `structure.md`: component in `src/components/PascalCase.tsx`.
   Engine logic stays out of the component — call `triage()` / `lookupTransaction()`.
3. **Type props** with an explicit interface; enum/union values must match the
   glossary verbatim (`'Resolve Immediately'`, `'Aged'`, `'Completed'`, …).
4. **Indicators:** use the fixed palette (design §5.5). Always pair colour with a
   text label — never colour alone.
5. **Wire data** through the engine entry point (`triage(input, today)`) and
   `lookupTransaction(ref)` — no real network calls in the engine.
6. **Write a component test** in `tests/components/` asserting the key elements
   render (per `testing-standards.md`).
7. **Self-check:** run lint + type-check; confirm the layering rule (component →
   engine/data, never the reverse).

## Output

- One component file and one test file.
- A one-line note of which REQ ids the component now satisfies.

## Guardrails

- No PII/PCI/secrets/URLs. No browser storage. No new dependencies without
  justification (CVE gate). Stay within the approved stack in `tech.md`.
