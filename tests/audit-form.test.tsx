import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuditForm } from "@/components/audit-form/AuditForm";

describe("AuditForm screenshot controls", () => {
  const createObjectURL = vi.fn(() => "blob:preview");
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });

    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows a preview and lets the user remove a valid screenshot", () => {
    render(<AuditForm />);

    const input = screen.getByLabelText(/^Choose screenshot/) as HTMLInputElement;
    const screenshot = new File(["image-data"], "checkout.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [screenshot] } });

    expect(screen.getByAltText("Preview of checkout.png")).toHaveAttribute("src", "blob:preview");
    expect(screen.getByText("checkout.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove screenshot" })).toBeInTheDocument();
    expect(screen.getByText("Replace screenshot")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove screenshot" }));

    expect(screen.queryByAltText("Preview of checkout.png")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove screenshot" })).not.toBeInTheDocument();
    expect(screen.getByText("Choose screenshot")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Screenshot removed. Choose another screenshot when you are ready.",
    );
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("keeps context fields intact when a screenshot is removed", () => {
    render(<AuditForm />);

    fireEvent.change(screen.getByLabelText("Screen title"), {
      target: { value: "Checkout payment step" },
    });
    fireEvent.change(screen.getByLabelText("Target user"), {
      target: { value: "First-time customer" },
    });

    const screenshot = new File(["image-data"], "checkout.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText(/^Choose screenshot/), {
      target: { files: [screenshot] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Remove screenshot" }));

    expect(screen.getByLabelText("Screen title")).toHaveValue("Checkout payment step");
    expect(screen.getByLabelText("Target user")).toHaveValue("First-time customer");
  });

  it("reports an accessible error when audit is submitted without a screenshot", () => {
    render(<AuditForm />);

    fireEvent.click(screen.getByRole("button", { name: "Run UX audit" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Add a screenshot before starting the audit.",
    );
    expect(screen.getByLabelText(/^Choose screenshot/)).toHaveAttribute("aria-invalid", "true");
  });
});
