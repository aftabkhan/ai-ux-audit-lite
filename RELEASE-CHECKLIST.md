# Release Checklist

## Sprint 14 implementation

- [x] Screenshot-aware provider is isolated behind a server-side interface
- [x] Provider responses are runtime validated
- [x] Staged audit progress and safe recovery states are implemented
- [x] Directional UX score and category overview are implemented
- [x] Search, severity filtering, and category filtering are implemented
- [x] Detailed findings are expandable and keyboard operable
- [x] Markdown and JSON exports are implemented
- [x] Lightweight request rate limiting is implemented
- [x] Temporary migration tooling has been removed
- [x] Public documentation reflects the current implementation

## Code quality

- [x] Lockfile is committed
- [x] GitHub Actions uses `npm ci`
- [x] `npm run typecheck` is part of the quality gate
- [x] `npm run lint` is part of the quality gate
- [x] `npm run test` is part of the quality gate
- [x] `npm run build` is part of the quality gate
- [ ] Final Sprint 14 pull request passes `Quality / verify`
- [ ] `Quality / verify` passes on `main` after merge

## Functional browser verification

- [ ] Supported screenshot can be selected, previewed, replaced, and removed
- [ ] Unsupported file type is rejected with recovery guidance
- [ ] File above 5 MB is rejected with recovery guidance
- [ ] Context fields respect character limits and preserve content after recoverable errors
- [ ] Fixture audit returns a schema-valid report
- [ ] OpenAI audit references visible screenshot details
- [ ] Search, severity filters, and category filters work together
- [ ] Filtered empty state and clear-filters action work
- [ ] Markdown copy works in a secure browser context
- [ ] Markdown and JSON downloads work
- [ ] New-review reset restores the form
- [ ] Provider and network failures show safe recovery messages
- [ ] Rate-limit response is understandable and recoverable

## Accessibility verification

- [ ] Complete flow works with keyboard only
- [ ] Focus order is logical
- [ ] Focus moves to results after completion
- [ ] Errors and statuses are announced
- [ ] Score and severity are understandable without colour alone
- [ ] 200% zoom does not hide content or controls
- [ ] 320 px viewport does not introduce horizontal scrolling
- [ ] Forced-colours or High Contrast review completed
- [ ] Manual screen-reader smoke test completed
- [ ] Automated accessibility scan completed

## Privacy and security

- [x] Fixture provider is the safe local default
- [x] No credentials are committed
- [x] API key configuration is server-side only
- [x] Uploads and audit history are not persisted by the application
- [x] API responses are not cached
- [x] Provider output is validated
- [x] Request rate limiting is implemented
- [x] Provider handling and limitations are documented
- [ ] Production environment variables configured through the hosting provider
- [ ] Production provider and storage settings verified
- [ ] Abuse and cost thresholds reviewed for the live deployment

## Responsive browser matrix

- [ ] Chrome desktop
- [ ] Edge desktop
- [ ] Firefox desktop
- [ ] 320 px mobile viewport
- [ ] 375 px mobile viewport
- [ ] 768 px tablet viewport
- [ ] 1024 px desktop viewport
- [ ] 1440 px wide desktop viewport

## Portfolio release

- [ ] Production deployment completed
- [ ] Live URL added to README and repository About section
- [ ] Desktop and mobile screenshots added
- [ ] Audit progress and results screenshots added
- [ ] Short product demo recorded
- [ ] Architecture diagram added
- [x] Known limitations published
- [ ] Portfolio case study written
- [x] GitHub profile links to the public repository
- [ ] Private interview guide updated with final Sprint 14 decisions

See [`docs/RELEASE-VALIDATION.md`](docs/RELEASE-VALIDATION.md) for the detailed browser, accessibility, provider, rate-limit, and production validation procedure.

A checklist item must remain open until it has been verified through a real command, browser review, or deployment check. Implementation completion does not substitute for manual release evidence.
