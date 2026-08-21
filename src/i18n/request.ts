// Per-request next-intl config: resolves the active locale and loads its
// messages/*.json. Falls back to the default locale if the requested one
// isn't in routing.locales (belt-and-suspenders — [locale]/layout.tsx
// already 404s on an invalid locale segment).
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
