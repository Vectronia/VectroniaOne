"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";
import type { Artwork } from "@/data/artworks";

gsap.registerPlugin(ScrollTrigger);

/** How far the artwork travels left as the panel enters, in percent of its width. */
const ARTWORK_TRAVEL = 14;

export type IntroPanelProps = {
  /** The same plate the hero shows, so it reads as one continuous object. */
  artwork: Artwork;
  header: string;
  /** One entry per paragraph. */
  body?: string[];
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
export function IntroPanel({ artwork, header, body, id, className }: IntroPanelProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // The plate carries on from where the hero released it, drifting left
      // into place while the text rises on the right.
      gsap.from(figureRef.current, {
        xPercent: ARTWORK_TRAVEL,
        opacity: 0,
        ease: "power3.out",
        duration: 1,
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          once: true,
        },
      });

      gsap.from(textRef.current, {
        y: 28,
        opacity: 0,
        ease: "power2.out",
        duration: 0.9,
        delay: 0.15,
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={id ? `${id}-header` : undefined}
      className={cn("relative w-full overflow-x-clip px-6 py-24 lg:py-32", className)}
    >
      {/*
       * The hero ends on its accent colour while the backdrop below starts on
       * navy. This blends the two rather than leaving a hard edge.
       */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[38vh]"
        style={{
          // Starts at the hero's composited bottom edge — its accent sits under
          // a 30% black wash, so the raw teal would read as a step, not a blend.
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--color-brand-teal) 56%, #000) 0%, color-mix(in srgb, var(--color-brand-teal) 26%, transparent) 45%, transparent 100%)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div ref={figureRef} className="will-change-transform">
          {/* eslint-disable-next-line @next/next/no-img-element -- shares the hero's renditions so the browser reuses the decoded image */}
          <img
            src={artwork.src}
            srcSet={artwork.srcSet}
            sizes="(max-width: 1024px) 88vw, 44vw"
            alt={artwork.alt}
            width={artwork.width}
            height={artwork.height}
            loading="lazy"
            decoding="async"
            className="w-full rounded-[12px] shadow-[0_24px_90px_rgba(0,0,0,0.55)] ring-1 ring-white/10 md:rounded-[16px]"
          />
        </div>

        <div ref={textRef}>
          <h2
            id={id ? `${id}-header` : undefined}
            className="text-metal font-display text-3xl font-semibold text-balance italic md:text-4xl lg:text-5xl"
          >
            {header}
          </h2>
          {body?.map((paragraph) => (
            <p key={paragraph} className="body-copy mt-6 max-w-[62ch] text-fg-muted">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
