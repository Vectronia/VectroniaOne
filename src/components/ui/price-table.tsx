"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { cn } from "@/lib/utils";

export type PriceRow = {
  /** Row label — a sheet size, or what the surcharge is for. */
  label: string;
  /** One price per medium, in euro, in the order of `media`. */
  prices: number[];
};

export type PriceTableProps = {
  /** The media the sheet can be worked in — the columns. */
  media: string[];
  /** The sizes and their prices. */
  sizes: PriceRow[];
  /** What can be added on top, priced the same way. */
  extras: PriceRow[];
  header: string;
  /** What every price already contains. */
  included: string[];
  /** The closing line; `children` carries the link out of it. */
  children?: React.ReactNode;
  id?: string;
  className?: string;
};

const euro = (value: number) => `${value} €`;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

/**
 * What a drawing costs, as a table rather than as a paragraph.
 *
 * A price belongs in a grid: the reader is comparing two numbers — a size
 * against a medium — and a sentence makes them hold both in their head. This
 * is a real table, so a screen reader announces "DIN A3, Aquarell, 120 €"
 * rather than reading a wall of figures.
 *
 * The surcharges share the table rather than standing in their own: they are
 * priced per medium exactly as the sizes are, and splitting them off would
 * repeat the three column headings for three rows.
 */
export function PriceTable({
  media,
  sizes,
  extras,
  header,
  included,
  children,
  id,
  className,
}: PriceTableProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    if (!section) return;

    let io: IntersectionObserver | null = null;
    const ctx = gsap.context(() => {
      gsap.set(innerRef.current, { opacity: 0, y: 16 });
      // An observer rather than a ScrollTrigger, for the same reason as the
      // panels: a trigger's cached start was stale on first load and left the
      // section invisible seconds after it had entered the viewport.
      io = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return;
          io?.disconnect();
          gsap.to(innerRef.current, { opacity: 1, y: 0, ease: "power2.out", duration: 0.9 });
        },
        { rootMargin: "0px 0px -12% 0px" },
      );
      io.observe(section);
    }, sectionRef);

    return () => {
      io?.disconnect();
      ctx.revert();
    };
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={id ? `${id}-header` : undefined}
      className={cn("relative w-full px-6 py-24 lg:py-32", className)}
    >
      <div ref={innerRef} className="relative mx-auto max-w-3xl">
        <h2
          id={id ? `${id}-header` : undefined}
          className="text-metal font-display text-center text-3xl font-semibold text-balance italic md:text-4xl lg:text-5xl"
        >
          {header}
        </h2>

        {/*
         * The table scrolls sideways only if it has to. Four columns of short
         * figures fit a phone, but a long medium name or a large text setting
         * can push past it, and a table that overflows its section silently is
         * worse than one the reader can push along.
         */}
        <div className="mt-14 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm sm:text-base">
            <caption className="sr-only">
              Preise nach Format und Medium, jeweils in Euro
            </caption>
            <thead>
              <tr className="border-b border-white/15">
                <th scope="col" className="py-3 pr-3 font-display text-sm font-normal text-fg-muted italic sm:pr-4 sm:text-base">
                  Format
                </th>
                {media.map((medium) => (
                  <th
                    key={medium}
                    scope="col"
                    className="py-3 pl-3 text-right font-display text-sm font-normal text-fg italic sm:pl-4 sm:text-base md:text-lg"
                  >
                    {medium}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizes.map((row) => (
                <tr key={row.label} className="border-b border-white/8">
                  <th scope="row" className="py-4 pr-3 text-left font-normal text-fg sm:pr-4">
                    {row.label}
                  </th>
                  {row.prices.map((price, index) => (
                    <td
                      key={media[index]}
                      className="py-4 pl-3 text-right tabular-nums text-fg-muted sm:pl-4"
                    >
                      {euro(price)}
                    </td>
                  ))}
                </tr>
              ))}
              {extras.map((row, rowIndex) => (
                <tr
                  key={row.label}
                  className={cn(
                    "text-sm",
                    // The surcharges are set apart from the sizes by a rule
                    // above the first of them: they answer a different
                    // question, and a reader scanning for a format should not
                    // land on one of them by accident.
                    rowIndex === 0 && "border-t border-white/15",
                    rowIndex < extras.length - 1 && "border-b border-white/8",
                  )}
                >
                  <th scope="row" className="py-4 pr-3 text-left font-normal text-fg-muted sm:pr-4">
                    {row.label}
                  </th>
                  {row.prices.map((price, index) => (
                    <td
                      key={media[index]}
                      className="py-4 pl-3 text-right tabular-nums text-fg-muted/80 sm:pl-4"
                    >
                      + {euro(price)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-12 space-y-4 border-t border-white/10 pt-8">
          {included.map((line) => (
            <li key={line} className="flex gap-3 text-sm leading-relaxed text-fg-muted">
              {/* A mark rather than a bullet: the list is three short facts,
                  not an enumeration anybody counts. */}
              <span aria-hidden className="mt-[0.45em] h-1 w-1 shrink-0 rounded-full bg-brand-amber" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {children && (
          // Centred like the lead, not justified like a panel's running text:
          // this is one short closing line under a centred heading, and a
          // justified block would set its own edge against nothing.
          <p className="body-copy mx-auto mt-10 max-w-[58ch] text-center text-fg-muted [text-align-last:center]">
            {children}
          </p>
        )}
      </div>
    </section>
  );
}
