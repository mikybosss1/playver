import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function RequestAFeaturePage() {
  const t = await getTranslations("RequestFeature");

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-20">
          <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-4">
            {t("eyebrow")}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
            {t("title")}
          </h1>
          <p className="text-zinc-500 text-lg mb-12">{t("subtitle")}</p>

          <form className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-700">{t("nameLabel")}</label>
              <input
                type="text"
                placeholder={t("namePlaceholder")}
                className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-700">{t("emailLabel")}</label>
              <input
                type="email"
                placeholder={t("emailPlaceholder")}
                className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-700">{t("messageLabel")}</label>
              <textarea
                rows={5}
                placeholder={t("messagePlaceholder")}
                className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 placeholder:text-zinc-400 resize-none"
              />
            </div>

            <button
              type="submit"
              className="self-start px-8 py-3 text-sm font-semibold text-white rounded-lg bg-[#e21d12] hover:bg-[#d41810] transition-colors shadow"
            >
              {t("submit")}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
