---
name: frontend-design
description: Design and style the React + Vite + Tailwind UI for the payment-triage prototype — visual system, layout, the fixed action/priority/age palette, accessibility, and single-screen flow. Use when building or restyling DisputeForm, DisputeSummary, RecommendationPanel, or App.
---

# Frontend design

Reusable instruction package for the **look, layout, and interaction** of the
payment-triage UI. Pairs with `react-page-from-ui-spec` (which scaffolds a
component); this skill governs *how it should look and feel*. Consistent with
`.kiro/steering/` and `design.md` §5.

## When to use

Building or restyling `DisputeForm`, `DisputeSummary`, `RecommendationPanel`, or
`App`; setting up the Tailwind theme; or reviewing UI for visual + accessibility
consistency.

## Design principles

1. **Operations tool, not a marketing page.** Calm, dense-but-legible, fast to
   scan. The user triages disputes all day — prioritise clarity over flourish.
2. **One screen, no navigation** (REQ-07.2). Form on the left/top, summary +
   recommendation on the right/below — both visible after submit.
3. **Decision first.** The recommended action is the most prominent element on
   the result side; reasoning is one glance away.
4. **Colour is never the only signal** — always pair it with a text label or icon
   (accessibility + colour-blind safety).

## Visual system

### Colour — semantic only (Tailwind tokens)

Use the **fixed palette** from `design.md` §5.4; do not invent new colours for
status meaning.

| Meaning | Token (Tailwind) | Used for |
| --- | --- | --- |
| Resolve Immediately / Recent / Low-ok | `green-600` / `green-100` bg | action chip, age badge |
| Investigate Further / Moderate | `amber-600` / `amber-100` bg | action chip, age/priority badge |
| Escalate / Aged / High | `red-600` / `red-100` bg | action chip, badges |
| Refer to Another Team | `blue-600` / `blue-100` bg | action chip |
| Low priority | `gray-500` / `gray-100` bg | priority badge |
| Surfaces | `white` card on `gray-50` page; `gray-200` borders | layout |
| Text | `gray-900` primary, `gray-500` secondary | — |

Map enum **code → label → colour** through one place (`client/src/labels.ts` +
a small `tone()` helper). Never hard-code a label or colour inside a component.

### Typography & spacing

- System/`Inter` sans; `text-sm` body, `text-lg`/`font-semibold` section titles,
  `text-2xl font-bold` for the action headline.
- 8px spacing scale (Tailwind `2/3/4/6`); cards `rounded-xl border p-4 shadow-sm`;
  comfortable `gap-4` between fields.

### Components

- **Badges** (`PriorityBadge`, `AgeBadge`): pill, `rounded-full px-2 py-0.5
  text-xs font-medium`, coloured bg + darker text + the label word.
- **Action banner** (RecommendationPanel): full-width coloured block, large label,
  short reason beneath.
- **Rule-evaluation list**: each of the 6 rules as a row; triggered rule
  highlighted (ring/filled), others muted with a ✓/– matched indicator.
- **Form fields**: label above input; inline error in `red-600 text-xs` beneath
  the field; invalid input gets `border-red-400`.

## Layout

```
┌───────────────────────────── App (single screen) ──────────────────────────┐
│  Dispute Capture                     │   Result                              │
│  ┌────────────────────────────────┐  │  ┌─────────────────────────────────┐ │
│  │ DisputeForm (fields, dropdowns)│  │  │ Action banner (coloured)        │ │
│  │ inline validation               │  │  │ Priority + Age badges           │ │
│  │ [ Submit ]                      │  │  │ Plain-language reason           │ │
│  └────────────────────────────────┘  │  │ DisputeSummary (8 fields)       │ │
│                                       │  │ Rule-evaluation list (6 rules)  │ │
│                                       │  └─────────────────────────────────┘ │
└──────────────────────────────────────┴───────────────────────────────────────┘
```

Two columns on desktop (`md:grid-cols-2`), stacked on small screens
(`grid-cols-1`). The result column is empty/placeholder before first submit.

## Accessibility (required)

- Every input has a `<label htmlFor>`; errors linked via `aria-describedby` and
  `aria-invalid`.
- Badges/chips carry their text label — colour is supplementary, contrast ≥ 4.5:1.
- Full keyboard path: tab order top-to-bottom, visible focus ring, Enter submits.
- Announce the recommendation via an `aria-live="polite"` region on result.

## Steps

1. Read `design.md` §5 for the target component and which REQ it serves.
2. Apply the palette/typography/spacing above via Tailwind utility classes only
   (no inline hex, no new CSS files unless a token is genuinely missing).
3. Route enum → label → colour through `labels.ts` + `tone()`.
4. Verify accessibility checklist; check the two-column → stacked responsive
   behaviour.
5. Confirm colour is never the sole signal and the action is the most prominent
   result element.

## Guardrails

- Stay within the approved stack (`tech.md`): React + Vite + **Tailwind** only —
  no UI kit dependency without justification (CVE gate).
- No PII/PCI in placeholder/sample text. No browser storage. No external font/CDN
  calls — bundle fonts or use the system stack.
- Compute stays server-side; components fetch via `client/src/api.ts` and render
  props only.
