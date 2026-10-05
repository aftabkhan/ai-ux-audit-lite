import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiModelSelect } from "@/components/ai/GeminiModelSelect";

describe("Gemini model picker", () => {
  afterEach(cleanup);
  it("applies a selected model from an accessible dialog", () => {
    const onChange = vi.fn();
    render(<GeminiModelSelect model="" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /server default.*change/i }));
    expect(screen.getByRole("dialog", { name: "Choose a Gemini model" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Gemini 3.7 Flash/ }));
    fireEvent.click(screen.getByRole("button", { name: "Use selected model" }));

    expect(onChange).toHaveBeenCalledWith("gemini-3.7-flash");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("accepts custom model IDs and retries without discarding the current selection", () => {
    const onChange = vi.fn();
    const onRetry = vi.fn();
    render(<GeminiModelSelect model="" onChange={onChange} onRetry={onRetry} recoveryMessage="Model was unavailable." />);

    fireEvent.click(screen.getByRole("button", { name: /server default.*change/i }));
    fireEvent.click(screen.getByRole("radio", { name: /Other model/ }));
    fireEvent.change(screen.getByLabelText(/Gemini model ID/), { target: { value: "gemini-custom-preview" } });
    expect(screen.getByRole("button", { name: "Change model & retry" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Change model & retry" }));

    expect(onChange).toHaveBeenCalledWith("gemini-custom-preview");
    expect(onRetry).toHaveBeenCalledWith("gemini-custom-preview");
  });
});
