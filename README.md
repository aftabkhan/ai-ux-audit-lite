# AI UX Audit Lite

A focused public portfolio product demonstrating AI-assisted UX analysis, human-in-the-loop review, accessibility-aware product thinking, and structured UX engineering.

> Status: active product / public portfolio candidate. The product is not a formal accessibility certification or compliance tool.

## Product direction

AI UX Audit Lite should demonstrate a complete review lifecycle rather than a generic "AI found issues" experience:

screenshot/context input → structured AI-assisted findings → human triage → explicit severity override/rationale → reviewed result → provenance-preserving export → persistent/history workflow when implemented.

The current repository includes provider abstraction, runtime validation, filtering/export, automated quality checks, and HITL triage work with unreviewed state, review status, explicit severity override, reviewer notes, and separation of AI baseline from human review.

## AI and trust model

AI is a first-pass assistant. Findings are suggestions until reviewed. Structured output is validated before it reaches product state, and human decisions must not destroy the original AI baseline. Do not claim formal accessibility compliance from AI output.

## Next product-completion priorities

- persistent audit records where appropriate;
- reopen/read/update/archive/delete lifecycle;
- clear history/version semantics;
- robust loading, empty, timeout, malformed-output and recovery states;
- privacy controls for screenshots/context;
- critical-flow integration/E2E coverage;
- recruiter-usable public workflow that can be completed without explanation.

These are requirements, not claims of current implementation.

## Stack

- Next.js App Router
- React
- TypeScript
- Zod
- CSS
- ESLint
- Vitest and Testing Library
- GitHub Actions
- Server-side provider adapter

## Local development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The safe local default uses the fixture provider unless a supported AI provider is explicitly configured.

Run the quality gate:

```bash
npm run verify
```

## Documentation

- [`docs/README.md`](docs/README.md) — documentation map and authority order
- [`docs/CURRENT-PRODUCT-DIRECTION.md`](docs/CURRENT-PRODUCT-DIRECTION.md) — current product/UX/AI/security/reliability bar
- [`docs/PRODUCT-BRIEF.md`](docs/PRODUCT-BRIEF.md) — product framing
- [`docs/PRODUCT-EXPERIENCE.md`](docs/PRODUCT-EXPERIENCE.md) and [`docs/UX-FLOW.md`](docs/UX-FLOW.md) — experience references
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/AUDIT-SCHEMA.md`](docs/AUDIT-SCHEMA.md) — implementation contracts
- [`docs/QA-REVIEW.md`](docs/QA-REVIEW.md), [`docs/RELEASE-VALIDATION.md`](docs/RELEASE-VALIDATION.md) — quality/release evidence
- [`SECURITY.md`](SECURITY.md) — security/privacy guidance

Older sprint/release documents remain useful traceability but do not override the current product direction.

## Privacy

Do not upload or commit confidential, personal, client-owned, employer-owned, regulated, or NDA-protected interface screenshots. Raw images and user context should not be written to logs. Provider-side handling must be reviewed against deployment configuration before public use.

## License

MIT
