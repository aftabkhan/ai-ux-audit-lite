# AI UX Audit — Phase 2 Lifecycle Architecture

**Status:** Active implementation contract
**Auth authority:** Product Lab Invite Auth / Product Lab session boundary
**Product key:** `ai-ux-audit`

## Goal

Evolve the current single-screenshot HITL audit into a persistent, reviewer-owned AI-assisted UX audit workflow without discarding the existing validated AI baseline, human review, filtering, scoring or export behavior.

Target workflow:

`Define Audit → Add Evidence → Analyze → Inspect Findings → Human Review → Prioritize → Save → Revisit → Continue → Version / Compare → Finalize → Export`

## Scope for Phase 2

### REQUIRED

- Persist reviewer-owned audits.
- Define explicit audit scope: single screen, multiple screens, user flow, page sequence or product workflow.
- Support multiple pieces of screenshot evidence and ordered evidence sequences.
- Preserve AI run output separately from human review.
- Persist accepted/dismissed state, severity override, reviewer rationale and approved recommendation.
- Reopen and continue an audit.
- Archive, restore and delete reviewer-owned audits.
- Create immutable audit versions/snapshots at explicit lifecycle transitions.
- Compare AI baseline with reviewed state and compare saved versions.
- Preserve provenance in Markdown/JSON export; PDF remains optional until implemented and validated.
- Harden provider timeout/failure/malformed-output recovery.
- Add integration/security tests for ownership, IDOR, malformed input and critical lifecycle transitions.

### BACKLOG

- URL crawling or arbitrary remote page ingestion.
- Interaction recordings, analytics ingestion, research repositories and automated accessibility evidence ingestion.
- Collaboration, comments, teams, sharing and public report links.
- Autonomous remediation.

## Identity and authorization boundary

The Audit application does not authenticate reviewers itself.

Every persisted operation requires a server-derived Product Lab context containing at minimum:

- validated reviewer identity;
- active, unrevoked session;
- active `ai-ux-audit` product grant;
- session expiry/revocation enforcement.

Browser-provided reviewer IDs, roles, product keys, invitation IDs or ownership claims are never authoritative.

Until the Product Lab cross-subdomain session contract is available, persistence HTTP endpoints must remain fail-closed. Domain/storage code may be implemented and tested independently, but no client identity fallback is permitted.

## Product-specific privacy and retention

### Screenshots/evidence

- Raw screenshot bytes are not stored in database rows.
- Persisted screenshot evidence must use private object storage with generated object keys; never use client filenames as storage paths.
- Evidence is readable only through a server-authorized reviewer/audit path or short-lived signed retrieval mechanism.
- Raw evidence is excluded from application/activity logs.
- Unsupported or oversized evidence is rejected before storage/provider calls.

### Archive/delete semantics

- Archive is reversible and preserves audit data/evidence.
- Restore reverses archive.
- Delete is explicit, destructive and reviewer-authorized.
- Delete removes audit domain records and associated evidence objects as one controlled operation; failure must surface rather than silently leaving an inconsistent success state.
- No automatic retention deletion is claimed in this phase.

## Domain model

`Product Lab Reviewer`
→ `Audit`
→ `Audit Scope`
→ `Evidence[]`
→ `Audit Run[]`
→ `AI Finding Baseline[]`
→ `Human Review`
→ `Audit Version[]`
→ `Export`

### Audit

Owns title, scope type, lifecycle status, task/persona/business context, timestamps and reviewer ownership.

### Evidence

Represents one traceable input item. Phase 2 supports screenshot evidence. Every finding may reference one or more evidence IDs.

### Audit Run

Immutable provider execution metadata plus normalized AI result. A new analysis creates a new run; it does not overwrite earlier runs.

### AI Finding Baseline

Immutable model-proposed observation, impact, recommendation, severity, confidence, dimension and evidence references.

### Human Review

Mutable human decision associated with one baseline finding. It never overwrites baseline fields.

### Audit Version

Immutable JSON snapshot created intentionally at lifecycle checkpoints such as saved review/finalization. It supports history and comparison without mutating previous snapshots.

## Audit scope types

- `single-screen`
- `multi-screen`
- `user-flow`
- `page-sequence`
- `product-workflow`

## Lifecycle states

- `draft`
- `ready`
- `analyzing`
- `in-review`
- `finalized`
- `archived`

A failed analysis does not fabricate or transition to a successful state.

## Audit dimensions

Phase 2 uses an explicit governed dimension vocabulary:

- usability
- interaction-design
- navigation
- information-architecture
- visual-hierarchy
- content-clarity
- forms
- error-prevention-recovery
- accessibility
- responsive-behavior
- cognitive-load
- task-completion
- workflow-friction
- consistency
- trust
- feedback-system-status
- empty-loading-error-states

Findings must be grounded in supplied evidence/context. Unsupported assertions must be represented as low confidence or omitted.

## Security invariants

1. Reviewer ownership always comes from validated Product Lab server context.
2. Every read/update/archive/restore/delete query includes reviewer ownership scope.
3. AI baseline rows are immutable after creation.
4. Human review cannot destroy AI baseline fields.
5. Evidence object keys are generated server-side.
6. Raw screenshots/context are never logged.
7. Provider credentials remain server-only.
8. Provider output is runtime validated before persistence/rendering.
9. Destructive delete requires explicit confirmation and verified ownership.
10. Cross-reviewer IDOR tests are release-blocking.

## Phase 2 exit gate

Phase 2 is complete only when:

- persistent reviewer-owned audit CRUD works through the Product Lab auth boundary;
- multi-evidence audit creation and ordered evidence handling work;
- analysis produces traceable evidence-grounded baselines;
- HITL review persists and survives revisit;
- history/version comparison works;
- archive/restore/delete work with ownership enforcement;
- provenance-aware export works;
- failure/recovery UX is validated;
- required unit/integration/browser/security/accessibility tests pass;
- no unresolved critical security finding remains.
