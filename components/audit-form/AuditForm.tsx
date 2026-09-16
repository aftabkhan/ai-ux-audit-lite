"use client";

import { ChangeEvent, FormEvent, useEffect, useId, useRef, useState } from "react";
import { AuditResults } from "@/components/audit-results/AuditResults";
import { validateScreenshot } from "@/lib/validation/file";
import type { AuditError, AuditResult } from "@/src/types/audit";

interface FormState {
  screenTitle: string;
  productContext: string;
  targetUser: string;
}

interface EvidencePreview {
  file: File;
  url: string;
}

const initialFormState: FormState = {
  screenTitle: "",
  productContext: "",
  targetUser: "",
};

const MAX_SCREENSHOTS = 8;
const MAX_COMBINED_BYTES = 20 * 1024 * 1024;

const progressMessages = [
  "Preparing the evidence…",
  "Reading the visible interfaces…",
  "Evaluating hierarchy and actions…",
  "Reviewing clarity and accessibility…",
  "Prioritizing recommendations…",
  "Preparing your audit report…",
];

export function AuditForm() {
  const fileInputId = useId();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [evidence, setEvidence] = useState<EvidencePreview[]>([]);
  const previewUrlsRef = useRef<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [progressIndex, setProgressIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function clearEvidence() {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
    setEvidence([]);
  }

  function removeScreenshot(index: number) {
    setEvidence((current) => {
      const item = current[index];
      if (item) {
        URL.revokeObjectURL(item.url);
        previewUrlsRef.current = previewUrlsRef.current.filter((url) => url !== item.url);
      }
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
    setFileError(null);
    setStatus("Screenshot removed. Remaining evidence is still ready to review.");
    setResult(null);
    setInputKey((current) => current + 1);
    requestAnimationFrame(() => {
      document.getElementById(fileInputId)?.focus();
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    setStatus("");
    setResult(null);

    if (selectedFiles.length === 0) {
      return;
    }

    if (selectedFiles.length > MAX_SCREENSHOTS) {
      setFileError(`Choose no more than ${MAX_SCREENSHOTS} screenshots for one audit.`);
      event.target.value = "";
      return;
    }

    let combinedBytes = 0;
    for (const selectedFile of selectedFiles) {
      const validation = validateScreenshot(selectedFile);
      if (!validation.valid) {
        setFileError(validation.message);
        event.target.value = "";
        return;
      }
      combinedBytes += selectedFile.size;
    }

    if (combinedBytes > MAX_COMBINED_BYTES) {
      setFileError("The selected screenshots exceed 20 MB combined. Compress or remove evidence and try again.");
      event.target.value = "";
      return;
    }

    clearEvidence();
    const nextEvidence = selectedFiles.map((file) => ({ file, url: URL.createObjectURL(file) }));
    previewUrlsRef.current = nextEvidence.map((item) => item.url);
    setEvidence(nextEvidence);
    setFileError(null);
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (evidence.length === 0) {
      setFileError("Add at least one screenshot before starting the audit.");
      document.getElementById(fileInputId)?.focus();
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    setStatus("");
    setProgressIndex(0);

    const progressTimer = window.setInterval(() => {
      setProgressIndex((current) => Math.min(current + 1, progressMessages.length - 1));
    }, 1800);

    const body = new FormData();
    evidence.forEach(({ file }) => body.append("screenshot", file));
    body.set("screenTitle", form.screenTitle);
    body.set("targetUser", form.targetUser);
    body.set("productContext", form.productContext);

    try {
      const response = await fetch("/api/audit", { method: "POST", body });
      const payload = (await response.json()) as AuditResult | AuditError;

      if (!response.ok) {
        const error = payload as AuditError;
        setStatus(error.recovery ? `${error.message} ${error.recovery}` : error.message);
        return;
      }

      setResult(payload as AuditResult);
      setStatus("Audit complete. Review, filter, copy, or download the findings below.");
      requestAnimationFrame(() => {
        const heading = document.getElementById("audit-results-heading");
        heading?.focus({ preventScroll: true });
        heading?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setStatus("The audit request could not be completed. Check your connection and try again. Your inputs are still here.");
    } finally {
      window.clearInterval(progressTimer);
      setIsSubmitting(false);
    }
  }

  function resetAudit() {
    clearEvidence();
    setForm(initialFormState);
    setFileError(null);
    setStatus("");
    setResult(null);
    setProgressIndex(0);
    setInputKey((current) => current + 1);
    requestAnimationFrame(() => {
      document.getElementById(fileInputId)?.focus();
      document.getElementById("screenshot-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <>
      <form className="audit-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        <section className="form-section" aria-labelledby="screenshot-heading">
          <div className="section-heading">
            <span className="step-label">Step 1</span>
            <h2 id="screenshot-heading">Add interface evidence</h2>
            <p>Choose 1–8 ordered PNG, JPEG, or WebP screenshots. Each image can be up to 5 MB, with a 20 MB combined limit. Avoid confidential or personal information.</p>
          </div>

          <label className="upload-control" htmlFor={fileInputId}>
            <span className="upload-title">{evidence.length ? "Replace evidence" : "Choose screenshots"}</span>
            <span className="upload-help">1–8 screenshots · PNG, JPEG, or WebP · 5 MB each</span>
          </label>
          <input
            key={inputKey}
            className="visually-hidden"
            id={fileInputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={handleFileChange}
            aria-describedby={fileError ? `${fileInputId}-error` : undefined}
            aria-invalid={Boolean(fileError)}
            disabled={isSubmitting}
          />

          {fileError ? <p className="field-error" id={`${fileInputId}-error`} role="alert">{fileError}</p> : null}

          {evidence.length ? (
            <div className="evidence-list" aria-label="Selected screenshot evidence">
              {evidence.map(({ file, url }, index) => (
                <figure className="preview-card" key={`${file.name}-${file.size}-${index}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preview of evidence ${index + 1}: ${file.name}`} />
                  <figcaption>
                    <div>
                      <strong>Evidence {index + 1} · {file.name}</strong>
                      <span>{Math.ceil(file.size / 1024)} KB · Ready to review</span>
                    </div>
                    <button className="secondary-button" type="button" onClick={() => removeScreenshot(index)} disabled={isSubmitting}>
                      Remove evidence {index + 1}
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : null}
        </section>

        <section className="form-section" aria-labelledby="context-heading">
          <div className="section-heading">
            <span className="step-label">Step 2</span>
            <h2 id="context-heading">Add context</h2>
            <p>Context helps the review stay relevant to the screen sequence, product, task, and intended audience.</p>
          </div>

          <div className="field-grid">
            <label>
              <span>Audit / screen title</span>
              <input type="text" value={form.screenTitle} onChange={(event) => updateField("screenTitle", event.target.value)} maxLength={100} placeholder="Example: Checkout flow" disabled={isSubmitting} />
            </label>
            <label>
              <span>Target user</span>
              <input type="text" value={form.targetUser} onChange={(event) => updateField("targetUser", event.target.value)} maxLength={120} placeholder="Example: First-time mobile customer" disabled={isSubmitting} />
            </label>
            <label className="full-width">
              <span>Product context</span>
              <textarea value={form.productContext} onChange={(event) => updateField("productContext", event.target.value)} maxLength={600} rows={5} placeholder="Describe the user goal, sequence, business context, or known constraints." disabled={isSubmitting} />
              <small>{form.productContext.length}/600 characters</small>
            </label>
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Analyzing evidence…" : result ? "Run another audit" : "Run UX audit"}</button>
          <p className="privacy-note">Evidence is processed for this request and is not persisted by the current public workflow. Product Lab persistence will use reviewer-owned private storage only after its auth boundary is active.</p>
        </div>

        <div className="status-message" role="status" aria-live="polite" aria-atomic="true">
          {isSubmitting ? (
            <div className="audit-progress">
              <span className="audit-progress-spinner" aria-hidden="true" />
              <div>
                <strong>{progressMessages[progressIndex]}</strong>
                <span>AI is preparing an evidence-grounded first-pass review.</span>
              </div>
            </div>
          ) : status ? <p>{status}</p> : null}
        </div>
      </form>

      {result ? <AuditResults result={result} onReset={resetAudit} /> : null}
    </>
  );
}
