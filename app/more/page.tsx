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
          <Link href="/vault" className="more-tile is-vault"><Image src="/home/vault.png" alt="" width={120} height={120} /><strong>Vault</strong><span>Your papers</span></Link>
          <Link href="/bills" className="more-tile is-bills is-photo"><Image src={SCENE.dates} alt="" width={120} height={120} /><strong>Bills</strong><span>What is coming up</span></Link>
          <Link href="/construction" className="more-tile is-build"><Image src="/home/construction.png" alt="" width={120} height={120} /><strong>Construction</strong><span>The build log</span></Link>
          <Link href="/buy-sell" className="more-tile is-buy"><Image src="/home/buy-sell.png" alt="" width={120} height={120} /><strong>Buy / Sell</strong><span>Private purchase work</span></Link>
          <Link href="/updates" className="more-tile is-updates"><Image src="/home/updates.png" alt="" width={120} height={120} /><strong>Updates</strong><span>Activity on your records</span></Link>
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
