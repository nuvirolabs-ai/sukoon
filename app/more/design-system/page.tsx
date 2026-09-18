"use client";

import { Disclosure, GroupedList, ListRow, Metric, SectionHeader } from "@/components/consumer";
import { layoutStressFixtures } from "@/lib/ui-content";
import { useState } from "react";
import { Button, EmptyState, ErrorState, Input, LoadingState, PageHead, SavedState, Sheet, Skeleton, StatusPill, Surface } from "@/components/ui";

export default function DesignSystemPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const stress = layoutStressFixtures();
  return <div>
    <PageHead title="Design system" sub="Internal primitive preview. Development layout fixtures only." />
    <div className="space-y-6 pb-8">
      <SectionHeader title="Summary first"/><div className="metric-group"><Metric label="Example metric" value="3"/><Metric label="Example status" value="Ready"/></div>
      <GroupedList>
        <ListRow title="A clear destination" detail="One useful supporting line" href="/more"/>
        <Disclosure title="Detail on demand" detail="Actions live with the record"><p>Additional information appears only when requested.</p></Disclosure>
      </GroupedList>
      <section>
        <SectionHeader title="Layout stress fixtures"/>
        <GroupedList>
          <ListRow title={stress.property} detail={stress.locality} value={stress.amount} href="/more"/>
          <ListRow title={stress.document} detail={stress.person} href="/more"/>
          <ListRow title={stress.task} detail="Construction task" href="/more"/>
        </GroupedList>
      </section>
      <Surface tone="soft"><p className="text-[18px] font-medium">Sukoon primitives</p><p className="mt-1 text-[13px] text-ink-muted">Shared tokens keep warm surfaces, forest actions, 20px gutters and overflow-safe rows consistent.</p></Surface>
      <Surface className="space-y-3"><p className="text-[16px] font-medium">Controls</p><Input label="Keyboard-safe input" placeholder="Focus this field" hint="Focus ring and 16px minimum text prevent accidental zoom on mobile." /><div className="flex flex-wrap gap-2"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="quiet">Quiet</Button><Button variant="danger">Danger</Button></div><div className="flex flex-wrap gap-2"><StatusPill>Neutral</StatusPill><StatusPill tone="success">Success</StatusPill><StatusPill tone="warning">Review</StatusPill><StatusPill tone="danger">Error</StatusPill><StatusPill tone="info">Info</StatusPill><SavedState /></div></Surface>
      <LoadingState label="Loading state preview" />
      <Surface><p className="text-[16px] font-medium">Skeleton preview</p><div className="mt-2 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-10 w-full" /></div></Surface>
      <EmptyState title="Empty state preview" detail="New accounts remain empty until the owner adds a record." action={<Button variant="secondary">Example action</Button>} />
      <ErrorState message="An error state keeps the next action and message visible without inventing data." />
      <Button className="w-full" onClick={() => setSheetOpen(true)}>Open responsive sheet</Button>
      <Sheet open={sheetOpen} title="Keyboard-safe sheet" onClose={() => setSheetOpen(false)}><div className="space-y-3"><p className="text-[13px] leading-5 text-ink-muted">This uses the same bottom-sheet surface and safe-area padding as property edit flows.</p><Input label="Example field" autoFocus placeholder="Type here" /><Button className="w-full" onClick={() => setSheetOpen(false)}>Done</Button></div></Sheet>
    </div>
  </div>;
}
