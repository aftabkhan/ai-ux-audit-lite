# Quality Review

## Scope

This review covers the public MVP implementation through the results experience.

## Automated checks

The repository provides one verification command:

```bash
npm run verify
```

It runs, in order:

1. TypeScript typecheck
2. ESLint
3. Vitest
4. Next.js production build

The same checks run in `.github/workflows/quality.yml` for pushes and pull requests targeting `main`.

## Test coverage added

- Screenshot MIME validation
- Screenshot size validation
- Audit-context limits
- Audit-result schema validation
- Invalid audit-category rejection
- Markdown report generation

## Accessibility review checklist

- [x] Semantic headings and landmark structure
- [x] Explicit form labels
- [x] Keyboard-accessible file selection
- [x] Visible focus treatment
- [x] Live status and error announcements
- [x] Disabled state during submission
- [x] Results focus management after completion
- [x] Filters use native labelled controls
- [x] Findings do not rely on colour alone
- [x] Reduced-motion preference respected
- [ ] Manual screen-reader review in deployed environment
- [ ] Automated browser accessibility scan

## Security and privacy review

- [x] Provider credentials remain server-side
- [x] Fixture provider is the safe default
- [x] Upload type and size are validated on client and server
- [x] Context length is validated
- [x] Provider output is validated before rendering
- [x] API responses use `Cache-Control: no-store`
- [x] Generated HTML is not rendered
- [x] Raw screenshots and user context are not intentionally logged or persisted
- [x] Public documentation prohibits confidential uploads
- [ ] Real-provider retention and privacy terms documented before enablement
- [ ] Rate limiting added before unrestricted public deployment

## Responsive review targets

Manual verification should cover:

- 360 px mobile viewport
- 768 px tablet viewport
- 1280 px desktop viewport
- 200% browser zoom
- Keyboard-only completion of upload, form, filtering, export, and reset

## Release decision

Fixture mode is suitable for public code review and local demonstration, provided it is clearly described as deterministic sample output rather than screenshot analysis.

A public live release using a real multimodal provider remains blocked until provider privacy terms, abuse protection, rate limiting, deployment configuration, and final accessibility checks are complete.
