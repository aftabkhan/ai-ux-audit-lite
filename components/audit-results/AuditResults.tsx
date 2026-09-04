"use client";

import { useMemo, useState } from "react";
import { auditToMarkdown, downloadAuditJson, downloadAuditMarkdown } from "@/lib/audit/export";
import { createAuditScorecard, describeScore } from "@/lib/audit/score";
import type {
  AuditCategory,
  AuditResult,
  AuditReviewStatus,
  AuditTriageMap,
  AuditTriageSummary,
  FindingSeverity,
  FindingTriageStatus,
} from "@/src/types/audit";

interface AuditResultsProps {
  result: AuditResult;
  onReset: () => void;
}

type SeverityFilter = "all" | FindingSeverity;
type CategoryFilter = "all" | AuditCategory;

const severityOrder: FindingSeverity[] = ["critical", "high", "medium", "low"];

export function AuditResults({ result, onReset }: AuditResultsProps) {
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  // Initialize interactive triage state with "unreviewed" baseline
  const [triage, setTriage] = useState<AuditTriageMap>(() =>
    result.findings.reduce<AuditTriageMap>((acc, f) => {
      acc[f.id] = {
        status: "unreviewed",
        severity: f.severity,
        originalSeverity: f.severity,
        reviewerNote: "",
      };
      return acc;
    }, {}),
  );

  function handleStatusChange(id: string, status: FindingTriageStatus) {
    setTriage((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return { ...prev, [id]: { ...current, status } };
    });
  }

  function handleSeverityChange(id: string, newSeverity: FindingSeverity) {
    setTriage((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: {
          ...current,
          severity: newSeverity,
          status: current.status === "unreviewed" ? "accepted" : current.status,
        },
      };
    });
  }

  function handleNoteChange(id: string, note: string) {
    setTriage((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: {
          ...current,
          reviewerNote: note,
        },
      };
    });
  }

  function handleResetFinding(id: string) {
    setTriage((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: {
          status: "unreviewed",
          severity: current.originalSeverity,
          originalSeverity: current.originalSeverity,
          reviewerNote: "",
        },
      };
    });
  }

  // Baseline scorecard derived solely from AI findings
  const baselineScorecard = useMemo(() => createAuditScorecard(result.findings), [result.findings]);

  // Active findings: unreviewed and accepted findings apply their effective severity penalty. Dismissed findings contribute 0 penalty.
  const activeFindings = useMemo(
    () =>
      result.findings
        .filter((finding) => triage[finding.id]?.status !== "dismissed")
        .map((finding) => ({
          ...finding,
          severity: triage[finding.id]?.severity ?? finding.severity,
        })),
    [result.findings, triage],
  );

  // Dynamic recalculated scorecard based on reviewer triage
  const scorecard = useMemo(() => createAuditScorecard(activeFindings), [activeFindings]);

  // HITL summary statistics
  const triageSummary = useMemo<AuditTriageSummary>(() => {
    const entries = Object.values(triage);
    const totalCount = result.findings.length;
    const acceptedCount = entries.filter((item) => item.status === "accepted").length;
    const dismissedCount = entries.filter((item) => item.status === "dismissed").length;
    const overrideCount = entries.filter((item) => item.severity !== item.originalSeverity).length;
    const reviewedCount = acceptedCount + dismissedCount;
    const unreviewedCount = Math.max(0, totalCount - reviewedCount);

    let reviewStatus: AuditReviewStatus = "not-started";
    if (reviewedCount === totalCount && totalCount > 0) {
      reviewStatus = "completed";
    } else if (reviewedCount > 0) {
      reviewStatus = "in-progress";
    }

    return {
      totalCount,
      reviewedCount,
      unreviewedCount,
      acceptedCount,
      dismissedCount,
      overrideCount,
      baselineScore: baselineScorecard.overall,
      adjustedScore: scorecard.overall,
      reviewStatus,
    };
  }, [triage, result.findings.length, baselineScorecard.overall, scorecard.overall]);

  const isScoreAdjusted =
    triageSummary.adjustedScore !== triageSummary.baselineScore || triageSummary.overrideCount > 0;

  const categories = useMemo(
    () => Array.from(new Set(result.findings.map((finding) => finding.category))).sort(),
    [result.findings],
  );

  const counts = useMemo(
    () =>
      severityOrder.reduce<Record<FindingSeverity, number>>(
        (current, item) => ({
          ...current,
          [item]: activeFindings.filter((finding) => finding.severity === item).length,
        }),
        { critical: 0, high: 0, medium: 0, low: 0 },
      ),
    [activeFindings],
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredFindings = useMemo(
    () =>
      result.findings.filter((finding) => {
        const itemTriage = triage[finding.id];
        const effectiveSeverity = itemTriage?.severity ?? finding.severity;

        const matchesFilters =
          (severity === "all" || effectiveSeverity === severity) &&
          (category === "all" || finding.category === category);
        const searchableText = [
          finding.title,
          finding.observation,
          finding.impact,
          finding.recommendation,
          finding.category,
        ]
          .join(" ")
          .toLowerCase();

        return matchesFilters && (!normalizedQuery || searchableText.includes(normalizedQuery));
      }),
    [category, normalizedQuery, result.findings, severity, triage],
  );

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(auditToMarkdown(result, triage, triageSummary));
      setCopyStatus("Markdown report copied to the clipboard with HITL triage summary.");
    } catch {
      setCopyStatus("The report could not be copied. Download the Markdown file instead.");
    }
  }

  function clearFilters() {
    setSeverity("all");
    setCategory("all");
    setQuery("");
  }

  return (
    <section className="results-shell" aria-labelledby="audit-results-heading">
      <div className="results-header">
        <div>
          <p className="eyebrow">Audit complete</p>
          <h2 id="audit-results-heading" tabIndex={-1}>
            UX review results
          </h2>
          <p>{result.summary.overview}</p>
        </div>
        <button className="secondary-button" type="button" onClick={onReset}>
          Start a new review
        </button>
      </div>

      <section className="audit-scorecard" aria-labelledby="scorecard-heading">
        <div className="overall-score">
          <p className="score-label" id="scorecard-heading">
            Directional UX score
          </p>
          <p className="score-value">
            <strong>{scorecard.overall}</strong>
            <span>/100</span>
          </p>
          <p>{describeScore(scorecard.overall)}</p>

          {isScoreAdjusted && (
            <div className="score-adjusted-badge" role="status" aria-live="polite">
              <span className="badge-pill">Human Reviewer</span>
              <span className="badge-label">
                Score adjusted by Human Reviewer: <strong>{baselineScorecard.overall}</strong> &rarr;{" "}
                <strong>{scorecard.overall}</strong>
              </span>
              <span
                className="score-delta"
                aria-label={`Score change: ${scorecard.overall - baselineScorecard.overall} points`}
              >
                {scorecard.overall - baselineScorecard.overall >= 0
                  ? `+${scorecard.overall - baselineScorecard.overall}`
                  : scorecard.overall - baselineScorecard.overall}{" "}
                pts
              </span>
            </div>
          )}
        </div>
        <div className="category-score-list" aria-label="Category score overview">
          {scorecard.byCategory.slice(0, 6).map((item) => (
            <div className="category-score" key={item.category}>
              <div>
                <span>{formatLabel(item.category)}</span>
                <strong>{item.score}</strong>
              </div>
              <div className="score-track" aria-hidden="true">
                <span style={{ width: `${item.score}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="score-note">
          This transparent score is derived only from finding severity and is dynamically updated
          by human reviewer triage. It is a directional summary, not a benchmark, certification, or
          accessibility conformance score.
        </p>
      </section>

      <div className="hitl-metrics-bar" aria-label="Human-in-the-loop review overview">
        <div className="hitl-stat">
          <span className="hitl-stat-label">Reviewed</span>
          <span className="hitl-stat-value">
            {triageSummary.reviewedCount} / {triageSummary.totalCount}
          </span>
        </div>
        <div className="hitl-stat">
          <span className="hitl-stat-label">Accepted</span>
          <span className="hitl-stat-value hitl-accepted">{triageSummary.acceptedCount}</span>
        </div>
        <div className="hitl-stat">
          <span className="hitl-stat-label">Dismissed</span>
          <span className="hitl-stat-value hitl-dismissed">{triageSummary.dismissedCount}</span>
        </div>
        <div className="hitl-stat">
          <span className="hitl-stat-label">Overrides</span>
          <span className="hitl-stat-value hitl-overrides">{triageSummary.overrideCount}</span>
        </div>
        <div className="hitl-stat">
          <span className="hitl-stat-label">Remaining</span>
          <span className="hitl-stat-value hitl-remaining">{triageSummary.unreviewedCount}</span>
        </div>
      </div>

      <dl className="severity-summary" aria-label="Active findings by severity">
        {severityOrder.map((item) => (
          <div key={item} className={`severity-summary-card severity-${item}`}>
            <dt>{item}</dt>
            <dd>{counts[item]}</dd>
          </div>
        ))}
        <div className="severity-summary-card">
          <dt>Active Total</dt>
          <dd>{activeFindings.length}</dd>
        </div>
      </dl>

      <div className="summary-grid">
        <section aria-labelledby="strengths-heading">
          <h3 id="strengths-heading">Strengths</h3>
          <ul>
            {result.summary.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="priorities-heading">
          <h3 id="priorities-heading">AI Baseline — Priority Actions (Pre-Review)</h3>
          <p className="priority-actions-caption">
            Generated from the original AI audit before human review.
          </p>
          <ol>
            {result.summary.priorityActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </section>
      </div>

      <div className="results-toolbar" aria-label="Search, filter, and export results">
        <div className="filter-group">
          <label className="finding-search">
            <span>Search findings</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search observation or recommendation"
            />
          </label>

          <label>
            <span>Severity</span>
            <select
              value={severity}
              onChange={(event) => setSeverity(event.target.value as SeverityFilter)}
            >
              <option value="all">All severities</option>
              {severityOrder.map((item) => (
                <option key={item} value={item}>
                  {item[0].toUpperCase() + item.slice(1)} ({counts[item]})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryFilter)}
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="export-actions">
          <button className="secondary-button" type="button" onClick={copyMarkdown}>
            Copy Markdown
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => downloadAuditMarkdown(result, triage, triageSummary)}
          >
            Download Markdown
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => downloadAuditJson(result, triage, triageSummary)}
          >
            Download JSON
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => window.print()}
            title="Print or save the audited report as PDF"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <p className="status-message results-status" role="status" aria-live="polite">
        {copyStatus}
      </p>

      <div className="findings-heading">
        <div>
          <h3>Detailed findings</h3>
          <p className="findings-subtitle">
            Review and triage each item below to fine-tune the final score.
          </p>
        </div>
        <p>{filteredFindings.length} shown</p>
      </div>

      {filteredFindings.length ? (
        <ol className="findings-list">
          {filteredFindings.map((finding, index) => {
            const itemTriage = triage[finding.id] ?? {
              status: "unreviewed",
              severity: finding.severity,
              originalSeverity: finding.severity,
              reviewerNote: "",
            };
            const isDismissed = itemTriage.status === "dismissed";
            const isAccepted = itemTriage.status === "accepted";
            const isUnreviewed = itemTriage.status === "unreviewed";
            const isOverridden = itemTriage.severity !== itemTriage.originalSeverity;
            const isModified =
              !isUnreviewed ||
              isOverridden ||
              Boolean(itemTriage.reviewerNote && itemTriage.reviewerNote.trim().length > 0);

            return (
              <li
                key={finding.id}
                className={`finding-card ${isDismissed ? "finding-card-dismissed" : ""}`}
              >
                <details open={index === 0}>
                  <summary>
                    <span className="finding-summary-copy">
                      <span className="finding-card-header">
                        <span className="badge-cluster">
                          <span className={`severity-badge severity-${itemTriage.severity}`}>
                            {itemTriage.severity}
                          </span>
                          {isOverridden && (
                            <span
                              className="override-badge"
                              title={`AI initially assessed: ${itemTriage.originalSeverity}`}
                            >
                              Overridden from {itemTriage.originalSeverity}
                            </span>
                          )}
                          {isDismissed && (
                            <span className="dismissed-badge">Dismissed / False Positive</span>
                          )}
                          {isAccepted && <span className="accepted-badge">Accepted</span>}
                          {isUnreviewed && <span className="unreviewed-badge">Unreviewed</span>}
                          <span className="category-badge">{formatLabel(finding.category)}</span>
                        </span>
                        <span className="confidence-label">{finding.confidence} confidence</span>
                      </span>
                      <strong className={isDismissed ? "title-dismissed" : ""}>
                        {finding.title}
                      </strong>
                    </span>
                    <span className="finding-toggle" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <dl className="finding-details">
                    <div>
                      <dt>Observation</dt>
                      <dd>{finding.observation}</dd>
                    </div>
                    <div>
                      <dt>Impact</dt>
                      <dd>{finding.impact}</dd>
                    </div>
                    <div>
                      <dt>Recommendation</dt>
                      <dd>{finding.recommendation}</dd>
                    </div>
                  </dl>
                </details>

                <div
                  className="triage-toolbar"
                  role="toolbar"
                  aria-label={`Reviewer triage for finding: ${finding.title}`}
                >
                  <div
                    className="triage-status-group"
                    role="group"
                    aria-label="Triage status selection"
                  >
                    <button
                      type="button"
                      className={`triage-btn triage-btn-accept ${isAccepted ? "is-selected" : ""}`}
                      aria-pressed={isAccepted}
                      onClick={() => handleStatusChange(finding.id, "accepted")}
                    >
                      <span className="triage-icon" aria-hidden="true">
                        &#x2713;
                      </span>
                      <span>Accept Finding</span>
                    </button>
                    <button
                      type="button"
                      className={`triage-btn triage-btn-dismiss ${isDismissed ? "is-selected" : ""}`}
                      aria-pressed={isDismissed}
                      onClick={() => handleStatusChange(finding.id, "dismissed")}
                    >
                      <span className="triage-icon" aria-hidden="true">
                        &#x2715;
                      </span>
                      <span>Dismiss / False Positive</span>
                    </button>
                  </div>

                  <div className="triage-override-group">
                    <label htmlFor={`severity-${finding.id}`} className="sr-only">
                      Override severity for {finding.title}
                    </label>
                    <div className="triage-select-wrapper">
                      <span className="triage-select-label" id={`severity-label-${finding.id}`}>
                        Severity:
                      </span>
                      <select
                        id={`severity-${finding.id}`}
                        aria-labelledby={`severity-label-${finding.id}`}
                        value={itemTriage.severity}
                        onChange={(e) =>
                          handleSeverityChange(finding.id, e.target.value as FindingSeverity)
                        }
                        className="triage-select"
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    {isOverridden && (
                      <span
                        className="override-badge"
                        aria-label={`Overridden from ${itemTriage.originalSeverity}`}
                      >
                        Overridden from {itemTriage.originalSeverity}
                      </span>
                    )}

                    {isModified && (
                      <button
                        type="button"
                        className="triage-reset-btn"
                        onClick={() => handleResetFinding(finding.id)}
                        aria-label={`Reset to AI baseline: ${finding.title}`}
                      >
                        Reset to AI baseline
                      </button>
                    )}
                  </div>

                  <div className="reviewer-note-container">
                    <label htmlFor={`note-${finding.id}`} className="note-label">
                      Reviewer note (optional)
                    </label>
                    <textarea
                      id={`note-${finding.id}`}
                      value={itemTriage.reviewerNote ?? ""}
                      onChange={(e) => handleNoteChange(finding.id, e.target.value)}
                      placeholder="e.g., False positive: component is hidden on mobile viewport..."
                      maxLength={500}
                      rows={2}
                      className="note-input"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="empty-results" role="status">
          <h4>No findings match your search</h4>
          <p>Change the search or filters to view more findings.</p>
          <button className="secondary-button" type="button" onClick={clearFilters}>
            Clear search and filters
          </button>
        </div>
      )}

      <p className="results-disclaimer">{result.disclaimer}</p>
    </section>
  );
}

function formatLabel(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

