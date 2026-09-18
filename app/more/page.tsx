"use client";
import { GroupedList, ListRow, DevAccountHint } from "@/components/consumer";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { useStore } from "@/components/StoreProvider";
import { LangToggle, PageHead } from "@/components/ui";

export default function MorePage() {
  const { email, logout } = useStore();
  return (
    <div>
      <PageHead title="More" />
      <div className="space-y-6 pb-6">
        <section>
          <p className="text-[13px] text-ink-muted mb-2">Property</p>
          <GroupedList>
            <AnimatedList stagger={false}>
              <ListRow href="/vault" title="Vault" detail="Documents" />
              <ListRow href="/bills" title="Bills & payments" />
              <ListRow href="/construction" title="Construction" />
              <ListRow href="/buy-sell" title="Buy / Sell" />
              <ListRow href="/updates" title="Updates" />
              <ListRow href="/reminders" title="Reminders" />
            </AnimatedList>
          </GroupedList>
        </section>
        <section>
          <p className="text-[13px] text-ink-muted mb-2">Account</p>
          <GroupedList>
            <ListRow href="/profile" title="Profile" detail="Sessions, privacy, exports" />
          </GroupedList>
        </section>
        <section>
          <p className="text-[13px] text-ink-muted mb-2">App</p>
          <GroupedList>
            <AnimatedList stagger={false}>
              <ListRow href="/guides" title="Guides" />
              <ListRow href="/pricing" title="About plans" />
              <ListRow href="/refer" title="Invite" />
              <ListRow href="/vendors" title="Vendors" />
              <ListRow href="/guideline" title="Circle rates" />
              <ListRow href="/drafts" title="Drafts" />
            </AnimatedList>
          </GroupedList>
        </section>
        <LangToggle />
        <div className="surface bg-white p-4">
          <p className="text-[13px] text-ink-muted">Signed in</p>
          <p className="mt-1 text-[15px] break-all">{email}</p>
          <button type="button" onClick={() => void logout()} className="mt-3 h-11 w-full rounded-full border border-line bg-white text-[15px]">Sign out</button>
        </div>
        <DevAccountHint />
      </div>
    </div>
  );
}
