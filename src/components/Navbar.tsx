"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import LanguageToggle from "./LanguageToggle";
import { useSession } from "@/lib/auth-client";

const navHrefs = ["/discover", "/teams", "/request-a-feature"] as const;

export default function Navbar() {
  const t = useTranslations("Navbar");
  const pathname = usePathname();
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? null;

  const navLinks = [
    { href: navHrefs[0], label: t("discover") },
    { href: navHrefs[1], label: t("teams") },
    { href: navHrefs[2], label: t("requestFeature") },
  ];

  return (
    <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image src="/logo.png" alt="Playver" width={100} height={40} priority className="object-contain" />
        </Link>

        {/* Nav links */}
        <nav className="hidden lg:flex items-center gap-7 ml-2">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-xs font-black tracking-widest uppercase transition-opacity whitespace-nowrap ${
                pathname === href ? "text-[#e21d12]" : "text-zinc-700 hover:opacity-70"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <LanguageToggle />

          {firstName ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-[#e21d12] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {firstName[0].toUpperCase()}
              </span>
              <span className="text-sm font-semibold text-zinc-800">{firstName}</span>
            </Link>
          ) : (
            <>
              <Link href="/auth/signin" className="text-sm font-medium text-zinc-700 hover:text-[#e21d12] transition-colors">
                {t("login")}
              </Link>
              <Link href="/auth/signup" className="px-5 py-2 text-sm font-semibold text-white rounded-full transition-colors hover:bg-[#d41810] bg-[#e21d12]">
                {t("signup")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
