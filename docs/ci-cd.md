# CI/CD — Payment Dispute Triage

**Platform:** GitHub Actions (`.github/workflows/ci.yml`)
**Scope:** CI only — no deploy stage (live deployment must go through the AI SDLC
**Deployment Approval Gate**, so it is intentionally excluded from automated CI).
**Trigger:** every push to `main` and every pull request to `main`.

## Jobs

### 1. Build & Test (`build-test`)
Runs on Node 22 (from `.nvmrc`), installs the workspaces from the lockfile
(`npm ci`), then:
- generates the Prisma client + applies migrations against a throwaway SQLite DB
  (guarded — only if `server/prisma/schema.prisma` exists);
- `npm run lint` (ESLint), `npm run format:check` (Prettier);
- `npm run build` (type-check + bundle both apps);
- `npm test` (Vitest unit + integration, both workspaces);
- `npx playwright install --with-deps` + `npm run test:e2e` (Playwright);
- uploads the Playwright report as an artifact.

### 2. Dependency CVE/Malware (`dependency-scan`) — *governance*
Mirrors `gov-cve-build-gate`. Runs **OSV-Scanner** over the repo:
- **Malware (OSV `MAL-*` / malicious-packages) BLOCKS the build.**
- CRITICAL/HIGH CVEs are surfaced in the log (warn) but do not fail — fixes are
  often upstream.
- The full JSON result is uploaded as an artifact.

### 3. Secrets & PII (`secrets-pii`) — *governance*
Enforces the mock-only rule:
- **gitleaks** scans history for secrets/tokens.
- A grep blocks any 13–19 digit run (PAN/account-number shaped) in `server/`,
  `client/`, or `docs/`. Mock tokens like `MOCK-AC-001` do not match.

### 4. Compliance Evidence (`compliance-evidence`) — *governance*
After the other jobs, emits `compliance-evidence.json` (commit, gate results, and
a mapping to ISO/IEC 42001, NIST AI RMF 1.0, PCI DSS v4.0, POPIA) and uploads it
as a 30-day artifact — the CI analogue of `ai-sdlc check --report`.

## What CI does not do
- **No deploy.** Adding a deploy job must route through the Deployment Approval
  Gate; do not bypass it in CI.
- **No secret-bearing steps.** The pipeline needs no cloud credentials; everything
  runs locally on the runner with mock data.

## Relationship to the Kiro governance hooks
The Kiro `gov-*` hooks guard the developer's workstation (pre-tool-use audit,
pre-commit review, CVE/dep gates). This CI is the **server-side backstop** that
re-runs the equivalent checks on every push/PR, so nothing depends on a single
developer's local setup.

## Notes
- The workflow is written for the finished app; jobs go green as the
  `server/` + `client/` code lands (the Prisma step is guarded until the schema
  exists).
- Branch protection: require the `Build & Test`, `Dependency CVE/Malware`, and
  `Secrets & PII` checks to pass before merge.
