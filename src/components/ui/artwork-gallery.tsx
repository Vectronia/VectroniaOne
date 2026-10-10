"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { Artwork } from "@/data/artworks";

export type ArtworkGalleryProps = {
  /** Names the region; the gallery carries no visible heading. */
  label: string;
  /** Shown in this order, first to last. */
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

function Arrow({ back }: { back?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={back ? "rotate-180" : undefined}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/**
 * One drawing at a time, large, with the rest of the set below it.
 *
 * It has a first and a last rather than looping: the order is the one the
 * works were arranged in, and a reader who steps to the end should be told
 * they are at the end instead of being handed the beginning again. So the
 * arrows disable rather than wrap, and a count says where in the set you are.
 *
 * The strip below is dimmed so the stage stays the thing being looked at; the
 * current one is the only one at full strength, which is also what marks it.
 */
export function ArtworkGallery({ label, artworks, id, className }: ArtworkGalleryProps) {
  const [index, setIndex] = useState(0);
  const stripRef = useRef<HTMLUListElement>(null);
  const thumbRefs = useRef<(HTMLLIElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();

  const last = artworks.length - 1;
  const active = artworks[index];
  const atStart = index === 0;
  const atEnd = index === last;

  const go = useCallback(
    (next: number) => setIndex(Math.min(last, Math.max(0, next))),
    [last],
  );

  /*
   * The neighbours are fetched as soon as one is shown, so stepping does not
   * start with an empty stage. The browser reuses whatever the srcset picks,
   * which is the same rendition the stage will ask for.
   */
  useEffect(() => {
    for (const neighbour of [artworks[index - 1], artworks[index + 1]]) {
      if (!neighbour) continue;
      const preload = new globalThis.Image();
      if (neighbour.srcSet) preload.srcset = neighbour.srcSet;
      preload.sizes = "(max-width: 1024px) 92vw, 64rem";
      preload.src = neighbour.src;
    }
  }, [index, artworks]);

  /*
   * The current thumbnail is brought to the middle of the strip.
   *
   * `scrollTo` on the strip rather than `scrollIntoView` on the thumbnail:
   * the latter may scroll the page as well as the strip, which on a phone
   * moves the stage out from under the reader mid-step.
   */
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = thumbRefs.current[index];
    if (!strip || !thumb) return;
    strip.scrollTo({
      left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [index, reduced]);

  // Arrow keys work wherever the focus sits inside the gallery, because the
  // event bubbles here from whichever button holds it.
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  };

  const step =
    "flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-fg ring-1 ring-white/15 transition-[background-color,opacity,color] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-amber disabled:cursor-default disabled:text-fg-muted/35 disabled:ring-white/8 disabled:hover:bg-transparent motion-reduce:transition-none";

  // Lying over the drawing they need a ground of their own — a drawing can be
  // white paper right where the arrow sits.
  const overlaid =
    "absolute z-10 bg-black/55 backdrop-blur-[2px] disabled:bg-black/30 md:static md:bg-transparent md:backdrop-blur-none md:disabled:bg-transparent";

  return (
    <section
      id={id}
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("relative w-full px-6 py-20 lg:py-24", className)}
    >
      <div className="mx-auto max-w-6xl">
        {/*
         * The arrows flank the stage where there is room and lie over its
         * edges where there is not. Kept outside on a phone they took 112 of
         * 342 points of width, and since every sheet here is landscape the
         * width is what sets the size: the drawing came out 214px wide with
         * 198px of empty stage under it.
         */}
        <div className="relative flex items-center md:gap-8">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={atStart}
            aria-label="Vorheriges Werk"
            className={cn(step, overlaid, "left-0")}
          >
            <Arrow back />
          </button>

          {/*
           * A stage of fixed height, with the drawing fitted inside it rather
           * than filling it. The sheets differ in proportion — a 10x15 sketch
           * next to an A3 plate — and a stage that took each one's own height
           * would jump by hundreds of pixels at every step, carrying the
           * caption and the strip with it.
           */}
          <div className="flex aspect-[4/3] min-w-0 flex-1 items-center justify-center md:aspect-auto md:h-[clamp(20rem,52svh,34rem)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- its own renditions, shown at display size */}
            <img
              key={active.slug}
              src={active.src}
              srcSet={active.srcSet}
              sizes="(max-width: 1024px) 92vw, 64rem"
              alt={active.alt}
              width={active.width}
              height={active.height}
              decoding="async"
              /*
               * Two limits in one declaration: the stage, and the drawing's
               * own pixels. Most plates were scanned at 3000px and up and fill
               * the stage; the few low resolution sources stop short instead
               * of being blown up into mush.
               *
               * They have to share a declaration because an inline style beats
               * a class. Written as `max-h-full` in the class list and the cap
               * here, the cap won and the drawing overflowed the stage — at
               * 1440 it stood 722px tall in a 468px box and printed the
               * caption across its own lower edge.
               */
              style={{
                maxWidth: `min(100%, ${active.width}px)`,
                maxHeight: `min(100%, ${active.height}px)`,
              }}
              className="w-auto rounded-sm object-contain shadow-[0_30px_90px_rgba(0,0,0,0.6)] ring-1 ring-white/12"
            />
          </div>

          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={atEnd}
            aria-label="Nächstes Werk"
            className={cn(step, overlaid, "right-0")}
          >
            <Arrow />
          </button>
        </div>

        {/*
         * Announced politely: stepping changes the picture, and without this a
         * reader who cannot see it is told nothing at all.
         */}
        <figcaption aria-live="polite" className="mt-8 text-center">
          <span className="block font-display text-xl text-rose-200 italic md:text-2xl">
            {active.title}
          </span>
          <span className="mt-1 block text-xs tracking-[0.18em] text-fg-muted uppercase">
            {active.meta}
          </span>
          {active.format && (
            <span className="mt-1 block text-[0.6875rem] tracking-[0.14em] text-fg-muted/70 uppercase">
              {active.format}
            </span>
          )}
          <span className="mt-4 block text-xs tracking-[0.18em] text-fg-muted/60 tabular-nums">
            {index + 1} / {artworks.length}
          </span>
        </figcaption>

        {/*
         * The rest of the set. It scrolls sideways rather than wrapping into
         * rows: a strip that keeps its height is a strip the stage above does
         * not have to move for.
         */}
        <ul
          ref={stripRef}
          className="strip-scroll relative mt-10 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-4 md:gap-3"
        >
          {artworks.map((art, i) => (
            <li
              key={art.slug}
              ref={(node) => {
                thumbRefs.current[i] = node;
              }}
              className="shrink-0 snap-center"
            >
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={i === index}
                aria-label={`${art.title} anzeigen`}
                className={cn(
                  "block h-20 w-28 cursor-pointer overflow-hidden rounded-sm ring-1 transition-[opacity,filter] duration-300 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-amber md:h-24 md:w-32 motion-reduce:transition-none",
                  i === index
                    ? "opacity-100 ring-brand-amber/70"
                    : // Dimmed rather than greyed: the colour plates are part
                      // of what tells them apart at this size, so taking the
                      // light down keeps them recognisable where taking the
                      // colour out would not.
                      "opacity-45 brightness-75 ring-white/10 hover:opacity-80 hover:brightness-100",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- its own renditions, shown small */}
                <img
                  src={art.src}
                  srcSet={art.srcSet}
                  sizes="128px"
                  alt=""
                  width={art.width}
                  height={art.height}
                  loading={i < 6 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
