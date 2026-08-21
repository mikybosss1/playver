// next-intl config: the two supported locales, and locale-aware Link/
// redirect/useRouter/usePathname wrappers. Import these instead of the
// plain next/navigation/next/link equivalents anywhere you need locale-
// prefixed URLs (localePrefix "as-needed" means "en" has no /en prefix but
// "fr" does).
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
