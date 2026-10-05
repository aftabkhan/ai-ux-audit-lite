"use client";
import { useId, useState } from "react";
import { GEMINI_MODELS, GEMINI_MODEL_PATTERN } from "@/lib/ai/gemini-models";

export function GeminiModelSelect({ model, onChange, disabled }: {
  model: string;
  onChange: (model: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [custom, setCustom] = useState(false);
  return (
    <div className="gemini-model-control">
      <label htmlFor={id}>Gemini model</label>
      <select id={id} data-gemini-model aria-describedby={`${id}-help`} disabled={disabled}
        value={custom ? "__custom__" : model}
        onChange={(event) => {
          const next = event.target.value;
          setCustom(next === "__custom__");
          onChange(next === "__custom__" ? "" : next);
        }}>
        <option value="">Server default</option>
        {GEMINI_MODELS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        <option value="__custom__">Other model — enter model ID</option>
      </select>
      {custom ? <>
        <label htmlFor={`${id}-custom`}>Gemini model ID</label>
        <input id={`${id}-custom`} value={model} onChange={(event) => onChange(event.target.value)}
          placeholder="gemini-3.8-flash" pattern={GEMINI_MODEL_PATTERN.source} maxLength={87}
          required disabled={disabled} spellCheck={false} autoComplete="off" aria-describedby={`${id}-help`} />
      </> : null}
      <small id={`${id}-help`}>Choose a model, or enter another compatible Gemini model ID. Availability depends on the connected Google project. Legacy and preview models may have restricted access.</small>
    </div>
  );
}
