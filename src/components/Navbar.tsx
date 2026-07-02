"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import LanguageToggle from "./LanguageToggle";
import { useSession, signOut } from "@/lib/auth-client";

const navHrefs = ["/tournaments", "/events", "/teams", "/request-a-feature"] as const;

export default function Navbar() {
  const t = useTranslations("Navbar");
  const pathname = usePathname();
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? null;
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const navLinks = [
    { href: navHrefs[0], label: t("tournaments") },
    { href: navHrefs[1], label: t("discover") },
    { href: navHrefs[2], label: t("teams") },
    { href: navHrefs[3], label: t("requestFeature") },
  ];

  return (
    <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image src="/logo.png" alt="Playver" width={100} height={40} priority className="object-contain" />
        </Link>

        {/* Desktop nav links */}
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

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3 shrink-0">
          <LanguageToggle />

          {firstName ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-[#e21d12] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {firstName[0].toUpperCase()}
              </span>
              <span className="hidden sm:flex flex-col leading-none">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">{firstName}</span>
                <span className="text-xs font-bold text-zinc-800">{t("myDashboard")}</span>
              </span>
            </Link>
          ) : (
            <>
              <Link href="/auth/signin" className="text-sm font-medium text-zinc-700 hover:text-[#e21d12] transition-colors hidden sm:inline">
                {t("login")}
              </Link>
              <Link href="/auth/signup" className="px-4 sm:px-5 py-2 text-sm font-semibold text-white rounded-full transition-colors hover:bg-[#d41810] bg-[#e21d12]">
                {t("signup")}
              </Link>
            </>
          )}

          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-zinc-100 transition-colors gap-1.5"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <span className={`block w-5 h-0.5 bg-zinc-700 transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-zinc-700 transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-zinc-700 transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-zinc-100 shadow-lg px-4 py-4 flex flex-col gap-1">
          {firstName && (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors mb-1"
              >
                <span className="w-9 h-9 rounded-full bg-[#e21d12] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {firstName[0].toUpperCase()}
                </span>
                <div className="flex flex-col leading-none">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-0.5">{firstName}</span>
                  <span className="text-sm font-bold text-zinc-900">{t("myDashboard")}</span>
                </div>
                <svg className="ml-auto text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
              <div className="h-px bg-zinc-100 my-1" />
            </>
          )}
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-3 rounded-xl text-sm font-bold tracking-wide uppercase transition-colors ${
                pathname === href
                  ? "bg-[#e21d12]/10 text-[#e21d12]"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {label}
            </Link>
          ))}
          {firstName ? (
            <button
              type="button"
              onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } })}
              className="mt-2 px-4 py-3 rounded-xl text-sm font-bold tracking-wide uppercase text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              {t("logout")}
            </button>
          ) : (
            <Link
              href="/auth/signin"
              className="px-4 py-3 rounded-xl text-sm font-bold tracking-wide uppercase text-zinc-700 hover:bg-zinc-50 transition-colors sm:hidden"
            >
              {t("login")}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
