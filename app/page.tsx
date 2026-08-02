import { AuditForm } from "@/components/audit-form/AuditForm";

const reviewAreas = [
  "Visual hierarchy",
  "Navigation and orientation",
  "Clarity of actions",
  "Consistency",
  "Readability",
  "Feedback and system status",
  "Error prevention and recovery",
  "Accessibility basics",
];

export default function HomePage() {
  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="AI UX Audit Lite home">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>AI UX Audit Lite</span>
        </a>
        <nav className="header-actions" aria-label="Primary navigation">
          <a className="quiet-link" href="#review-model">Review model</a>
          <a className="header-button" href="https://github.com/aftabkhan/ai-ux-audit-lite">
            View source <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <div className="page-shell">
        <section className="hero" aria-labelledby="page-title">
          <div className="announcement"><span className="announcement-dot" aria-hidden="true" />Portfolio MVP · privacy-aware by design</div>
          <h1 id="page-title">Turn a UI screenshot into<span className="hero-accent"> a clearer product experience.</span></h1>
          <p className="hero-copy">Upload one interface screenshot and receive a structured first-pass UX review with prioritized findings, user impact, and practical recommendations.</p>
          <div className="hero-actions">
            <a className="primary-cta" href="#audit-workspace">Start a UX review <span aria-hidden="true">→</span></a>
            <a className="text-cta" href="#review-model">Explore the review model <span aria-hidden="true">↘</span></a>
          </div>
          <ul className="trust-list" aria-label="Product commitments"><li>No account required</li><li>No screenshot history</li><li>Human review recommended</li></ul>
        </section>

        <section id="audit-workspace" className="workspace" aria-label="UX audit workspace">
          <div className="workspace-frame">
            <div className="workspace-chrome" aria-hidden="true"><span className="chrome-dot chrome-red" /><span className="chrome-dot chrome-yellow" /><span className="chrome-dot chrome-green" /><span className="workspace-label">AI-assisted review workspace</span></div>
            <div className="workspace-intro"><div><p className="workspace-kicker">Structured UX reasoning</p><h2>Review one screen. Surface the decisions that matter.</h2></div><span className="workspace-status">Provider aware</span></div>
            <AuditForm />
          </div>
        </section>

        <section id="review-model" className="review-areas" aria-labelledby="review-areas-title">
          <div className="review-copy"><p className="eyebrow">How the audit is structured</p><h2 id="review-areas-title">Eight focused lenses, one actionable report.</h2><p>Every finding follows a consistent structure: observation, likely user impact, recommendation, severity, and confidence.</p></div>
          <ol>{reviewAreas.map((area, index) => <li key={area}><span>{String(index + 1).padStart(2, "0")}</span>{area}</li>)}</ol>
        </section>
      </div>

      <footer><p>Built by Aftab Khan as a focused AI + UX Engineering portfolio project.</p><p>AI output may be incomplete and should be validated by a qualified reviewer.</p></footer>
    </main>
  );
}
