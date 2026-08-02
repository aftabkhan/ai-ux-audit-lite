# AI UX Audit Lite

A focused public portfolio project demonstrating AI-assisted UX analysis, accessible frontend engineering, and structured product thinking.

AI UX Audit Lite lets a user upload one interface screenshot, add optional context, and request a structured first-pass UX review across common usability heuristics.

The project is intentionally small and limited to generic, explainable portfolio functionality.

## Features

- Responsive Next.js App Router interface
- Accessible screenshot picker and local preview
- PNG, JPEG, and WebP validation with a 5 MB limit
- Optional screen title, target-user, and product-context fields
- Screenshot-aware AI provider with deterministic fixture mode
- Runtime validation and safe error handling
- Staged progress feedback
- Summary, strengths, priority actions, and structured findings
- Directional score derived transparently from finding severity
- Search and filtering by severity and category
- Expandable findings
- Markdown and JSON export
- Rate limiting and privacy-aware server boundaries
- Automated typecheck, lint, tests, and production build

## Review Categories

1. Visual hierarchy
2. Navigation and orientation
3. Clarity of actions
4. Consistency
5. Readability
6. Feedback and system status
7. Error prevention and recovery
8. Accessibility basics

## Stack

- Next.js App Router
- React
- TypeScript
- Zod
- CSS
- ESLint
- Vitest and Testing Library
- GitHub Actions

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The safe local default is:

```env
AUDIT_PROVIDER=fixture
```

Run the complete quality gate:

```bash
npm run verify
```

## Privacy

Do not upload confidential, personal, client-owned, employer-owned, regulated, or NDA-protected screenshots.

The application does not write screenshots or audit history to application storage. Provider-side data handling must be reviewed before enabling a real provider publicly.

## Disclaimer

AI UX Audit Lite provides an AI-assisted first-pass review. It does not provide a formal UX audit, legal opinion, accessibility certification, security assessment, or compliance determination.

## License

MIT
