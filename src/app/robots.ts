// Dynamic /robots.txt (Next.js App Router convention — see
// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots).
// Production allows normal crawling; staging and every Vercel Preview
// disallow everything, backing up the noindex/nofollow meta tag (see
// isIndexable() in src/lib/env.ts) with an explicit crawl block too.
import type { MetadataRoute } from "next";
import { isIndexable } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  // No sitemap.xml exists in this app yet — nothing to reference here.
  // If one is added later, wire its URL into this rules object.
  return { rules: { userAgent: "*", allow: "/" } };
}
