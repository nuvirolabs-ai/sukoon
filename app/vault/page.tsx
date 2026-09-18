"use client";
import { useStore } from "@/components/StoreProvider";
import { PageHead } from "@/components/ui";
import { Disclosure, GroupedList, ListRow, Metric, SectionHeader } from "@/components/consumer";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { StatusTransition } from "@/components/motion/StatusTransition";

export default function VaultPage() {
  const { s } = useStore();
  const docs = s.docs.filter((d) => !d.deletedAt && !d.archivedAt);
  const needsReview = docs.filter((d) => d.reviewStatus !== "confirmed" || d.scanStatus !== "clean").length;
  return (
    <div>
      <PageHead title="Vault" sub={`${docs.length} documents`} />
      <div className="space-y-6 pb-6">
        <div className="metric-group">
          <Metric label="Documents" value={docs.length} />
          <Metric label="Needs review" value={needsReview} />
        </div>
        {needsReview > 0 ? <p className="text-[13px] text-forest" role="status"><StatusTransition statusKey={`review-${needsReview}`}>{needsReview} need review</StatusTransition></p> : null}
        <section>
          <SectionHeader title="Collections" />
          <GroupedList>
            <AnimatedList>
              {s.properties.map((p) => <ListRow key={p.id} title={p.name} detail={`${s.docs.filter((d) => d.propertyId === p.id).length} documents`} href={`/property/${p.id}?tab=vault`} />)}
            </AnimatedList>
          </GroupedList>
        </section>
        {!s.properties.length ? <GroupedList><ListRow title="Add a property" detail="Keep documents together." href="/property/new" /></GroupedList> : null}
        <Disclosure title="What this means"><p className="text-[14px] leading-relaxed text-ink-muted">A security scan does not establish authenticity or government approval. Review is separate.</p></Disclosure>
      </div>
    </div>
  );
}
