"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function HeroSection() {
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
    <section className="bg-white py-20 sm:py-28">
      <div ref={containerRef} className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] text-zinc-900 mb-6"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {t("titleLine1")}
            <br />
            <span className="text-[#e21d12]">{t("titleLine2")}</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-xl mx-auto mb-10">
            {t("subtitle")}
          </p>

          <div className="flex justify-center">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-8 py-3 text-base font-semibold text-white rounded-lg shadow-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors"
            >
              {t("cta")}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
