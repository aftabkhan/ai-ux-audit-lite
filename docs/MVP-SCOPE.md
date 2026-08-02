# MVP Scope

## Release Goal

Deliver a small, polished, explainable UX review tool suitable for a public portfolio demonstration.

## Included

### Input

- One PNG, JPG, or WebP screenshot
- Optional screen title
- Optional product context
- Optional target-user context

### Review Categories

The MVP is limited to eight categories:

1. Visual hierarchy
2. Navigation and orientation
3. Clarity of actions
4. Consistency
5. Readability
6. Feedback and system status
7. Error prevention and recovery
8. Accessibility basics

### Output

- Overall summary
- Findings grouped by severity
- Related heuristic/category
- Evidence visible in the submitted screen
- Recommended improvement
- Confidence indicator
- Clear disclaimer that the output is an AI-assisted first-pass review

### Report Actions

- Copy report as Markdown
- Download report as JSON
- Start a new review

## Excluded

- URL crawling
- Authentication
- Accounts or saved history
- Team collaboration
- Figma plugin
- PDF report generation
- Automated WCAG conformance claims
- Performance analysis
- Analytics integration
- Competitive benchmarking
- Conversion scoring
- Multi-agent workflows

## Acceptance Criteria

- A user can complete the review flow without instructions.
- Keyboard-only users can operate the primary workflow.
- Loading, empty, success, and error states are present.
- Results use a stable structured schema.
- No private commercial logic is included.
- The repository can be understood and run from its README.

## Later, Only If Justified

- Local example gallery
- Side-by-side before/after notes
- Export to PDF
- Optional URL screenshot capture

These are not commitments for the MVP.
