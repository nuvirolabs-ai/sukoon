"use client";
import Image from "next/image";
import Link from "next/link";
import { GroupedList, ListRow, DevAccountHint } from "@/components/consumer";
import { useStore } from "@/components/StoreProvider";
import { LangToggle, PageHead } from "@/components/ui";
import { Scene, SCENE, placeImage } from "@/components/PlaceCover";
import { presentName } from "@/lib/ui-content";

export default function MorePage() {
  const { s, logout } = useStore();
  const name = presentName(s.properties.find((property) => property.ownerName)?.ownerName || "");
  return (
    <div>
      <PageHead title="More" sub={name || undefined} />
      <div className="space-y-6 pb-6">
        <Scene src={placeImage(s.properties[0] || { type: "villa" })}>
          <p>Signed in</p>
          <strong>{name || "Your account"}</strong>
        </Scene>
        <section className="guided-home-next scene-next">
          <p className="guided-eyebrow">{s.properties.length} {s.properties.length === 1 ? "property" : "properties"}</p>
          <h2>{s.referralCode ? `Invite code ${s.referralCode}` : "Your account"}</h2>
          <button type="button" onClick={() => void logout()} className="mt-3 h-11 w-full rounded-full border border-line bg-white text-[15px]">Sign out</button>
        </section>
        <div className="more-grid">
          <Link href="/estate?tab=portfolio" className="more-tile is-vault"><Image src="/home/vault.png" alt="" width={120} height={120} /><strong>Estate &amp; Vault</strong><span>Property &amp; Papers</span></Link>
          <Link href="/bills" className="more-tile is-bills is-photo"><Image src={SCENE.dates} alt="" width={120} height={120} /><strong>Bills</strong><span>What is coming up</span></Link>
          <Link href="/estate?tab=rates" className="more-tile is-build"><Image src="/home/construction.png" alt="" width={120} height={120} /><strong>Construction</strong><span>Daily Rates &amp; Spend</span></Link>
          <Link href="/market?tab=deals" className="more-tile is-buy"><Image src="/home/buy-sell.png" alt="" width={120} height={120} /><strong>Market &amp; Deals</strong><span>Live Verified Deals</span></Link>
          <Link href="/market?tab=knowledge" className="more-tile is-updates"><Image src="/home/updates.png" alt="" width={120} height={120} /><strong>Intelligence</strong><span>Rates, News &amp; Vastu</span></Link>
          <Link href="/reminders" className="more-tile is-dates is-photo"><Image src={SCENE.dates} alt="" width={120} height={120} /><strong>Reminders</strong><span>Dates you set</span></Link>
        </div>
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
