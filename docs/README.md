# AI UX Audit Lite — Documentation Map

This folder is organized around the current product direction first, with implementation/reference documents kept for traceability.

## Start here

1. [`CURRENT-PRODUCT-DIRECTION.md`](CURRENT-PRODUCT-DIRECTION.md) — current product purpose, UX model, AI/HITL rules, reliability/security bar, and portfolio-readiness requirements.
2. [`STRATEGY-THREAT-MODEL.md`](STRATEGY-THREAT-MODEL.md) — Phase 1 scope, actors, trust boundaries, invariants, STRIDE/OWASP threats, acceptance evidence, and the blocking persistence/identity decision for the next product-completion release.
3. [`PRODUCT-BRIEF.md`](PRODUCT-BRIEF.md) — original product framing and problem definition.
4. [`PRODUCT-EXPERIENCE.md`](PRODUCT-EXPERIENCE.md) and [`UX-FLOW.md`](UX-FLOW.md) — interaction model and current user journey.
5. [`ARCHITECTURE.md`](ARCHITECTURE.md), [`AUDIT-SCHEMA.md`](AUDIT-SCHEMA.md), and [`INTELLIGENT-AUDIT-ENGINE.md`](INTELLIGENT-AUDIT-ENGINE.md) — implementation contracts.
6. [`QA-REVIEW.md`](QA-REVIEW.md), [`RELEASE-VALIDATION.md`](RELEASE-VALIDATION.md), and [`DEPLOYMENT.md`](DEPLOYMENT.md) — quality and release evidence.

## Current authority

`CURRENT-PRODUCT-DIRECTION.md` is the active product-development authority for new work. `STRATEGY-THREAT-MODEL.md` governs the Phase 1 gate for the next product-completion release and must not override the product direction. Existing documents remain useful implementation/history references, but where an older statement conflicts with the current direction, the current direction wins.

## Documentation rule

Do not add speculative features as facts. A capability may be described as implemented only when the repository contains the working behavior and it has been reviewed/tested. Future requirements must be labelled as planned, required, backlog, blocked, or not applicable.