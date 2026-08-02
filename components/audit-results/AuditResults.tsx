"use client";

import { useMemo, useState } from "react";
import { auditToMarkdown, downloadAuditJson, downloadAuditMarkdown } from "@/lib/audit/export";
import { createAuditScorecard, describeScore } from "@/lib/audit/score";
import type { AuditCategory, AuditResult, FindingSeverity } from "@/src/types/audit";

interface AuditResultsProps {
  result: AuditResult;
  onReset: () => void;
}

type SeverityFilter = "all" | FindingSeverity;
type CategoryFilter = "all" | AuditCategory;

const severityOrder: FindingSeverity[] = ["high", "medium", "low"];

export function AuditResults({ result, onReset }: AuditResultsProps) {
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(result.findings.map((finding) => finding.category))).sort(),
    [result.findings],
  );

  const counts = useMemo(
    () =>
      severityOrder.reduce<Record<FindingSeverity, number>>(
        (current, item) => ({
          ...current,
          [item]: result.findings.filter((finding) => finding.severity === item).length,
        }),
        { high: 0, medium: 0, low: 0 },
      ),
    [result.findings],
  );

  const scorecard = useMemo(() => createAuditScorecard(result.findings), [result.findings]);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredFindings = useMemo(
    () =>
      result.findings.filter((finding) => {
        const matchesFilters =
          (severity === "all" || finding.severity === severity) &&
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
    [category, normalizedQuery, result.findings, severity],
  );

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(auditToMarkdown(result));
      setCopyStatus("Markdown report copied to the clipboard.");
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
          <h2 id="audit-results-heading" tabIndex={-1}>UX review results</h2>
          <p>{result.summary.overview}</p>
        </div>
        <button className="secondary-button" type="button" onClick={onReset}>
          Start a new review
        </button>
      </div>

      <section className="audit-scorecard" aria-labelledby="scorecard-heading">
        <div className="overall-score">
          <p className="score-label" id="scorecard-heading">Directional UX score</p>
          <p className="score-value"><strong>{scorecard.overall}</strong><span>/100</span></p>
          <p>{describeScore(scorecard.overall)}</p>
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
          This transparent score is derived only from finding severity. It is a directional summary, not a benchmark,
          certification, or accessibility conformance score.
        </p>
      </section>

      <dl className="severity-summary" aria-label="Findings by severity">
        {severityOrder.map((item) => (
          <div key={item} className={`severity-summary-card severity-${item}`}>
            <dt>{item}</dt>
            <dd>{counts[item]}</dd>
          </div>
        ))}
        <div className="severity-summary-card">
          <dt>Total</dt>
          <dd>{result.findings.length}</dd>
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
          <h3 id="priorities-heading">Priority actions</h3>
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
            <select value={severity} onChange={(event) => setSeverity(event.target.value as SeverityFilter)}>
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
            <select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)}>
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
          <button className="secondary-button" type="button" onClick={() => downloadAuditMarkdown(result)}>
            Download Markdown
          </button>
          <button className="secondary-button" type="button" onClick={() => downloadAuditJson(result)}>
            Download JSON
          </button>
        </div>
      </div>

      <p className="status-message results-status" role="status" aria-live="polite">
        {copyStatus}
      </p>

      <div className="findings-heading">
        <h3>Detailed findings</h3>
        <p>{filteredFindings.length} shown</p>
      </div>

      {filteredFindings.length ? (
        <ol className="findings-list">
          {filteredFindings.map((finding, index) => (
            <li key={finding.id} className="finding-card">
              <details open={index === 0}>
                <summary>
                  <span className="finding-summary-copy">
                    <span className="finding-card-header">
                      <span>
                        <span className={`severity-badge severity-${finding.severity}`}>{finding.severity}</span>
                        <span className="category-badge">{formatLabel(finding.category)}</span>
                      </span>
                      <span className="confidence-label">{finding.confidence} confidence</span>
                    </span>
                    <strong>{finding.title}</strong>
                  </span>
                  <span className="finding-toggle" aria-hidden="true">+</span>
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
            </li>
          ))}
        </ol>
      ) : (
        <div className="empty-results" role="status">
          <h4>No findings match your search</h4>
          <p>Change the search or filters to view more findings.</p>
          <button className="secondary-button" type="button" onClick={clearFilters}>Clear search and filters</button>
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
