import { describe, expect, it } from "vitest";
import { otherPlaces, primaryAskLines, resolveSelectedLifeId } from "@/lib/home-life-session";
import {
  composeHomeLives,
  composeSharedLives,
  emptyHomeLivesInput,
  formatStoredDate,
  selectLatestChange,
  shortLabel,
  withHomeLives,
  type HomeGuidanceInput,
  type HomeLivesInput,
} from "@/lib/home-lives";

const TODAY = "2026-09-23";

function guidance(row: Partial<HomeGuidanceInput> & Pick<HomeGuidanceInput, "id" | "ruleKey" | "subjectId" | "type" | "title">): HomeGuidanceInput {
  return {
    subjectType: "RECORD",
    priority: "HIGH",
    reason: "Recorded.",
    actionType: "OPEN_DECISION",
    createdAt: new Date("2026-09-20T00:00:00.000Z"),
    relevantUntil: null,
    ...row,
  };
}

function input(patch: Partial<HomeLivesInput> = {}): HomeLivesInput {
  return { ...emptyHomeLivesInput(TODAY), ...patch, today: TODAY };
}

describe("Home V2 lives ranking", () => {
  it("keeps domain tier order, drops FYI, and dedupes the same decision and the same shortage", () => {
    const lives = composeHomeLives(input({
      properties: [{ id: "plot", name: "Super Corridor Plot", city: "Indore", area: "Super Corridor" }],
      projects: [{
        id: "build",
        propertyId: "plot",
        stageName: "RCC / Structure",
        milestoneName: "First-floor slab",
        progressPercent: 30,
        updates: [],
        guidance: [
          guidance({ id: "g02", ruleKey: "G02", subjectId: "decision-1", type: "DECISION", title: "Electrical layout approval is due soon.", actionType: "OPEN_DECISION" }),
          guidance({ id: "g01", ruleKey: "G01", subjectId: "decision-1", type: "BLOCKING", title: "Electrical layout approval needs approval.", reason: "Electrical conduit preparation depends on this decision. A decision is recorded as due tomorrow.", actionType: "OPEN_DECISION", relevantUntil: "2026-09-25" }),
          guidance({ id: "g10", ruleKey: "G10", subjectId: "invoice-1", type: "DECISION", title: "Contractor invoice — Ravi Buildcon needs review.", reason: "₹2.40L recorded from Ravi Buildcon. No payment is implied.", actionType: "OPEN_MONEY_RECORD" }),
          guidance({ id: "g05", ruleKey: "G05", subjectId: "inspection-1", type: "DUE", title: "Reinforcement inspection is tomorrow.", reason: "Recorded for tomorrow by Neha Kulkarni.", actionType: "OPEN_INSPECTION", relevantUntil: "2026-09-24" }),
          guidance({ id: "g07", ruleKey: "G07", subjectId: "issue-1", type: "EXCEPTION", priority: "CRITICAL", title: "Cement delivery shortage needs attention.", actionType: "OPEN_ISSUE", createdAt: new Date("2026-09-01T00:00:00.000Z") }),
          guidance({ id: "g04", ruleKey: "G04", subjectId: "delivery-1", type: "EXCEPTION", title: "10 cement bags were short.", reason: "390 received against 400 recorded as ordered.", actionType: "OPEN_DELIVERY", createdAt: new Date("2026-09-02T00:00:00.000Z") }),
          guidance({ id: "g08", ruleKey: "G08", subjectId: "change-1", type: "FYI", title: "Bedroom flooring upgrade changed the approved project cost.", actionType: "OPEN_MONEY_RECORD" }),
          guidance({ id: "g12", ruleKey: "G12", subjectId: "steel-1", type: "FYI", title: "TMT steel is required later.", actionType: "OPEN_DELIVERY" }),
        ],
      }],
    })).lives[0]!;

    expect(lives.asks.map((ask) => ask.ruleKey)).toEqual(["G01", "G10", "G05"]);
    expect(lives.asks.map((ask) => ask.tier)).toEqual([0, 2, 3]);
    expect(lives.asks[0]).toMatchObject({ title: "Electrical layout approval", eyebrow: "Decision", actionLabel: "Review the layout", href: "/construction/build?tab=more#decisions" });
    expect(lives.asks[0]?.reason).toBe("Electrical conduit preparation depends on this decision.");
    expect(lives.asks[1]?.meta).toBe("₹2.40L");
    expect(lives.asks[2]).toMatchObject({ title: "Reinforcement inspection", meta: "tomorrow" });
    expect(lives.moreCount).toBe(1);
    expect(lives.asks.some((ask) => ask.ruleKey === "G02" || ask.ruleKey === "G07" || ask.ruleKey === "G08" || ask.ruleKey === "G12")).toBe(false);
    expect(lives.dot).toBe(true);
    expect(lives.summary.headline).toBe("On RCC / Structure");
    expect(lives.summary.detail).toBe("Preparing the first-floor slab · 30%");
  });

  it("prefers the delivery shortage over the issue even when the issue sorts first", () => {
    const life = composeHomeLives(input({
      properties: [{ id: "plot", name: "Super Corridor Plot", city: "Indore", area: null }],
      projects: [{
        id: "build",
        propertyId: "plot",
        stageName: "RCC / Structure",
        milestoneName: null,
        progressPercent: 30,
        updates: [],
        guidance: [
          guidance({ id: "g07", ruleKey: "G07", subjectId: "issue-1", type: "EXCEPTION", priority: "CRITICAL", title: "Cement delivery shortage needs attention.", actionType: "OPEN_ISSUE", createdAt: new Date("2026-09-01T00:00:00.000Z") }),
          guidance({ id: "g04", ruleKey: "G04", subjectId: "delivery-1", type: "EXCEPTION", priority: "HIGH", title: "10 cement bags were short.", reason: "390 received against 400 recorded as ordered.", actionType: "OPEN_DELIVERY", createdAt: new Date("2026-09-02T00:00:00.000Z") }),
        ],
      }],
    })).lives[0]!;
    expect(life.asks).toHaveLength(1);
    expect(life.asks[0]).toMatchObject({ ruleKey: "G04", title: "10 cement bags were short.", reason: "390 received against 400." });
    expect(life.moreCount).toBe(0);
  });

  it("does not promote FYI when it is the only guidance", () => {
    const life = composeHomeLives(input({
      properties: [{ id: "plot", name: "Quiet Plot", city: null, area: null }],
      projects: [{
        id: "build",
        propertyId: "plot",
        stageName: "RCC / Structure",
        milestoneName: "First-floor slab",
        progressPercent: 30,
        updates: [],
        guidance: [guidance({ id: "g12", ruleKey: "G12", subjectId: "steel", type: "FYI", title: "TMT steel is required later." })],
      }],
    })).lives[0]!;
    expect(life.asks).toEqual([]);
    expect(life.summary.headline).toBe("Nothing needs you.");
    expect(life.dot).toBe(false);
  });

  it("opens on the life with the strongest primary ask", () => {
    const result = composeHomeLives(input({
      properties: [
        { id: "house", name: "Vijay Nagar House", city: "Indore", area: "Vijay Nagar" },
        { id: "plot", name: "Super Corridor Plot", city: "Indore", area: "Super Corridor" },
      ],
      projects: [{
        id: "build",
        propertyId: "plot",
        stageName: "RCC / Structure",
        milestoneName: "First-floor slab",
        progressPercent: 30,
        updates: [],
        guidance: [guidance({ id: "g01", ruleKey: "G01", subjectId: "decision-1", type: "BLOCKING", title: "Electrical layout approval needs approval.", relevantUntil: "2026-09-25" })],
      }],
      maintenance: [{ id: "repair", propertyId: "house", task: "Electrical Check", status: "IN_PROGRESS", dateReported: "2026-09-21" }],
    }));
    expect(result.defaultLifeId).toBe("house:plot");
    expect(result.lives.map((life) => life.id)).toEqual(["house:plot", "house:house"]);
  });

  it("remembers a session life only when that life is still present", () => {
    expect(resolveSelectedLifeId(["house:plot", "house:house"], "house:house", "house:plot")).toBe("house:house");
    expect(resolveSelectedLifeId(["house:plot"], "house:missing", "house:plot")).toBe("house:plot");
    expect(resolveSelectedLifeId([], "house:plot", null)).toBeNull();
  });

  it("does not repeat an ask subject in the latest change", () => {
    const change = selectLatestChange({
      updates: [{
        id: "beam",
        title: "Beam reinforcement completed",
        description: "mehta-residence synthetic history. Beam reinforcement was completed. Electrical conduit work has started.",
        occurredAt: "2026-09-22T00:00:00.000Z",
        createdAt: "2026-09-22T08:00:00.000Z",
        href: "/construction/build?tab=site",
      }],
      timeline: [{
        id: "cement-event",
        propertyId: "plot",
        title: "Cement delivery shortage",
        detail: "390 received against 400.",
        date: "2026-09-22",
        createdAt: "2026-09-22T09:00:00.000Z",
        href: "/property/plot",
      }],
      askSubjectIds: new Set(["decision-1", "invoice-1", "inspection-1", "delivery-1"]),
      askTitles: ["Electrical layout approval", "Contractor invoice — Ravi Buildcon", "Reinforcement inspection"],
      shortageTokens: ["cement"],
    });
    expect(change?.sentence).toBe("Beam reinforcement was completed.");
    expect(change?.subjectId).toBe("beam");
  });

  it("uses a specific site note when a later construction echo is only the generic history line", () => {
    const change = selectLatestChange({
      updates: [{
        id: "beam",
        title: "Beam reinforcement completed",
        description: "namespace synthetic history. Beam reinforcement was completed. Electrical conduit work has started.",
        occurredAt: "2026-09-22T12:00:00.000Z",
        createdAt: "2026-09-22T12:00:00.000Z",
        href: "/construction/build?tab=site",
      }],
      timeline: [{
        id: "echo",
        propertyId: "plot",
        title: "Construction history updated",
        detail: "Owner recorded a construction event. Open Construction for authorized details.",
        date: "2026-09-25",
        createdAt: "2026-09-25T10:00:00.000Z",
        href: "/property/plot",
      }],
      askSubjectIds: new Set(["decision-1"]),
      askTitles: ["Reinforcement inspection"],
      shortageTokens: ["cement"],
    });
    expect(change?.title).toBe("Beam reinforcement completed");
    expect(change?.sentence).toBe("Beam reinforcement was completed.");
  });

  it("keeps a newer real event ahead of an older site note", () => {
    const generic = selectLatestChange({
      updates: [{
        id: "beam",
        title: "Beam reinforcement completed",
        description: "Beam reinforcement was completed.",
        occurredAt: "2026-09-22",
        createdAt: "2026-09-22T08:00:00.000Z",
        href: "/construction/build?tab=site",
      }],
      timeline: [{
        id: "real",
        propertyId: "plot",
        title: "Owner recorded a construction event",
        detail: "Owner recorded a construction event.",
        date: "2026-09-25",
        createdAt: "2026-09-25T10:00:00.000Z",
        href: "/property/plot",
      }],
      askSubjectIds: new Set(),
      askTitles: [],
      shortageTokens: [],
    });
    expect(generic?.title).toBe("Owner recorded a construction event");
    const newer = selectLatestChange({
      updates: [{
        id: "beam",
        title: "Beam reinforcement completed",
        description: "Beam reinforcement was completed.",
        occurredAt: "2026-09-22",
        createdAt: "2026-09-22T08:00:00.000Z",
        href: "/construction/build?tab=site",
      }],
      timeline: [{
        id: "tax",
        propertyId: "plot",
        title: "Tax paid",
        detail: "The tax payment was recorded.",
        date: "2026-09-24",
        createdAt: "2026-09-24T10:00:00.000Z",
        href: "/property/plot",
      }],
      askSubjectIds: new Set(),
      askTitles: [],
      shortageTokens: [],
    });
    expect(newer?.title).toBe("Tax paid");
    expect(newer?.sentence).toBe("The tax payment was recorded.");
  });

  it("shows a visit name and keeps a date-only reason as meta", () => {
    expect(primaryAskLines(
      { title: "Nikhil Jain", reason: "26 Sep.", meta: "26 Sep" },
      "Nikhil Jain ₹83.00L · Priya Shah ₹81.00L",
    )).toEqual({ title: "Nikhil Jain", reason: null, meta: "26 Sep" });
    const shown = primaryAskLines({ title: "Nikhil Jain", reason: "26 Sep.", meta: "26 Sep" }, null);
    expect(JSON.stringify(shown)).not.toContain("Nothing was sent");
    expect(primaryAskLines(
      { title: "Nikhil Jain", reason: "26 Sep. Nothing was sent.", meta: "26 Sep" },
      "Nikhil Jain ₹83.00L · Priya Shah ₹81.00L",
    ).reason).toBe("26 Sep. Nothing was sent.");
    expect(primaryAskLines(
      { title: "Electrical Check", reason: "Reported 21 Sep.", meta: null },
      "Electrical check is still open.",
    )).toEqual({ title: null, reason: "Reported 21 Sep.", meta: null });
  });

  it("uses the open repair before a bill due this week, and leaves planned work out", () => {
    const life = composeHomeLives(input({
      properties: [{ id: "house", name: "Vijay Nagar House", city: "Indore", area: "Vijay Nagar" }],
      obligations: [
        { id: "tax", propertyId: "house", label: "Property Tax", remainingPaise: "1845000", dueDate: "2026-10-11" },
        { id: "power", propertyId: "house", label: "Electricity", remainingPaise: "485000", dueDate: "2026-09-30" },
        { id: "loan", propertyId: "house", label: "Loan instalment", remainingPaise: "2500000", dueDate: "2026-10-21" },
      ],
      maintenance: [
        { id: "repair", propertyId: "house", task: "Electrical Check", status: "IN_PROGRESS", dateReported: "2026-09-21" },
        { id: "paint", propertyId: "house", task: "Exterior Painting", status: "PLANNED", dateReported: "2026-09-01" },
      ],
      reminders: [{ id: "rem", propertyId: "house", title: "Electricity due soon.", scheduledAt: "2026-09-30T00:00:00.000Z", href: "/property/house?tab=bills" }],
    })).lives[0]!;
    expect(life.asks.map((ask) => ask.title)).toEqual(["Electrical Check", "Electricity"]);
    expect(life.asks[1]?.meta).toBe(`₹4,850 · due ${formatStoredDate("2026-09-30")}`);
    expect(life.summary.headline).toBe("Electrical check is still open.");
    expect(life.asks[0]?.reason).toBe(`Reported ${formatStoredDate("2026-09-21")}.`);
    expect(life.status).toBe("Electrical check open");
    expect(life.dot).toBe(true);
    expect(life.moreCount).toBe(0);
    expect(JSON.stringify(life.asks)).not.toContain("Exterior Painting");
    expect(JSON.stringify(life.asks)).not.toContain("Loan");
  });

  it("lets an overdue bill outrank the repair", () => {
    const life = composeHomeLives(input({
      properties: [{ id: "house", name: "Vijay Nagar House", city: "Indore", area: null }],
      obligations: [{ id: "power", propertyId: "house", label: "Electricity", remainingPaise: "485000", dueDate: "2026-09-01" }],
      maintenance: [{ id: "repair", propertyId: "house", task: "Electrical Check", status: "IN_PROGRESS", dateReported: "2026-09-21" }],
    })).lives[0]!;
    expect(life.asks.map((ask) => ask.ruleKey)).toEqual(["obligation", "maintenance"]);
    expect(life.asks[0]?.tier).toBe(1);
    expect(life.dot).toBe(true);
  });

  it("states the Riverfront offer without asking for another counter", () => {
    const life = composeHomeLives(input({
      purchases: [{
        id: "river",
        name: "Riverfront Residency — Unit 1204",
        location: "Indore",
        phase: "NEGOTIATING",
        linkedPropertyId: null,
        askingPricePaise: "1800000000",
        latestBuyerOfferPaise: "1720000000",
        reportedCounterPaise: "1750000000",
        agreed: false,
        netPricePaidPaise: "0",
        termsPricePaise: null,
        handoverItems: [],
      }],
      visits: [{ id: "visit-1", candidateId: "river", prospectId: null, startsOn: "2026-09-25", contactName: "Owner-recorded visit", notes: "Planned privately. No invitation was sent.", status: "PLANNED" }],
      transactionGuidance: [
        { ruleKey: "TX02", subjectId: "river", title: "Which parking space is allocated?", href: "/buy-sell/purchases/river/questions", dueDate: "2026-09-24", relevanceKey: "q-parking" },
        { ruleKey: "TX09", subjectId: "river", title: "View the planned visit", href: "/buy-sell/purchases/river", dueDate: "2026-09-25", relevanceKey: "visit-1" },
        { ruleKey: "TX02", subjectId: "river", title: "What are the current society dues?", href: "/buy-sell/purchases/river/questions", dueDate: null, relevanceKey: "q-dues" },
      ],
    })).lives[0]!;
    expect(life.summary.headline).toBe("You offered ₹1.72Cr. Their last reply was ₹1.75Cr.");
    expect(life.summary.caption).toBe("No agreed price is recorded.");
    expect(life.summary.phaseWord).toBe("Talking");
    expect(life.asks.map((ask) => ask.title)).toEqual(["Which parking space is allocated?", "Visit", "What are the current society dues?"]);
    expect(life.asks[0]?.actionLabel).toBe("Answer");
    expect(JSON.stringify(life)).not.toContain("Review the reported counter");
    expect(JSON.stringify(life)).not.toContain("1.72Cr budget");
    expect(life.status).toBe("Talking · parking question");
    expect(life.dot).toBe(false);
    expect(life.upcoming.map((row) => row.subjectId)).not.toContain("q-parking");
    expect(life.visualSummary).toMatchObject({ kind: "buying", you: "₹1.72Cr", them: "₹1.75Cr", phaseWord: "Talking" });
    expect(JSON.stringify(life)).not.toContain("Review the reply");
    expect(life.capture.map((action) => action.label)).toEqual(["Ask", "Record visit", "Record payment", "Add note"]);
  });

  it("keeps Palm under houses and asks for the planned visit, not a reply", () => {
    const life = composeHomeLives(input({
      properties: [{ id: "palm", name: "Palm Meadows Apartment", city: "Indore", area: null }],
      sales: [{
        id: "sale-palm",
        propertyId: "palm",
        prospects: [
          { id: "priya", name: "Priya Shah", privateNotes: "Seller-only note. Not visible to the other prospect.", nextVisit: null, visitNotes: null, offers: [{ amountPaise: "810000000", offeredOn: "2026-09-18", status: "RECORDED" }] },
          { id: "nikhil", name: "Nikhil Jain", privateNotes: "Separate prospect. Offer is not shared with Priya Shah.", nextVisit: "2026-09-26", visitNotes: "Planned privately. No invitation was sent.", offers: [{ amountPaise: "830000000", offeredOn: "2026-09-21", status: "RECORDED" }] },
        ],
      }],
      visits: [{ id: "nikhil-visit", candidateId: null, prospectId: "nikhil", startsOn: "2026-09-26", contactName: "Nikhil Jain", notes: "Planned privately. No invitation was sent.", status: "PLANNED" }],
      transactionGuidance: [
        { ruleKey: "TX09", subjectId: "nikhil", title: "View the planned visit", href: "/buy-sell/sales", dueDate: "2026-09-26", relevanceKey: "nikhil-visit" },
      ],
    })).lives[0]!;
    expect(life.kind).toBe("house");
    expect(life.summary.headline).toBe("Nikhil Jain ₹83.00L · Priya Shah ₹81.00L");
    expect(life.summary.caption).toBe("Priya cannot see Nikhil's offer.");
    expect(life.asks).toHaveLength(1);
    expect(life.asks[0]).toMatchObject({ title: "Nikhil Jain", eyebrow: "Visit", actionLabel: "See the visit", href: "/buy-sell/sales/sale-palm", meta: formatStoredDate("2026-09-26") });
    expect(life.asks[0]?.reason).toContain("Nothing was sent.");
    expect(life.status).toBe("Selling · Nikhil Jain ₹83.00L");
    expect(life.destinationHref).toBe("/property/palm");
    expect(life.dot).toBe(false);
    expect(life.upcoming.map((row) => row.title)).not.toContain("Nikhil Jain");
    expect(life.visualSummary).toMatchObject({
      kind: "selling",
      privacy: "Priya cannot see Nikhil's offer.",
      offers: [{ name: "Nikhil Jain", amount: "₹83.00L" }, { name: "Priya Shah", amount: "₹81.00L" }],
    });
    expect(life.capture.map((action) => action.label)).toEqual(["Record offer"]);
  });

  it("names the first open handover item and the recorded Lakeview payment", () => {
    const life = composeHomeLives(input({
      purchases: [{
        id: "lake",
        name: "Lakeview Apartment — Unit 502",
        location: null,
        phase: "HANDOVER",
        linkedPropertyId: null,
        askingPricePaise: null,
        latestBuyerOfferPaise: null,
        reportedCounterPaise: null,
        agreed: false,
        netPricePaidPaise: "30000000",
        termsPricePaise: "1730000000",
        handoverItems: [
          { label: "Keys", disposition: "OPEN" },
          { label: "Meter readings", disposition: "OPEN" },
          { label: "Included fixtures", disposition: "OPEN" },
          { label: "Pending dues", disposition: "OPEN" },
        ],
      }],
      transactionGuidance: [
        { ruleKey: "TX10", subjectId: "lake", title: "Check open handover items", href: "/buy-sell/purchases/lake", dueDate: null, relevanceKey: "handover-1" },
      ],
    })).lives[0]!;
    expect(life.summary.phaseWord).toBe("Moving in");
    expect(life.summary.headline).toBe("₹3.00L recorded toward ₹1.73Cr");
    expect(life.summary.caption).toBe("Entered by you, not a bank receipt.");
    expect(life.asks[0]).toMatchObject({ title: "Keys", reason: "3 other items are still open.", actionLabel: "See what’s left" });
    expect(life.asks).toHaveLength(1);
    expect(life.status).toBe("Moving in · Keys open");
    expect(life.visualSummary).toMatchObject({ kind: "buying", recorded: "₹3.00L", toward: "₹1.73Cr", openHandover: 4 });
    expect(JSON.stringify(life.visualSummary)).not.toContain("2 of 4");
  });

  it("is calm when a house has no ask", () => {
    const life = composeHomeLives(input({
      properties: [{ id: "quiet", name: "Quiet House", city: "Indore", area: null }],
    })).lives[0]!;
    expect(life.asks).toEqual([]);
    expect(life.summary.headline).toBe("Nothing needs you.");
    expect(life.summary.situation).toBe("Quiet House is quiet.");
    expect(life.latestChange).toBeNull();
    expect(life.dot).toBe(false);
  });

  it("returns no lives for an empty account", () => {
    expect(composeHomeLives(emptyHomeLivesInput(TODAY))).toEqual({ lives: [], defaultLifeId: null });
  });

  it("shows shared places without owner asks", () => {
    const shared = composeSharedLives(
      [{ id: "shared-house", name: "Shared House", city: "Indore", area: null }],
      [{ id: "event-1", propertyId: "shared-house", title: "Tax paid", detail: "Recorded by the owner.", date: "2026-09-20" }],
    );
    expect(shared.lives[0]?.asks).toEqual([]);
    expect(shared.lives[0]?.summary.headline).toBe("Shared with you.");
    expect(shared.lives[0]?.latestChange?.title).toBe("Tax paid");
    expect(shared.lives[0]?.destinationHref).toBe("/shared/shared-house");
    expect(shared.defaultLifeId).toBe("house:shared-house");
    expect(shared.lives[0]?.capture).toEqual([]);
    expect(shared.lives[0]?.upcoming).toEqual([]);
    expect(shared.lives[0]?.recentChanges[0]?.title).toBe("Tax paid");
  });

  it("keeps the primary ask out of this week and recent changes", () => {
    const life = composeHomeLives(input({
      properties: [{ id: "plot", name: "Super Corridor Plot", city: "Indore", area: "Super Corridor" }],
      projects: [{
        id: "build",
        propertyId: "plot",
        stageName: "RCC / Structure",
        milestoneName: "First-floor slab",
        progressPercent: 30,
        updates: [
          { id: "decision-1", title: "Electrical layout approval", description: "Same subject as the ask.", occurredAt: "2026-09-23T12:00:00.000Z", createdAt: "2026-09-23T12:00:00.000Z" },
          { id: "beam", title: "Beam reinforcement completed", description: "Beam reinforcement was completed.", occurredAt: "2026-09-22T12:00:00.000Z", createdAt: "2026-09-22T12:00:00.000Z" },
          { id: "note-2", title: "Morning delay recorded", description: "Weather delayed the morning start.", occurredAt: "2026-09-20T12:00:00.000Z", createdAt: "2026-09-20T12:00:00.000Z" },
          { id: "note-3", title: "Steel requirement noted", description: "Quotes are recorded and none is selected.", occurredAt: "2026-09-21T12:00:00.000Z", createdAt: "2026-09-21T12:00:00.000Z" },
          { id: "note-4", title: "Plinth work recorded", description: "Plinth work followed the earlier confirmation.", occurredAt: "2026-09-19T12:00:00.000Z", createdAt: "2026-09-19T12:00:00.000Z" },
        ],
        guidance: [
          guidance({ id: "g01", ruleKey: "G01", subjectId: "decision-1", type: "BLOCKING", title: "Electrical layout approval needs approval.", relevantUntil: "2026-09-25" }),
          guidance({ id: "g05", ruleKey: "G05", subjectId: "inspection-1", type: "DUE", title: "Reinforcement inspection is tomorrow.", actionType: "OPEN_INSPECTION", relevantUntil: "2026-09-24" }),
          guidance({ id: "g04", ruleKey: "G04", subjectId: "delivery-1", type: "EXCEPTION", title: "10 cement bags were short.", reason: "390 received against 400 recorded as ordered.", actionType: "OPEN_DELIVERY", relevantUntil: "2026-09-26" }),
          guidance({ id: "g12", ruleKey: "G12", subjectId: "steel-1", type: "FYI", title: "TMT steel is required later.", relevantUntil: "2026-09-25" }),
          guidance({ id: "dated-5", ruleKey: "G06", subjectId: "inspect-2", type: "DUE", title: "Waterproofing check is on 28 Sep.", actionType: "OPEN_INSPECTION", relevantUntil: "2026-09-28" }),
          guidance({ id: "dated-6", ruleKey: "G06", subjectId: "inspect-3", type: "DUE", title: "Door check is on 29 Sep.", actionType: "OPEN_INSPECTION", relevantUntil: "2026-09-29" }),
          guidance({ id: "dated-7", ruleKey: "G06", subjectId: "inspect-4", type: "DUE", title: "Paint check is on 30 Sep.", actionType: "OPEN_INSPECTION", relevantUntil: "2026-09-30" }),
        ],
      }],
      timeline: [{ id: "echo", propertyId: "plot", title: "Construction history updated", detail: "Owner recorded a construction event. Open Construction for authorized details.", date: "2026-09-25", createdAt: "2026-09-25T10:00:00.000Z" }],
    })).lives[0]!;
    const weekIds = life.upcoming.map((row) => row.subjectId);
    const recentIds = life.recentChanges.map((row) => row.subjectId);
    expect(weekIds).not.toContain("decision-1");
    expect(recentIds).not.toContain("decision-1");
    expect(weekIds.every((id) => !recentIds.includes(id))).toBe(true);
    expect(life.upcoming.length).toBeLessThanOrEqual(4);
    expect(life.recentChanges.length).toBeLessThanOrEqual(3);
    expect(life.upcomingMoreCount).toBeGreaterThan(0);
    expect(life.upcoming.find((row) => row.date === "2026-09-24")?.label).toBe("Tomorrow");
    expect(life.upcoming.find((row) => row.date === "2026-09-26")?.label).toBe("26 Sep");
    expect(life.upcoming.some((row) => row.ruleKey === "G12" || /needs a quote|20 bags/i.test(row.title))).toBe(false);
    expect(life.upcoming.some((row) => row.title.includes("10 cement bags"))).toBe(true);
    expect(JSON.stringify(life.visualSummary)).not.toMatch(/20 bags|needs a quote/i);
    expect(life.visualSummary).toMatchObject({ kind: "construction", photoHref: null, stageName: "RCC / Structure", progressPercent: 30 });
    if (life.visualSummary?.kind === "construction") {
      expect(life.visualSummary.journey.map((step) => step.label)).toEqual(["Foundation", "Structure", "Walls", "Services", "Finishes"]);
      expect(life.visualSummary.journey.find((step) => step.label === "Structure")?.state).toBe("current");
    }
    expect(life.capture.map((action) => action.label)).toEqual(["Site update", "Record cost", "Add note"]);
    expect(life.capture.every((action) => action.href.startsWith("/construction/build"))).toBe(true);
  });

  it("does not treat a photo label as an image", () => {
    const life = composeHomeLives(input({
      properties: [{ id: "plot", name: "Super Corridor Plot", city: "Indore", area: "Super Corridor" }],
      projects: [{
        id: "build",
        propertyId: "plot",
        stageName: "RCC / Structure",
        milestoneName: "First-floor slab",
        progressPercent: 30,
        updates: [{ id: "beam", title: "Beam reinforcement completed", description: "No site photo is attached.", occurredAt: "2026-09-22", createdAt: "2026-09-22", photoRefs: ["No site photo is attached."] }],
        guidance: [],
      }],
    })).lives[0]!;
    expect(life.visualSummary?.kind === "construction" && life.visualSummary.photoHref).toBe(null);
  });

  it("omits the selected life from Your Places and keeps a calm story when a change exists", () => {
    const result = composeHomeLives(input({
      properties: [
        { id: "quiet", name: "Quiet House", city: "Indore", area: null },
        { id: "plot", name: "Super Corridor Plot", city: "Indore", area: "Super Corridor" },
      ],
      projects: [{
        id: "build",
        propertyId: "plot",
        stageName: "RCC / Structure",
        milestoneName: null,
        progressPercent: 30,
        updates: [{ id: "beam", title: "Beam reinforcement completed", description: "Beam reinforcement was completed.", occurredAt: "2026-09-22", createdAt: "2026-09-22" }],
        guidance: [],
      }],
    }));
    const quiet = result.lives.find((life) => life.id === "house:quiet")!;
    expect(quiet.asks).toEqual([]);
    expect(quiet.upcoming).toEqual([]);
    expect(quiet.recentChanges).toEqual([]);
    expect(quiet.capture.map((action) => action.label)).toEqual(["Record bill", "Something needs fixing", "Add paper", "Add note"]);
    const plot = result.lives.find((life) => life.id === "house:plot")!;
    expect(plot.asks).toEqual([]);
    expect(plot.recentChanges.map((row) => row.title)).toContain("Beam reinforcement completed");
    expect(otherPlaces(result.lives, plot.id).map((place) => place.id)).toEqual(["house:quiet"]);
    expect(otherPlaces(result.lives, plot.id).some((place) => place.id === plot.id)).toBe(false);
  });

  it("leaves the previous home fields readable when lives is ignored", () => {
    const previous = { mode: "owner", summary: { propertyCount: 2, portfolioValuePaise: "1" }, attention: [{ type: "reminder", title: "Keep" }], activity: [{ id: "a" }] };
    const next = withHomeLives(previous, [], "house:plot");
    const { lives, defaultLifeId, ...old } = next;
    expect(old).toEqual(previous);
    expect(lives).toEqual([]);
    expect(defaultLifeId).toBe("house:plot");
  });

  it("shortens place names the way the navigation labels read", () => {
    expect(shortLabel("Super Corridor Plot")).toBe("Corridor");
    expect(shortLabel("Palm Meadows Apartment")).toBe("Palm");
    expect(shortLabel("Vijay Nagar House")).toBe("Vijay Nagar");
    expect(shortLabel("Riverfront Residency — Unit 1204")).toBe("Riverfront");
    expect(shortLabel("Lakeview Apartment — Unit 502")).toBe("Lakeview");
  });
});
