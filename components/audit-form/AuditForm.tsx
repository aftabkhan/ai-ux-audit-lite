"use client";

import { ChangeEvent, FormEvent, useEffect, useId, useState } from "react";
import { AuditResults } from "@/components/audit-results/AuditResults";
import { validateScreenshot } from "@/lib/validation/file";
import type { AuditError, AuditResult } from "@/src/types/audit";

interface FormState {
  screenTitle: string;
  productContext: string;
  targetUser: string;
}

const initialFormState: FormState = {
  screenTitle: "",
  productContext: "",
  targetUser: "",
};

const progressMessages = [
  "Preparing the screenshot…",
  "Reading the visible interface…",
  "Evaluating hierarchy and actions…",
  "Reviewing clarity and accessibility…",
  "Prioritizing recommendations…",
  "Preparing your audit report…",
];

export function AuditForm() {
  const fileInputId = useId();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [progressIndex, setProgressIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setStatus("");
    setResult(null);
    clearPreview();

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validation = validateScreenshot(selectedFile);
    if (!validation.valid) {
      setFile(null);
      setFileError(validation.message);
      return;
    }

    setFile(selectedFile);
    setFileError(null);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setFileError("Add a screenshot before starting the audit.");
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
    body.set("screenshot", file);
    body.set("screenTitle", form.screenTitle);
    body.set("targetUser", form.targetUser);
    body.set("productContext", form.productContext);

    try {
      const response = await fetch("/api/audit", { method: "POST", body });
      const payload = (await response.json()) as AuditResult | AuditError;

      if (!response.ok) {
        const error = payload as AuditError;
        setStatus([error.message, error.recovery].filter(Boolean).join(" "));
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
    clearPreview();
    setFile(null);
    setForm(initialFormState);
    setFileError(null);
    setStatus("");
    setResult(null);
    setProgressIndex(0);
    setInputKey((current) => current + 1);
    requestAnimationFrame(() => document.getElementById(fileInputId)?.focus());
  }

  return (
    <>
      <form className="audit-form" onSubmit={handleSubmit} noValidate>
        <section className="form-section" aria-labelledby="upload-heading">
          <div className="section-heading">
            <p className="step-label">Step 1</p>
            <h2 id="upload-heading">Upload an interface screenshot</h2>
            <p>Use a PNG, JPEG, or WebP image up to 5 MB. Avoid confidential or personal information.</p>
          </div>

          <label className="upload-control" htmlFor={fileInputId}>
            <span className="upload-title">{file ? "Replace screenshot" : "Choose screenshot"}</span>
            <span className="upload-help">PNG, JPEG, or WebP · Maximum 5 MB</span>
          </label>
          <input key={inputKey} className="visually-hidden" id={fileInputId} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} aria-describedby={fileError ? `${fileInputId}-error` : undefined} disabled={isSubmitting} />

          {fileError ? <p className="field-error" id={`${fileInputId}-error`} role="alert">{fileError}</p> : null}

          {previewUrl && file ? (
            <figure className="preview-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt={`Preview of ${file.name}`} />
              <figcaption><strong>{file.name}</strong><span>{Math.ceil(file.size / 1024)} KB · Ready to review</span></figcaption>
            </figure>
          ) : null}
        </section>

        <section className="form-section" aria-labelledby="context-heading">
          <div className="section-heading">
            <p className="step-label">Step 2</p>
            <h2 id="context-heading">Add context</h2>
            <p>Context helps the review stay relevant to the screen, product, and intended audience.</p>
          </div>

          <div className="field-grid">
            <label><span>Screen title</span><input type="text" value={form.screenTitle} onChange={(event) => updateField("screenTitle", event.target.value)} maxLength={100} placeholder="Example: Checkout payment step" disabled={isSubmitting} /></label>
            <label><span>Target user</span><input type="text" value={form.targetUser} onChange={(event) => updateField("targetUser", event.target.value)} maxLength={120} placeholder="Example: First-time mobile customer" disabled={isSubmitting} /></label>
            <label className="full-width"><span>Product context</span><textarea value={form.productContext} onChange={(event) => updateField("productContext", event.target.value)} maxLength={600} rows={5} placeholder="Describe the user goal, business context, or known constraints." disabled={isSubmitting} /><small>{form.productContext.length}/600 characters</small></label>
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Analyzing screenshot…" : result ? "Run another audit" : "Run UX audit"}</button>
          <p className="privacy-note">Screenshots are processed for this request and are not saved by this application.</p>
        </div>

        <div className="status-message" role="status" aria-live="polite" aria-atomic="true">
          {isSubmitting ? (
            <div className="audit-progress"><span className="audit-progress-spinner" aria-hidden="true" /><div><strong>{progressMessages[progressIndex]}</strong><span>AI is preparing a screenshot-specific first-pass review.</span></div></div>
          ) : status ? <p>{status}</p> : null}
        </div>
      </form>

      {result ? <AuditResults result={result} onReset={resetAudit} /> : null}
    </>
  );
}
