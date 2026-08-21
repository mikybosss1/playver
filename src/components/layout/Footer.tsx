// Site footer with links to the /legal/* pages (see components/legal/
// LegalPage.tsx for how those pages render).
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function Footer() {
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();

  const legalLinks: { href: string; label: string }[] = [
    { href: "/legal/terms", label: t("legal.terms") },
    { href: "/legal/privacy", label: t("legal.privacy") },
    { href: "/legal/refunds", label: t("legal.refunds") },
    { href: "/legal/cookies", label: t("legal.cookies") },
    { href: "/legal/acceptable-use", label: t("legal.acceptableUse") },
  ];

  return (
    <footer className="bg-zinc-50 border-t border-zinc-200 pt-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/">
          <Image src="/logo.png" alt="Playver" width={100} height={40} className="object-contain" />
        </Link>

        <div className="text-center">
          <p className="text-sm text-zinc-500">{t("copyright", { year })}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{t("tagline")}</p>
        </div>

        <a
          href="https://instagram.com/playver_"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-[#e21d12] transition-colors"
          aria-label="Instagram"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
          </svg>
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4 pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {legalLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-xs text-zinc-400 hover:text-[#e21d12] transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
