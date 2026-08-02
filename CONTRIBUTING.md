# Contributing

AI UX Audit Lite is a focused portfolio project. Contributions should protect its small scope and avoid introducing commercial or proprietary product ideas.

## Before Contributing

- Read `docs/PRODUCT-BRIEF.md`.
- Read `docs/MVP-SCOPE.md`.
- Check `ROADMAP.md`.
- Do not add private product logic, prompts, scoring, taxonomies, or workflows.

## Contribution Principles

- One logical change per commit
- Accessibility considered in every UI change
- Type-safe data contracts
- No provider-specific response formats in UI components
- No raw uploaded content in logs
- No model-generated HTML rendering
- Tests for important validation or transformation logic

## Commit Examples

```text
feat(upload): add accessible screenshot input
feat(results): render findings by severity
fix(validation): reject unsupported image types
docs(architecture): clarify provider adapter boundary
test(schema): cover invalid audit responses
```

## Pull Request Checklist

- [ ] Scope matches the MVP or an approved roadmap item
- [ ] User-facing behaviour is documented
- [ ] Keyboard interaction has been checked
- [ ] Error and loading states are covered
- [ ] No confidential or proprietary material is included
- [ ] Tests or clear manual verification steps are provided

## Public Content Rule

Use only self-created, licensed, or clearly permitted screenshots and examples. Never commit employer, client, or NDA-protected material.
