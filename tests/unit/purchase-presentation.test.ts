import { describe, expect, it } from "vitest";
import { isPracticeWorkspace, lastActivityMs, partitionPurchaseRows, sortRecentlyActive, splitPurchaseName } from "@/lib/purchase-presentation";

describe("purchase presentation", () => {
  it("splits a unit from a property name without changing stored values", () => {
    expect(splitPurchaseName("Riverfront Residency — Unit 1204")).toEqual({ title: "Riverfront Residency", subtitle: "Unit 1204" });
  });
  it("sorts by recent activity, not demo email or hardcoded names", () => {
    const older = { id: "a", name: "Older", propertyType: "3 BHK", location: "Indore", areaValue: null, areaUnit: null, askingPricePaise: null, budgetPaise: null, source: null, notes: null, stage: "CONSIDERING", version: 1, entries: [{ id: "1", kind: "NOTE", body: "x", createdAt: "2026-01-01T00:00:00.000Z" }], workspaceId: "w1", workspaceName: "Older" };
    const newer = { ...older, id: "b", name: "Newer", entries: [{ id: "2", kind: "NOTE", body: "y", createdAt: "2026-09-14T12:00:00.000Z" }], workspaceId: "w2", workspaceName: "Newer" };
    expect(sortRecentlyActive([older, newer]).map((row) => row.id)).toEqual(["b", "a"]);
    expect(lastActivityMs(newer)).toBeGreaterThan(lastActivityMs(older));
  });
  it("keeps disposable practice workspaces in a secondary group", () => {
    expect(isPracticeWorkspace("Motion Acceptance Disposable / Motion Flat 7")).toBe(true);
    const groups = partitionPurchaseRows([
      { id: "w1", name: "Riverfront Residency — Unit 1204", candidates: [{ id: "r", name: "Riverfront Residency — Unit 1204", propertyType: "3 BHK", location: "Indore", areaValue: null, areaUnit: null, askingPricePaise: "15200000", budgetPaise: "14000000", source: null, notes: null, stage: "INFORMATION_GATHERING", version: 1, entries: [{ id: "1", kind: "NOTE", body: "x", createdAt: "2026-09-10T00:00:00.000Z" }] }] },
      { id: "w2", name: "Motion Acceptance Disposable / Motion Flat 7", candidates: [{ id: "m", name: "Motion Flat 7", propertyType: "flat", location: "Indore", areaValue: null, areaUnit: null, askingPricePaise: null, budgetPaise: null, source: null, notes: null, stage: "CONSIDERING", version: 1, entries: [{ id: "2", kind: "NOTE", body: "y", createdAt: "2026-09-14T00:00:00.000Z" }] }] },
    ]);
    expect(groups.active.map((row) => row.id)).toEqual(["r"]);
    expect(groups.practice.map((row) => row.id)).toEqual(["m"]);
  });
});
