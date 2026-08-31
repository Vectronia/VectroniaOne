"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

/** Height of the scroll track, in viewport heights. */
const TRACK_VH = 3.6;
/** Card height as a share of the viewport once the car has landed. */
const CARD_VH = 0.52;
const IMMERSE_OVERFILL = 1.04;
/** Progress at which the car has finished landing in the photo. */
const LANDED_AT = 0.2;
/** Progress at which the immersion ends and the release begins. */
const RELEASE_AT = 0.8;

/**
 * How the cut-out is treated while it floats on the dark ground.
 *
 * Taken from the supplied heroStart.psd, whose brightness/contrast layer sits
 * at -70/0 over the car. Fitting that against the flattened file gives
 * brightness(0.685) to within 3.2/255, and no contrast or saturation change.
 * Animated to neutral as the car settles into the photograph.
 */
const ON_DARK = { brightness: 0.685, contrast: 1, saturate: 1 };
const IN_PHOTO = { brightness: 1, contrast: 1, saturate: 1 };

export type HeroStageProps = {
  /** The cut-out artwork that travels from the dark ground into the photo. */
  cutoutSrc: string;
  cutoutSrcSet?: string;
  /** The framed photograph the cut-out lands in. */
  posterSrc: string;
  posterSrcSet?: string;
  /** Describes the artwork — this is the section's content, not decoration. */
  artworkAlt: string;
  /** Accessible heading; the visible brand marks are artwork. */
  heading: string;
  /** Brand mark, shown large and bleeding off the left edge. */
  logo: React.ReactNode;
  /** Wordmark, shown along the lower edge. */
  wordmark: React.ReactNode;
  id?: string;
  accentHex?: string;
  aspect?: number;
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
 * The opening act.
 *
 * At rest: the mark stands large against the left edge, the cut-out artwork
 * floats on the dark ground, and the wordmark runs along the bottom. Scrolling
 * clears the marks to either side and carries the cut-out into the framed
 * photograph, where its treatment resolves to the photograph's own.
 */
export function HeroStage({
  cutoutSrc,
  cutoutSrcSet,
  posterSrc,
  posterSrcSet,
  artworkAlt,
  heading,
  logo,
  wordmark,
  id,
  accentHex = "#11383b",
  aspect = 16 / 9,
  className,
}: HeroStageProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const car = carRef.current;
    if (!section || !car) return;

    const ctx = gsap.context(() => {
      const startScale = () => (window.innerWidth < 768 ? 1 : 1.18);
      const immerseScale = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const baseW = Math.min(vw * 0.96, vh * CARD_VH * aspect);
        const baseH = Math.min(vh * CARD_VH, (vw * 0.96) / aspect);
        if (baseW <= 0 || baseH <= 0) return 1.5;
        return Math.max(vw / baseW, vh / baseH) * IMMERSE_OVERFILL;
      };

      // The cut-out's treatment is tweened through a proxy: `filter` is a
      // string, so GSAP cannot interpolate it directly.
      const tone = { ...ON_DARK };
      const applyTone = () => {
        car.style.filter = `brightness(${tone.brightness}) contrast(${tone.contrast}) saturate(${tone.saturate})`;
      };
      applyTone();

      gsap.set(car, { xPercent: 14, yPercent: -4, scale: startScale() });
      gsap.set(cardRef.current, { scale: 1, transformOrigin: "50% 50%" });
      gsap.set(posterRef.current, { opacity: 0 });

      const master = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
      });

      // 1 — the marks clear the stage and the car settles into the photograph.
      master.to(logoRef.current, { xPercent: -140, ease: "power2.in", duration: LANDED_AT }, 0);
      master.to(wordRef.current, { xPercent: 140, ease: "power2.in", duration: LANDED_AT }, 0);
      master.to(cueRef.current, { opacity: 0, ease: "power1.in", duration: 0.06 }, 0);
      master.to(
        car,
        { xPercent: 0, yPercent: 0, scale: 1, ease: "power2.inOut", duration: LANDED_AT },
        0,
      );
      master.to(
        tone,
        {
          ...IN_PHOTO,
          ease: "power1.inOut",
          duration: LANDED_AT,
          onUpdate: applyTone,
        },
        0,
      );
      master.to(
        posterRef.current,
        { opacity: 1, ease: "power1.inOut", duration: LANDED_AT * 0.8 },
        LANDED_AT * 0.2,
      );

      // 2 — immersion.
      master.to(
        cardRef.current,
        { scale: () => immerseScale(), ease: "power2.in", duration: RELEASE_AT - LANDED_AT },
        LANDED_AT,
      );

      // 3 — release.
      master.to(
        cardRef.current,
        { scale: 1, ease: "power3.inOut", duration: 1 - RELEASE_AT },
        RELEASE_AT,
      );

      ScrollTrigger.refresh();
    }, sectionRef);

    return () => ctx.revert();
  }, [reduced, aspect]);

  return (
    <section
      ref={sectionRef}
      id={id}
      className={cn(
        "relative w-full overflow-clip text-white",
        "h-[var(--hero-track)] motion-reduce:h-[100svh]",
        className,
      )}
      style={{ "--hero-track": `${TRACK_VH * 100}vh` } as React.CSSProperties}
    >
      <h1 className="sr-only">{heading}</h1>

      <div className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden">
        <div aria-hidden className="absolute inset-0 z-0" style={{ backgroundColor: accentHex }} />
        <div aria-hidden className="absolute inset-0 z-0 bg-black/35" />
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 42% 40%, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0) 58%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        {/* Full-height mark against the left edge; the crop is intended. */}
        <div
          ref={logoRef}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-0 z-10 -translate-x-[32%] -translate-y-1/2 will-change-transform"
        >
          {logo}
        </div>

        {/* The photograph the cut-out lands in, and the cut-out itself. */}
        <div
          ref={cardRef}
          className="relative z-20 will-change-transform"
          style={{
            width: `min(96vw, calc(${CARD_VH * 100}svh * ${aspect}))`,
            height: `min(${CARD_VH * 100}svh, 96vw / ${aspect})`,
            aspectRatio: aspect,
          }}
        >
          <div
            ref={posterRef}
            aria-hidden
            className="absolute inset-0 overflow-hidden rounded-[12px] shadow-[0_20px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10 md:rounded-[16px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed art direction */}
            <img
              src={posterSrc}
              srcSet={posterSrcSet}
              sizes="(max-width: 768px) 96vw, min(96vw, 92svh)"
              alt=""
              width={1600}
              height={900}
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>

          <div ref={carRef} className="absolute inset-0 z-10 will-change-[transform,filter]">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed art direction */}
            <img
              src={cutoutSrc}
              srcSet={cutoutSrcSet}
              sizes="(max-width: 768px) 96vw, min(96vw, 92svh)"
              alt={artworkAlt}
              width={1600}
              height={1030}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* The wordmark runs along the lower edge. */}
        <div
          ref={wordRef}
          aria-hidden
          className="pointer-events-none absolute right-0 bottom-[8vh] left-0 z-10 flex justify-center will-change-transform md:justify-end md:pr-[6vw]"
        >
          {wordmark}
        </div>

        <div
          ref={cueRef}
          aria-hidden
          className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-fg-muted motion-reduce:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 4v15M6 13l6 6 6-6" />
          </svg>
        </div>
      </div>
    </section>
  );
}
