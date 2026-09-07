import Link from "next/link";

import { missingLegalDetails } from "@/data/legal";

/**
 * The frame the two legal pages share.
 *
 * Set left-aligned rather than justified: the rest of the site justifies its
 * copy, but these pages are read to look something up, not read through, and
 * a ragged right edge is easier to scan for the line you want.
 */
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
      <Link
        href="/"
        className="font-display text-lg text-fg-muted italic underline-offset-4 hover:text-fg hover:underline"
      >
        ← Zurück zur Startseite
      </Link>

      <h1 className="text-metal mt-10 font-display text-4xl font-semibold italic md:text-5xl">
        {title}
      </h1>

      {missingLegalDetails.length > 0 && (
        <p
          role="alert"
          className="mt-8 rounded-[12px] bg-brand-amber/15 px-5 py-4 text-fg ring-1 ring-brand-amber/50"
        >
          <strong className="font-semibold">Diese Seite ist noch nicht vollständig.</strong> Es
          fehlen: {missingLegalDetails.join(", ")}. Trage die Angaben in{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5">src/data/legal.ts</code> ein. Solange
          hier etwas fehlt, erfüllt die Seite ihren Zweck nicht.
        </p>
      )}

      <div className="mt-10 space-y-8 text-fg-muted [&_a]:text-fg [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-fg [&_h2]:italic [&_h2+p]:mt-3 [&_li]:mt-1.5 [&_p]:leading-[1.7] [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
    </main>
  );
}
