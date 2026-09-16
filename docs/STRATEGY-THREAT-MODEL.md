# AI UX Audit Lite — Phase 1 Strategy & Threat Model

**Status:** Phase 1 PASS for the current Showcase Ready release  
**Authority:** subordinate to `docs/CURRENT-PRODUCT-DIRECTION.md`; replaces no approved product behavior  
**Auth boundary:** Product Lab Invite Auth is the external identity/authorization authority. This repository must not duplicate or modify it.

## 1. Goal and release outcome

Deliver the existing AI-assisted UX audit and HITL review flow as a recruiter-usable end-to-end product while preserving the current trust model:

1. an invited reviewer reaches Audit through an authorized Product Lab session;
2. the reviewer supplies a supported screenshot and optional context;
3. the server validates input and invokes the configured audit provider;
4. provider output is validated into the application schema;
5. findings begin `unreviewed`;
6. human review explicitly accepts/dismisses findings, may override severity, and may add rationale;
7. AI baseline and human decision remain separate;
8. reviewed result/export preserves provenance;
9. failure states are recoverable and never fabricate success.

Cross-session persisted audit history is not required to pass this Showcase Ready release. It remains a required future lifecycle capability once the shared Product Lab user-scoped storage contract is available.

## 2. Scope

### REQUIRED

- Preserve all implemented HITL semantics and provider/schema boundaries.
- Treat Product Lab Invite Auth as the only identity/authentication boundary.
- Do not add signup, password, invite redemption, reviewer administration, ACL management, or a second identity store in this repository.
- Complete robust loading, empty, timeout, malformed-provider-output and recovery states.
- Add privacy controls and explicit data-handling copy appropriate to the deployed provider configuration.
- Add critical-flow integration/E2E coverage for the shipped lifecycle.
- Make the workflow understandable and completable without private explanation.
- Keep future persistence ownership compatible with server-derived Product Lab identity and product scope.

### BACKLOG / DEPENDENCY-BOUND

- Cross-session audit persistence/history CRUD until the approved shared Product Lab user-scoped storage integration contract is available.
- Additional AI providers or AI novelty not needed for the approved journey.
- Collaboration, teams, comments, sharing, billing, marketplace features, automatic remediation, or formal accessibility certification.
- Rich analytics that capture uploaded screenshot/context content.

### NOT APPLICABLE

- Formal legal/accessibility/security certification claims.
- Enterprise contractual SLA/compliance commitments for this public portfolio product unless separately approved.

## 3. Source of truth

1. `docs/CURRENT-PRODUCT-DIRECTION.md`
2. this Phase 1 baseline
3. `AGENTS.md`
4. `docs/AUDIT-SCHEMA.md`, `docs/ARCHITECTURE.md`, provider/input validation contracts
5. current tested repository behavior
6. older sprint/release documents for traceability only

## 4. Actors and privileges

| Actor | Privilege | Trust level | Rule |
| --- | --- | --- | --- |
| Invited reviewer | Use Audit only while Product Lab session grants Audit access | Untrusted application input | Reviewer-supplied IDs, roles, invite tokens or ownership claims are never authorization |
| Product Lab identity layer | Establish/revoke session and enforce product permission | External trusted auth boundary | Audit must consume only server-validated authorization context when integration is available |
| Next.js Audit server | Validate requests, enforce limits, invoke provider, normalize errors | Trusted application boundary | Default-deny malformed/oversized/unsupported input |
| AI provider | Process validated provider input and return structured output | External/untrusted response | Response must pass runtime schema validation before use |
| Deployment operator | Configure provider/secret/deployment settings | Privileged | Secrets remain server-side; configuration changes require validation |

## 5. Product Lab auth safety wall

Approved boundary:

```text
Invite link
  -> Product Lab validates/redeems invite
  -> Product Lab establishes secure session
  -> Product Lab enforces reviewer-to-product permission
  -> authorized reviewer reaches AI UX Audit
  -> Audit handles only product-local UX/audit behavior
```

### REQUIRED invariants

- No public signup or reviewer-created password is added here.
- Invite token generation, hashing, expiry, redemption and revocation stay outside this repository.
- Session creation, termination and reviewer/product ACL administration stay outside this repository.
- Hiding a UI link is never treated as authorization.
- When an Audit server endpoint consumes identity/product scope, it must come from a server-validated Product Lab session boundary, never from client-provided `userId`, `reviewerId`, `role`, `productId`, invite token, query parameter or request body.
- Revoked/expired Product Lab access must not be bypassable by an Audit-local identity mechanism because no such mechanism may exist.

No Product Lab implementation changes are part of this release.

## 6. Audit data flow

```text
Authorized Product Lab Session Boundary
  v
Untrusted Audit Browser Input
  | screenshot + optional context
  v
Audit Server Request Boundary
  | validate size/type/context; rate/request controls
  v
AI Provider Boundary
  | external processing
  v
Runtime Output Validation
  | normalized audit schema only
  v
Browser Product State
  | human review kept separate from AI baseline
  v
Export
```

A cross-session persistence boundary is intentionally not implemented until the shared Product Lab storage contract is available.

## 7. Sensitive data

### REQUIRED handling

- Screenshot pixels/content: potentially confidential or personal; never log raw content.
- User-entered context: potentially sensitive; never log raw content.
- Product Lab session/invite material: security-sensitive; Audit must not expose or persist raw invite/session secrets.
- Provider credentials: secret; server-only.
- Provider response: untrusted until validated; never render provider HTML.
- Human reviewer rationale: user-generated content; treat as untrusted and render as text.

Public UX must continue warning users not to upload confidential, personal, regulated, client-owned, employer-owned or NDA-protected screenshots unless a future approved privacy model explicitly changes that boundary.

## 8. Security invariants

1. **REQUIRED:** Product Lab remains the sole auth/ACL authority for lab-product access.
2. **REQUIRED:** AI output never becomes trusted application state before runtime validation.
3. **REQUIRED:** AI baseline remains immutable as provenance; human review is stored separately in product state/export.
4. **REQUIRED:** review state changes only through explicit human action.
5. **REQUIRED:** provider/API credentials never reach the browser or client bundle.
6. **REQUIRED:** unsupported, malformed or oversized uploads are rejected server-side.
7. **REQUIRED:** no raw screenshot or sensitive context is written to application logs.
8. **REQUIRED:** provider failure, timeout or malformed output never returns a fabricated successful audit.
9. **REQUIRED:** any future persisted audit record is scoped from server-derived Product Lab identity/product authorization; client IDs are never authoritative.
10. **REQUIRED:** destructive persisted-data actions require authorization and explicit confirmation when persistence is introduced.
11. **REQUIRED:** exported data preserves AI-vs-human provenance and review status.

Violation of any invariant is a release **BLOCKER**.

## 9. STRIDE / OWASP-oriented threats

| Threat | Risk | Required control | Status |
| --- | --- | --- | --- |
| Forged reviewer/product identity | Auth bypass / IDOR | Product Lab server-validated session/ACL only; never trust browser identity fields | REQUIRED boundary |
| Replayed/expired invite | Unauthorized access | Product Lab invite/session expiry and revocation; no Audit-local bypass | External boundary |
| Tampered multipart/file metadata | Unsafe input | Server-side MIME/size/context validation | Existing control; retain/test |
| Malicious context/model text rendered as HTML | XSS | React text rendering; no model-generated HTML | Existing invariant; retain/test |
| Arbitrary future URL fetching | SSRF | No client-controlled server fetch targets; allowlist if introduced | NOT APPLICABLE currently |
| Path/file-name traversal | Traversal | Do not use client filenames as filesystem paths | Existing design; retain/test |
| Oversized/repeated audit requests | Resource exhaustion/cost abuse | Request-size limits and reasonable request/rate controls | REQUIRED |
| Malformed provider JSON | Integrity/reliability | Runtime schema validation; safe recovery state | Existing control; expand tests |
| Provider timeout/failure | Availability | Explicit timeout/failure UX and safe retry | REQUIRED |
| Sensitive screenshot/context in logs | Information disclosure | Redacted/metadata-only logging | REQUIRED |
| Future cross-user history access | IDOR/information disclosure | Server-derived Product Lab ownership scope on every CRUD operation | BLOCKED only for persistence feature |
| Dependency/supply-chain compromise | Build/runtime compromise | Lockfile, `npm ci`, dependency/security scan where configured, review critical upgrades | REQUIRED |

## 10. Reliability and failure behavior

### REQUIRED

- Loading state is explicit and accessible.
- Empty state explains what is required to begin.
- Timeout/provider unavailable/malformed response uses safe, non-technical errors and preserves recoverable user input where safe.
- Reset/remove screenshot behavior remains keyboard accessible and deterministic.
- Retry must never synthesize a success after provider failure.
- Authentication/access failures must be handled by the Product Lab boundary; Audit must not invent a fallback identity path.

## 11. Availability and recovery

This is a portfolio product, not a contracted service.

- Formal external SLA: **NOT APPLICABLE** unless separately approved.
- Current server-data RPO: **NOT APPLICABLE** because Audit currently stores no history.
- Release recovery: **REQUIRED** rollback/redeploy to a last known-good revision and revalidate the critical audit flow.
- Persisted-data RPO/RTO: **BACKLOG / DEPENDENCY-BOUND** until shared storage is introduced.
- MTTR target: **NOT DEFINED**; failures must still be diagnosable through non-sensitive logs and deployment evidence.

## 12. Acceptance criteria and PASS/FAIL evidence

The current Showcase Ready release requires:

- PASS: `npm ci` succeeds from the committed lockfile.
- PASS: typecheck, lint, unit/integration tests and production build succeed.
- PASS: browser validation covers the critical audit flow and supported responsive viewports.
- PASS: serious/critical automated accessibility checks remain clear on tested flows.
- PASS: malformed/oversized/unsupported uploads reject safely.
- PASS: provider timeout/failure/malformed-output tests produce recoverable states.
- PASS: HITL regression tests prove unreviewed → explicit human decision, severity override/rationale and provenance-preserving export.
- PASS: no secrets are committed; provider credentials remain server-side.
- PASS: no Audit-local signup/password/invite/ACL implementation is introduced.
- PASS: no blocking security finding or invariant violation remains.

When persistence is introduced later, read/update/archive/delete authorization and IDOR regression tests become **REQUIRED** for that release.

## 13. Phase 1 exit status

- Goal/outcome/scope/exclusions: **PASS**
- Source-of-truth hierarchy: **PASS**
- Actors/trust boundaries/data classes: **PASS**
- Product Lab Invite Auth boundary: **PASS**
- Security invariants/threat model: **PASS**
- Reliability/error-state requirements: **PASS**
- Acceptance evidence definition: **PASS**
- Cross-session storage implementation: **BACKLOG / DEPENDENCY-BOUND; not a blocker to the current Showcase Ready release**

**Phase 1 gate passed. Proceed to Phase 2 within the Product Lab auth safety wall.**