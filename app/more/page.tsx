"use client";
import { GroupedList, ListRow, DevAccountHint } from "@/components/consumer";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { useStore } from "@/components/StoreProvider";
import { LangToggle, PageHead } from "@/components/ui";
import { presentName } from "@/lib/ui-content";

export default function MorePage() {
  const { s, logout } = useStore();
  const name = presentName(s.properties.find((property) => property.ownerName)?.ownerName || "");
  return (
    <div>
      <PageHead title="More" sub={name || undefined} />
      <div className="space-y-6 pb-6">
        <section className="surface bg-white p-4">
          <p className="text-[13px] text-ink-muted">Signed in</p>
          <p className="mt-1 text-[20px] font-medium tracking-tight">{name || "Your account"}</p>
          <p className="mt-1 text-[13px] text-ink-muted">{s.properties.length} {s.properties.length === 1 ? "property" : "properties"} · invite code {s.referralCode || "not set"}</p>
          <button type="button" onClick={() => void logout()} className="mt-3 h-11 w-full rounded-full border border-line bg-white text-[15px]">Sign out</button>
        </section>
        <section>
          <p className="text-[13px] text-ink-muted mb-2">Property</p>
          <GroupedList>
            <AnimatedList stagger={false}>
              <ListRow href="/vault" title="Vault" detail="Your papers" />
              <ListRow href="/bills" title="Bills & payments" detail="What is coming up" />
              <ListRow href="/construction" title="Construction" detail="Build log" />
              <ListRow href="/buy-sell" title="Buy / Sell" detail="Private purchase work" />
              <ListRow href="/updates" title="Updates" detail="Activity on your records" />
              <ListRow href="/reminders" title="Reminders" detail="Dates you set" />
            </AnimatedList>
          </GroupedList>
        </section>
        <section>
          <p className="text-[13px] text-ink-muted mb-2">Account</p>
          <GroupedList>
            <ListRow href="/profile" title="Profile" detail={name || "Sessions and privacy"} />
            <ListRow href="/refer" title="Invite" detail={s.referralCode ? `Code ${s.referralCode}` : "Your invite code"} />
            <ListRow href="/guides" title="Guides" detail="How Sukoon works" />
          </GroupedList>
        </section>
        <LangToggle />
        <DevAccountHint />
      </div>
    </div>
  );
}
