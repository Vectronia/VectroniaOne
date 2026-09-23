/**
 * The site's own address, in one place.
 *
 * The page is prerendered, so Next resolves absolute URLs at build time and
 * has no request to take the host from: without this it writes localhost into
 * `og:image`, the canonical link and the sitemap. The live domain is the
 * default, so a plain build is already correct; NEXT_PUBLIC_SITE_URL overrides
 * it for a preview or staging deployment.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vectronia-one.de";
