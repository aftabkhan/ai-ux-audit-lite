# Roadmap

## v0.1 — Foundation

Status: Complete

- Product brief
- MVP scope
- UX flow
- Architecture
- Audit schema
- Privacy and safety boundaries
- Contribution guidance

## v0.2 — Application Shell

Status: Complete

- Initialize Next.js and TypeScript
- Add global layout and design tokens
- Build responsive landing page
- Add accessible screenshot input
- Add context fields and validation
- Add preview, empty, error, and status states

## v0.3 — Audit Engine

Status: Complete

- Add server-side audit route
- Add provider adapter
- Add structured-output validation
- Normalize provider responses
- Add safe error handling
- Add deterministic fixture for local development
- Connect the form to the server route

## v0.4 — Results Experience

Status: Complete

- Render summary and severity counts
- Add accessible findings list
- Add filtering by severity and category
- Add Markdown copy and download
- Add JSON download
- Add reset and new-review flow
- Add filtered empty state and export feedback

## v0.5 — Quality Tooling

Status: Implemented, verification pending

- Add Vitest and Testing Library configuration
- Add tests for screenshot validation
- Add tests for audit response schemas
- Add tests for Markdown export
- Add combined `npm run verify` quality gate
- Add GitHub Actions workflow for typecheck, lint, tests, and build
- Document accessibility, responsive, security, and privacy review
- Add evidence-based release checklist

The release checklist remains open until commands and manual browser checks have been run successfully.

## v1.0 — Portfolio Release

Status: Planned

- Complete CI and local verification
- Complete keyboard, screen-reader, responsive, and automated accessibility checks
- Decide whether fixture-only deployment is sufficient for the portfolio
- Connect and document a real multimodal provider only after privacy and cost controls are approved
- Add rate limiting before unrestricted public use
- Deploy the application
- Add screenshots and demo media
- Add final architecture diagram
- Publish known limitations
- Write portfolio case-study summary

## Non-Goals

The roadmap does not include proprietary scoring, continuous monitoring, website crawling, benchmarking, or private commercial capabilities.
