# AI UX Audit Lite — Phase 1 Strategy & Threat Model

**Status:** Phase 1 baseline for the next product-completion release  
**Authority:** subordinate to `docs/CURRENT-PRODUCT-DIRECTION.md`; replaces no approved product behavior  
**Implementation rule:** do not begin persistence/auth implementation until the storage and identity boundary below is resolved.

## 1. Goal and release outcome

Deliver the existing AI-assisted UX audit and HITL review flow as a recruiter-usable end-to-end product while preserving the current trust model:

1. user supplies a supported screenshot and optional context;
2. server validates input and invokes the configured audit provider;
3. provider output is validated into the application schema;
4. findings begin `unreviewed`;
5. human review explicitly accepts/dismisses findings, may override severity, and may add rationale;
6. AI baseline and human decision remain separate;
7. reviewed result/export preserves provenance;
8. failure states are recoverable and do not fabricate success;
9. when an approved persistence model exists, prior audits can be reopened and lifecycle-managed without weakening privacy or authorization boundaries.

## 2. Scope

### REQUIRED

- Preserve all implemented HITL semantics and provider/schema boundaries.
- Complete robust loading, empty, timeout, malformed-provider-output and recovery states.
- Add privacy controls and explicit data-handling copy appropriate to the deployed provider configuration.
- Add critical-flow integration/E2E coverage for the shipped lifecycle.
- Make the public workflow understandable and completable without private explanation.
- Add audit persistence/history CRUD only after the persistence/identity decision in Section 12 is approved.

### BACKLOG

- Additional AI providers or AI novelty not needed for the approved journey.
- Collaboration, teams, comments, sharing, multi-user workflows, billing, marketplace features, automatic remediation, or formal accessibility certification.
- Rich analytics that capture uploaded screenshot/context content.

### NOT APPLICABLE

- Formal legal/accessibility/security certification claims.
- Enterprise contractual SLA/compliance commitments for this public portfolio product unless separately approved.

## 3. Source of truth

1. `docs/CURRENT-PRODUCT-DIRECTION.md`
2. `AGENTS.md`
3. `docs/AUDIT-SCHEMA.md`, `docs/ARCHITECTURE.md`, provider/input validation contracts
4. current tested repository behavior
5. older sprint/release documents for traceability only

Where older documentation says there is no persistence, that remains true for the current implementation; it does not cancel the newer requirement to design an approved lifecycle persistence model.

## 4. Actors and privileges

| Actor | Current privilege | Trust level | Rule |
| --- | --- | --- | --- |
| Anonymous browser user | Submit one audit request, review returned findings, export returned data | Untrusted | Cannot supply trusted identity, ownership, role or authorization data |
| Next.js server route | Validate requests, enforce limits, invoke provider, normalize errors | Trusted application boundary | Must default-deny malformed/oversized/unsupported input |
| AI provider | Process validated provider input and return structured output | External/untrusted response | Response must pass runtime schema validation before use |
| Deployment operator | Configure provider/secret/deployment settings | Privileged | Secrets remain server-side; configuration changes require validation |
| Future persisted-data user | **UNRESOLVED** | **UNRESOLVED** | No authorization model may be implemented until Section 12 is approved |

## 5. Trust boundaries and data flow

```text
Untrusted Browser
  | screenshot + optional context
  v
Server Request Boundary
  | validate size/type/content shape; rate/request controls
  v
AI Provider Boundary
  | external processing
  v
Runtime Output Validation
  | normalized audit schema only
  v
Browser Product State
  | human review state kept separate from AI baseline
  v
Export
```

A persistence boundary is intentionally absent from this diagram until its storage/identity model is approved.

## 6. Sensitive data

### REQUIRED handling

- Screenshot pixels/content: potentially confidential or personal; never log raw content.
- User-entered context: potentially sensitive; never log raw content unless an explicit safe logging design is approved.
- Provider credentials: secret; server-only.
- Provider response: untrusted until validated; do not render provider HTML.
- Human reviewer rationale: user-generated content; treat as untrusted and escape through normal React rendering.

Public UX must continue warning users not to upload confidential, personal, regulated, client-owned, employer-owned or NDA-protected screenshots unless a future approved privacy model explicitly changes that boundary.

## 7. Security invariants

1. **REQUIRED:** AI output never becomes trusted application state before runtime validation.
2. **REQUIRED:** AI baseline is immutable as provenance; human review is stored separately.
3. **REQUIRED:** review state changes only through explicit human action.
4. **REQUIRED:** provider/API credentials never reach the browser or client bundle.
5. **REQUIRED:** unsupported, malformed or oversized uploads are rejected server-side.
6. **REQUIRED:** no raw screenshot or sensitive context is written to application logs.
7. **REQUIRED:** provider failure, timeout or malformed output never returns a fabricated successful audit.
8. **REQUIRED:** any future persisted record must be scoped by a server-derived ownership boundary; client-supplied user/owner IDs are never authoritative.
9. **REQUIRED:** destructive persisted-data actions require authorization and explicit confirmation.
10. **REQUIRED:** exported data preserves AI-vs-human provenance and review status.

Violation of any invariant is a release **BLOCKER**.

## 8. STRIDE / OWASP-oriented threats

| Threat | Risk | Required control | Status |
| --- | --- | --- | --- |
| Spoofed user/owner identity in future persistence | IDOR/auth bypass | Server-derived identity and ownership checks; never trust client owner IDs | BLOCKED pending identity model |
| Tampered multipart/file metadata | Unsafe input | Server-side MIME/size/content-shape validation | Existing control; retain/test |
| Malicious context/model text rendered as HTML | XSS | React text rendering; no model-generated HTML | Existing invariant; retain/test |
| Provider/internal URL manipulation if future URL inputs are added | SSRF | No arbitrary server fetch target from client input; allowlist if introduced | NOT APPLICABLE to current screenshot-only flow |
| Path/file-name traversal | Traversal | Do not use client filenames as filesystem paths; avoid server file persistence without safe generated IDs | Existing design; regression-test where applicable |
| Oversized/repeated audit requests | Resource exhaustion/cost abuse | Request-size limits and reasonable request/rate controls | REQUIRED |
| Malformed provider JSON | Integrity/reliability | Zod/runtime schema validation; safe error state | Existing control; expand recovery tests |
| Provider timeout/failure | Availability | Explicit timeout/failure UX; retry without duplicate destructive effects | REQUIRED |
| Sensitive screenshot/context in logs | Information disclosure | Redacted/metadata-only logging | REQUIRED |
| Persisted audit access across users | IDOR/information disclosure | Ownership enforcement on every read/update/archive/delete | BLOCKED pending persistence/identity model |
| CSRF on future authenticated mutations | Tampering | Same-site/session protections and mutation validation appropriate to chosen auth model | BLOCKED pending auth model |
| Dependency/supply-chain compromise | Build/runtime compromise | Lockfile, `npm ci`, dependency/security scan in CI, review critical upgrades | REQUIRED |

## 9. Reliability and failure behavior

### REQUIRED

- Loading state is explicit and accessible.
- Empty state explains what is required to begin.
- Timeout/provider unavailable/malformed response use safe, non-technical errors and preserve recoverable user input where safe.
- Retry must not silently create duplicate persisted records if persistence is later introduced.
- Reset/remove screenshot behavior remains keyboard accessible and deterministic.

No successful result may be synthesized after an upstream failure.

## 10. Availability, recovery and service objectives

This is currently a public portfolio product, not a contracted service.

- Formal external SLA: **NOT APPLICABLE** unless separately approved.
- Current server-data RPO: **NOT APPLICABLE** because the application currently stores no audit history.
- Current release recovery mechanism: **REQUIRED** rollback/redeploy to a last known-good revision and revalidate the critical audit flow.
- Persisted-data RPO/RTO: **BLOCKED** until the storage architecture in Section 12 is approved; do not invent backup/restore guarantees before then.
- MTTR target: **NOT DEFINED**; production incidents must still be diagnosable through non-sensitive logs and deployment evidence.

## 11. Acceptance criteria and PASS/FAIL evidence

Phase 2 may begin only when the architecture decision in Section 12 is resolved.

For implementation changes, the release gate requires:

- PASS: `npm ci` succeeds from the committed lockfile.
- PASS: typecheck, lint, unit/integration tests and production build succeed.
- PASS: browser validation covers the critical audit flow and supported responsive viewports.
- PASS: serious/critical automated accessibility checks remain clear on tested flows.
- PASS: malformed/oversized/unsupported upload tests reject safely.
- PASS: provider timeout/failure/malformed-output tests produce recoverable error states.
- PASS: HITL regression tests prove unreviewed → explicit human decision, severity override/rationale and provenance-preserving export.
- PASS: no secrets are committed; provider credentials remain server-side.
- PASS: no blocking security finding or invariant violation remains.
- PASS: if persistence is introduced, authorization/IDOR tests cover read/update/archive/delete and destructive confirmation.

A required failure is a **BLOCKER**. Optional visual/feature improvements that do not violate an invariant are **BACKLOG**.

## 12. Blocking architecture decision — persistence and identity

The current product direction requires persistent audit records/history where appropriate, while the current implementation intentionally has no account or database. The repository does not yet approve one of these boundaries:

### Option A — browser-local persistence

- Anonymous, device/browser-scoped audit history.
- No server database or account identity.
- Lower server-side privacy/IDOR exposure.
- History does not follow the user across devices and can be lost when browser storage is cleared.

### Option B — authenticated server persistence

- User account/session plus server-side audit storage.
- Cross-device history is possible.
- Requires approved authentication, ownership schema, authorization on every CRUD operation, screenshot/context retention policy, deletion semantics, backup/recovery and additional security tests.

### Gate

**BLOCKER:** Do not implement persistence, history CRUD, authentication or a storage schema until Option A, Option B, or another explicitly specified model is approved. All non-persistence reliability/privacy/test work may proceed independently once scoped to current behavior.

## 13. Phase 1 exit status

- Goal/outcome/scope/exclusions: **PASS**
- Current source-of-truth hierarchy: **PASS**
- Actors/trust boundaries/data classes: **PASS**
- Security invariants/threat model: **PASS**
- Reliability/error-state requirements: **PASS**
- Acceptance evidence definition: **PASS**
- Persistence/identity architecture: **FAIL — BLOCKER**

**Phase 1 gate is not passed until Section 12 is resolved.**