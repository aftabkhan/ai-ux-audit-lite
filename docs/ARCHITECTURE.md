# Architecture

## Objective

Keep the application small, understandable, secure by default, and easy to explain in an interview.

## Proposed Stack

- Next.js with the App Router
- React
- TypeScript
- CSS Modules or Tailwind CSS
- Zod for runtime validation
- Vitest and React Testing Library
- An AI provider called only from a server-side route

The specific AI provider is intentionally abstracted so the public project does not depend on one vendor.

## High-Level Flow

```text
Browser
  -> validates screenshot and context
  -> submits multipart request
Server route
  -> validates request
  -> converts the screenshot into provider-compatible input
  -> requests a structured review
  -> validates the provider response
  -> returns normalized audit data
Browser
  -> renders summary and findings
  -> supports Markdown copy and JSON download
```

## Proposed Structure

```text
app/
  api/audit/route.ts
  page.tsx
  layout.tsx
components/
  audit-form/
  audit-results/
  feedback/
lib/
  ai/
  audit/
  validation/
src/types/
  audit.ts
docs/
tests/
public/
```

The exact structure may be adjusted during implementation, but responsibilities should remain separate.

## Boundaries

### Client Responsibilities

- File selection and preview
- Basic file validation
- Context input
- Accessible interaction states
- Rendering normalized results
- Exporting already returned data

### Server Responsibilities

- Secure API-key use
- Request-size enforcement
- MIME verification
- AI-provider communication
- Response validation and normalization
- Safe error mapping

### AI Provider Adapter

The provider-specific implementation must sit behind a small internal interface. UI components must not depend on provider response formats.

## Data Handling

- No authentication or persistence in the MVP
- No uploaded screenshot stored by the application
- No audit history database
- No analytics capturing uploaded content
- Logs must exclude raw images and sensitive user context

Provider-side data handling depends on the chosen provider and must be documented before deployment.

## Reliability

- Validate the model response before rendering it.
- Reject malformed or incomplete findings.
- Return a stable application error shape.
- Never fabricate a successful report after a provider failure.

## Security

- Keep API credentials server-side.
- Enforce file type and size limits.
- Treat file metadata and user context as untrusted input.
- Escape rendered content through React's standard rendering model.
- Do not render model-generated HTML.

## Testing Priorities

1. Audit schema validation
2. File validation
3. Form keyboard flow
4. Loading and error states
5. Results rendering by severity
6. Export transformation

## Deployment

A browser-accessible deployment may use Vercel or another Next.js-compatible platform. Deployment is outside Sprint 07 and will be implemented with the MVP.
