# Architecture

AI UX Audit Lite uses a small Next.js App Router architecture designed to remain understandable in a portfolio review.

## Request flow

1. The client validates the selected screenshot.
2. The form sends a multipart request to `/api/audit`.
3. The server validates file type, size, and optional context.
4. A provider factory selects fixture or screenshot-aware AI mode.
5. The provider returns a structured result.
6. Zod validates the result before it reaches the interface.
7. The report renders summary, score, filters, findings, and exports.

## Boundaries

- Provider credentials stay on the server.
- UI components depend on the shared audit contract, not a vendor response shape.
- Fixture mode is deterministic and clearly disclosed.
- Screenshots are not written to application storage.
- The directional score is a transparent presentation aid based on validated finding severity.

## Main folders

- `app/`: page, layout, styles, and API route
- `components/`: audit input and report experiences
- `lib/ai/`: provider abstraction and prompt
- `lib/audit/`: schema, errors, export, and score utilities
- `lib/security/`: lightweight rate limiting
- `lib/validation/`: screenshot validation
- `src/types/`: shared contracts
- `tests/`: focused unit tests
