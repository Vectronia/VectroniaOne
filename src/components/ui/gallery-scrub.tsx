"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";
import type { Artwork } from "@/data/artworks";

gsap.registerPlugin(ScrollTrigger);

/** Scroll track spent on each plate, as a share of the viewport height. */
const PLATE_VH = 0.55;
/** Plates kept mounted around the active one. Keeps 14 large images off the wire. */
const WINDOW = 2;

export type GalleryScrubProps = {
  heading: string;
  intro?: string;
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

function plateSize(aspect: number) {
  return {
    width: `min(92vw, calc(58svh * ${aspect}))`,
    height: `min(58svh, 92vw / ${aspect})`,
    aspectRatio: aspect,
  };
}

/**
 * Scroll-driven plate gallery.
 *
 * Every artwork stays in the DOM as a `<figure>` with its caption, so the
 * reading order is complete for assistive tech even though only one plate is
 * visible at a time. Under reduced motion the whole thing renders as an
 * ordinary grid — same content, no scroll dependency.
 */
export function GalleryScrub({ heading, intro, artworks, id, className }: GalleryScrubProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const plateRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const reduced = usePrefersReducedMotion();
  const count = artworks.length;

  useEffect(() => {
    if (reduced || count === 0) return;
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const plates = plateRefs.current.slice(0, count).filter(Boolean) as HTMLElement[];
      if (plates.length !== count) return;

      gsap.set(plates, { opacity: 0, scale: 1.04 });
      gsap.set(plates[0], { opacity: 1, scale: 1 });

      const slot = 1 / count;
      const fade = slot * 0.6;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const index = Math.min(count - 1, Math.max(0, Math.floor(self.progress * count)));
            setActive((current) => (current === index ? current : index));
          },
        },
      });

      for (let i = 0; i < count - 1; i++) {
        const at = (i + 1) * slot - fade / 2;
        tl.to(plates[i], { opacity: 0, scale: 0.97, ease: "power1.inOut", duration: fade }, at);
        tl.fromTo(
          plates[i + 1],
          { opacity: 0, scale: 1.04 },
          { opacity: 1, scale: 1, ease: "power1.inOut", duration: fade },
          at,
        );
      }

      ScrollTrigger.refresh();
    }, sectionRef);

    return () => ctx.revert();
  }, [reduced, count]);

  const current = artworks[active];

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-label={heading}
      className={cn(
        "relative w-full bg-[image:var(--gradient-page)]",
        "h-[var(--gallery-track)] motion-reduce:h-auto",
        className,
      )}
      style={
        {
          "--gallery-track": `${count * PLATE_VH * 100 + 100}vh`,
        } as React.CSSProperties
      }
    >
      {/* ---- Reduced motion: an ordinary grid, no scroll choreography ---- */}
      <div className="hidden px-6 py-24 motion-reduce:block">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-metal font-display text-4xl font-semibold italic md:text-6xl">
            {heading}
          </h2>
          {intro && <p className="mt-4 max-w-[60ch] text-fg-muted">{intro}</p>}
          <ul className="mt-12 grid gap-12 sm:grid-cols-2">
            {artworks.map((art) => (
              <li key={art.slug}>
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element -- fixed art direction, no layout-dependent sizing */}
                  <img
                    src={art.src}
                    srcSet={art.srcSet}
                    sizes="(max-width: 640px) 92vw, 46vw"
                    alt=""
                    width={art.width}
                    height={art.height}
                    loading="lazy"
                    decoding="async"
                    className="w-full rounded-xl ring-1 ring-white/10"
                  />
                  <figcaption className="mt-3">
                    <span className="font-display text-xl italic text-rose-200">{art.title}</span>
                    <span className="mt-1 block text-sm text-fg-muted">{art.meta}</span>
                    <span className="mt-2 block text-sm text-fg-muted">{art.alt}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---- Motion: stacked plates driven by scroll ---- */}
      <div className="sticky top-0 flex h-[100svh] w-full flex-col items-center justify-center overflow-hidden motion-reduce:hidden">
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 60%)",
          }}
        />

        <header className="absolute top-8 left-1/2 z-20 w-full -translate-x-1/2 px-6 text-center md:top-10">
          <h2 className="text-metal font-display text-2xl font-semibold italic md:text-4xl">
            {heading}
          </h2>
          {intro && (
            <p className="mx-auto mt-2 max-w-[52ch] text-sm text-fg-muted md:text-base">{intro}</p>
          )}
        </header>

        <div className="relative z-10 flex items-center justify-center">
          {artworks.map((art, index) => {
            const mounted = Math.abs(index - active) <= WINDOW;
            return (
              <figure
                key={art.slug}
                ref={(node) => {
                  plateRefs.current[index] = node;
                }}
                className="absolute overflow-hidden rounded-[12px] shadow-[0_24px_90px_rgba(0,0,0,0.6)] ring-1 ring-white/10 will-change-[transform,opacity] md:rounded-[16px]"
                style={plateSize(art.aspect)}
              >
                {mounted && (
                  // eslint-disable-next-line @next/next/no-img-element -- sized from the artwork's own aspect, not a fixed layout
                  <img
                    src={art.src}
                    srcSet={art.srcSet}
                    sizes="(max-width: 768px) 92vw, min(92vw, 103svh)"
                    alt=""
                    width={art.width}
                    height={art.height}
                    fetchPriority={index === 0 ? "high" : "low"}
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                )}
                {/* Carries the description for assistive tech; the images are alt="" so it is not read twice. */}
                <figcaption className="sr-only">
                  {art.title}. {art.meta}. {art.alt}
                </figcaption>
              </figure>
            );
          })}
        </div>

        {/* Live caption for the plate currently on screen. */}
        <div className="absolute right-0 bottom-14 left-0 z-20 px-6 text-center md:bottom-16">
          <p
            key={current?.slug}
            className="font-display text-xl text-rose-200 italic md:text-3xl"
          >
            {current?.title}
          </p>
          <p className="mt-1 text-xs tracking-[0.2em] text-fg-muted uppercase md:text-sm">
            {current?.meta}
          </p>
        </div>

        {/* Progress: scroll-driven sections need to show how far along they are. */}
        <div className="absolute right-6 bottom-6 left-6 z-20 flex items-center gap-4">
          <span className="font-body text-xs tabular-nums text-fg-muted">
            {String(active + 1).padStart(2, "0")}
          </span>
          <div className="h-px flex-1 bg-white/15">
            <div
              className="h-px bg-brand-amber transition-[width] duration-300 ease-out"
              style={{ width: `${((active + 1) / Math.max(count, 1)) * 100}%` }}
            />
          </div>
          <span className="font-body text-xs tabular-nums text-fg-muted">
            {String(count).padStart(2, "0")}
          </span>
        </div>
      </div>
    </section>
  );
}
