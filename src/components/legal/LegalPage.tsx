// Generic renderer for every /legal/[slug] page (terms, privacy, refunds,
// cookies, acceptable-use) — the actual copy lives as structured data in
// src/content/legal/, not in this component.
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Link } from "@/i18n/routing";
import type { LegalBlock, LegalDoc } from "@/content/legal/types";
import { legalPages } from "@/content/legal/types";

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "list") {
    return (
      <ul className="list-disc pl-6 space-y-2 text-zinc-600 leading-relaxed">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p className="text-zinc-600 leading-relaxed">{block.text}</p>;
}

export default function LegalPage({
  doc,
  slug,
  locale,
}: {
  doc: LegalDoc;
  slug: string;
  locale: string;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-16 md:py-20 grid md:grid-cols-[220px_1fr] gap-12">
          <nav className="hidden md:block sticky top-24 self-start">
            <p className="text-xs font-bold tracking-wide uppercase text-zinc-400 mb-3">
              {locale === "fr" ? "Documents légaux" : "Legal documents"}
            </p>
            <ul className="space-y-2">
              {legalPages.map((page) => (
                <li key={page.slug}>
                  <Link
                    href={`/legal/${page.slug}`}
                    className={`text-sm block py-1 transition-colors ${
                      page.slug === slug
                        ? "text-[#e21d12] font-semibold"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    {locale === "fr" ? page.fr : page.en}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <article className="min-w-0">
            <h1
              className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-2"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {doc.title}
            </h1>
            <p className="text-sm text-zinc-400 mb-10">
              {(locale === "fr" ? "Dernière mise à jour : " : "Last updated: ") + doc.updated}
            </p>

            <div className="space-y-4 mb-10">
              {doc.intro.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>

            <div className="space-y-10">
              {doc.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-xl font-bold text-zinc-900 mb-3">{section.heading}</h2>
                  <div className="space-y-3">
                    {section.blocks.map((block, i) => (
                      <Block key={i} block={block} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
