"use client";

import { useEffect, useId, useRef, useState } from "react";
import { GEMINI_MODELS, GEMINI_MODEL_PATTERN } from "@/lib/ai/gemini-models";
import styles from "./GeminiModelSelect.module.css";

type Props = {
  model: string;
  onChange: (model: string) => void;
  disabled?: boolean;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  recoveryMessage?: string;
  onRetry?: (model: string) => void;
};

function modelName(model: string) {
  return GEMINI_MODELS.find((item) => item.id === model)?.label.replace(/\s\((preview|legacy access)\)$/i, "") || model || "Server default";
}

export function GeminiModelSelect({ model, onChange, disabled, className, open: controlledOpen, onOpenChange, recoveryMessage, onRetry }: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [localOpen, setLocalOpen] = useState(false);
  const [draft, setDraft] = useState(model);
  const [custom, setCustom] = useState(Boolean(model && !GEMINI_MODELS.some((item) => item.id === model)));
  const isOpen = controlledOpen ?? localOpen;
  const setOpen = (next: boolean) => {
    setLocalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, model]);

  useEffect(() => {
    if (isOpen) return;
    triggerRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  function close() {
    setOpen(false);
  }

  function openPicker() {
    setDraft(model);
    setCustom(Boolean(model && !GEMINI_MODELS.some((item) => item.id === model)));
    setOpen(true);
  }

  function apply(retry: boolean) {
    onChange(draft);
    close();
    if (retry) onRetry?.(draft);
  }

  function choose(value: string) {
    setCustom(value === "__custom__");
    setDraft(value === "__custom__" ? "" : value);
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") close();
    if (event.key !== "Tab") return;
    const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  function handleRadioKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || target.getAttribute("role") !== "radio") return;
    const radios = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    const currentIndex = radios.indexOf(target);
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (currentIndex + 1) % radios.length;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + radios.length) % radios.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = radios.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    radios[nextIndex]?.focus();
    radios[nextIndex]?.click();
  }

  return (
    <div className={`${styles.control} ${className ?? ""}`}>
      <span className={styles.controlLabel}>Gemini model</span>
      <button ref={triggerRef} className={styles.trigger} type="button" aria-haspopup="dialog" aria-expanded={isOpen} disabled={disabled} onClick={openPicker}>
        <span className={styles.triggerValue}>{modelName(model)}</span>
        <span className={styles.triggerAction}>Change <span aria-hidden="true">⌄</span></span>
      </button>
      <small className={styles.helper}>Use the server default or choose any compatible Gemini model ID.</small>

      {isOpen ? (
        <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onKeyDown={handleDialogKeyDown}>
            <header className={styles.header}>
              <div>
                <p className={styles.eyebrow}>Generation settings</p>
                <h2 id={`${id}-title`}>Choose a Gemini model</h2>
                <p id={`${id}-description`} className={styles.description}>The model is used for this request only. Your form and uploaded evidence stay in place.</p>
              </div>
              <button ref={closeRef} className={styles.close} type="button" onClick={close} aria-label="Close model selection">×</button>
            </header>

            <div className={styles.activeModel}><span>Active model</span><strong>{modelName(draft)} <span aria-hidden="true">✓</span></strong></div>
            <div className={styles.options} role="radiogroup" aria-label="Gemini model" onKeyDown={handleRadioKeyDown}>
              <button type="button" role="radio" aria-checked={!draft && !custom} className={styles.option} onClick={() => choose("")}>
                <span className={styles.check} aria-hidden="true">{!draft && !custom ? "✓" : ""}</span><span>Server default</span>{model === "" ? <span className={styles.badge}>Current</span> : null}
              </button>
              {GEMINI_MODELS.map((item) => {
                const selected = draft === item.id;
                const badge = item.label.match(/\((preview|legacy access)\)$/i)?.[1];
                return <button key={item.id} type="button" role="radio" aria-checked={selected} className={`${styles.option} ${selected ? styles.selected : ""}`} onClick={() => choose(item.id)}>
                  <span className={styles.check} aria-hidden="true">{selected ? "✓" : ""}</span><span>{item.label.replace(/\s\((preview|legacy access)\)$/i, "")}</span>{badge ? <span className={styles.badge}>{badge}</span> : null}
                </button>;
              })}
              <button type="button" role="radio" aria-checked={custom} className={`${styles.option} ${custom ? styles.selected : ""}`} onClick={() => choose("__custom__")}>
                <span className={styles.check} aria-hidden="true">{custom ? "✓" : ""}</span><span>Other model</span><span className={styles.badge}>Custom ID</span>
              </button>
            </div>

            {custom ? <label className={styles.customField}>Gemini model ID
              <input value={draft} onChange={(event) => setDraft(event.target.value)} pattern={GEMINI_MODEL_PATTERN.source} maxLength={87} placeholder="gemini-model-name" required autoComplete="off" spellCheck={false} />
              <small>Enter a compatible model ID available to your Google project.</small>
            </label> : null}

            {recoveryMessage ? <div className={styles.recovery} role="status">{recoveryMessage}</div> : null}
            <footer className={styles.footer}>
              <button className={styles.cancel} type="button" onClick={close}>Cancel</button>
              {onRetry ? <button className={styles.apply} type="button" disabled={custom && !GEMINI_MODEL_PATTERN.test(draft)} onClick={() => apply(true)}>Change model &amp; retry</button>
                : <button className={styles.apply} type="button" disabled={custom && !GEMINI_MODEL_PATTERN.test(draft)} onClick={() => apply(false)}>Use selected model</button>}
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
