# Release Checklist

## Code quality

- [x] GitHub Actions dependency installation completes
- [x] `npm run typecheck` passes in GitHub Actions
- [x] `npm run lint` passes in GitHub Actions
- [x] `npm run test` passes in GitHub Actions
- [x] `npm run build` passes in GitHub Actions
- [x] GitHub Actions quality workflow passes on `main`

## Functional verification

- [ ] Supported screenshot can be selected and previewed
- [ ] Unsupported file type is rejected
- [ ] File above 5 MB is rejected
- [ ] Context fields respect character limits
- [ ] Fixture audit returns a schema-valid report
- [ ] Severity and category filters work
- [ ] Markdown copy works in a secure browser context
- [ ] Markdown and JSON downloads work
- [ ] New-review reset restores the form
- [ ] API failure shows a safe recovery message

## Accessibility

- [ ] Complete flow works with keyboard only
- [ ] Focus order is logical
- [ ] Focus moves to results after completion
- [ ] Errors and statuses are announced
- [ ] 200% zoom does not hide content or controls
- [ ] Manual screen-reader pass completed
- [ ] Automated accessibility scan completed

## Privacy and security

- [x] Fixture provider is the default
- [x] No credentials are committed
- [x] Uploads and audit history are not persisted by the MVP
- [x] API responses are not cached
- [x] Provider output is validated
- [ ] Real-provider retention terms documented
- [ ] Rate limiting implemented before unrestricted public access
- [ ] Abuse and cost controls configured

## Portfolio release

- [ ] Live URL added to README
- [ ] Product screenshots added
- [ ] Architecture diagram added
- [x] Known limitations published
- [ ] Portfolio case study written
- [x] GitHub profile links to the public repository

A checklist item must remain open until it has been verified through a real command, browser review, or deployment check.
