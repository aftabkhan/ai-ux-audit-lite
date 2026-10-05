import { describe, expect, it } from "vitest";
import { geminiThinkingConfig } from "@/lib/ai/gemini-models";

describe("Gemini thinking settings", () => {
  it("maps the switch to Gemini 3 thinking levels", () => {
    expect(geminiThinkingConfig("gemini-3.7-flash", true)).toEqual({ thinkingLevel: "high" });
    expect(geminiThinkingConfig("gemini-3.7-flash", false)).toEqual({ thinkingLevel: "low" });
  });
  it("maps compatible Gemini 2.5 Flash models to thinking budgets", () => {
    expect(geminiThinkingConfig("gemini-2.5-flash", true)).toEqual({ thinkingBudget: -1 });
    expect(geminiThinkingConfig("gemini-2.5-flash-lite", false)).toEqual({ thinkingBudget: 0 });
  });
  it("leaves thinking behavior to unsupported or custom model IDs", () => {
    expect(geminiThinkingConfig("gemini-custom-preview", true)).toBeUndefined();
    expect(geminiThinkingConfig("gemini-2.5-pro", true)).toBeUndefined();
  });
});
