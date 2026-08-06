# Sprint 16: Browser and Accessibility Validation

## Goal

Convert the release checklist's highest-risk browser and accessibility checks into a repeatable CI gate before public showcase.

## Implemented

- Playwright configuration for Chromium, Firefox, 320 px mobile, 375 px mobile, and 768 px tablet projects
- Horizontal-overflow checks at every configured viewport
- Automated serious and critical accessibility violation scan with axe
- Screenshot preview, removal, focus restoration, same-flow reselection, and context preservation coverage
- Unsupported type and oversized screenshot recovery coverage
- Fixture-provider audit completion, results focus, filtering empty state, and new-review reset coverage
- Failure traces, screenshots, videos, and a retained HTML report in GitHub Actions

## Validation boundary

This sprint automates supporting evidence. Manual keyboard, 200% zoom, forced-colours, screen-reader, Edge, export-download, OpenAI-provider, rate-limit, and production-configuration checks remain open until verified directly.
