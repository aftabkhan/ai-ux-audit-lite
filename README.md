# AI UX Audit Lite

A focused public portfolio project demonstrating AI-assisted UX analysis, accessible frontend engineering, and structured product thinking.

> Status: Sprint 14 implementation is complete. Automated quality checks run on every pull request; final live deployment and manual release evidence are tracked separately.

## Overview

AI UX Audit Lite lets a user upload one interface screenshot, add optional context, and request a structured first-pass UX review across a limited set of common heuristics.

The project is intentionally small and limited to generic, explainable portfolio functionality.

## Current Experience

The application includes:

- Responsive Next.js App Router interface
- Accessible screenshot picker and local preview
- PNG, JPEG, and WebP validation with a 5 MB limit
- Optional screen title, target-user, and product-context fields
- Server-side `/api/audit` route
- Provider-independent audit interface
- Deterministic fixture provider for safe local development
- Screenshot-aware OpenAI provider behind the same server-side interface
- Zod validation for context and provider responses
- Stable public error mapping and no-store responses
- Accessible staged progress and recovery messaging
- Transparent directional UX score and category overview
- Audit summary with strengths and priority actions
- Severity counts and structured findings
- Search, severity filters, and category filters
- Expandable detailed findings
- Markdown copy and download
- JSON download
- Reset and new-review flow
- Lightweight request rate limiting
- Vitest tests and GitHub Actions quality workflow

Fixture mode returns schema-valid sample findings without inspecting screenshot pixels. OpenAI mode submits the screenshot and user context from the server route and validates the structured response before rendering it.

## What It Demonstrates

- UX evaluation and heuristic reasoning
- AI provider abstraction and structured-response design
- React and Next.js architecture
- TypeScript data modeling
- Accessible form and results experiences
- Runtime validation and safe error handling
- Client-side report transformation and export
- Automated quality checks
- Privacy-aware server boundaries
- Product scoping and technical documentation

## MVP

The first release supports:

- One PNG, JPG, or WebP screenshot
- Optional screen title, product context, and target-user context
- Eight limited UX review categories
- Summary and findings grouped by severity
- Actionable recommendations
- Transparent directional scoring
- Search and report filtering
- Markdown copy and download
- JSON download
- Clear AI-assisted review limitations

The MVP does not include crawling, accounts, saved history, benchmarking, continuous monitoring, formal accessibility certification, or commercial scoring.

## Review Categories

1. Visual hierarchy
2. Navigation and orientation
3. Clarity of actions
4. Consistency
5. Readability
6. Feedback and system status
7. Error prevention and recovery
8. Accessibility basics

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

## Quality Status

The `Quality / verify` workflow runs:

- Reproducible dependency installation with `npm ci`
- Typecheck
- Lint
- Unit tests
- Production build

Historical failed workflow runs remain visible because GitHub preserves past CI results. The latest protected-branch result represents the current code state.

## Run Locally

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The safe local default is:

```env
AUDIT_PROVIDER=fixture
```

Run the complete quality gate:

```bash
npm run verify
```

Individual commands:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Documentation

- [Product brief](docs/PRODUCT-BRIEF.md)
- [MVP scope](docs/MVP-SCOPE.md)
- [UX flow](docs/UX-FLOW.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Audit schema](docs/AUDIT-SCHEMA.md)
- [Intelligent audit engine](docs/INTELLIGENT-AUDIT-ENGINE.md)
- [Product experience](docs/PRODUCT-EXPERIENCE.md)
- [Quality review](docs/QA-REVIEW.md)
- [Release validation](docs/RELEASE-VALIDATION.md)
- [Release checklist](RELEASE-CHECKLIST.md)
- [Roadmap](ROADMAP.md)
- [Security and privacy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

The canonical TypeScript contract is available in [`src/types/audit.ts`](src/types/audit.ts), with runtime validation in [`lib/audit/schema.ts`](lib/audit/schema.ts).

## Privacy

Do not upload or commit confidential, personal, client-owned, employer-owned, regulated, or NDA-protected interface screenshots.

The application does not persist screenshots or audit history. Raw images and user context must not be written to logs. Provider-side handling must be reviewed against the deployment configuration before public release.

## Disclaimer

AI UX Audit Lite provides an AI-assisted first-pass review. It does not provide a formal UX audit, legal opinion, accessibility certification, security assessment, or compliance determination.

## License

MIT
