"use client";

// EN/FR switcher — navigates to the same pathname under the other locale
// via next-intl's locale-aware router (see src/i18n/routing.ts).
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="flex items-center bg-zinc-100 p-1 rounded-md text-[10px] font-bold">
      {(["en", "fr"] as const).map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`px-1.5 sm:px-2 py-0.5 rounded transition-all ${
            locale === l
              ? "bg-white shadow text-zinc-900"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
