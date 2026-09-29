import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";
import { Shell } from "@/components/ui";
import { ToastProvider } from "@/components/motion/Toast";
import { PageTransition } from "@/components/motion/PageTransition";
import { NativeRuntime } from "@/components/NativeRuntime";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SUKOON — Escape the chaos",
  description: "Your property, your peace of mind. One record. A lifetime of clarity. Tax, papers, rent, resale — no tension.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Sukoon" },
};

export const viewport: Viewport = { themeColor: "#f7f3eb", viewportFit: "cover", interactiveWidget: "resizes-content" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-full bg-canvas text-foreground">
        <script dangerouslySetInnerHTML={{ __html: "try{var p=location.pathname;document.documentElement.classList.toggle('is-inner',p!=='/'&&p!=='/home-reference')}catch(e){}" }} />
        <NativeRuntime />
        <StoreProvider>
          <ToastProvider>
            <Shell>
              <PageTransition>{children}</PageTransition>
            </Shell>
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
