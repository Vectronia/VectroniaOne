import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * What crawlers may read, and where the sitemap is.
 *
 * Everything is open except the contact endpoint, which only accepts POST and
 * has nothing to index. The pages that should stay out of the index say so
 * themselves, in a robots meta tag: a page disallowed here can still be listed
 * from a link elsewhere, because the crawler is told not to read it and so
 * never sees the instruction not to list it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
