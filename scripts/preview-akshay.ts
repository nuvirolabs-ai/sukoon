import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { previewDocumentsEnabled } from "@/lib/preview-documents";
import { STAGING_DATABASE_NAME, stagingReviewOwnerEmail, stagingSeedAllowsInternalInvitationToken } from "@/lib/staging-seed-policy";
import { createDocumentForUser } from "@/lib/vault-repository";
import { createManualReminderForUser } from "@/lib/durable-reminders";
import { reconcileSearchProjections } from "@/lib/search";

function databaseName(raw: string | undefined) {
  try {
    const url = new URL(raw ?? "");
    return decodeURIComponent(url.pathname.replace(/^\//, ""));
  } catch {
    return "";
  }
}

function assertReady() {
  if (!stagingSeedAllowsInternalInvitationToken()) throw new Error("PREVIEW_SEED_CONFIRMATION_REQUIRED");
  if (!previewDocumentsEnabled()) throw new Error("PREVIEW_DOCUMENT_STORE_REQUIRED");
  if (databaseName(process.env.DATABASE_URL) !== STAGING_DATABASE_NAME) throw new Error("PREVIEW_SEED_DATABASE_REFUSED");
}

function tidy(value: string) {
  const next = value
    .replace(/Mehta Residence/g, "Kothari Residence")
    .replace(/Aarav Mehta/g, "Akshay Kothari")
    .replace(/Naina Mehta/g, "Kothari family")
    .replace(/SYNTHETIC DEMO DATASET v1 — completed workflow record\./gi, "Marked complete in the build log.")
    .replace(/SYNTHETIC DEMO DATASET v1 - owner-entered, not government verified/gi, "Recorded by Akshay Kothari. Not a government record.")
    .replace(/SYNTHETIC DEMO DATASET v1 — [^.]+\./gi, "Recorded in this workspace.")
    .replace(/SYNTHETIC DEMO DATASET v1/gi, "Recorded in this workspace.")
    .replace(/Synthetic demo \/ /gi, "")
    .replace(/Synthetic owner-entered planning estimate; planned budget total is ₹1\.20 Cr\./gi, "Planning estimate. The build budget on file is Rs. 1.20 Cr.")
    .replace(/Synthetic G\+2 residence; owner-entered requirements\./gi, "G+2 home. Requirements recorded by you.")
    .replace(/Synthetic owner-entered service/gi, "Recorded by you")
    .replace(/Owner-recorded synthetic update/gi, "Recorded on the build.")
    .replace(/Synthetic issue note; no external weather claim/gi, "Work paused. Recorded by you.")
    .replace(/Synthetic Design Studio/gi, "Design studio")
    .replace(/Synthetic Structural Practice/gi, "Structural practice")
    .replace(/\bSynthetic\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .trim();
  return next || value;
}

function pdf(lines: string[]) {
  const stream = ["BT", "/F1 16 Tf", "54 760 Td", ...lines.flatMap((line, index) => {
    const safe = line.replace(/[()\\]/g, "");
    return index === 0 ? [`(${safe}) Tj`] : ["0 -22 Td", `(${safe}) Tj`];
  }), "ET"].join("\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body));
    body += object;
  }
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body);
}

function plusDays(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

async function main() {
  assertReady();
  const current = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  if (current[0]?.name !== STAGING_DATABASE_NAME) throw new Error("PREVIEW_SEED_DATABASE_REFUSED");
  const email = stagingReviewOwnerEmail();
  const owner = await prisma.user.findUnique({ where: { email } });
  if (!owner) throw new Error("PREVIEW_OWNER_MISSING");
  await prisma.user.update({ where: { id: owner.id }, data: { name: "Akshay Kothari" } });
  const labels: Record<string, string> = {
    "demo-lawyer@sukoon.local": "Family lawyer",
    "demo-architect@sukoon.local": "Site architect",
    "demo-coowner@sukoon.local": "Co-owner",
    "demo-buyer@sukoon.local": "Buyer",
    "demo-operator@sukoon.local": "Operator",
  };
  for (const [personaEmail, name] of Object.entries(labels)) {
    await prisma.user.updateMany({ where: { email: personaEmail }, data: { name } });
  }
  const workspace = await prisma.workspace.findUnique({ where: { ownerUserId: owner.id } });
  if (!workspace) throw new Error("PREVIEW_WORKSPACE_MISSING");
  await prisma.workspace.update({ where: { id: workspace.id }, data: { name: "Akshay Kothari", referralCode: "AKSHAY" } });

  const properties = await prisma.property.findMany({ where: { workspaceId: workspace.id } });
  const byName = new Map(properties.map((property) => [property.name, property]));
  const addressFor: Record<string, { area: string; address: string }> = {
    "Vijay Nagar House": { area: "Vijay Nagar", address: "Vijay Nagar, Indore" },
    "Palm Meadows Apartment": { area: "Palm Meadows", address: "Palm Meadows, Indore" },
    "Super Corridor Plot": { area: "Super Corridor", address: "Super Corridor, Indore" },
  };
  for (const property of properties) {
    const place = addressFor[property.name];
    await prisma.property.update({
      where: { id: property.id },
      data: {
        ownerName: "Akshay Kothari",
        coOwners: property.coOwners ? "Kothari family" : property.coOwners,
        area: place?.area ?? tidy(property.area),
        address: place?.address ?? tidy(property.address),
        jurisdiction: "Indore",
        ownershipProvenance: "Recorded by Akshay Kothari. Not a government record.",
      },
    });
  }

  await prisma.constructionProject.updateMany({ where: { workspaceId: workspace.id, name: "Mehta Residence" }, data: { name: "Kothari Residence" } });
  const projects = await prisma.constructionProject.findMany({ where: { workspaceId: workspace.id } });
  for (const project of projects) {
    const requirements = typeof project.requirements === "string" ? tidy(project.requirements) : project.requirements;
    const notes = project.notes ? tidy(project.notes) : project.notes;
    await prisma.constructionProject.update({ where: { id: project.id }, data: { requirements: requirements ?? undefined, notes } });
  }

  const textTables: Array<Promise<unknown>> = [];
  for (const row of await prisma.bill.findMany({ where: { workspaceId: workspace.id } })) {
    if (row.notes) textTables.push(prisma.bill.update({ where: { id: row.id }, data: { notes: tidy(row.notes) } }));
  }
  for (const row of await prisma.maintenance.findMany({ where: { workspaceId: workspace.id } })) {
    textTables.push(prisma.maintenance.update({ where: { id: row.id }, data: { notes: row.notes ? tidy(row.notes) : row.notes, provider: row.provider ? tidy(row.provider) : row.provider } }));
  }
  for (const row of await prisma.timelineEvent.findMany({ where: { workspaceId: workspace.id } })) {
    textTables.push(prisma.timelineEvent.update({ where: { id: row.id }, data: { title: tidy(row.title), detail: row.detail ? tidy(row.detail) : row.detail } }));
  }
  for (const row of await prisma.constructionTask.findMany({ where: { workspaceId: workspace.id } })) {
    if (row.notes) textTables.push(prisma.constructionTask.update({ where: { id: row.id }, data: { notes: tidy(row.notes) } }));
  }
  for (const row of await prisma.constructionBudgetItem.findMany({ where: { workspaceId: workspace.id } })) {
    if (row.notes) textTables.push(prisma.constructionBudgetItem.update({ where: { id: row.id }, data: { notes: tidy(row.notes) } }));
  }
  for (const row of await prisma.constructionContact.findMany({ where: { workspaceId: workspace.id } })) {
    textTables.push(prisma.constructionContact.update({ where: { id: row.id }, data: { company: tidy(row.company), notes: tidy(row.notes) } }));
  }
  for (const row of await prisma.constructionUpdate.findMany({ where: { workspaceId: workspace.id } })) {
    textTables.push(prisma.constructionUpdate.update({ where: { id: row.id }, data: { title: tidy(row.title), description: tidy(row.description) } }));
  }
  for (const row of await prisma.shareLink.findMany({ where: { workspaceId: workspace.id } })) {
    if (row.note) textTables.push(prisma.shareLink.update({ where: { id: row.id }, data: { note: tidy(row.note) } }));
  }
  for (const row of await prisma.purchaseCandidate.findMany({ where: { workspaceId: workspace.id } })) {
    textTables.push(prisma.purchaseCandidate.update({ where: { id: row.id }, data: { location: row.location ? tidy(row.location) : row.location, notes: row.notes ? tidy(row.notes) : row.notes } }));
  }
  for (const row of await prisma.checklistRule.findMany()) {
    textTables.push(prisma.checklistRule.update({
      where: { id: row.id },
      data: {
        title: tidy(row.title),
        description: tidy(row.description).replace(/Hosted document upload and scanning are temporarily unavailable in this staging checkpoint; no document is being represented as verified\./i, "Papers you add stay in the vault as your copies. A missing paper is not a legal finding."),
        jurisdiction: row.jurisdiction ? tidy(row.jurisdiction) : row.jurisdiction,
        sourceName: "Sukoon",
        reviewer: "Sukoon",
      },
    }));
  }
  await Promise.all(textTables);

  const papers = [
    { property: "Vijay Nagar House", category: "Registry", file: "vijay-nagar-sale-deed-note.pdf", title: "Sale deed note — Vijay Nagar House", lines: ["SUKOON", "Sale deed note", "Vijay Nagar House, Indore", "Owner on file: Akshay Kothari", "Purchase date on file: 15 Jun 2019", "This is the copy kept in Sukoon.", "It is not a government certificate."] },
    { property: "Vijay Nagar House", category: "Tax receipt", file: "vijay-nagar-tax-receipt-note.pdf", title: "Property tax note — Vijay Nagar House", lines: ["SUKOON", "Property tax note", "Vijay Nagar House, Indore", "Owner on file: Akshay Kothari", "A tax amount is recorded in Bills.", "This page is your copy, not a municipal receipt."] },
    { property: "Vijay Nagar House", category: "Insurance", file: "vijay-nagar-insurance-note.pdf", title: "Home insurance note — Vijay Nagar House", lines: ["SUKOON", "Home insurance note", "Vijay Nagar House, Indore", "Owner on file: Akshay Kothari", "Renewal reminder is set in Reminders.", "This page is your copy, not an insurer policy."] },
    { property: "Palm Meadows Apartment", category: "NOC", file: "palm-meadows-society-note.pdf", title: "Society note — Palm Meadows", lines: ["SUKOON", "Society note", "Palm Meadows Apartment, Indore", "Owner on file: Akshay Kothari", "Society maintenance is recorded in Bills.", "This page is your copy, not a society NOC."] },
    { property: "Palm Meadows Apartment", category: "Receipt", file: "palm-meadows-maintenance-receipt-note.pdf", title: "Maintenance receipt note — Palm Meadows", lines: ["SUKOON", "Maintenance receipt note", "Palm Meadows Apartment, Indore", "Owner on file: Akshay Kothari", "Kept with the apartment passport.", "This page is your copy, not a payment proof from a bank."] },
    { property: "Super Corridor Plot", category: "Sanction map", file: "super-corridor-sanction-note.pdf", title: "Sanction map note — Super Corridor", lines: ["SUKOON", "Sanction map note", "Super Corridor Plot, Indore", "Build: Kothari Residence", "Owner on file: Akshay Kothari", "This page is your copy, not an approved sanction map."] },
  ];
  for (const paper of papers) {
    const property = byName.get(paper.property);
    if (!property) throw new Error("PREVIEW_PROPERTY_MISSING");
    await createDocumentForUser({
      userId: owner.id,
      propertyId: property.id,
      category: paper.category,
      displayName: paper.title,
      idempotencyKey: `preview-akshay:${paper.file}`,
      filename: paper.file,
      mimeType: "application/pdf",
      bytes: pdf(paper.lines),
    });
  }

  const reminders = [
    { property: "Vijay Nagar House", title: "Home insurance renewal", days: 22, sourceType: "PROPERTY_DEADLINE", body: "Renew the home insurance note for Vijay Nagar House. This is a date you set, not an official deadline." },
    { property: "Palm Meadows Apartment", title: "Society maintenance", days: 38, sourceType: "PROPERTY_DEADLINE", body: "Society maintenance for Palm Meadows is on your list. This is a date you set, not a society demand." },
    { property: "Super Corridor Plot", title: "Kothari Residence site check", days: 10, sourceType: "FUTURE_EVENT", body: "Walk the Super Corridor plot and update the construction log. This is a reminder you set." },
  ];
  for (const reminder of reminders) {
    const property = byName.get(reminder.property);
    if (!property) throw new Error("PREVIEW_PROPERTY_MISSING");
    await createManualReminderForUser(owner.id, property.id, {
      title: reminder.title,
      scheduledDate: plusDays(reminder.days),
      localTime: "09:00",
      timezone: "Asia/Kolkata",
      channels: ["IN_APP"],
      sourceType: reminder.sourceType,
      sourceId: `preview-akshay:${reminder.title}`,
      idempotencyKey: `preview-akshay-reminder:${reminder.title}`,
      deepLink: `/property/${property.id}?tab=overview`,
      body: reminder.body,
    });
  }

  const guides = [
    {
      slug: "how-your-property-passport-works",
      title: "How your property passport works",
      summary: "Each property keeps its papers, bills, and notes together.",
      body: [
        "This is a product guide. It is not legal, tax, or circle-rate advice.",
        "Open Properties and choose a passport. Vijay Nagar House, Palm Meadows Apartment, and Super Corridor Plot are already here.",
        "The overview shows the owner you recorded, the purchase figure you entered, and how many papers are on file.",
        "Sukoon does not certify title or government approval.",
      ],
    },
    {
      slug: "how-the-vault-works",
      title: "How the vault keeps your papers",
      summary: "Open a sale deed note, tax note, insurance note, or sanction map note.",
      body: [
        "This is a product guide. It is not a scan certificate.",
        "From Home, open Vault, choose a property, then Preview on a paper.",
        "Files added on this preview say In your vault. Malware scanning is not connected.",
        "Search can find a paper by its name, such as insurance or sanction.",
      ],
    },
    {
      slug: "how-the-construction-log-works",
      title: "How the construction log works",
      summary: "Kothari Residence tracks stages, tasks, and the budget you entered.",
      body: [
        "This is a product guide. It is not a structural certificate.",
        "Open Construction to see Kothari Residence on the Super Corridor plot.",
        "Stages, tasks, and the budget are records you keep. They are not a site inspection.",
        "The next site check is under Reminders.",
      ],
    },
  ];
  for (const guide of guides) {
    await prisma.educationContent.upsert({
      where: { slug: guide.slug },
      create: {
        id: randomUUID(),
        slug: guide.slug,
        contentType: "product_help",
        title: guide.title,
        summary: guide.summary,
        body: guide.body,
        sourceName: "Sukoon",
        sourceReference: { kind: "product_help", note: "How Sukoon works. Not legal, tax, or circle-rate advice." },
        reviewer: "Sukoon",
        reviewedAt: new Date("2026-09-01T00:00:00.000Z"),
        effectiveFrom: "2026-01-01",
        status: "PUBLISHED",
        version: 1,
      },
      update: { title: guide.title, summary: guide.summary, body: guide.body, status: "PUBLISHED", sourceName: "Sukoon", reviewer: "Sukoon" },
    });
  }

  await reconcileSearchProjections(workspace.id);
  const documents = await prisma.propertyDoc.count({ where: { workspaceId: workspace.id, deletedAt: null, archivedAt: null, scanStatus: "owner_copy" } });
  console.log(JSON.stringify({ ok: true, owner: "Akshay Kothari", properties: properties.length, documents, reminders: reminders.length, guides: guides.length }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "PREVIEW_SEED_FAILED");
  process.exit(1);
});
