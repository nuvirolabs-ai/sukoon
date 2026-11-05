"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { getServerSnapshot, getSnapshot, persistState, replaceState, requestOtp, retrySession, reviewCodeClient, signInClientReview, signInStagingReview, signOut, stagingReviewClient, startClientStore, subscribe, verifyOtp } from "@/lib/client-store";
import type { AppState } from "@/lib/types";
import { clientSafeError } from "@/lib/client-review";

type StoreContextValue = {
  s: AppState;
  email: string;
  update: (fn: (s: AppState) => AppState) => void;
  replace: (state: AppState, version?: number) => void;
  logout: () => Promise<void>;
};

const Ctx = createContext<StoreContextValue | null>(null);

// Default state when open without password so user can directly use and test everything
const DEFAULT_DIRECT_STATE: AppState = {
  properties: [
    {
      id: "prop-sc-108",
      name: "Super Corridor Plot 108",
      type: "plot",
      city: "Indore",
      area: "Super Corridor Phase 2",
      address: "Plot 108, Sector C, Near TCS Metro, Indore",
      carpetAreaSqft: 1500,
      plotSizeSqft: 1500,
      ownerName: "Akshay Sharma",
      purchaseValue: 5200000,
      loanActive: false,
      ownershipAssertion: "self_asserted",
      createdAt: "2026-02-14T10:00:00.000Z",
    },
    {
      id: "prop-vn-house",
      name: "Vijay Nagar Residence",
      type: "villa",
      city: "Indore",
      area: "Vijay Nagar / Scheme 54",
      address: "Plot 42, PU-4, Vijay Nagar, Indore",
      carpetAreaSqft: 2400,
      plotSizeSqft: 2400,
      ownerName: "Akshay Sharma",
      purchaseValue: 14500000,
      loanActive: true,
      loanBalance: 4200000,
      ownershipAssertion: "self_asserted",
      createdAt: "2026-01-10T10:00:00.000Z",
    },
    {
      id: "prop-omaxe-villa",
      name: "Omaxe City Palm Villa",
      type: "flat",
      city: "Indore",
      area: "Omaxe City 1, AB Bypass",
      address: "Villa 18, Sector B, Omaxe City 1, Indore",
      carpetAreaSqft: 1800,
      plotSizeSqft: 1800,
      ownerName: "Akshay Sharma",
      purchaseValue: 6750000,
      loanActive: false,
      ownershipAssertion: "self_asserted",
      createdAt: "2026-03-01T10:00:00.000Z",
    },
  ],
  docs: [
    {
      id: "doc-reg-01",
      propertyId: "prop-sc-108",
      type: "Registry",
      name: "Registered Sale Deed (Bikrinama)",
      uploadDate: "2026-02-14",
    },
    {
      id: "doc-mut-01",
      propertyId: "prop-sc-108",
      type: "Naamantaran (mutation)",
      name: "Revenue Mutation Order (Namantaran)",
      uploadDate: "2026-03-01",
    },
    {
      id: "doc-tax-01",
      propertyId: "prop-vn-house",
      type: "Tax receipt",
      name: "Municipal Property Tax Paid Receipt 2026",
      uploadDate: "2026-04-10",
    },
  ],
  bills: [
    {
      id: "bill-01",
      propertyId: "prop-vn-house",
      type: "Electricity",
      title: "MP West Discom Electricity Bill",
      amount: 3450,
      dueDate: "2026-11-10",
      status: "pending",
      recurring: "monthly",
    },
    {
      id: "bill-02",
      propertyId: "prop-vn-house",
      type: "Maintenance",
      title: "Society Maintenance Scheme 54",
      amount: 2200,
      dueDate: "2026-11-05",
      status: "pending",
      recurring: "monthly",
    },
  ],
  maintenance: [],
  timeline: [
    {
      id: "ev-01",
      propertyId: "prop-sc-108",
      date: "2026-02-14",
      title: "Registry Executed",
      detail: "Sub-Registrar Office Indore registered in favor of Akshay Sharma.",
      kind: "doc",
    },
    {
      id: "ev-02",
      propertyId: "prop-sc-108",
      date: "2026-03-01",
      title: "Namantaran (Mutation) Passed",
      detail: "Revenue records updated in B-1 Khasra extract.",
      kind: "mutation",
    },
  ],
  shares: [],
  listings: [],
  projects: [
    {
      id: "sc-proj-01",
      propertyId: "prop-sc-108",
      name: "Super Corridor Contemporary Villa",
      plotSizeSqft: 1500,
      spec: "G+1 Modern Villa",
      budget: 5500000,
      currentStage: 3,
      stageStatus: { 0: "done", 1: "done", 2: "done", 3: "active" },
      startDate: "2026-06-01",
    },
  ],
  tenants: [],
  bookings: [],
  reminders: [
    {
      id: "rem-01",
      propertyId: "prop-vn-house",
      kind: "tax",
      title: "Pay Municipal Property Tax (5% Early Rebate)",
      dueDate: "2026-11-15",
      done: false,
    },
  ],
  lang: "en",
  referralCode: "SKN-IND-77",
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const path = usePathname();
  startClientStore();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Local state for direct no-password access
  const [guestState, setGuestState] = useState<AppState>(() => {
    if (typeof window === "undefined") return DEFAULT_DIRECT_STATE;
    try {
      const saved = localStorage.getItem("sukoon_direct_workspace");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_DIRECT_STATE;
  });

  if (path === "/home-reference") return <>{children}</>;

  // If user has active authenticated server session, use it
  if (snapshot.status === "ready" && snapshot.state && snapshot.email) {
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

  // DIRECT ACCESS MODE (No password required) - users enter app directly
  const directValue: StoreContextValue = {
    s: guestState,
    email: "akshay-review@sukoon.local",
    update: (fn) => {
      setGuestState((prev) => {
        const next = fn(structuredClone(prev));
        try {
          localStorage.setItem("sukoon_direct_workspace", JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    replace: (next) => {
      setGuestState(next);
      try {
        localStorage.setItem("sukoon_direct_workspace", JSON.stringify(next));
      } catch {}
    },
    logout: async () => {
      try {
        localStorage.removeItem("sukoon_direct_workspace");
      } catch {}
      await signOut();
    },
  };

  return <Ctx.Provider value={directValue}>{children}</Ctx.Provider>;
}

export function SignInForm({ onDirectEnter }: { onDirectEnter?: () => void }) {
  const [email, setEmail] = useState("akshay-review@sukoon.local");
  const [accessCode, setAccessCode] = useState("ktc_RhkjhZHC0qNou9gaBNQHXjza7LigLai4Xax-Q4k");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sandboxOtp, setSandboxOtp] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const handleDirectAccess = () => {
    if (onDirectEnter) {
      onDirectEnter();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <main className="native-safe-screen mx-auto min-h-dvh max-w-[430px] bg-white px-6 pb-10 pt-20 text-foreground">
      <div className="mx-auto max-w-sm">
        <p className="text-center text-[46px] tracking-wide leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          SUK<span className="text-[#2563eb]">OO</span>N
        </p>
        <p className="mt-2 text-center text-[11px] tracking-[0.35em] text-ink-muted">ESCAPE THE CHAOS</p>
        <section className="mt-10 rounded-[26px] border border-line bg-[#fbfaf7] p-5 shadow-soft">
          <p className="font-serif text-[22px]">Open your passport</p>
          <p className="mt-1 text-[13px] leading-5 text-ink-muted">
            Tap below to enter directly without a password, or sign in manually.
          </p>

          {/* 1-Tap Direct No-Password Entry */}
          <div className="mt-4 mb-2">
            <button
              type="button"
              onClick={handleDirectAccess}
              className="w-full py-3.5 px-4 rounded-full bg-forest text-white font-bold text-[15px] shadow-sm hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              <span>🚀 Enter App Directly (No Password)</span>
            </button>
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-line"></div>
              <span className="flex-shrink mx-2 text-[10px] text-ink-muted uppercase font-bold tracking-wider">or Manual Sign-In</span>
              <div className="flex-grow border-t border-line"></div>
            </div>
          </div>

          <form
            className="mt-2 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              setBusy(true);
              setMessage("");
              void (reviewCodeClient
                ? stagingReviewClient
                  ? signInStagingReview(email, accessCode)
                  : signInClientReview(email, accessCode)
                : otpSent
                ? verifyOtp(email, otp)
                : requestOtp(email).then((result) => {
                    setSandboxOtp(result.sandboxOtp);
                    setOtpSent(true);
                    setMessage(result.sandboxOtp ? "Local sandbox mailbox: enter the displayed OTP." : "OTP sent. Check the email address you entered to continue.");
                  })
              )
                .then(() => handleDirectAccess())
                .catch((e: unknown) => {
                  setMessage(clientSafeError(e));
                })
                .finally(() => setBusy(false));
            }}
          >
            <label className="block text-[12px] font-semibold" htmlFor="sukoon-email">
              Email address
            </label>
            <input
              id="sukoon-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="owner@example.com"
              className="h-12 w-full rounded-2xl border border-line bg-white px-3 text-[14px] outline-none focus:border-forest"
            />
            {reviewCodeClient ? (
              <>
                <label className="block text-[12px] font-semibold" htmlFor="sukoon-access-code">
                  Access code
                </label>
                <input
                  id="sukoon-access-code"
                  type="password"
                  autoComplete="one-time-code"
                  required
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  placeholder="Enter your access code"
                  className="h-12 w-full rounded-2xl border border-line bg-white px-3 text-[14px] outline-none focus:border-forest"
                />
              </>
            ) : null}
            {!reviewCodeClient && otpSent ? (
              <>
                <label className="block text-[12px] font-semibold" htmlFor="sukoon-otp">
                  One-time code
                </label>
                <input
                  id="sukoon-otp"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="h-12 w-full rounded-2xl border border-line bg-white px-3 text-[14px] tracking-[0.35em] outline-none focus:border-forest"
                />
                {sandboxOtp ? (
                  <p className="rounded-xl border border-dashed border-forest/40 bg-[#effaf2] p-3 text-[12px] text-forest">
                    Local sandbox OTP: <b>{sandboxOtp}</b>
                  </p>
                ) : null}
              </>
            ) : null}
            <button
              disabled={busy}
              className="h-12 w-full rounded-full bg-forest text-white font-semibold disabled:opacity-50"
            >
              {busy ? "Checking…" : reviewCodeClient ? "Continue" : otpSent ? "Open passport" : "Send OTP"}
            </button>
            {!reviewCodeClient && otpSent ? (
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setSandboxOtp(undefined);
                  setMessage("");
                }}
                className="w-full text-[12px] underline"
              >
                Use a different email
              </button>
            ) : null}
          </form>
          {message ? (
            <div className="mt-3 p-3 rounded-xl bg-mint text-forest text-xs font-bold space-y-1">
              <p>Sign in bypassed! You can enter directly:</p>
              <button
                type="button"
                onClick={handleDirectAccess}
                className="underline block font-extrabold text-forest"
              >
                Click here to enter app →
              </button>
            </div>
          ) : null}
          <div className="mt-4 rounded-xl border border-line/60 bg-white p-3 text-[11px] leading-4 text-ink-muted space-y-1">
            <p className="font-semibold text-foreground">Review Account Info:</p>
            <p>
              Email: <code className="bg-canvas/60 px-1 py-0.5 rounded text-foreground font-mono">akshay-review@sukoon.local</code>
            </p>
            <p>
              Access Code:{" "}
              <code className="bg-canvas/60 px-1 py-0.5 rounded text-foreground font-mono break-all">
                ktc_RhkjhZHC0qNou9gaBNQHXjza7LigLai4Xax-Q4k
              </code>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export function useStore() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useStore outside provider");
  return value;
}

export function useOptionalStore() {
  return useContext(Ctx);
}
