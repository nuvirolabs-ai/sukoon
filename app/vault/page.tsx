"use client";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";
import { PageHead } from "@/components/ui";
import { Disclosure, GroupedList, ListRow, SectionHeader } from "@/components/consumer";
import { StatusTransition } from "@/components/motion/StatusTransition";
import { Scene, SCENE, placeImage } from "@/components/PlaceCover";

export default function VaultPage() {
  const { s } = useStore();
  const docs = s.docs.filter((d) => !d.deletedAt && !d.archivedAt).slice().sort((a, b) => {
    const left = s.properties.find((property) => property.id === a.propertyId)?.name || "";
    const right = s.properties.find((property) => property.id === b.propertyId)?.name || "";
    return left.localeCompare(right) || (a.displayName || a.name).localeCompare(b.displayName || b.name);
  });
  const needsReview = docs.filter((d) => d.scanStatus !== "owner_copy" && (d.reviewStatus !== "confirmed" || d.scanStatus !== "clean")).length;
  return (
    <div>
      <PageHead title="Vault" sub={`${docs.length} documents`} />
      <div className="space-y-6 pb-6">
        <Scene src={SCENE.papers}>
          <p>Your vault</p>
          <strong>{docs.length ? "Open a paper to preview it" : "Add the first paper"}</strong>
        </Scene>
        {needsReview > 0 ? <p className="text-[13px] text-forest" role="status"><StatusTransition statusKey={`review-${needsReview}`}>{needsReview} need review</StatusTransition></p> : null}
        <section className="paper-stack">
          {docs.map((doc) => {
            const property = s.properties.find((item) => item.id === doc.propertyId);
            return (
              <Link key={doc.id} href={`/property/${doc.propertyId}/documents/${doc.id}`} className="paper-card motion-pressable">
                <span className="paper-card__thumb"><Image src={SCENE.papers} alt="" fill sizes="76px" style={{ objectFit: "cover" }} /></span>
                <span className="paper-card__body"><strong>{doc.displayName || doc.name}</strong><span>{doc.type}{property ? ` · ${property.name}` : ""}</span></span>
                <span className="paper-card__go" aria-hidden="true">→</span>
              </Link>
            );
          })}
        </section>
        <section>
          <SectionHeader title="By property" />
          <div className="paper-stack">
            {s.properties.map((p) => { const count = s.docs.filter((d) => d.propertyId === p.id && !d.deletedAt && !d.archivedAt).length; return (
              <Link key={p.id} href={`/property/${p.id}?tab=vault`} className="explore-place motion-pressable">
                <span className="explore-place__photo"><Image src={placeImage(p)} alt="" fill sizes="92px" style={{ objectFit: "cover" }} /></span>
                <span><strong>{p.name}</strong><span>{count} {count === 1 ? "paper" : "papers"}</span></span>
              </Link>
            ); })}
          </div>
        </section>
        {!s.properties.length ? <GroupedList><ListRow title="Add a property" detail="Keep documents together." href="/property/new" /></GroupedList> : null}
        <Disclosure title="What this means"><p className="text-[14px] leading-relaxed text-ink-muted">Papers you add stay in your vault. Malware scanning is not connected on this preview, so a file here is your copy, not a scan result or a government approval.</p></Disclosure>
      </div>
    </div>
  );
}
