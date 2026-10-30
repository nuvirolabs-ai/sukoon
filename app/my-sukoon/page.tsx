import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function MySukoonPage() {
  return (
    <div className="min-h-screen bg-canvas text-foreground pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur-md border-b border-line/60 px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-foreground transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8B82]">
          MY SUKOON
        </span>
        <div className="w-8" />
      </header>

      {/* Main Serene Content (Blank canvas ready for future features) */}
      <main className="max-w-md mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-white border border-[#E7E3D9] flex items-center justify-center shadow-xs">
            <Sparkles className="w-9 h-9 text-[#8C7A58] opacity-80" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-[#1B2922] tracking-tight">
          My Sukoon
        </h1>

        <p className="text-xs text-[#7C8B82] max-w-xs mt-2 leading-relaxed">
          Your personal real estate sanctuary. New bespoke privileges and tailored insights will appear here soon.
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className="tap-scale inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-forest text-white text-xs font-semibold shadow-xs hover:opacity-95 transition"
          >
            Explore Home
          </Link>
        </div>
      </main>
    </div>
  );
}
