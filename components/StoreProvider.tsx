"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { getServerSnapshot, getSnapshot, persistState, replaceState, requestOtp, retrySession, reviewCodeClient, signInClientReview, signInStagingReview, signOut, stagingReviewClient, startClientStore, subscribe, verifyOtp } from "@/lib/client-store";
import type { AppState } from "@/lib/types";
import { clientSafeError, CLIENT_REVIEW_UNAVAILABLE_MESSAGE } from "@/lib/client-review";

type StoreContextValue = {
  s: AppState;
  email: string;
  update: (fn: (s: AppState) => AppState) => void;
  replace: (state: AppState, version?: number) => void;
  logout: () => Promise<void>;
};

const Ctx = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  startClientStore();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (snapshot.status === "loading") return <div className="mx-auto max-w-[430px] bg-white min-h-dvh p-6 text-sm native-safe-screen">Loading Sukoon…</div>;
  if (snapshot.status === "unreachable") return <UnreachableState />;
  if (snapshot.status === "signed-out") return <SignInForm />;
  if (!snapshot.state || !snapshot.email) return <SignInForm error={snapshot.error} />;

  const value: StoreContextValue = {
    s: snapshot.state,
    email: snapshot.email,
    update: (fn) => {
      const next = fn(structuredClone(snapshot.state as AppState));
      replaceState(next);
      void persistState(next);
    },
    replace: replaceState,
    logout: signOut,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function SignInForm({ error }: { error?: string }) {
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sandboxOtp, setSandboxOtp] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(error ? clientSafeError(error) : "");

  return (
    <main className="native-safe-screen mx-auto min-h-dvh max-w-[430px] bg-white px-6 pb-10 pt-24 text-foreground">
      <div className="mx-auto max-w-sm">
        <p className="text-center text-[46px] tracking-wide leading-none" style={{fontFamily:'"Playfair Display", Georgia, serif'}}>SUK<span className="text-[#2563eb]">OO</span>N</p>
        <p className="mt-2 text-center text-[11px] tracking-[0.35em] text-ink-muted">ESCAPE THE CHAOS</p>
        <section className="mt-12 rounded-[26px] border border-line bg-[#fbfaf7] p-5 shadow-soft">
          <p className="font-serif text-[22px]">Open your passport</p>
          <p className="mt-1 text-[13px] leading-5 text-ink-muted">{reviewCodeClient ? "Use your review access code to open the synthetic client review account." : "Use an email OTP to open a separate account. No password or sample property data is created."}</p>
          <form className="mt-5 space-y-3" onSubmit={(event) => { event.preventDefault(); setBusy(true); setMessage(""); void (reviewCodeClient ? (stagingReviewClient ? signInStagingReview(email, accessCode) : signInClientReview(email, accessCode)) : otpSent ? verifyOtp(email, otp) : requestOtp(email).then((result) => { setSandboxOtp(result.sandboxOtp); setOtpSent(true); setMessage(result.sandboxOtp ? "Local sandbox mailbox: enter the displayed OTP." : "OTP sent. Check the email address you entered to continue."); })).catch((e: unknown) => setMessage(clientSafeError(e))).finally(() => setBusy(false)); }}>
            <label className="block text-[12px] font-semibold" htmlFor="sukoon-email">Email address</label>
            <input id="sukoon-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="owner@example.com" className="h-12 w-full rounded-2xl border border-line bg-white px-3 text-[14px] outline-none focus:border-forest" />
            {reviewCodeClient ? <>
              <label className="block text-[12px] font-semibold" htmlFor="sukoon-access-code">Access code</label>
              <input id="sukoon-access-code" type="password" autoComplete="one-time-code" required minLength={32} value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="Enter your access code" className="h-12 w-full rounded-2xl border border-line bg-white px-3 text-[14px] outline-none focus:border-forest" />
            </> : null}
            {!reviewCodeClient && otpSent ? <>
              <label className="block text-[12px] font-semibold" htmlFor="sukoon-otp">One-time code</label>
              <input id="sukoon-otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="000000" className="h-12 w-full rounded-2xl border border-line bg-white px-3 text-[14px] tracking-[0.35em] outline-none focus:border-forest" />
              {sandboxOtp ? <p className="rounded-xl border border-dashed border-forest/40 bg-[#effaf2] p-3 text-[12px] text-forest">Local sandbox OTP: <b>{sandboxOtp}</b></p> : null}
            </> : null}
            <button disabled={busy} className="h-12 w-full rounded-full bg-forest text-white font-semibold disabled:opacity-50">{busy ? "Checking…" : reviewCodeClient ? "Continue" : otpSent ? "Open passport" : "Send OTP"}</button>
            {!reviewCodeClient && otpSent ? <button type="button" onClick={() => { setOtpSent(false); setOtp(""); setSandboxOtp(undefined); setMessage(""); }} className="w-full text-[12px] underline">Use a different email</button> : null}
          </form>
          {message ? <p role="alert" className="mt-3 rounded-xl bg-[#fff5f5] p-3 text-[12px] text-red-700">{message}</p> : null}
          <p className="mt-4 text-[11px] leading-4 text-ink-muted">{reviewCodeClient ? "This client review uses synthetic data and a temporary access code. No email service is required." : "Local sandbox codes are shown only during local development. Client review requires an approved sign-in transport."}</p>
        </section>
      </div>
    </main>
  );
}

function UnreachableState() {
  return (
    <main className="native-safe-screen mx-auto min-h-dvh max-w-[430px] bg-white px-6 pb-10 pt-24 text-foreground">
      <p className="text-center text-[46px] tracking-wide leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>SUK<span className="text-[#2563eb]">OO</span>N</p>
      <section className="mt-12 rounded-[26px] border border-line bg-[#fbfaf7] p-5 shadow-soft">
        <p className="font-serif text-[22px]">{CLIENT_REVIEW_UNAVAILABLE_MESSAGE}</p>
        <p className="mt-1 text-[13px] leading-5 text-ink-muted">Your session was not signed out.</p>
        <button className="mt-5 h-12 w-full rounded-full bg-forest text-white font-semibold" onClick={() => retrySession()}>Retry</button>
      </section>
    </main>
  );
}

export function useStore() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useStore outside provider");
  return value;
}
