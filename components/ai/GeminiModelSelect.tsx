"use client";

import { useEffect, useId, useRef, useState } from "react";
import { GEMINI_MODELS, GEMINI_MODEL_PATTERN, geminiThinkingConfig } from "@/lib/ai/gemini-models";
import styles from "./GeminiModelSelect.module.css";

type Props = {
  model: string;
  onChange: (model: string) => void;
  disabled?: boolean;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  recoveryMessage?: string;
  onRetry?: (model: string, extendedThinking?: boolean) => void;
  extendedThinking?: boolean;
  onExtendedThinkingChange?: (enabled: boolean) => void;
};

function modelName(model: string) {
  return GEMINI_MODELS.find((item) => item.id === model)?.label.replace(/\s\((preview|legacy access)\)$/i, "") || model || "Server default";
}

function modelDescription(model: string) {
  if (/flash-lite/i.test(model)) return "Fastest responses";
  if (/\bpro\b/i.test(model)) return "Advanced reasoning";
  if (/flash/i.test(model)) return "Balanced speed and capability";
  return "Compatible Gemini model";
}

function supportsThinkingControl(model: string) {
  return Boolean(model && geminiThinkingConfig(model, false));
}

export function GeminiModelSelect({
  model,
  onChange,
  disabled,
  className,
  open: controlledOpen,
  onOpenChange,
  recoveryMessage,
  onRetry,
  extendedThinking,
  onExtendedThinkingChange,
}: Props) {
  const id = useId();
  const controlRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const [localOpen, setLocalOpen] = useState(false);
  const [localThinking, setLocalThinking] = useState(false);
  const [custom, setCustom] = useState(false);
  const [customModel, setCustomModel] = useState("");
  const [showAllModels, setShowAllModels] = useState(false);
  const isOpen = controlledOpen ?? localOpen;
  const thinking = extendedThinking ?? localThinking;
  const thinkingSupported = supportsThinkingControl(model);

  function setOpen(next: boolean) {
    setLocalOpen(next);
    onOpenChange?.(next);
  }

  function close(returnFocus = false) {
    setOpen(false);
    if (returnFocus) requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !controlRef.current?.contains(event.target)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };
    const frame = requestAnimationFrame(() => selectedRef.current?.focus({ preventScroll: true }));
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, model]);

  function openPicker() {
    const isCustom = Boolean(model && !GEMINI_MODELS.some((item) => item.id === model));
    setCustom(isCustom);
    setCustomModel(isCustom ? model : "");
    setShowAllModels(false);
    setOpen(true);
  }

  function select(value: string) {
    const nextThinking = supportsThinkingControl(value) ? thinking : false;
    onChange(value);
    if (nextThinking !== thinking) setThinking(nextThinking);
    close(true);
    if (recoveryMessage && onRetry) onRetry(value, nextThinking);
  }

  function setThinking(value: boolean) {
    setLocalThinking(value);
    onExtendedThinkingChange?.(value);
  }

  function handleRadioKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || target.getAttribute("role") !== "radio") return;
    const radios = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)')];
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

  const selectedId = model || "";
  const sortedModels = [...GEMINI_MODELS];
  const featuredModels = [
    sortedModels.find((item) => /flash-lite/i.test(item.label)),
    sortedModels.find((item) => /flash/i.test(item.label) && !/flash-lite/i.test(item.label)),
    sortedModels.find((item) => /\bpro\b/i.test(item.label)),
  ].filter((item): item is (typeof GEMINI_MODELS)[number] => Boolean(item));
  const featuredIds = new Set(featuredModels.map((item) => item.id));
  const extraModels = sortedModels.filter((item) => !featuredIds.has(item.id));
  const selectedExtra = sortedModels.find((item) => item.id === model && !featuredIds.has(item.id));
  const remainingModelCount = extraModels.length - Number(Boolean(selectedExtra));
  const visibleModels = showAllModels ? sortedModels : [...featuredModels, ...(selectedExtra ? [selectedExtra] : [])];
  const options = [
    { id: "", label: "Server default", description: "Use the model configured for this product", badge: "" },
    ...visibleModels.map((item) => ({
      id: item.id,
      label: item.label.replace(/\s\((preview|legacy access)\)$/i, ""),
      description: modelDescription(item.id),
      badge: item.label.match(/\((preview|legacy access)\)$/i)?.[1] ?? "",
    })),
  ];

  return (
    <div ref={controlRef} className={`${styles.control} ${className ?? ""}`} data-picker-open={isOpen}>
      <span className={styles.controlLabel}>Gemini model</span>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-label={`Gemini model: ${modelName(model)}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={`${id}-popover`}
        disabled={disabled}
        onClick={() => isOpen ? close() : openPicker()}
      >
        <span className={styles.triggerValue}>{modelName(model)}</span>
        <span className={styles.chevron} aria-hidden="true">{isOpen ? "⌃" : "⌄"}</span>
      </button>

      {isOpen ? (
        <section
          id={`${id}-popover`}
          className={styles.popover}
          role="dialog"
          aria-labelledby={`${id}-title`}
          onKeyDown={handleRadioKeyDown}
        >
          <h2 id={`${id}-title`} className={styles.visuallyHidden}>Choose a Gemini model</h2>
          {recoveryMessage ? <p className={styles.recovery} role="status">{recoveryMessage}</p> : null}
          <div className={styles.options} role="radiogroup" aria-label="Available Gemini models">
            {options.map((option) => {
              const selected = selectedId === option.id;
              return (
                <button
                  key={option.id || "server-default"}
                  ref={selected ? selectedRef : undefined}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={styles.option}
                  onClick={() => select(option.id)}
                >
                  <span className={styles.optionCopy}>
                    <span className={styles.optionTitle}>{option.label}</span>
                    <span className={styles.optionDescription}>{option.description}</span>
                  </span>
                  {option.badge ? <span className={styles.badge}>{option.badge}</span> : null}
                  <span className={styles.check} aria-hidden="true">{selected ? "✓" : ""}</span>
                </button>
              );
            })}
            <button
              type="button"
              role="radio"
              aria-checked={custom}
              ref={custom ? selectedRef : undefined}
              className={styles.option}
              onClick={() => setCustom(true)}
            >
              <span className={styles.optionCopy}>
                <span className={styles.optionTitle}>Custom model ID</span>
                <span className={styles.optionDescription}>Use any Gemini model available to your project</span>
              </span>
              <span className={styles.check} aria-hidden="true">{custom ? "✓" : ""}</span>
            </button>
          </div>

          {!showAllModels && remainingModelCount > 0 ? (
            <button
              className={styles.moreModels}
              type="button"
              aria-expanded="false"
              onClick={() => setShowAllModels(true)}
            >
              View all Gemini models <span>({remainingModelCount} more)</span>
            </button>
          ) : showAllModels ? (
            <button
              className={styles.moreModels}
              type="button"
              aria-expanded="true"
              onClick={() => setShowAllModels(false)}
            >
              Show fewer models
            </button>
          ) : null}

          {custom ? (
            <form className={styles.customField} onSubmit={(event) => { event.preventDefault(); if (GEMINI_MODEL_PATTERN.test(customModel)) select(customModel); }}>
              <label htmlFor={`${id}-custom`}>Gemini model ID</label>
              <div className={styles.customRow}>
                <input
                  id={`${id}-custom`}
                  value={customModel}
                  onChange={(event) => setCustomModel(event.target.value.trim())}
                  pattern={GEMINI_MODEL_PATTERN.source}
                  maxLength={87}
                  placeholder="gemini-model-name"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="submit" disabled={!GEMINI_MODEL_PATTERN.test(customModel)}>
                  {recoveryMessage ? "Retry" : "Use"}
                </button>
              </div>
            </form>
          ) : null}

          <div className={styles.divider} />
          <div className={styles.thinkingRow}>
            <div className={styles.thinkingCopy}>
              <span className={styles.optionTitle}>Extended thinking</span>
              <span className={styles.optionDescription}>
                {thinkingSupported ? "Allow more time for complex tasks" : "Thinking settings are controlled by this model"}
              </span>
            </div>
            <button
              className={styles.switch}
              type="button"
              role="switch"
              aria-checked={thinking}
              aria-label="Extended thinking"
              disabled={!thinkingSupported}
              onClick={() => setThinking(!thinking)}
            >
              <span />
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
