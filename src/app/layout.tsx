// Absolute root layout (outside the [locale] segment) — fonts, global CSS,
// and <html>/<body>. Deliberately has no next-intl provider or nav chrome;
// that all lives one level down in [locale]/layout.tsx, since every real
// route is under /[locale]/.
import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { isIndexable } from "@/lib/env";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// metadataBase reflects wherever this deployment is actually served
// (playver.ca in prod, stage.playver.ca on staging, localhost in dev) —
// no page currently declares its own `alternates.canonical`, so nothing
// resolves against this yet, but it's the correct base for anything that
// does in the future (OG images, relative canonical/alternate URLs) and
// ensures none of it can ever resolve to the wrong environment's domain.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://playver.ca"),
  title: "Playver — Find Your Next Game",
  description: "Discover local sports games, connect with players in your area, and level up your game.",
  // The actual indexing switch: only the real production deployment is
  // index/follow. Staging and every Vercel Preview default to
  // noindex/nofollow via isIndexable() (src/lib/env.ts) — applies
  // site-wide since no page overrides `robots` in its own metadata.
  robots: isIndexable()
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={`${playfair.variable} ${inter.variable}`}>
      <body suppressHydrationWarning className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-inter)" }}>
        {children}
      </body>
    </html>
  );
}
