"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations("Home");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    requestAnimationFrame(() => {
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
  }, []);

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden py-20 bg-white">
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-50/40 rounded-full blur-3xl pointer-events-none" />

      <div ref={containerRef} className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto">
        <span className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-6">
          {t("eyebrow")}
        </span>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-zinc-900 mb-6" style={{ fontFamily: "var(--font-playfair)" }}>
          {t("title")}
        </h1>

        <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-xl mb-10">
          {t("subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-8 py-3 text-base font-semibold text-white rounded-lg shadow-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors"
          >
            {t("cta")}
            <span aria-hidden>→</span>
          </Link>
          {isLoggedIn && (
            <Link
              href="/dashboard/events"
              className="inline-flex items-center gap-2 px-8 py-3 text-base font-semibold text-white rounded-lg shadow-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors"
            >
              {t("createEvent")}
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
