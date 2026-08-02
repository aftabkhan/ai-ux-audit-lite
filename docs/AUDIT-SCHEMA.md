# Audit Schema

## Purpose

Define the stable contract between the server-side AI adapter and the user interface.

The application must render only normalized, validated data. Provider-specific response formats must never leak into UI components.

## Result Shape

```ts
interface AuditResult {
  version: "1.0";
  generatedAt: string;
  context: AuditContext;
  summary: AuditSummary;
  findings: AuditFinding[];
  disclaimer: string;
}
```

## Finding Requirements

Every finding must include:

- Stable identifier
- Clear title
- Severity: `high`, `medium`, or `low`
- One supported review category
- Observation grounded in the submitted screenshot
- User or product impact
- Actionable recommendation
- Confidence: `high`, `medium`, or `low`

## Review Categories

- `visual-hierarchy`
- `navigation-orientation`
- `clarity-of-actions`
- `consistency`
- `readability`
- `feedback-system-status`
- `error-prevention-recovery`
- `accessibility-basics`

## Output Rules

- Do not claim legal or standards compliance.
- Do not state that an accessibility issue is definitively WCAG-nonconformant from screenshot evidence alone.
- Do not invent product context that the user did not provide.
- Distinguish visible evidence from inference.
- Recommendations must be specific enough to act on.
- Duplicate findings should be merged.
- Findings without visible or contextual support should be removed.

## Severity Guidance

### High

Likely to block task completion, create a serious misunderstanding, or materially exclude users.

### Medium

Likely to slow users, increase errors, or reduce comprehension, but does not clearly block the primary task.

### Low

A refinement that improves clarity, consistency, readability, or polish.

## Confidence Guidance

### High

The issue is directly visible in the screenshot and does not depend on hidden interaction behaviour.

### Medium

The issue is visible, but some impact depends on product context or interaction behaviour.

### Low

The finding is a cautious inference and must be described as such.

## Error Contract

The application returns a stable error code, user-facing message, and optional recovery instruction. Raw provider errors must not be exposed.

The canonical TypeScript definitions live in `src/types/audit.ts`.
