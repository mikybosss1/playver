import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Link } from "@/i18n/routing";
import { legalPages } from "@/content/legal/types";

const descriptions: Record<string, { en: string; fr: string }> = {
  terms: {
    en: "The rules for using Playver, including how the platform and event organizers share responsibility.",
    fr: "Les règles d'utilisation de Playver, y compris le partage des responsabilités entre la plateforme et les organisateurs.",
  },
  privacy: {
    en: "What personal information we collect, why, and the privacy rights available to you.",
    fr: "Les renseignements personnels que nous recueillons, pourquoi, et vos droits en matière de vie privée.",
  },
  refunds: {
    en: "How the Playver wallet works, when payments are refunded, and how withdrawals work.",
    fr: "Le fonctionnement du portefeuille Playver, les remboursements et les retraits.",
  },
  cookies: {
    en: "The cookies we use on Playver and how to manage them.",
    fr: "Les témoins que nous utilisons sur Playver et comment les gérer.",
  },
  "acceptable-use": {
    en: "The conduct we expect from everyone using Playver.",
    fr: "La conduite que nous attendons de toute personne qui utilise Playver.",
  },
};

export default async function LegalIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isFr = locale === "fr";

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-20">
          <p className="text-sm font-bold tracking-wide uppercase text-[#e21d12] mb-4">
            {isFr ? "Légal" : "Legal"}
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {isFr ? "Documents légaux" : "Legal documents"}
          </h1>
          <p className="text-zinc-500 text-lg mb-12">
            {isFr
              ? "Les conditions et politiques qui régissent l'utilisation de Playver."
              : "The terms and policies that govern your use of Playver."}
          </p>

          <ul className="divide-y divide-zinc-200 border-t border-b border-zinc-200">
            {legalPages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/legal/${page.slug}`}
                  className="flex items-center justify-between py-5 group"
                >
                  <span>
                    <span className="block text-base font-semibold text-zinc-900 group-hover:text-[#e21d12] transition-colors">
                      {isFr ? page.fr : page.en}
                    </span>
                    <span className="block text-sm text-zinc-500 mt-0.5">
                      {isFr ? descriptions[page.slug].fr : descriptions[page.slug].en}
                    </span>
                  </span>
                  <span className="text-zinc-300 group-hover:text-[#e21d12] transition-colors">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
