# AI UX Audit Lite — Current Product Direction

**Status:** Active Product / Public portfolio candidate  
**Primary purpose:** Demonstrate trustworthy human–AI collaboration for UX review, accessibility-aware product thinking, and UX engineering.

## Product outcome

A reviewer uploads an interface screenshot, receives structured AI-assisted findings, then explicitly reviews the findings before treating them as decisions. AI is a first-pass assistant, not the authority.

## Core user journey

1. Provide a supported screenshot and optional context.
2. Run the audit through the configured provider.
3. Review structured findings, severity and supporting rationale.
4. Triage each finding as unreviewed, accepted or dismissed.
5. Override severity explicitly when needed and optionally record reviewer rationale.
6. Keep AI baseline and human decision separate.
7. Recalculate the reviewed result without erasing the original AI output.
8. Export a report that preserves provenance and review state.

## Implemented evidence to preserve

Current repository work includes provider abstraction, structured/runtime validation, accessible result presentation, filtering/export, automated tests and a human-in-the-loop triage model with unreviewed state, review status, explicit severity override, reviewer note and separate AI-baseline/human-review export semantics.

## Next product requirements

To become a stronger end-to-end portfolio product, development should prioritize the audit lifecycle rather than adding more AI novelty:

- persistent audit records where appropriate;
- reopen/read prior audits;
- update review state and rationale;
- archive/delete saved audits;
- clear history/version semantics;
- reliable loading, empty, timeout, malformed-output and recovery states;
- authentication/scoped data only if persistence requires user identity;
- privacy controls for uploaded screenshots and context;
- critical-flow integration/E2E coverage;
- live public experience that a recruiter can understand without explanation.

These are requirements, not claims of current implementation.

## AI governance

- AI findings remain suggestions until reviewed.
- Structured output must be validated before it reaches product state.
- Human review must never overwrite or destroy the AI baseline.
- No autonomous remediation of a user's interface.
- Do not claim formal accessibility compliance from AI output.
- Provider errors, insufficient evidence and uncertainty require explicit UX states.
- Uploaded client/employer/confidential interfaces must not be encouraged or retained without an approved privacy model.

## Security and reliability bar

The product must use server-side provider boundaries, scoped secrets, input validation, output validation, dependency verification, explicit destructive-action confirmation where persistence is introduced, and audit-safe logging that excludes raw sensitive image/context data.

## Portfolio proof

The case study should prove: problem framing, UX audit workflow, HITL interaction design, accessibility thinking, explainability, state design, React/Next.js implementation, validation, testing, privacy boundaries and reflection. Only implemented behavior may appear as shipped capability.

## Acceptance gate

The product is Showcase Ready only when a recruiter can open it, complete the core audit/review journey, understand AI vs human decisions, recover from failure, and see a meaningful result without private explanation.
