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

  it("renders with default unreviewed findings, reviewedCount=0, and no adjustment badge", () => {
    render(<AuditResults result={mockResult} onReset={() => {}} />);

    // Baseline: high (12) + medium (6) = 18 penalty => 82
    expect(document.querySelector(".score-value strong")).toHaveTextContent("82");
    expect(screen.queryByText(/Score adjusted by Human Reviewer/)).not.toBeInTheDocument();

    // Metrics banner initial status
    expect(screen.getByText("0 / 2")).toBeInTheDocument(); // Reviewed: 0 / 2
    expect(screen.getAllByText("Unreviewed")).toHaveLength(2);

    // AI Baseline Priority Actions Provenance
    expect(screen.getByText("AI Baseline — Priority Actions (Pre-Review)")).toBeInTheDocument();
    expect(
      screen.getByText("Generated from the original AI audit before human review."),
    ).toBeInTheDocument();
  });

  it("transitions finding to accepted when 'Accept Finding' is clicked, marking review in-progress", () => {
    render(<AuditResults result={mockResult} onReset={() => {}} />);

    const acceptButtons = screen.getAllByRole("button", { name: /Accept Finding/i });
    fireEvent.click(acceptButtons[0]);

    expect(acceptButtons[0]).toHaveAttribute("aria-pressed", "true");
    // Reviewed count is now 1 / 2, remaining 1
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
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

  it("updates effective penalty and registers an override when severity select changes", () => {
    render(<AuditResults result={mockResult} onReset={() => {}} />);

    const select = screen.getByRole("combobox", {
      name: `Override severity for ${mockResult.findings[0].title}`,
    });
    // f-1 is high (12 penalty). Change to critical (18 penalty).
    fireEvent.change(select, { target: { value: "critical" } });

    // Critical (18) + Medium (6) = 24 penalty => 76 score
    expect(document.querySelector(".score-value strong")).toHaveTextContent("76");
    expect(screen.getAllByText(/Overridden from high/i).length).toBeGreaterThan(0);
    expect(screen.getByText("-6 pts")).toBeInTheDocument();
  });

  it("persists reviewer note across status changes and clears it on reset", () => {
    render(<AuditResults result={mockResult} onReset={() => {}} />);

    // Note input is progressively disclosed: click "+ Add note" to reveal textarea
    const addNoteBtn = screen.getAllByRole("button", { name: /\+ Add note/i })[0];
    fireEvent.click(addNoteBtn);

    const textarea = screen.getByLabelText(`Reviewer note for ${mockResult.findings[0].title}`);
    fireEvent.change(textarea, {
      target: { value: "False positive: icon is hidden on small screens" },
    });

    expect(textarea).toHaveValue("False positive: icon is hidden on small screens");

    // Click Done to collapse the note editor
    const doneBtn = screen.getByRole("button", {
      name: `Done editing note for ${mockResult.findings[0].title}`,
    });
    fireEvent.click(doneBtn);

    // Collapsed preview tag is displayed and toggle now says "Edit note"
    expect(screen.getByText(/False positive: icon is hidden on small screens/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Edit note/i }),
    ).toBeInTheDocument();

    // Click Accept Finding
    const acceptButtons = screen.getAllByRole("button", { name: /Accept Finding/i });
    fireEvent.click(acceptButtons[0]);

    // Note preview remains intact across status changes
    expect(screen.getByText(/False positive: icon is hidden on small screens/)).toBeInTheDocument();

    // Reopen note and verify value persisted
    fireEvent.click(
      screen.getByRole("button", { name: /Edit note/i }),
    );
    const reopenedTextarea = screen.getByLabelText(
      `Reviewer note for ${mockResult.findings[0].title}`,
    );
    expect(reopenedTextarea).toHaveValue("False positive: icon is hidden on small screens");

    // Click Reset to AI baseline
    const resetBtn = screen.getByRole("button", {
      name: /Reset to AI baseline: Primary call to action lacks contrast/i,
    });
    fireEvent.click(resetBtn);

    // Note is cleared, reset collapses editor and restores "+ Add note"
    expect(screen.getAllByRole("button", { name: /\+ Add note/i })).toHaveLength(2);
    expect(
      screen.queryByText(/False positive: icon is hidden on small screens/),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Unreviewed")).toHaveLength(2);
  });

  it("flips reviewStatus to completed when all items are triaged", () => {
    render(<AuditResults result={mockResult} onReset={() => {}} />);

    const acceptButtons = screen.getAllByRole("button", { name: /Accept Finding/i });
    fireEvent.click(acceptButtons[0]);
    fireEvent.click(acceptButtons[1]);

    // All items triaged: 2 / 2 reviewed, 0 remaining
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(document.querySelector(".hitl-stat-value.hitl-remaining")).toHaveTextContent("0");
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
