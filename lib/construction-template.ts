/** Workflow suggestions only. No legal, engineering or duration claims. */
export const CONSTRUCTION_TEMPLATE_VERSION = "home-workflow-v1";
export const CONSTRUCTION_TEMPLATE = [
  ["Pre-Construction", ["Record requirements", "Review planned budget"]],
  [
    "Survey & Site Preparation",
    ["Attach site survey record", "Record site preparation"],
  ],
  ["Design", ["Record design decisions", "Link design documents"]],
  [
    "Approvals",
    ["Review applicable configured checklist", "Record approval follow-up"],
  ],
  [
    "Foundation",
    [
      "Site marking",
      "Excavation",
      "Footing preparation",
      "Reinforcement",
      "Concrete pouring",
      "Curing",
      "Inspection record",
    ],
  ],
  ["RCC / Structure", ["Record structural work", "Attach progress evidence"]],
  ["Masonry", ["Record masonry work"]],
  ["Plumbing", ["Record plumbing work"]],
  ["Electrical", ["Record electrical work"]],
  ["Plastering", ["Record plastering work"]],
  ["Flooring", ["Record flooring work"]],
  ["Doors & Windows", ["Record installation"]],
  ["Painting", ["Record painting work"]],
  ["Fixtures", ["Record fixture installation"]],
  ["External Works", ["Record external work"]],
  [
    "Final Inspection",
    ["Record inspection findings", "Resolve recorded issues"],
  ],
  [
    "Completion / Handover",
    ["Link completion records", "Record maintenance and warranty handoff"],
  ],
] as const;

export interface MaterialPricingPort {
  latest(input: {
    material: string;
    location: string;
    unit: string;
  }): Promise<{ state: "UNAVAILABLE"; reason: string }>;
}
export const materialPricing: MaterialPricingPort = {
  async latest() {
    return {
      state: "UNAVAILABLE",
      reason: "No external material pricing provider is connected.",
    };
  },
};
