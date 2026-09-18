import { describe, expect, it } from "vitest";
import { activityTitle, displayLabel, humanText } from "../../components/consumer";

describe("consumer presentation without changing stored values", () => {
  it("labels enums and reminder-only directions for people", () => {
    expect(displayLabel("IN_PROGRESS")).toBe("In progress");
    expect(displayLabel("NON_FINANCIAL")).toBe("Reminder only");
    expect(displayLabel("PROPERTY_BASIC_READ")).toBe("Property details");
  });
  it("summarizes manual obligation events without exposing directions", () => {
    expect(activityTitle("Obligation recorded", "Insurance renewal was added manually as NON_FINANCIAL.")).toBe("Insurance renewal added");
    expect(activityTitle("Obligation recorded", "Property tax was added manually as PAYABLE.")).toBe("Property tax added");
  });
  it("preserves names and turns lifecycle events into readable text", () => {
    expect(activityTitle("Maintenance status_changed", "IN_PROGRESS")).toBe("Maintenance in progress");
    expect(activityTitle("Maintenance reported", "Bathroom leakage · Plumbing")).toBe("Bathroom leakage reported");
    expect(activityTitle("Riverfront Residency updated")).toBe("Riverfront Residency updated");
    expect(humanText("USER_REPORTED · IN_PROGRESS")).toBe("added by you · in progress");
  });
});
