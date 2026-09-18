"use client";
import { useStore } from "@/components/StoreProvider";
import { PageHead } from "@/components/ui";
import { waShare } from "@/lib/reminders";

export default function Refer() {
  const { s } = useStore();
  const msg = `I manage my property papers, tax + rent on SUKOON. Use my code ${s.referralCode} — One Property. One Record. Forever. ${typeof window !== "undefined" ? window.location.origin : ""}`;
  return (
    <div>
      <PageHead title="Invite" />
      <div className="space-y-4 pb-6">
        <div className="rounded-[22px] bg-forest text-white p-5 text-center">
          <p className="text-[13px] tracking-widest opacity-70">YOUR CODE</p>
          <p className="text-[32px] font-medium tracking-tight mt-1">{s.referralCode}</p>
          <p className="text-[14px] opacity-80 mt-2">No reward is connected in this build.</p>
        </div>
        <a href={waShare(msg)} target="_blank" className="flex h-12 items-center justify-center rounded-full bg-[#25D366] text-white text-[14px] font-semibold">Share on WhatsApp</a>
        <button onClick={() => { navigator.clipboard?.writeText(msg); }} className="h-11 w-full rounded-full border border-line text-[15px]">Copy invite</button>
      </div>
    </div>
  );
}
