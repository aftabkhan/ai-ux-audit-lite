# Production Deployment

## Objective

Deploy AI UX Audit Lite as a public portfolio application without exposing provider credentials or implying formal certification.

## Required environment variables

```env
NEXT_PUBLIC_SITE_URL=https://your-production-domain.example
AUDIT_PROVIDER=fixture
```

For screenshot-aware production reviews:

```env
AUDIT_PROVIDER=openai
OPENAI_API_KEY=server-side-secret
OPENAI_AUDIT_MODEL=gpt-5
```

`OPENAI_API_KEY` must remain server-side only. Never prefix it with `NEXT_PUBLIC_`.

## Recommended first release

Launch in fixture mode first. This validates the deployment, responsive experience, metadata, exports, and browser behaviour without creating provider cost or abuse exposure.

Enable the real provider only after confirming:

- provider retention and privacy terms;
- request limits and expected monthly cost;
- safe error behaviour when the provider is unavailable;
- production rate-limit behaviour;
- no screenshot or user context is written to logs;
- the public disclaimer remains visible.

## Build and release commands

```bash
npm ci
npm run verify
npm run build
npm run start
```

## Production verification

After deployment, confirm:

- `/` loads without console errors;
- `/robots.txt` allows the site and blocks `/api/`;
- `/sitemap.xml` uses the production domain;
- security headers are present;
- unsupported files and files above 5 MB are rejected;
- fixture review, filtering, exports, and reset work;
- keyboard navigation and 200% zoom remain usable;
- mobile, tablet, and desktop layouts do not clip content;
- direct requests to `/api/audit` return safe responses;
- provider credentials are not present in client JavaScript or browser network payloads.

## Release evidence

Record the following in `RELEASE-CHECKLIST.md` only after real verification:

- deployment URL;
- deployment date;
- browser and device coverage;
- accessibility scan result;
- provider mode used;
- known issues and follow-up actions.

## Rollback

If production validation fails:

1. switch `AUDIT_PROVIDER` back to `fixture`;
2. redeploy the last verified commit;
3. remove the public live link until the issue is resolved;
4. document the failure without including credentials, screenshots, or private user context.
