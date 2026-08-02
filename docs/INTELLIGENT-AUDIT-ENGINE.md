# Intelligent Audit Engine

Sprint 13 turns the project from a fixture-only demonstration into a screenshot-aware first-pass UX review tool while preserving fixture mode for development and tests.

## Provider modes

### Fixture

`AUDIT_PROVIDER=fixture`

Returns deterministic sample content. It does not inspect screenshot pixels and must never be presented as a real audit.

### OpenAI

`AUDIT_PROVIDER=openai`

Requires the server-only `OPENAI_API_KEY`. `OPENAI_AUDIT_MODEL` defaults to `gpt-5` and can be overridden without changing application code.

The provider sends the screenshot as an image input together with optional screen title, target user, and product context. The response is normalized through the existing audit schema before it reaches the UI.

## Review model

The prompt evaluates one screenshot across:

1. Visual hierarchy
2. Navigation and orientation
3. Clarity of actions
4. Consistency
5. Readability
6. Feedback and system status
7. Error prevention and recovery
8. Accessibility basics

Each finding includes visible evidence, likely impact, recommendation, severity, and confidence.

## Guardrails

- The model is told not to invent hidden flows, analytics, implementation details, user research, keyboard behavior, screen-reader behavior, or precise contrast ratios.
- Accessibility output is framed as a visual first pass, not a WCAG conformance result.
- Provider output must pass runtime schema validation.
- Provider errors are mapped to safe public recovery messages.
- Requests use `Cache-Control: no-store`.
- OpenAI Responses requests set `store: false`.
- The application applies a lightweight five-audits-per-ten-minutes process-level limit.
- Screenshots are not written to application storage.

## Production limitations

The in-memory rate limiter is suitable for a portfolio deployment but is not a globally consistent distributed limit. A commercial deployment should use a shared rate-limit store, authentication or abuse controls, usage budgets, monitoring, and a documented provider data policy.

AI output remains advisory. Teams should validate recommendations with research, analytics, accessibility testing, and expert review.
