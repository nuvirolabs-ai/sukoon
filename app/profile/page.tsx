"use client";

import Link from "next/link";
import { Disclosure, GroupedList, ListRow } from "@/components/consumer";
import { useStore } from "@/components/StoreProvider";
import { Button, PageHead } from "@/components/ui";
import { PrivacySessions } from "@/components/PrivacySessions";
import { PrivacyRequests } from "@/components/PrivacyRequests";
import { ProcessingControl } from "@/components/ProcessingControl";
import { presentName } from "@/lib/ui-content";

export default function ProfilePage() {
  const { email, s, logout } = useStore();
  const name = s.properties.find((p) => p.ownerName)?.ownerName;
  return (
    <div>
      <PageHead title={presentName(name || "Profile")} sub={email} />
      <div className="space-y-6 pb-6">
        <div className="surface p-5">
          <p className="text-[13px] text-ink-muted">Account</p>
          <p className="mt-1 text-[17px] font-medium">{s.properties.length} {s.properties.length === 1 ? "property" : "properties"}</p>
        </div>
        <section>
          <p className="text-[13px] text-ink-muted mb-2">Privacy</p>
          <GroupedList>
            <Disclosure title="Sessions" detail="Devices signed in"><PrivacySessions /></Disclosure>
            <Disclosure title="Exports & deletion" detail="Your data requests"><PrivacyRequests /></Disclosure>
            <Disclosure title="Document processing" detail="Background processing"><ProcessingControl /></Disclosure>
          </GroupedList>
        </section>
        <section>
          <p className="text-[13px] text-ink-muted mb-2">Sharing</p>
          <GroupedList>
            <ListRow href="/properties" title="People with access" detail="Open a property to manage" />
          </GroupedList>
        </section>
        <section>
          <p className="text-[13px] text-ink-muted mb-2">App</p>
          <GroupedList>
            <ListRow href="/more" title="Appearance & language" />
            <ListRow href="/guides" title="About Sukoon" />
          </GroupedList>
        </section>
        <Button variant="quiet" className="w-full" onClick={() => void logout()}>Sign out</Button>
        <Link href="/more" className="block text-center text-[14px] text-ink-muted">More</Link>
      </div>
    </div>
  );
}
