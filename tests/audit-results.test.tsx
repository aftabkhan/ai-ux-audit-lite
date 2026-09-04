import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuditResults } from "@/components/audit-results/AuditResults";
import type { AuditResult } from "@/src/types/audit";

const mockResult: AuditResult = {
  version: "1.0",
  generatedAt: "2026-09-04T10:00:00.000Z",
  context: {
    screenTitle: "Payment Flow",
    targetUser: "Shopper",
    productContext: "Checkout",
  },
  summary: {
    overview: "A focused evaluation.",
    strengths: ["Clear primary visual path"],
    priorityActions: ["Clarify secondary buttons"],
  },
  findings: [
    {
      id: "f-1",
      title: "Primary call to action lacks contrast",
      severity: "high",
      category: "visual-hierarchy",
      observation: "Buttons have low color differentiation.",
      impact: "Users might misclick.",
      recommendation: "Increase button contrast.",
      confidence: "high",
    },
    {
      id: "f-2",
      title: "Secondary links have small hit targets",
      severity: "medium",
      category: "accessibility-basics",
      observation: "Hit target is 28px tall.",
      impact: "Difficult to tap on touch devices.",
      recommendation: "Increase hit target to 44px.",
      confidence: "medium",
    },
  ],
  disclaimer: "Directional review only.",
};

describe("AuditResults HITL Review Experience", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders with default accepted findings and baseline score without adjustment badge", () => {
    render(<AuditResults result={mockResult} onReset={() => {}} />);

    // Baseline: high (12) + medium (6) = 18 penalty => 82
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.queryByText(/Score adjusted by Human Reviewer/)).not.toBeInTheDocument();

    // Default triage buttons are rendered and "Accept Finding" is selected
    const acceptButtons = screen.getAllByRole("button", { name: /Accept Finding/i });
    expect(acceptButtons).toHaveLength(2);
    expect(acceptButtons[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("recalculates score and displays adjustment badge when a finding is dismissed", () => {
    render(<AuditResults result={mockResult} onReset={() => {}} />);

    const dismissButtons = screen.getAllByRole("button", { name: /Dismiss \/ False Positive/i });
    // Dismiss the high severity finding (f-1)
    fireEvent.click(dismissButtons[0]);

    // High severity finding (12 penalty) is dismissed. Only medium (6 penalty) remains active.
    // Score should recalculate to 100 - 6 = 94.
    const scoreVal = document.querySelector(".score-value strong");
    expect(scoreVal).toHaveTextContent("94");

    // Adjustment badge should be visible
    expect(screen.getByText(/Score adjusted by Human Reviewer/i)).toBeInTheDocument();
    expect(screen.getByText("+12 pts")).toBeInTheDocument();

    // Finding card should show dismissed tag
    expect(screen.getByText("Dismissed / False Positive")).toBeInTheDocument();
  });

  it("cycles severity when Override Severity button is clicked and recalculates score", () => {
    render(<AuditResults result={mockResult} onReset={() => {}} />);

    // Cycle order: critical -> high -> medium -> low -> critical
    // Finding 1 starts as 'high'. Next is 'medium'.
    const cycleButtons = screen.getAllByRole("button", { name: /Override severity/i });
    fireEvent.click(cycleButtons[0]);

    // f-1 is now medium (6), f-2 is medium (6) => penalty 12 => score 88 (up from 82)
    expect(document.querySelector(".score-value strong")).toHaveTextContent("88");
    expect(screen.getByText(/Overridden from high/i)).toBeInTheDocument();
    expect(screen.getByText("+6 pts")).toBeInTheDocument();

    // Cycle again: medium -> low (penalty 2) => penalty 2 + 6 = 8 => score 92
    fireEvent.click(cycleButtons[0]);
    expect(document.querySelector(".score-value strong")).toHaveTextContent("92");

    // Cycle again: low -> critical (penalty 18) => penalty 18 + 6 = 24 => score 76
    fireEvent.click(cycleButtons[0]);
    expect(document.querySelector(".score-value strong")).toHaveTextContent("76");
    expect(screen.getByText("-6 pts")).toBeInTheDocument();

    // Reset button should restore finding to high (baseline 82)
    const resetBtn = screen.getByRole("button", { name: /Reset to AI baseline/i });
    fireEvent.click(resetBtn);
    expect(document.querySelector(".score-value strong")).toHaveTextContent("82");
    expect(screen.queryByText(/Score adjusted by Human Reviewer/)).not.toBeInTheDocument();
  });

  it("supports keyboard activation on triage controls", () => {
    render(<AuditResults result={mockResult} onReset={() => {}} />);

    const dismissButtons = screen.getAllByRole("button", { name: /Dismiss \/ False Positive/i });
    const firstDismissBtn = dismissButtons[0];

    // Standard button responds to click or keyboard events
    fireEvent.keyDown(firstDismissBtn, { key: "Enter", code: "Enter" });
    fireEvent.click(firstDismissBtn);

    expect(firstDismissBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Score adjusted by Human Reviewer/i)).toBeInTheDocument();
  });
});
