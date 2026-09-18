import { describe, expect, it } from "vitest";
import { formatINR } from "@/lib/construction-os";
import {
  filterGuidanceForCaps,
  projectGuidanceForRole,
  sortGuidance,
  type GuidanceRow,
} from "@/lib/construction-guidance";

function row(partial: Partial<GuidanceRow> & { ruleKey: string }): GuidanceRow {
  return {
    id: partial.ruleKey,
    subjectType: "DECISION",
    subjectId: "s1",
    type: "FYI",
    priority: "NORMAL",
    title: partial.ruleKey,
    reason: "",
    consequence: null,
    actionType: "NONE",
    actionTarget: null,
    relevanceKey: partial.ruleKey,
    status: "ACTIVE",
    provenance: {},
    relevantUntil: null,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as GuidanceRow;
}

describe("Construction OS money formatting", () => {
  it("formats paise in compact INR without floats", () => {
    expect(formatINR(269000000n)).toBe("₹26.90L");
    expect(formatINR(18200000n)).toBe("₹1.82L");
    expect(formatINR(1200000000n)).toBe("₹1.20Cr");
    expect(formatINR(24000000n)).toBe("₹2.40L");
    expect(formatINR(50000n)).toBe("₹500");
    expect(formatINR(-100000n)).toBe("-₹1.0K");
  });
});

describe("Construction OS guidance ordering", () => {
  it("orders BLOCKING before DECISION before DUE before EXCEPTION before FYI, deterministically", () => {
    const rows = [
      row({ ruleKey: "G14", type: "FYI" }),
      row({ ruleKey: "G04", type: "EXCEPTION", priority: "HIGH" }),
      row({ ruleKey: "G01", type: "BLOCKING", priority: "HIGH" }),
      row({ ruleKey: "G10", type: "DECISION", priority: "HIGH" }),
      row({ ruleKey: "G05", type: "DUE", priority: "HIGH" }),
    ];
    expect(sortGuidance(rows).map((r) => r.ruleKey)).toEqual(["G01", "G10", "G05", "G04", "G14"]);
  });
});

describe("Construction OS guidance authorization and projection", () => {
  const all = [
    row({ ruleKey: "G01", type: "BLOCKING", priority: "HIGH", title: "Electrical layout approval needs approval." }),
    row({ ruleKey: "G08", type: "FYI", title: "Change moved cost." }),
    row({ ruleKey: "G13", type: "FYI", title: "Drawing available." }),
  ];
  it("hides financial and document guidance without capabilities", () => {
    const filtered = filterGuidanceForCaps(all, {
      plan: true,
      financial: false,
      materials: true,
      site: true,
      documents: false,
      handover: false,
    });
    expect(filtered.map((r) => r.ruleKey)).toEqual(["G01"]);
  });
  it("rewords the same truth per role without changing facts", () => {
    const owner = projectGuidanceForRole(all, "OWNER");
    expect(owner[0].title).toMatch(/needs approval/);
    const architect = projectGuidanceForRole(all, "ARCHITECT");
    expect(architect[0].title).toMatch(/awaiting owner approval/);
    const contractor = projectGuidanceForRole(all, "CONTRACTOR");
    expect(contractor[0].reason).toMatch(/cannot complete until/);
    const pm = projectGuidanceForRole(all, "PROJECT_MANAGER");
    expect(pm[0].title).toMatch(/^Blocking decision:/);
  });
});
