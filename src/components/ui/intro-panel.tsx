"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";
import type { Artwork } from "@/data/artworks";

gsap.registerPlugin(ScrollTrigger);

/** How far the artwork travels left as the panel enters, in percent of its width. */
const ARTWORK_TRAVEL = 14;

/**
 * The squarest a photograph beside the copy may be cropped.
 *
 * The picture is meant to span the text, first line to last, and it does that
 * by filling the column and cropping. Beside a long text that column is far
 * taller than any photograph's own proportions, and filling it crops a
 * landscape picture into a portrait one: the Opel came out at 0.63 against the
 * file's 1.50 — 58% of the frame gone, the car cut in half and the plate with
 * it. The process photograph was already at 0.87 by 1024px wide.
 *
 * 1.15 is where the process photograph sits at 1440, which reads as a crop
 * rather than as a different picture, so it is the measured edge of what the
 * rule can take. Past that the picture keeps its shape and the column simply
 * runs on under it: the rule gives up its second half, the picture still
 * starts on the first line of text.
 */
const SQUAREST = 1.15;

export type IntroPanelProps = {
  /**
   * The picture beside the copy. Pass several and they stack in the same
   * column, sharing its height — the first still starts on the first line of
   * text and the last still finishes on the last.
   */
  artwork: Artwork | Artwork[];
  header: string;
  /** One entry per paragraph. A paragraph may carry a link or other markup. */
  body?: React.ReactNode[];
  /**
   * Mirrors the panel: copy on the left, picture on the right. The ranged edge
   * of the type follows, so it still meets the picture rather than turning its
   * back on it.
   */
  reversed?: boolean;
  /** Rendered under the copy — the contact panel puts its form here. */
  children?: React.ReactNode;
  /**
   * For artwork that is cut out rather than photographed: no frame, and free
   * to run wider than its column. A card around a cut-out would put back the
   * sheet edge it was cut from.
   */
  bare?: boolean;
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
 * The panel the hero hands off to: the artwork settles on the left, the text
 * sits right with room around it, over the page's static backdrop.
 *
 * The section clips horizontally: the entry tween parks the artwork at
 * `ARTWORK_TRAVEL` percent to the right until its trigger fires, which on a
 * narrow viewport is wide enough to open a horizontal scrollbar.
 */
export function IntroPanel({
  artwork,
  header,
  body,
  reversed,
  children,
  bare,
  id,
  className,
}: IntroPanelProps) {
  const pictures = Array.isArray(artwork) ? artwork : [artwork];
  const sectionRef = useRef<HTMLElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    if (!section) return;

    let io: IntersectionObserver | null = null;

    const ctx = gsap.context(() => {
      // The plate carries on from where the hero released it, drifting left
      // into place while the copy fades up beside it.
      //
      // An IntersectionObserver drives this rather than a ScrollTrigger: the
      // trigger's cached start position was stale on first load and left the
      // whole panel at opacity 0 for seconds after it had entered the viewport.
      gsap.set(figureRef.current, { xPercent: reversed ? -ARTWORK_TRAVEL : ARTWORK_TRAVEL, opacity: 0 });
      // Opacity only for the copy — any vertical offset here would break its
      // alignment with the artwork for as long as the tween runs.
      gsap.set(textRef.current, { opacity: 0 });

      io = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return;
          io?.disconnect();
          gsap.to(figureRef.current, {
            xPercent: 0,
            opacity: 1,
            ease: "power3.out",
            duration: 1,
          });
          gsap.to(textRef.current, {
            opacity: 1,
            ease: "power2.out",
            duration: 0.9,
            delay: 0.15,
          });
        },
        { rootMargin: "0px 0px -12% 0px" },
      );
      io.observe(section);
    }, sectionRef);

    return () => {
      io?.disconnect();
      ctx.revert();
    };
  }, [reduced, reversed]);

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={id ? `${id}-header` : undefined}
      className={cn("relative w-full overflow-x-clip px-6 py-24 lg:py-32", className)}
    >
      {/*
       * Two rows on wide viewports: the heading sits alone above, and the
       * artwork shares the lower row with the body copy so the two stretch to
       * the same height — the picture then starts on the first line of text and
       * finishes on the last.
       */}
      <div
        className={cn(
          "relative mx-auto grid max-w-6xl gap-y-10 lg:items-stretch lg:gap-x-16 lg:gap-y-12",
          reversed ? "lg:grid-cols-[1.15fr_0.85fr]" : "lg:grid-cols-[0.85fr_1.15fr]",
        )}
      >
        <div className={cn("lg:row-start-1", reversed ? "lg:col-start-1" : "lg:col-start-2")}>
          <h2
            id={id ? `${id}-header` : undefined}
            className={cn(
              "text-metal font-display text-3xl font-semibold text-balance italic text-center md:text-4xl lg:text-5xl",
              reversed ? "lg:text-left" : "lg:text-right",
            )}
          >
            {header}
          </h2>
        </div>

        {/*
         * The pictures are lifted out of the flow on wide viewports: the column
         * keeps its grid cell but contributes no height, so the row is measured
         * from the copy alone and the stack fills exactly that. Left in the
         * flow they would set the row height themselves whenever they came out
         * taller than the text — which is what pushed the last picture 27px
         * past the last line at 1440.
         */}
        <div
          ref={figureRef}
          className={cn(
            "will-change-transform lg:relative lg:row-start-2",
            reversed ? "lg:col-start-2" : "lg:col-start-1",
          )}
        >
          <div
            className={cn(
              "flex flex-col gap-6 lg:absolute lg:inset-0",
              // With several pictures the slack goes between them, so the first
              // still starts on the first line and the last ends on the last.
              // A single one has nowhere to put it and stays at the top.
              pictures.length > 1 && "lg:justify-between",
            )}
          >
            {pictures.map((picture) => (
              // eslint-disable-next-line @next/next/no-img-element -- shares the hero's renditions so the browser reuses the decoded image
              <img
                key={picture.slug}
                src={picture.src}
                srcSet={picture.srcSet}
                sizes="(max-width: 1024px) 88vw, 44vw"
                alt={picture.alt}
                width={picture.width}
                height={picture.height}
                loading="lazy"
                decoding="async"
                // Beside the copy the picture takes the column's width and as
                // much of its height as it is allowed: `aspect-[1.15]` sets
                // the squarest crop (see SQUAREST), `max-h-full` stops it
                // where the column ends, and whichever comes first wins. So a
                // short text crops the picture and a long one leaves it alone
                // rather than wringing it out.
                //
                // `min-h-0` lets a flex child fall below its intrinsic height
                // at all. Below lg the picture is above the text, not beside
                // it, and simply keeps its own proportions.
                className={cn(
                  "w-full lg:min-h-0 lg:w-full",
                  !bare && "lg:aspect-[var(--squarest)] lg:h-auto lg:max-h-full",
                  bare
                    ? // A drop shadow follows the silhouette; a box shadow
                      // would draw the rectangle that is not there.
                      "object-contain drop-shadow-[0_22px_44px_rgba(0,0,0,0.6)] lg:max-w-none"
                    : "rounded-[12px] object-cover shadow-[0_24px_90px_rgba(0,0,0,0.55)] ring-1 ring-white/10 md:rounded-[16px]",
                )}
                /*
                 * A cut-out runs wider than its column, but only as far as the
                 * page has room beside it. A flat 126% put the lead car's nose
                 * through the window edge from 1280px down, where the centred
                 * container already ends at the page margin. This spends what
                 * the container leaves, less a margin, and nothing when there
                 * is none.
                 */
                style={
                  bare
                    ? { width: "min(126%, 100% + max(0px, (100vw - 72rem) / 2 - 1rem))" }
                    : ({ "--squarest": SQUAREST } as React.CSSProperties)
                }
              />
            ))}
          </div>
        </div>

        <div
          ref={textRef}
          className={cn(
            "text-box-trim lg:row-start-2",
            reversed ? "lg:col-start-1" : "lg:col-start-2",
          )}
        >
          {body?.map((paragraph, index) => (
            <p
              // The paragraphs are fixed content in source order, so the index
              // is a stable identity; a paragraph carrying markup has no
              // string to key on.
              key={index}
              className={cn(
                "body-copy max-w-[62ch] text-fg-muted",
                index > 0 && "mt-6",
                // Justified copy flushes every line but the last; that one goes
                // to whichever side the picture is on — but only once there is
                // a side. Below lg the text stands under the picture and the
                // last line centres with the heading.
                reversed && "lg:[text-align-last:left]",
              )}
            >
              {paragraph}
            </p>
          ))}
          {children && <div className="mt-10">{children}</div>}
        </div>
      </div>
    </section>
  );
}
