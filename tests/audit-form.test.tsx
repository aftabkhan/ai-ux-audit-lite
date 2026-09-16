import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuditForm } from "@/components/audit-form/AuditForm";

describe("AuditForm screenshot controls", () => {
  let previewCounter = 0;
  const createObjectURL = vi.fn(() => `blob:preview-${++previewCounter}`);
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    previewCounter = 0;
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

  it("shows ordered evidence previews and lets the user remove one screenshot", () => {
    render(<AuditForm />);

    const input = screen.getByLabelText(/^Choose screenshots/) as HTMLInputElement;
    const first = new File(["first"], "cart.png", { type: "image/png" });
    const second = new File(["second"], "checkout.webp", { type: "image/webp" });

    fireEvent.change(input, { target: { files: [first, second] } });

    expect(screen.getByAltText("Preview of evidence 1")).toHaveAttribute("src", "blob:preview-1");
    expect(screen.getByAltText("Preview of evidence 2")).toHaveAttribute("src", "blob:preview-2");
    expect(screen.getByText("Evidence 1")).toBeInTheDocument();
    expect(screen.getByText("Evidence 2")).toBeInTheDocument();
    expect(screen.getByText("Replace evidence")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove evidence 1" }));

    expect(screen.queryByAltText("Preview of evidence 2")).not.toBeInTheDocument();
    expect(screen.getByAltText("Preview of evidence 1")).toHaveAttribute("src", "blob:preview-2");
    expect(screen.getByText("Evidence 1")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Screenshot removed. Remaining evidence is still ready to review.",
    );
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
  });

  it("keeps audit-definition fields intact when evidence is removed", () => {
    render(<AuditForm />);

    fireEvent.change(screen.getByLabelText("Audit title"), {
      target: { value: "Checkout payment flow" },
    });
    fireEvent.change(screen.getByLabelText("Target user"), {
      target: { value: "First-time customer" },
    });

    const screenshot = new File(["image-data"], "checkout.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText(/^Choose screenshots/), {
      target: { files: [screenshot] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Remove evidence 1" }));

    expect(screen.getByLabelText("Audit title")).toHaveValue("Checkout payment flow");
    expect(screen.getByLabelText("Target user")).toHaveValue("First-time customer");
  });

  it("rejects more than eight screenshots before submission", () => {
    render(<AuditForm />);

    const screenshots = Array.from({ length: 9 }, (_, index) =>
      new File([`screen-${index}`], `screen-${index}.png`, { type: "image/png" }),
    );
    fireEvent.change(screen.getByLabelText(/^Choose screenshots/), {
      target: { files: screenshots },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Choose no more than 8 screenshots");
  });

  it("reports an accessible error when audit is submitted without evidence", () => {
    render(<AuditForm />);

    fireEvent.click(screen.getByRole("button", { name: "Run UX audit" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Add at least one screenshot before starting the audit.",
    );
    expect(screen.getByLabelText(/^Choose screenshots/)).toHaveAttribute("aria-invalid", "true");
  });
});
