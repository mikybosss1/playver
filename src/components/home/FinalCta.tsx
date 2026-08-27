import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function FinalCta() {
  const t = await getTranslations("FinalCta");

  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 leading-tight mb-10"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          {t("headline")}
        </h2>
        <Link
          href="/auth/signup"
          className="inline-flex items-center px-8 py-3.5 text-base font-semibold text-white rounded-full shadow-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors"
        >
          {t("button")}
        </Link>
      </div>
    </section>
  );
}
