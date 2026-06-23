# Harness Walkthrough — How the Spec Pack & Steering Guided Kiro

**Role:** Harness Engineer (Kiro Engineer)
**Purpose:** Show the artefacts that shaped the build and trace them into the code
Kiro actually produced — including where the output drifted from the steering.

---

## 1. The harness at a glance

Four layers feed Kiro. Specs say **what** to build; steering says **how** and is
always-on; hooks enforce **quality gates**; skills are reusable recipes.

```
docs/  (Day-1 human spec pack)          .kiro/  (what Kiro reads)
├── requirements.md   (EARS, BA)        ├── steering/   persistent context (how)
├── architecture.md   (Architect)       ├── specs/      requirements→design→tasks (what)
├── api-spec.md       (API Designer)     ├── hooks/      automation gates (quality)
├── ui-spec.md        (UI/UX)            └── skills/     reusable instruction packages
├── test-cases.md     (Test Architect)
└── test-plan.md      (QE traceability)
```

---

## 2. Steering files and their inclusion modes

The **inclusion mode** is the core mechanism — it decides *when* each file enters
Kiro's context.

| File | Inclusion | What it governs |
| --- | --- | --- |
| `00-instructions.md` | **always** | Master orientation: prime directive, 5 guardrails, layering, "engine first" |
| `product.md` | always | What/why, the four actions, scope guardrails |
| `tech.md` | always | Stack decisions (React 18, Vite, Tailwind, Express, Prisma, Vitest, fast-check) |
| `structure.md` | always | File layout, naming, stable rule IDs, layering rule |
| `conventions.md` | always | Coding patterns (rules-as-array, inject `today`, no magic numbers) |
| `governance.md` | always | AI SDLC guardrails (mock-only, no AI/ML, no PII) |
| `testing-standards.md` | **fileMatch** `**/*.test.{ts,tsx}` | Auto-loads only when a test file is open (P1–P7, boundaries) |
| `api-standards.md` | **manual** (`#api-standards`) | REST contract, pulled in on demand |

Why the modes matter (context budgeting, the Harness Engineer's lever):
- **always** → product/tech/structure/conventions/governance/00-instructions sit
  in *every* prompt, so the rules are ambient — Kiro never has to be re-told the
  stack or the layering.
- **fileMatch** → `testing-standards.md` only consumes context while Kiro is
  editing a `*.test.ts` file.
- **manual** → `api-standards.md` stays out of the way until someone types
  `#api-standards`.

Hooks (`.kiro/hooks/`): `lint-on-save`, `typecheck-on-save`, `test-on-change`
(`.kiro.hook`). Skills: `frontend-design`, `react-page-from-ui-spec`.

---

## 3. Spec → code trace (evidence the steering worked)

Specific steering/spec rules map straight into the generated code:

| Steering / spec rule | Where it landed in the code |
| --- | --- |
| `structure.md`: engine = ageCalculator / priorityCalculator / actionRecommender / triage / validation / constants / types | `server/src/engine/` contains exactly those seven files |
| `structure.md`: stable rule IDs `R1-FAILED-RECENT … R6-DEFAULT`, never renumber | `actionRecommender.ts` uses those IDs verbatim |
| `conventions.md`: ordered rule array `{id,label,test,action,reason}`, first-match, return `ruleEvaluations`, inject `today` | `actionRecommender.ts` + `triage(input, today)` match precisely |
| `design.md §2.1`: code-form enums | server engine uses `RESOLVE_IMMEDIATELY`, `UNAUTHORIZED_TRANSACTION`, etc. |
| `design.md §2.3`: thresholds in one `constants.ts` | `constants.ts` = `HIGH_AMOUNT 10_000`, `LOW_AMOUNT 1_000`, `AGE_RECENT_MAX 7`, `AGE_MODERATE_MAX 30` |
| `product.md`: exactly four actions, four enums | no scope creep — four actions, four payment/issue values |
| `requirements.md` REQ-01.6 (enum injection, TC-042/043) | `validation.ts` rejects unsupported `paymentType`/`issueCategory` |
| `tech.md`: stack incl. fast-check | `package.json` matches the exact dependency set |
| `testing-standards.md`: P1–P7 property tests | `tests/engine/` has age / priority / action / validation / mockLookup / workedExamples |
| `api-spec.md`: endpoint set | `server/src/routes.ts` implements customers, transactions, disputes, recommendation, lifecycle PATCH, health |

The boundary values prove fidelity: `classifyAgeBand` returns Recent/Moderate/
Aged at the exact 7/8/30/31-day cuts from the spec, and `determinePriority`
follows High→Medium→Low→default Medium — matching test-cases TC-044…051.

---

## 4. Where steering did NOT hold (the Day-2 signal)

Steering is **guidance, not a hard gate** — only hooks block. Two always-loaded
rules were not enforced by the build:

- `structure.md` / `governance.md`: *"the engine is the only place triage logic
  lives; layering is client → server → engine."*
- **What actually happened:** the client grew its **own duplicate engine**
  (`src/engine/*`) and runs `triage()` in the browser (`App.tsx`), bypassing the
  server. The two copies have since diverged — client uses display-label enums and
  a `disputeDate` field; server uses code-form enums and `transactionDate`.

This is the textbook Harness Engineer Day-2 moment: the always-on rule shaped most
of the build but didn't *prevent* the drift. The remedy is to **tighten the
steering and/or add a hook**, then re-run:
- sharpen the layering rule in `structure.md` (e.g. "the client MUST call the API;
  no triage logic under `src/`"),
- add a hook that fails when a second `triage`/`actionRecommender` appears outside
  `server/src/engine/`,
- or consciously decide on a client-only demo and delete the server duplication.

---

## 5. The takeaway

| Layer | Question it answers | Enforced by |
| --- | --- | --- |
| Specs (`requirements/design/tasks`) | *What* to build | Kiro executes tasks |
| Steering (`always`/`fileMatch`/`manual`) | *How* to build it | Ambient context (soft) |
| Hooks | *Quality gates* | Blocking (hard) |
| Skills | Reusable recipes | On invocation |

Steering moved the build a long way in the right direction — stack, structure,
rule IDs, enums, tests all landed as specified. The one architectural drift it
didn't catch is exactly what the Harness Engineer tunes next: soft guidance shapes
behaviour; hard gates enforce it.
