# AI Agent Instructions

Before modifying this repository, read in order:

1. `README.md`
2. `docs/README.md`
3. `docs/CURRENT-PRODUCT-DIRECTION.md`
4. relevant architecture/schema/QA documents for the area being changed

## Mandatory rules

- Do not invent product features, workflows, claims, metrics, compliance status or architecture.
- Treat AI output/code/documentation as proposals until validated against repository behavior and current product direction.
- Preserve the human-in-the-loop model: AI baseline and human decision remain separate; findings begin unreviewed; review state must reflect real human action.
- Prefer durable schemas, validation, product state and tests over prompt-only logic.
- Security, privacy, failure/recovery, accessibility and test implications must be considered for every material product change.
- Do not weaken current governance to preserve older implementation or documentation.
- If a requirement is planned but not implemented, label it as planned/required rather than shipped.
