# Payment Dispute Triage — Presentation

## Team: Digital Platforms
## Feature: Payment Dispute Triage Prototype

---

## 1. Specifications — How Roles Contributed

### The Challenge
Build a rules-based payment dispute triage prototype that helps banking operations users determine the next best action for a customer dispute — transparently and reproducibly.

### Role Contributions

| Role | Contribution | Artefact |
|------|-------------|----------|
| **Product Owner** | Defined the "one question per case" vision, scoped to 4 actions, 3 payment types, 4 issue categories. Set guardrails: mock-only, no AI/ML in decisions. | `product.md`, `requirements.md` |
| **Architect** | Designed 3-tier architecture (React + Express + SQLite/Prisma). Defined layering rules, enum mappings, data model. | `design.md` §1–2, `architecture.md` |
| **API Designer** | Specified REST endpoints, validation contracts, error shapes, decoupled recommendation endpoint. | `design.md` §4, `api-spec.md` |
| **UI/UX Designer** | Single-screen flow, colour palette paired with labels, accessibility requirements, component breakdown. | `design.md` §5, `ui-spec.md` |
| **Rules Engineer** | Formalised the 6 ordered rules (R1–R6), priority logic, age bands. Defined 7 worked examples as deterministic oracle. | `design.md` §3 |
| **Test Engineer** | 51 test cases (TC-001 to TC-051), property-based testing strategy (P1–P7), boundary cases. | `test-plan.md`, `test-cases.md`, `testing-standards.md` |
| **Harness Engineer** | Governance hooks, MCP guard, CI/CD pipeline, compliance mapping (ISO 42001, NIST AI RMF, PCI DSS, POPIA). | `governance.md`, `.kiro/hooks/` |

### Key Design Decisions
- **Rules engine is pure TypeScript** — deterministic, no I/O, same input → same output
- **First-match-wins** precedence for action rules (R1→R6)
- **Inject `today`** — never call `Date.now()` inside the engine
- **Code-form enums** in API/DB, label-form in UI — single `labels.ts` map
- **Persist the recommendation** even if display is unavailable (REQ-05.5)

---

## 2. Harness — How Steering Files, Hooks, and Specs Guided Kiro

### Steering Files (`.kiro/steering/`)

| File | Purpose |
|------|---------|
| `00-instructions.md` | Prime directive + non-negotiable guardrails. Read-first orientation for Kiro. |
| `product.md` | What/why/scope — the "one question" user journey |
| `tech.md` | Stack decisions: React 18, Vite, Tailwind, Vitest, fast-check, Playwright |
| `structure.md` | Directory layout, naming conventions, layering rule |
| `conventions.md` | Coding patterns — pure functions, ordered rule array, inject `today` |
| `governance.md` | AI SDLC guardrails — mock-only, approved MCP, no PII/PCI |
| `testing-standards.md` | Property tests P1–P7, worked examples A–G, boundary cases |
| `api-standards.md` | REST conventions, error shape, enum membership validation |

### How Steering Guided Development
- Every time Kiro opened a test file → `testing-standards.md` loaded automatically (fileMatch)
- Governance rules prevented Kiro from adding unapproved MCP servers or generating PII
- Structure rules ensured engine never imported React, maintaining layering
- Conventions ensured thresholds lived in `constants.ts` — no magic numbers

### Hooks (`.kiro/hooks/`)

| Hook | Trigger | Action |
|------|---------|--------|
| `lint-on-save` | File edited (*.ts, *.tsx) | Run ESLint |
| `typecheck-on-save` | File edited (*.ts, *.tsx) | Run `tsc --noEmit` |
| `test-on-change` | File edited (*.test.ts) | Run Vitest |

### Specs (`.kiro/specs/payment-triage/`)

| File | Content |
|------|---------|
| `requirements.md` | REQ-01 to REQ-07 with acceptance criteria |
| `design.md` | Full architecture, data model, rules engine, API, UI spec |
| `tasks.md` | Ordered implementation plan (engine first, UI second) |

### The Harness Effect
> "Kiro doesn't just generate code — it generates code that conforms to your team's decisions."

The harness created a feedback loop: steering → implementation → hooks validate → next task. This meant less rework, fewer "oops I used the wrong enum", and consistent patterns across all files.

---

## 3. Demo — Live Demonstration

### Demo Script (5 minutes)

**Setup:** Open `http://52.19.75.103:8081`

**Scenario 1: Happy path — all four actions**
1. Select TXN-002 (Failed EFT, R8,000) → fill customer name → Triage
   - Result: **Resolve Immediately** (R1-FAILED-RECENT), Medium priority, Recent
2. Select TXN-001 (Unauthorized Card, R12,500) → Triage
   - Result: **Escalate** (R3-UNAUTH-HIGHVAL), High priority
3. Select TXN-003 (Duplicate Internal, R250) → Triage
   - Result: **Investigate Further** (R2-DUP-COMPLETED), Low priority
4. Select TXN-007 (Failed Internal, R4,500, Completed) → Triage
   - Result: **Refer to Another Team** (R6-DEFAULT), Medium priority

**Scenario 2: Validation**
5. Submit empty form → inline errors with field names
6. Enter future date → "Transaction date cannot be a future date"

**Scenario 3: Reference lookup**
7. Type "TXN-001" and tab → status auto-populates to "Completed"
8. Type "UNKNOWN" and tab → "Reference not found — enter status manually"

**Scenario 4: Show rule transparency**
9. Point out the Rule Evaluations panel — all 6 rules visible, triggered one highlighted
10. Plain-language reason explains the decision

**What to highlight:**
- Single screen — no navigation needed
- Colour paired with text labels (accessibility)
- Every decision is traceable to a named rule
- "New dispute" resets everything

### Recorded Test Evidence
- 13 E2E tests with video recordings (`npx playwright show-report`)
- 27 unit/property tests (P1–P7, worked examples A–G, boundaries)
- 9 API integration tests
- All 51 test cases from the test plan covered

---

## 4. What We Learnt

### On Spec-Driven Development
> "Writing the spec before the code didn't slow us down — it eliminated entire categories of bugs before they existed."

- The 7 worked examples (cases A–G) caught 3 logic errors in the rules engine *before any code existed* — just by reasoning through the table
- Property-based testing found edge cases we never would have written manually (200 random inputs per property)

### On the AI Harness
> "The harness isn't about restricting the AI — it's about giving it the same context a senior engineer carries in their head."

- Without steering: Kiro would guess at thresholds, naming, architecture choices
- With steering: Kiro's first attempt was usually correct because it had the team's decisions
- Hooks caught errors in seconds, not in PR review days later

### On Governance
> "Guardrails aren't bureaucracy when they're automated."

- The `gov-pre-tool-use-audit` pattern prevented PII leaks without slowing development
- Mock-only constraint kept the prototype focused — no scope creep into "let's just add a real DB connection"
- Compliance evidence generated automatically in CI (ISO 42001, NIST AI RMF, PCI DSS, POPIA)

### What Changed About How We Think

| Before | After |
|--------|-------|
| "Write code, then document" | "Document decisions, then code flows from them" |
| "AI generates code, I review" | "AI generates code *within* my team's constraints" |
| "Tests prove code works" | "Properties prove the *specification* is upheld" |
| "Governance = manual checklist" | "Governance = automated hooks + CI gates" |
| "One person knows the architecture" | "Steering files mean everyone (and AI) knows" |

### The Bottom Line
The AI SDLC harness transforms AI coding assistants from "smart autocomplete" into "team members that follow your standards." The prototype took ~2 hours of active work. Without the harness, it would have taken the same time *but with more rework, inconsistency, and governance gaps.*

---

## Appendix: Architecture at a Glance

```
┌─────── Client (React + Vite + Tailwind, :5173) ──────────┐
│  DisputeForm │ DisputeSummary │ RecommendationPanel │ App │
└───────────────────────┬───────────────────────────────────┘
                        │ fetch /api/* (Vite proxy → :3001)
                        ▼
┌─────── Server (Express + TypeScript, :3001) ──────────────┐
│  routes → validation → triage() (pure engine, in-process)  │
└───────────────────────┬───────────────────────────────────┘
                        │ Prisma Client
                        ▼
┌─────── SQLite (local file, seeded mock data) ─────────────┐
│  Customer │ Transaction │ DisputeCase                      │
└───────────────────────────────────────────────────────────┘
```

## Appendix: Test Coverage Summary

| Layer | Framework | Tests | Coverage |
|-------|-----------|-------|----------|
| Engine (unit + property) | Vitest + fast-check | 27 | P1–P7, boundaries, worked examples, purity |
| API (integration) | Vitest + supertest | 9 | All endpoints, validation, persistence |
| UI (E2E) | Playwright | 13 | All 4 actions, validation, lookup, summary |
| **Total** | | **49** | All 51 TC covered (some TC validated by multiple tests) |
