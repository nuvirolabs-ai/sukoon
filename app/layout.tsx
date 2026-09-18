import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";
import { Shell } from "@/components/ui";
import { ToastProvider } from "@/components/motion/Toast";
import { PageTransition } from "@/components/motion/PageTransition";
import { NativeRuntime } from "@/components/NativeRuntime";

export const metadata: Metadata = {
  title: "SUKOON — Escape the chaos",
  description: "Your property, your peace of mind. One record. A lifetime of clarity. Tax, papers, rent, resale — no tension.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Sukoon" },
};

export const viewport: Viewport = { themeColor: "#f7f3eb", viewportFit: "cover", interactiveWidget: "resizes-content" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full bg-canvas text-foreground">
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
