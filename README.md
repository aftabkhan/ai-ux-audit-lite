# AI UX Audit Lite

A focused public portfolio project demonstrating AI-assisted UX analysis, accessible frontend engineering, and structured product thinking.

> Status: MVP implementation complete. Automated quality checks are passing on `main`; manual browser and release verification remain tracked in the release checklist.

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
- Zod validation for context and provider responses
- Stable public error mapping and no-store responses
- Accessible loading, success, and recovery messaging
- Audit summary with strengths and priority actions
- Severity counts and structured findings
- Severity and category filters
- Markdown copy and download
- JSON download
- Reset and new-review flow
- Vitest tests and GitHub Actions quality workflow

The default fixture provider returns schema-valid sample findings but does not inspect screenshot pixels. A real multimodal provider can be added behind the same internal interface without changing UI components.

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
- Severity and category filtering
- Markdown copy and download
- JSON download
- Clear AI-assisted review limitations

The MVP does not include crawling, accounts, saved history, benchmarking, continuous monitoring, formal accessibility certification, or proprietary scoring.

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

The latest `main` workflow passes:

- Typecheck
- Lint
- Unit tests
- Production build

Historical failed workflow runs remain visible because GitHub preserves past CI results. The current branch state is represented by the latest successful run.

## Run Locally

```bash
npm install
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
- [Quality review](docs/QA-REVIEW.md)
- [Release checklist](RELEASE-CHECKLIST.md)
- [Roadmap](ROADMAP.md)
- [Security and privacy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

The canonical TypeScript contract is available in [`src/types/audit.ts`](src/types/audit.ts), with runtime validation in [`lib/audit/schema.ts`](lib/audit/schema.ts).

## Privacy

Do not upload or commit confidential, personal, client-owned, employer-owned, regulated, or NDA-protected interface screenshots.

The MVP does not store screenshots or audit history. Raw images and user context must not be written to logs. Provider-side data handling must be documented before a real provider is enabled.

## Disclaimer

AI UX Audit Lite provides an AI-assisted first-pass review. It does not provide a formal UX audit, legal opinion, accessibility certification, security assessment, or compliance determination.

## License

MIT
