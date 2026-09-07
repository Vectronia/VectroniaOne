import Link from "next/link";

/**
 * Closes the page and carries the two links the law requires to be reachable
 * from anywhere on the site. Kept quiet: it is a signpost, not a section.
 */
export function SiteFooter() {
  return (
    <footer className="relative w-full px-6 pb-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 border-t border-white/10 pt-8 text-sm text-fg-muted/80 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Vectronia One</p>
        <nav aria-label="Rechtliches">
          <ul className="flex gap-6">
            <li>
              <Link
                href="/impressum"
                className="underline-offset-4 transition-colors hover:text-fg hover:underline motion-reduce:transition-none"
              >
                Impressum
              </Link>
            </li>
            <li>
              <Link
                href="/datenschutz"
                className="underline-offset-4 transition-colors hover:text-fg hover:underline motion-reduce:transition-none"
              >
                Datenschutz
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
