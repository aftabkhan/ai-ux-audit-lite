import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiModelSelect } from "@/components/ai/GeminiModelSelect";

describe("Gemini model picker", () => {
  afterEach(cleanup);

  it("selects a model directly from the compact picker", () => {
    const onChange = vi.fn();
    render(<GeminiModelSelect model="" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /Gemini model: Server default/i }));
    expect(screen.getByRole("dialog", { name: "Choose a Gemini model" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Gemini 3.8 Flash/ }));

    expect(onChange).toHaveBeenCalledWith("gemini-3.8-flash");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the remaining model catalog available", () => {
    render(<GeminiModelSelect model="" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Gemini model: Server default/i }));
    fireEvent.click(screen.getByRole("button", { name: /View all Gemini models/ }));
    expect(screen.getByRole("radio", { name: /Gemini 3.7 Flash/ })).toBeInTheDocument();
  });

  it("accepts custom IDs and retries with the original context retained", () => {
    const onChange = vi.fn();
    const onRetry = vi.fn();
    render(<GeminiModelSelect model="" onChange={onChange} onRetry={onRetry} recoveryMessage="Model was unavailable." />);

    fireEvent.click(screen.getByRole("button", { name: /Gemini model: Server default/i }));
    fireEvent.click(screen.getByRole("radio", { name: /Custom model ID/ }));
    fireEvent.change(screen.getByLabelText(/Gemini model ID/), { target: { value: "gemini-custom-preview" } });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(onChange).toHaveBeenCalledWith("gemini-custom-preview");
    expect(onRetry).toHaveBeenCalledWith("gemini-custom-preview", false);
  });

  it("exposes extended thinking as an accessible switch", () => {
    const onExtendedThinkingChange = vi.fn();
    render(<GeminiModelSelect model="gemini-3.7-flash" onChange={vi.fn()} onExtendedThinkingChange={onExtendedThinkingChange} />);

    fireEvent.click(screen.getByRole("button", { name: /Gemini model: Gemini 3.7 Flash/i }));
    fireEvent.click(screen.getByRole("switch", { name: "Extended thinking" }));

    expect(onExtendedThinkingChange).toHaveBeenCalledWith(true);
  });
});
