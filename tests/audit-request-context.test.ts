import { describe, expect, it } from "vitest";
import { parseAuditContextFromFormData } from "@/lib/audit/request-context";

describe("audit request context", () => {
  it("preserves the full audit definition from form data", () => {
    const form = new FormData();
    form.set("screenTitle", "Checkout flow");
    form.set("scopeType", "user-flow");
    form.set("targetUser", "First-time customer");
    form.set("taskDescription", "Move from cart through payment confirmation");
    form.set("businessObjective", "Reduce abandonment while preserving trust");
    form.set("expectedOutcome", "Complete payment confidently");
    form.set("productContext", "Mobile commerce checkout");

    expect(parseAuditContextFromFormData(form)).toEqual({
      screenTitle: "Checkout flow",
      scopeType: "user-flow",
      targetUser: "First-time customer",
      taskDescription: "Move from cart through payment confirmation",
      businessObjective: "Reduce abandonment while preserving trust",
      expectedOutcome: "Complete payment confidently",
      productContext: "Mobile commerce checkout",
    });
  });

  it("rejects malformed scope values rather than silently dropping them", () => {
    const form = new FormData();
    form.set("scopeType", "admin-everything");
    expect(parseAuditContextFromFormData(form)).toBeNull();
  });
});
