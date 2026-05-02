import type { Metadata } from "next";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-inter)" }}>
        {children}
      </body>
    </html>
  );
}
