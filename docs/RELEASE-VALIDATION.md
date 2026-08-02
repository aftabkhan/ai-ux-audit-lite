# Release Validation

This checklist records the final checks required before presenting AI UX Audit Lite as a live portfolio project.

## Automated quality gate

Run:

```bash
npm ci
npm run verify
```

The combined verification must complete successfully:

- TypeScript typecheck
- ESLint
- Vitest
- Next.js production build

## Browser validation

Validate in the latest stable versions of Chrome, Edge, and Firefox.

### Landing page

- Header, hero, form, supporting content, and footer remain visually balanced.
- No horizontal scrolling at 320 px, 375 px, 768 px, 1024 px, and 1440 px viewport widths.
- Content remains readable at 200% browser zoom.
- Focus indicators remain visible and are not clipped.

### Screenshot form

- Keyboard users can reach every control in a logical order.
- The native file picker opens from the labelled upload control.
- Unsupported formats and oversized files produce clear recovery messages.
- A selected screenshot can be replaced or removed without refreshing the page.
- Optional context fields accept, preserve, and submit text correctly.

### Audit progress

- Progress copy is announced without moving keyboard focus unexpectedly.
- Reduced-motion preferences do not hide status information.
- A provider or network error preserves the selected screenshot and entered context.

### Results

- The results heading receives focus after a successful audit.
- Score, severity counts, summary, strengths, actions, and findings are understandable without colour alone.
- Search and filters work together and can be cleared.
- Expandable findings are keyboard operable and expose their state.
- Markdown copy, Markdown download, and JSON download work.
- Starting a new review resets report state safely.

## Accessibility validation

Perform these checks before release:

- Keyboard-only navigation
- Visible focus inspection
- 200% zoom and browser text scaling
- Windows High Contrast or forced-colours review
- Screen-reader smoke test with NVDA and Chrome or Edge
- Automated scan with axe DevTools or Lighthouse

Automated tools are supporting evidence only. They do not replace keyboard, zoom, screen-reader, and human usability review.

## Provider validation

### Fixture mode

Use:

```env
AUDIT_PROVIDER=fixture
```

Confirm the full form, progress, report, filtering, and export journey works without an external API key.

### OpenAI mode

Use server-side environment variables only:

```env
AUDIT_PROVIDER=openai
OPENAI_API_KEY=replace-with-server-side-secret
OPENAI_AUDIT_MODEL=replace-with-supported-vision-model
```

Confirm:

- The key is never exposed in client bundles or browser requests.
- The result references visible details from the submitted screenshot.
- Invalid provider output is rejected by runtime validation.
- Provider errors return safe public messages.
- Responses are not cached by the application route.
- The configured request-storage behaviour matches the privacy documentation.

## Rate-limit validation

Submit repeated requests until the public limit is reached.

Confirm:

- Normal use succeeds before the limit.
- Excess requests receive a clear retry message.
- The UI remains recoverable.
- No screenshot data or user context is written to logs.

## Production configuration

Before deployment:

- Add environment variables through the hosting provider, never through committed files.
- Keep `.env.local` untracked.
- Verify the production build uses the intended provider.
- Confirm HTTPS is active.
- Confirm the repository URL and live-demo URL are accurate.
- Verify the privacy and limitation statements against the deployed configuration.

## Portfolio evidence

Capture after deployment:

- Desktop landing-page screenshot
- Mobile landing-page screenshot
- Audit progress screenshot
- Results and filtering screenshot
- Short screen recording of one complete review

Do not use employer, client, confidential, personal, regulated, or NDA-protected screenshots in public demo media.

## Release decision

The release is ready only when:

- CI is green on `main`.
- The checks above have been completed and recorded.
- The live deployment matches the repository documentation.
- Known limitations remain visible.
- No confidential or restricted material appears in source, documentation, screenshots, issues, PRs, or demo assets.
