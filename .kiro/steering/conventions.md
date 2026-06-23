---
inclusion: always
---

# Conventions — Payment Dispute Triage

## Coding style

- TypeScript **strict**; never use `any` — model unknowns with explicit unions.
- Prefer **pure functions** for all logic. Side effects (rendering, state) live
  only in React components.
- No magic numbers or string literals for domain values — import from
  `constants.ts` and the shared enums.
- Keep functions small and single-purpose. The engine is a sequence of small
  predicate checks, not one large `if/else`.
- Comment the **why**, not the what. Each rule references the requirement it
  satisfies (e.g. `// R2.4 low-value settled duplicate`).

## Rules engine patterns

- Action rules are an **ordered array** of `{ id, label, test(input, ctx),
  action, reason }`, evaluated **first match wins** (R1→R6).
- `recommend()` returns the chosen action, the `triggeredRuleId`, and **all**
  `ruleEvaluations` (every rule + matched/not-matched) for the display.
- Priority is derived top-down, **highest match wins**, default Medium; age band
  by a separate pure function (Recent/Moderate/Aged). These are independent of
  the action rules.
- Adding a rule = add one array entry + one test. Never edit unrelated rules.
- Inject `today` for age math — no `Date.now()` inside the engine.

## API & layering patterns

- 3-tier on `node-conf-starter`: `client → server routes/middleware → engine +
  Prisma`. The **engine is pure** — it imports neither Express nor Prisma;
  route handlers own all I/O.
- Route handler: `validate → triage → persist (Prisma) → respond`; error-handling
  middleware returns `400 { errors:[{field,message}] }`; never throw raw strings.
- **Enums:** DB + API use the code form (`RESOLVE_IMMEDIATELY`); the UI maps to
  labels via one `client/src/labels.ts`. Never hand-format a label inline.
- SQLite is a local file; all "integrations" are seed data — no network egress.

## React patterns

- Function components with hooks; props typed with explicit interfaces; no
  required prop without a default where sensible.
- Colour is **always paired with a text label** (accessibility + clarity) — never
  convey priority/action by colour alone.
- Components fetch via `client/src/api.ts`; triage compute stays server-side in
  `engine/`.

## Testing expectations

- Property-based tests (fast-check, 100+ iterations) for age (P1/P2), priority
  (P3), action determinism (P4), precedence (P5), validation (P6), mock lookup
  (P7).
- The seven worked examples (design §3.5, cases A–G) are asserted as a
  table-driven test and must reproduce the documented outcomes.
- UI tests assert the rule-evaluation list and plain-language reason render.

## Git / commit conventions

- Conventional commits: `feat(engine): add R-MISS-EFT refer rule`.
- **Every commit references the Jira ticket key** (e.g. `EDP-123`) so it passes
  `gov-pre-tool-use-audit` commit validation.
- Run `gov-pre-commit-review` before opening a PR.

## Data hygiene (non-negotiable)

- Mock identifiers only. **No real PII, card/account numbers, secrets, or external
  URLs** anywhere in source or data — `gov-pre-tool-use-audit` will block writes
  that contain them.
