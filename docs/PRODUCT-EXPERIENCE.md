# Product Experience Scope

## Purpose

AI UX Audit Lite is a public portfolio project. Its report experience demonstrates UX engineering judgement through a deliberately limited, generic, and explainable implementation.

## Sprint 14 experience

The report includes:

- a concise executive summary;
- a transparent directional score;
- severity counts;
- strengths and priority actions;
- search by finding content;
- severity and category filters;
- expandable detailed findings;
- Markdown and JSON export;
- clear limitations and recovery states.

## Directional score

The public score uses a deliberately simple calculation:

- high-severity finding: 12-point deduction;
- medium-severity finding: 6-point deduction;
- low-severity finding: 2-point deduction;
- score is clamped between 0 and 100.

The score exists to help a user scan one generated report. It is not:

- a usability benchmark;
- an accessibility-conformance score;
- a quality certification;
- a comparison across products;
- a proprietary or commercially validated scoring model.

The implementation and limitations are intentionally visible so the feature remains explainable in interviews.

## Public repository boundaries

This repository intentionally excludes:

- proprietary weights or scoring logic;
- private prompt chains or multi-agent orchestration;
- benchmark datasets;
- industry-specific rules;
- customer or employer material;
- private commercial roadmaps.

## Interview explanation

The scorecard is a presentation aid, not an AI claim. The underlying report remains the source of detail. The score is calculated from already validated findings so it is deterministic, testable, vendor-independent, and easy to explain.
