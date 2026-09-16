import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceRefs } from "@/components/audit-results/EvidenceRefs";

describe("EvidenceRefs", () => {
  it("renders every supporting evidence position", () => {
    render(<EvidenceRefs findingId="finding-1" refs={[1, 3]} />);

    expect(screen.getByText("Evidence 1")).toBeInTheDocument();
    expect(screen.getByText("Evidence 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Supporting evidence for finding finding-1")).toBeInTheDocument();
  });

  it("renders nothing for legacy findings without evidence references", () => {
    const { container } = render(<EvidenceRefs findingId="legacy-finding" />);
    expect(container).toBeEmptyDOMElement();
  });
});
