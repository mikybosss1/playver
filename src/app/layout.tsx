// Absolute root layout (outside the [locale] segment) — fonts, global CSS,
// and <html>/<body>. Deliberately has no next-intl provider or nav chrome;
// that all lives one level down in [locale]/layout.tsx, since every real
// route is under /[locale]/.
import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Playver — Find Your Next Game",
  description: "Discover local sports games, connect with players in your area, and level up your game.",
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
