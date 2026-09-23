import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * The list of pages worth offering to a search engine.
 *
 * Only the home page. Impressum and Datenschutz carry `robots: noindex` — they
 * are there for the law and for anyone who looks, not for a search index — and
 * listing a page here while telling crawlers to skip it is a contradiction
 * Search Console reports as an error.
 *
 * Next serves this at /sitemap.xml; robots.ts points at it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
