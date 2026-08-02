# Security and Privacy

## Public Demo Warning

Do not upload confidential, personal, regulated, client-owned, employer-owned, or NDA-protected interface screenshots.

## MVP Data Policy

The intended MVP:

- Processes one screenshot per request
- Does not create user accounts
- Does not store audit history
- Does not add a screenshot database
- Does not log raw screenshots
- Does not expose AI-provider credentials to the browser

Actual provider-side retention and processing terms must be reviewed and documented before public deployment.

## Implementation Requirements

- Keep API keys on the server.
- Validate file size and MIME type on the server.
- Do not trust browser-provided file metadata alone.
- Do not render model-generated HTML.
- Exclude uploaded content from application logs.
- Return safe user-facing errors rather than raw provider errors.
- Apply reasonable request limits before public deployment.

## Supported Files

The MVP should accept only PNG, JPEG, and WebP images within the documented size limit.

## Reporting a Vulnerability

Do not open a public issue containing sensitive details. Contact the repository owner privately through the email listed on the GitHub profile.

## Disclaimer

This project provides an AI-assisted first-pass UX review. It does not provide a security audit, legal opinion, accessibility certification, or formal compliance assessment.
