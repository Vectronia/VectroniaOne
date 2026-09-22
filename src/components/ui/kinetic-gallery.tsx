"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";
import type { Artwork } from "@/data/artworks";

gsap.registerPlugin(ScrollTrigger);

/** Largest shear, in degrees, at peak scroll speed. */
const MAX_SKEW = 9;
/** Scroll velocity (px/s) that reaches MAX_SKEW. */
const VELOCITY_AT_MAX = 2600;
/** How long the grid takes to straighten once scrolling stops. */
const SETTLE_SECONDS = 0.7;
/** Dimming applied to the page behind an opened artwork. */
const LIGHTBOX_SCRIM = 0.3;

export type KineticGalleryProps = {
  /** Not rendered visibly — the grid is images only — but needed to name the region. */
  label: string;
  artworks: Artwork[];
  id?: string;
  className?: string;
};

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
 * A grid of artworks that shears while the page scrolls and straightens the
 * moment scrolling stops. Selecting one opens it large over a dimmed page.
 *
 * The grid carries no visible text; the descriptions live in each image's alt
 * so the section is still usable without sight.
 */
export function KineticGallery({ label, artworks, id, className }: KineticGalleryProps) {
  const gridRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduced = usePrefersReducedMotion();

  // --- Skew on scroll ---------------------------------------------------
  useEffect(() => {
    if (reduced) return;
    const grid = gridRef.current;
    if (!grid) return;

    const ctx = gsap.context(() => {
      const tiles = gsap.utils.toArray<HTMLElement>("[data-tile]", grid);
      if (!tiles.length) return;

      gsap.set(tiles, { transformOrigin: "center center", force3D: true });

      const applySkew = gsap.quickSetter(tiles, "skewY", "deg");
      const clamp = gsap.utils.clamp(-MAX_SKEW, MAX_SKEW);
      const state = { skew: 0 };

      const trigger = ScrollTrigger.create({
        onUpdate: (self) => {
          const next = clamp((self.getVelocity() / VELOCITY_AT_MAX) * MAX_SKEW);
          // Only ever take the larger shear, then always relax back to level —
          // that is what makes the grid straighten when scrolling stops.
          if (Math.abs(next) > Math.abs(state.skew)) {
            state.skew = next;
            gsap.to(state, {
              skew: 0,
              duration: SETTLE_SECONDS,
              ease: "power3",
              overwrite: true,
              onUpdate: () => applySkew(state.skew),
            });
          }
        },
      });

      return () => {
        trigger.kill();
        gsap.set(tiles, { clearProps: "transform" });
      };
    }, gridRef);

    return () => ctx.revert();
  }, [reduced]);

  // --- Lightbox ---------------------------------------------------------
  const close = useCallback(() => {
    setOpenIndex(null);
    returnFocusRef.current?.focus();
    returnFocusRef.current = null;
  }, []);

  const open = (index: number, trigger: HTMLElement) => {
    returnFocusRef.current = trigger;
    setOpenIndex(index);
  };

  useEffect(() => {
    if (openIndex === null) return;

    closeRef.current?.focus();

    // The page behind must not scroll away under the opened artwork.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      // Only the close button is focusable inside, so keep Tab on it.
      event.preventDefault();
      closeRef.current?.focus();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close]);

  const active = openIndex === null ? null : artworks[openIndex];

  return (
    <section
      id={id}
      aria-label={label}
      className={cn("relative w-full", className)}
    >
      <ul
        ref={gridRef}
        className="grid grid-cols-2 gap-2 p-2 md:grid-cols-3 md:gap-3 md:p-3"
      >
        {artworks.map((art, index) => (
          <li key={art.slug} data-tile className="will-change-transform">
            <button
              type="button"
              onClick={(event) => open(index, event.currentTarget)}
              aria-haspopup="dialog"
              className="group block w-full cursor-pointer overflow-hidden rounded-sm ring-1 ring-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-amber"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- srcset is driven by the artwork's own renditions */}
              <img
                src={art.src}
                srcSet={art.srcSet}
                sizes="(max-width: 768px) 50vw, 33vw"
                alt={art.alt}
                width={art.width}
                height={art.height}
                loading={index < 4 ? "eager" : "lazy"}
                decoding="async"
                className="block h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10"
        >
          {/* The scrim dims the page behind rather than hiding it. */}
          <button
            type="button"
            aria-label="Ansicht schließen"
            onClick={close}
            className="absolute inset-0 cursor-zoom-out"
            style={{ backgroundColor: `rgba(0, 0, 0, ${LIGHTBOX_SCRIM})` }}
            tabIndex={-1}
          />
          {/*
           * The gap has to clear the caption's ground, not just its type: the
           * gradient reaches 20px above the words, so at the old 12px it lay
           * 16px over the foot of the picture. 36px puts a clear 16px between
           * the two.
           */}
          <figure className="relative flex max-h-full min-h-0 flex-col items-center gap-9">
            {/* eslint-disable-next-line @next/next/no-img-element -- same renditions, shown at display size */}
            <img
              src={active.src}
              srcSet={active.srcSet}
              sizes="92vw"
              alt={active.alt}
              width={active.width}
              height={active.height}
              decoding="async"
              /*
               * Never shown larger than the pixels it actually has. The plates
               * scanned at 3000px and up fill the viewport as before and are
               * untouched by this; the few low-resolution sources stop short
               * instead of being blown up into mush. Smaller and sharp beats
               * bigger and soft, and the cap moves with each artwork's own
               * resolution rather than being a number picked for one of them.
               */
              style={{ maxWidth: active.width, maxHeight: active.height }}
              className="min-h-0 w-auto max-w-full flex-1 rounded-sm object-contain shadow-[0_30px_120px_rgba(0,0,0,0.7)] ring-1 ring-white/15"
            />
            {/*
             * The caption gets its own ground. The scrim dims the page to 30%
             * rather than hiding it, so the caption can land on the running
             * body copy of the panel below — light letters crossing light
             * letters, which no amount of contrast fixes. This darkens just the
             * patch under the caption, as a radial gradient that fades out
             * before its own edge, so nothing reads as a plate stuck on top.
             * `isolate` keeps the negative z-index inside the caption.
             */}
            <figcaption className="text-on-scrim relative isolate shrink-0 text-center">
              <span
                aria-hidden
                // Reaches much further below the caption than above it. Above,
                // anything beyond a little lies over the foot of the picture;
                // below, a three-line caption needs the room, and at an even
                // inset the sheet size ended up on the faded edge.
                className="pointer-events-none absolute -inset-x-14 -top-3 -bottom-10 -z-10"
                style={{
                  // The centre rides above the middle of that taller box, so
                  // the darkest part sits on the type rather than under it.
                  background:
                    "radial-gradient(62% 74% at 50% 42%, rgb(0 0 0 / 0.82) 0%, rgb(0 0 0 / 0.7) 48%, rgb(0 0 0 / 0.34) 76%, transparent 100%)",
                }}
              />
              <span className="block max-w-[34ch] text-balance font-display text-lg text-rose-200 italic md:text-2xl">
                {active.title}
              </span>
              <span className="mt-0.5 block text-xs tracking-[0.18em] text-fg-muted uppercase">
                {active.meta}
              </span>
              {/* Paper and sheet size sit on their own line: set in the same
                  wide-tracked capitals they would run past the picture. */}
              {active.format && (
                <span className="mt-0.5 block text-[0.6875rem] tracking-[0.14em] text-fg-muted/70 uppercase">
                  {active.format}
                </span>
              )}
            </figcaption>
          </figure>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            className="absolute top-4 right-4 z-10 cursor-pointer rounded-full bg-black/50 p-3 text-fg ring-1 ring-white/20 hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber md:top-6 md:right-6"
          >
            <span className="sr-only">Ansicht schließen</span>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
