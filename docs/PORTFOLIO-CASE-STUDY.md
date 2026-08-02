# AI UX Audit Lite — Portfolio Case Study

## Project summary

AI UX Audit Lite is a focused portfolio product that turns one interface screenshot and optional context into a structured first-pass UX review.

The project demonstrates how UX judgement, accessible interaction design, frontend engineering, runtime validation, and AI-assisted analysis can work together without turning a small portfolio project into an over-engineered platform.

## The problem

Design reviews are often delayed until a specialist is available, and early feedback can be inconsistent or difficult to prioritise. The product explores a narrower question:

> Can a user receive a useful, clearly limited first-pass UX review from one screenshot while keeping the experience understandable, recoverable, and transparent?

The product is not positioned as a replacement for usability research, accessibility certification, expert review, or product analytics.

## Product goals

- Make the first interaction understandable without onboarding.
- Accept one screenshot with minimal optional context.
- Produce structured findings rather than unformatted AI prose.
- Help users scan, filter, and export the report.
- Keep limitations and privacy expectations visible.
- Build an architecture that is easy to explain in an interview.

## Scope decisions

The MVP deliberately includes:

- one screenshot per review;
- eight general UX review categories;
- fixture and screenshot-aware provider modes;
- structured runtime validation;
- staged progress and recovery states;
- directional score presentation;
- search and filters;
- Markdown and JSON exports;
- lightweight rate limiting.

It deliberately excludes:

- website crawling;
- saved accounts or audit history;
- comparative benchmarking;
- formal accessibility conformance claims;
- continuous monitoring;
- complex agent orchestration;
- enterprise infrastructure.

These exclusions keep the product credible, maintainable, and defendable as an individual portfolio project.

## UX approach

### Clear entry point

The landing experience explains what the product does, what information is optional, and what the user will receive. The screenshot remains the primary input, while title, audience, and context improve the usefulness of the review.

### Visible system status

The interface uses staged progress messages instead of a generic spinner. The messages describe user-facing stages without exposing hidden reasoning or making unsupported claims about model cognition.

### Recoverable errors

File validation, provider errors, network problems, and rate limits use clear language and preserve recoverable user input where possible.

### Scannable results

The report combines:

- executive overview;
- transparent directional score;
- category overview;
- severity counts;
- strengths and priority actions;
- searchable and filterable findings;
- expandable detail;
- export actions.

The score is intentionally simple and disclosed as a presentation aid, not a benchmark or certification.

## Engineering approach

### Provider boundary

The UI and API route depend on a small provider contract rather than a specific vendor. Fixture mode supports deterministic development and testing. The screenshot-aware provider can be enabled through server-side configuration without changing report components.

### Structured output

Provider output is validated at runtime before it reaches the UI. This reduces the risk of rendering incomplete or malformed model responses and creates a stable contract for report components and exports.

### Server-side secrets

Provider credentials remain on the server. The browser submits the screenshot and context to the application route and never receives the external API key.

### Reproducible quality gate

The repository commits its lockfile and CI uses `npm ci`. Pull requests run typecheck, lint, unit tests, and a production build through one `verify` job.

## Accessibility considerations

The implementation includes labelled controls, keyboard-operable interactions, status and error messaging, visible focus treatment, semantic report structure, and non-colour indicators for severity and score meaning.

The release process still requires manual keyboard, zoom, forced-colours, screen-reader, and browser validation. Automated checks are evidence, not proof of accessibility.

## Privacy and trust

The application does not persist screenshots or audit history. API responses use no-store behaviour, provider output is validated, and public documentation warns users not to upload confidential, personal, client-owned, employer-owned, regulated, or NDA-protected screenshots.

Production provider handling must be checked against the deployed environment before release.

## Key trade-offs

### Simple score instead of advanced scoring

A deterministic severity-based score is easier to test and explain. It helps users scan one report but does not claim to compare products or measure objective UX quality.

### In-memory rate limiting instead of external infrastructure

The current limiter is appropriate for a small portfolio deployment and demonstrates basic abuse awareness. A larger product would require a distributed store and stronger identity-aware controls.

### No persistent history

Avoiding accounts and storage reduces privacy risk and keeps the core experience focused. Persistence would require authentication, retention rules, deletion controls, and a more complex security model.

### Limited automated testing

Unit tests cover deterministic business logic and validation. Browser and accessibility validation remain explicit release activities rather than being presented as complete without evidence.

## What I would improve next

After the first live release, the next improvements would be selected from observed usage rather than added speculatively:

- clearer example inputs;
- improved result comparison within one session;
- stronger production rate limiting;
- browser-level regression tests for the critical journey;
- additional accessibility evidence;
- better cost and latency monitoring;
- richer report annotations where they add measurable value.

## Interview-ready explanation

A concise explanation:

> I built AI UX Audit Lite to demonstrate how I combine UX evaluation, accessible interface design, and frontend engineering. I kept the product intentionally narrow: one screenshot, structured findings, transparent scoring, filters, exports, and safe recovery states. The AI provider is isolated behind a server-side contract, and every response is runtime validated before rendering. I deliberately avoided accounts, crawling, complex agents, and enterprise infrastructure because they did not strengthen the portfolio story or the core user journey.

## Release evidence

Add these items only after they exist:

- Live URL: _pending_
- Desktop screenshot: _pending_
- Mobile screenshot: _pending_
- Results screenshot: _pending_
- Product demo: _pending_
- Final accessibility notes: _pending_
