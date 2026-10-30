"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  CreditCard,
  UserCheck,
  Users,
  Bell,
  Lock,
  MessageCircle,
  LogOut,
  ChevronRight,
  ExternalLink,
  Award,
  Sparkles,
} from "lucide-react";
import { Disclosure, GroupedList, ListRow } from "@/components/consumer";
import { useStore } from "@/components/StoreProvider";
import { PrivacySessions } from "@/components/PrivacySessions";
import { PrivacyRequests } from "@/components/PrivacyRequests";
import { ProcessingControl } from "@/components/ProcessingControl";
import { presentName } from "@/lib/ui-content";

export default function ProfilePage() {
  const { email, s, logout } = useStore();
  const ownerProperty = s.properties.find((p) => p.ownerName);
  const displayName = ownerProperty?.ownerName || "Akshay Sharma";
  const userEmail = email || "akshay.sharma@sukoon.in";
  const userPhone = "+91 98260 11223";
  const passportId = "SKN-IND-88421";

  const [copiedId, setCopiedId] = useState(false);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [materialAlerts, setMaterialAlerts] = useState(true);

  const handleCopyPassport = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(passportId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-foreground pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur-md border-b border-line/60 px-4 py-3.5 flex items-center justify-between">
        <h1 className="text-base font-bold text-[#1B2922]">Profile &amp; Account</h1>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E5637] bg-[#E8F5EE] border border-[#A3D9B5] px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck size={11} /> Verified Citizen
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* VIP Citizen Passport Card */}
        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1B2922] via-[#243B30] to-[#12231A] text-white p-5 shadow-sm">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-lg font-bold text-[#E5D5B8] shadow-inner">
                {displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-white tracking-tight leading-snug">
                    {displayName}
                  </h2>
                  <Award size={15} className="text-[#E5D5B8]" />
                </div>
                <p className="text-[11px] text-white/70">{userEmail}</p>
                <p className="text-[11px] text-white/60 mt-0.5">{userPhone}</p>
              </div>
            </div>
          </div>

          {/* Sukoon Passport ID with Copy */}
          <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">
                Sukoon Passport ID
              </span>
              <span className="font-mono font-bold text-white tracking-wide text-xs">
                {passportId}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyPassport}
              className="tap-scale px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold flex items-center gap-1 border border-white/10 transition"
            >
              {copiedId ? (
                <>
                  <Check size={12} className="text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy size={12} /> Copy ID
                </>
              )}
            </button>
          </div>
        </section>

        {/* Real Estate Portfolio KPIs */}
        <section className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-[18px] bg-white border border-[#E7E3D9] shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8B82] block">
              Properties Registered
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-[#1B2922]">
                {Math.max(s.properties.length, 3)}
              </span>
              <span className="text-[11px] text-[#7C8B82]">Parcels</span>
            </div>
            <p className="text-[10px] text-forest font-semibold mt-1">
              ₹4.25 Cr Portfolio Value
            </p>
          </div>

          <div className="p-3.5 rounded-[18px] bg-white border border-[#E7E3D9] shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8B82] block">
              Vault Health Score
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-[#1E5637]">96%</span>
              <span className="text-[11px] text-emerald-700 font-semibold">Grade A+</span>
            </div>
            <p className="text-[10px] text-[#7C8B82] mt-1">
              All Deeds &amp; Tax Cleared
            </p>
          </div>
        </section>

        {/* Legal & KYC Verification Status */}
        <section className="p-4 rounded-[20px] bg-white border border-[#E7E3D9] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B2922] flex items-center gap-1.5">
              <UserCheck size={14} className="text-forest" />
              <span>KYC &amp; Legal Verification</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              100% Complete
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-sand/30 border border-line/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1B2922]">Aadhaar Card</p>
                <p className="text-[10px] text-ink-muted">•••• •••• 8842 (UIDAI e-KYC Verified)</p>
              </div>
              <CheckCircle2 size={16} className="text-[#1E5637] shrink-0" />
            </div>

            <div className="p-2.5 rounded-xl bg-sand/30 border border-line/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1B2922]">PAN Card (Income Tax)</p>
                <p className="text-[10px] text-ink-muted">ABCPS••••K (Linked for Form 26QB)</p>
              </div>
              <CheckCircle2 size={16} className="text-[#1E5637] shrink-0" />
            </div>

            <div className="p-2.5 rounded-xl bg-sand/30 border border-line/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1B2922]">Primary Bank Account</p>
                <p className="text-[10px] text-ink-muted">HDFC Bank •••• 4091 (RTGS Ready)</p>
              </div>
              <CheckCircle2 size={16} className="text-[#1E5637] shrink-0" />
            </div>

            <div className="p-2.5 rounded-xl bg-sand/30 border border-line/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1B2922]">Registered Nominee</p>
                <p className="text-[10px] text-ink-muted">Sunita Sharma (Spouse) • 100% Share</p>
              </div>
              <CheckCircle2 size={16} className="text-[#1E5637] shrink-0" />
            </div>
          </div>
        </section>

        {/* Trusted Family & Legal Circle */}
        <section className="p-4 rounded-[20px] bg-white border border-[#E7E3D9] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B2922] flex items-center gap-1.5">
              <Users size={14} className="text-forest" />
              <span>Trusted Family Access</span>
            </h3>
            <span className="text-[11px] text-[#7C8B82] font-medium">2 Active</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-sand/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  SS
                </div>
                <div>
                  <p className="font-bold text-[#1B2922]">Sunita Sharma</p>
                  <p className="text-[10px] text-[#7C8B82]">Co-Owner • Full Vault Access</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Family
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-sand/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                  RS
                </div>
                <div>
                  <p className="font-bold text-[#1B2922]">Adv. Rajesh Saxena</p>
                  <p className="text-[10px] text-[#7C8B82]">Legal Counsel • Read-Only Title Deeds</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                Counsel
              </span>
            </div>
          </div>

          <Link
            href="/properties"
            className="block text-center text-xs font-bold text-forest py-2 rounded-xl bg-mint/40 hover:bg-mint transition"
          >
            Manage Permissions &amp; Access
          </Link>
        </section>

        {/* Notifications & WhatsApp Updates */}
        <section className="p-4 rounded-[20px] bg-white border border-[#E7E3D9] shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B2922] flex items-center gap-1.5">
            <Bell size={14} className="text-forest" />
            <span>Smart Notifications</span>
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div>
                <p className="font-bold text-[#1B2922]">WhatsApp Deal &amp; Market Alerts</p>
                <p className="text-[10px] text-ink-muted">Receive verified Indore deals via WhatsApp</p>
              </div>
              <input
                type="checkbox"
                checked={whatsappAlerts}
                onChange={(e) => setWhatsappAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-forest focus:ring-forest"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none pt-2 border-t border-line/60">
              <div>
                <p className="font-bold text-[#1B2922]">Daily Mandi Material Rates</p>
                <p className="text-[10px] text-ink-muted">Cement &amp; Steel daily price trend notifications</p>
              </div>
              <input
                type="checkbox"
                checked={materialAlerts}
                onChange={(e) => setMaterialAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-forest focus:ring-forest"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none pt-2 border-t border-line/60">
              <div>
                <p className="font-bold text-[#1B2922]">Biometric / Face ID App Lock</p>
                <p className="text-[10px] text-ink-muted">Require Face ID / Fingerprint to open Vault</p>
              </div>
              <input
                type="checkbox"
                checked={biometricEnabled}
                onChange={(e) => setBiometricEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-forest focus:ring-forest"
              />
            </label>
          </div>
        </section>

        {/* Sukoon Private Concierge */}
        <section className="p-4 rounded-[20px] bg-[#FAF8F5] border border-[#E7E3D9] space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#1B2922]">
                Sukoon Private Concierge Desk
              </h3>
              <p className="text-[10px] text-[#7C8B82]">
                Dedicated real estate manager for title search &amp; deals
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/919109012345?text=Hello%20Sukoon%20Concierge%2C%20I%20need%20assistance%20with%20my%20property%20portfolio."
            target="_blank"
            rel="noopener noreferrer"
            className="tap-scale w-full py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:opacity-95 transition"
          >
            <MessageCircle size={14} /> Connect on WhatsApp (+91 91090 12345)
          </a>
        </section>

        {/* Existing Privacy & Data Security Disclosures */}
        <section className="space-y-2">
          <p className="text-[11px] font-bold text-ink-muted px-1 uppercase tracking-wider">
            Privacy &amp; Data Sovereign Controls
          </p>
          <GroupedList>
            <Disclosure title="Sessions" detail="Devices signed in">
              <PrivacySessions />
            </Disclosure>
            <Disclosure title="Exports & deletion" detail="Your data requests">
              <PrivacyRequests />
            </Disclosure>
            <Disclosure title="Document processing" detail="Background processing">
              <ProcessingControl />
            </Disclosure>
          </GroupedList>
        </section>

        {/* Sign Out */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => void logout()}
            className="tap-scale w-full py-2.5 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-50 transition shadow-2xs"
          >
            <LogOut size={14} /> Sign Out of Sukoon
          </button>
          <p className="text-center text-[10px] text-[#7C8B82] mt-3">
            Sukoon v2.4.0 • Enterprise 256-bit Encrypted Vault
          </p>
        </div>
      </main>
    </div>
  );
}
