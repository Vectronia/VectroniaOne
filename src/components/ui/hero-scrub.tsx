"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const PIN_VH_MULTIPLE = 3.2;
const IMMERSE_OVERFILL = 1.04;
const ENTRY_DELAY = 0.2;
const CARD_START_SCALE_DESKTOP = 0.6;
const CARD_START_SCALE_MOBILE = 0.82;
/** Counter-zoom applied to the media while the card grows, for depth. */
const MEDIA_PARALLAX_SCALE = 1.12;
/**
 * Card height as a share of the viewport. The card keeps its full layout box
 * even while scaled down, so this has to leave room for the wordmark and the
 * oversized mark below it; too large a share clips the lower slot.
 */
const CARD_VH = 0.52;

export type HeroScrubProps = {
  /** Always-rendered still. Doubles as the poster, the reduced-motion state and the frame-load fallback. */
  posterSrc: string;
  /** Describes the artwork itself — this is content, not decoration. */
  posterAlt: string;
  posterSrcSet?: string;
  posterSizes?: string;
  /** Accessible heading for the section. Rendered for assistive tech even though the visible words are decorative. */
  heading: string;
  /** Rendered as artwork, not read out: pass a string or a brand image. */
  titleTop: React.ReactNode;
  titleBottom: React.ReactNode;
  /** Optional canvas frame sequence. Omit both to run the choreography on the still alone. */
  frameCount?: number;
  frameUrl?: (index: number) => string;
  className?: string;
  titleTopClassName?: string;
  titleBottomClassName?: string;
  /**
   * Resting x-offset of the lower title, e.g. "14vw" to let an oversized mark
   * overhang the right edge. The parting tween pulls it to 0 first, so the mark
   * is briefly seen whole before it wipes off-screen.
   */
  titleBottomRestX?: string;
  accentHex?: string;
  defaultAspect?: number;
  children?: React.ReactNode;
};

function usePrefersReducedMotion() {
  // Assume "reduce" until the media query has been read, so the first paint is
  // never the motion-heavy variant for someone who asked for less motion.
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

export function HeroScrub({
  posterSrc,
  posterAlt,
  posterSrcSet,
  posterSizes,
  heading,
  titleTop,
  titleBottom,
  frameCount = 0,
  frameUrl,
  className,
  titleTopClassName,
  titleBottomClassName,
  titleBottomRestX = "0",
  accentHex = "#11383b",
  defaultAspect = 16 / 9,
  children,
}: HeroScrubProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastDrawnRef = useRef<number>(-1);
  const bgRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const titleTopRef = useRef<HTMLSpanElement>(null);
  const titleBottomRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  // Holding the generator in a ref keeps an inline arrow prop from restarting
  // the whole sequence download on every render.
  const frameUrlRef = useRef(frameUrl);
  useEffect(() => {
    frameUrlRef.current = frameUrl;
  }, [frameUrl]);

  const [posterReady, setPosterReady] = useState(false);
  const [framesReady, setFramesReady] = useState(false);
  const [aspect, setAspect] = useState<number>(defaultAspect);
  const reduced = usePrefersReducedMotion();

  const wantsFrames = frameCount > 0 && !!frameUrl && !reduced;

  // --- Poster ---------------------------------------------------------
  // The poster is server-rendered, so it is often already decoded by the time
  // React hydrates and `onLoad` never fires. Without this check `posterReady`
  // would stay false and the scroll choreography would never be built.
  const adoptPoster = (img: HTMLImageElement | null) => {
    if (!img) return;
    if (img.naturalWidth && img.naturalHeight) {
      setAspect(img.naturalWidth / img.naturalHeight);
    }
    setPosterReady(true);
  };

  useEffect(() => {
    const img = posterRef.current;
    // Mount-only: any later load is covered by the onLoad handler.
    if (img?.complete) adoptPoster(img);
  }, []);

  // --- Frame sequence -------------------------------------------------
  useEffect(() => {
    if (!wantsFrames) return;
    const url = frameUrlRef.current;
    if (!url) return;

    let cancelled = false;
    let errored = 0;
    const images: HTMLImageElement[] = new Array(frameCount);
    imagesRef.current = images;

    const onFirstReady = (img: HTMLImageElement) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (canvas && img.naturalWidth && img.naturalHeight) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")?.drawImage(img, 0, 0);
        lastDrawnRef.current = 0;
        setAspect(img.naturalWidth / img.naturalHeight);
        setFramesReady(true);
      }
    };

    const onErr = () => {
      errored++;
      // Enough failures to mean the sequence is unusable: stay on the poster.
      if (!cancelled && errored >= 5) setFramesReady(false);
    };

    const loadOne = (i: number) => {
      const img = new window.Image();
      img.decoding = "async";
      if (i < 4) {
        (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "high";
      }
      img.onerror = onErr;
      if (i === 0) img.onload = () => onFirstReady(img);
      img.src = url(i);
      images[i] = img;
    };

    const INITIAL = Math.min(20, frameCount);
    for (let i = 0; i < INITIAL; i++) loadOne(i);

    const BATCH = 20;
    let cursor = INITIAL;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const loadNext = () => {
      if (cancelled) return;
      const end = Math.min(frameCount, cursor + BATCH);
      for (let i = cursor; i < end; i++) loadOne(i);
      cursor = end;
      if (cursor < frameCount) timer = setTimeout(loadNext, 80);
    };
    timer = setTimeout(loadNext, 200);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      imagesRef.current = [];
      lastDrawnRef.current = -1;
    };
  }, [wantsFrames, frameCount]);

  // --- Entry animation -------------------------------------------------
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: ENTRY_DELAY });
      tl.from(bgRef.current, { opacity: 0, duration: 1.4, ease: "power2.out" });
      tl.from(cardRef.current, { opacity: 0, duration: 1.1, ease: "power3.out" }, 0.35);
      tl.from(titleTopRef.current, { opacity: 0, y: 30, duration: 1, ease: "expo.out" }, 0.5);
      tl.from(titleBottomRef.current, { opacity: 0, y: -30, duration: 1, ease: "expo.out" }, 0.62);
      tl.from(cueRef.current, { opacity: 0, duration: 0.8, ease: "power2.out" }, 1.1);
    }, sectionRef);
    return () => ctx.revert();
  }, [reduced]);

  // --- Scroll choreography ---------------------------------------------
  // A tall section with an inner sticky child reproduces a ScrollTrigger pin
  // without the layout side effects of pinning.
  useEffect(() => {
    if (reduced || !posterReady) return;
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const startScale = () =>
        window.innerWidth < 768 ? CARD_START_SCALE_MOBILE : CARD_START_SCALE_DESKTOP;

      const immerseScale = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const baseW = Math.min(vw * 0.96, vh * CARD_VH * aspect);
        const baseH = Math.min(vh * CARD_VH, (vw * 0.96) / aspect);
        if (baseW <= 0 || baseH <= 0) return 1.5;
        return Math.max(vw / baseW, vh / baseH) * IMMERSE_OVERFILL;
      };

      const isLoaded = (i: number) => {
        const img = imagesRef.current[i];
        return !!img && img.complete && img.naturalWidth > 0;
      };

      // Nearest already-decoded frame, so scrubbing ahead of the download
      // holds the last good image instead of flashing blank.
      const drawFrame = (index: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !imagesRef.current.length) return;
        let useIdx = index;
        if (!isLoaded(useIdx)) {
          let found = -1;
          for (let d = 1; d < frameCount; d++) {
            if (useIdx - d >= 0 && isLoaded(useIdx - d)) {
              found = useIdx - d;
              break;
            }
            if (useIdx + d < frameCount && isLoaded(useIdx + d)) {
              found = useIdx + d;
              break;
            }
          }
          if (found === -1) return;
          useIdx = found;
        }
        if (lastDrawnRef.current === useIdx) return;
        const img = imagesRef.current[useIdx];
        const c2d = canvas.getContext("2d");
        if (!c2d || !img) return;
        c2d.drawImage(img, 0, 0, canvas.width, canvas.height);
        lastDrawnRef.current = useIdx;
      };

      gsap.set(cardRef.current, { scale: startScale(), transformOrigin: "50% 50%" });
      gsap.set(titleBottomRef.current, { x: titleBottomRestX });

      const master = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
          invalidateOnRefresh: true,
          onUpdate: frameCount
            ? (self) => {
                const mapped = gsap.utils.clamp(0, 1, (self.progress - 0.15) / 0.63);
                drawFrame(Math.min(frameCount - 1, Math.floor(mapped * frameCount)));
              }
            : undefined,
        },
      });

      // Phase 1 — settle to rest, titles part to the sides.
      master.to(cardRef.current, { scale: 1, ease: "power2.out", duration: 0.15 }, 0);
      master.to(cueRef.current, { opacity: 0, ease: "power1.in", duration: 0.08 }, 0);
      master.to(
        titleTopRef.current,
        {
          x: () => (window.innerWidth < 768 ? "-70vw" : "-60vw"),
          ease: "power2.inOut",
          duration: 0.15,
        },
        0,
      );
      // Two stages: first slide the mark fully into frame, then wipe it right.
      master.to(titleBottomRef.current, { x: 0, ease: "power2.out", duration: 0.06 }, 0);
      master.to(
        titleBottomRef.current,
        {
          x: () => (window.innerWidth < 768 ? "70vw" : "60vw"),
          ease: "power2.in",
          duration: 0.09,
        },
        0.06,
      );

      // Phase 2 — immerse. Function values so `invalidateOnRefresh` recomputes
      // the target on resize instead of reusing a stale pixel ratio.
      master.to(
        cardRef.current,
        { scale: () => immerseScale(), ease: "power2.in", duration: 0.63 },
        0.15,
      );
      master.to(
        mediaRef.current,
        { scale: MEDIA_PARALLAX_SCALE, ease: "power2.in", duration: 0.63 },
        0.15,
      );
      master.to(titleTopRef.current, { opacity: 0, ease: "power1.in", duration: 0.22 }, 0.15);
      master.to(titleBottomRef.current, { opacity: 0, ease: "power1.in", duration: 0.22 }, 0.15);

      // Phase 3 — release back to the card.
      master.to(
        cardRef.current,
        { scale: () => startScale(), ease: "power3.inOut", duration: 0.22 },
        0.78,
      );
      master.to(mediaRef.current, { scale: 1, ease: "power3.inOut", duration: 0.22 }, 0.78);
      master.to(
        titleTopRef.current,
        { x: 0, opacity: 1, ease: "power2.inOut", duration: 0.22 },
        0.78,
      );
      master.to(
        titleBottomRef.current,
        { x: titleBottomRestX, opacity: 1, ease: "power2.inOut", duration: 0.22 },
        0.78,
      );

      ScrollTrigger.refresh();
    }, sectionRef);

    return () => ctx.revert();
  }, [posterReady, reduced, aspect, frameCount, titleBottomRestX]);

  // Under reduced motion the tall scroll track buys nothing, so collapse it.
  // Driven by CSS rather than the `reduced` state so that the server-rendered
  // height already matches the user's preference and nothing reflows on hydrate.
  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative w-full overflow-clip text-white",
        "h-[var(--hero-track)] motion-reduce:h-[100svh]",
        className,
      )}
      style={
        {
          "--hero-track": `${(PIN_VH_MULTIPLE + 1) * 100}vh`,
        } as React.CSSProperties
      }
    >
      {/* The visible words are styled artwork; this carries the actual heading. */}
      <h1 className="sr-only">{heading}</h1>

      <div className="sticky top-0 flex h-[100svh] w-full flex-col items-center justify-center overflow-hidden">
        <div
          ref={bgRef}
          aria-hidden
          className="absolute inset-0 z-0"
          style={{ backgroundColor: accentHex }}
        />
        <div aria-hidden className="absolute inset-0 z-0 bg-black/30" />
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 55%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 md:gap-4">
          <span
            ref={titleTopRef}
            aria-hidden
            className={cn("flex w-full justify-center", titleTopClassName)}
          >
            {titleTop}
          </span>

          <div
            ref={cardRef}
            className="relative overflow-hidden rounded-[12px] shadow-[0_20px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10 will-change-transform md:rounded-[16px]"
            style={{
              width: `min(96vw, calc(${CARD_VH * 100}svh * ${aspect}))`,
              height: `min(${CARD_VH * 100}svh, 96vw / ${aspect})`,
              aspectRatio: aspect,
            }}
          >
            <div ref={mediaRef} className="absolute inset-0 will-change-transform">
              {/* eslint-disable-next-line @next/next/no-img-element -- the scrub reads naturalWidth off this element directly */}
              <img
                ref={posterRef}
                src={posterSrc}
                srcSet={posterSrcSet}
                sizes={posterSizes}
                alt={posterAlt}
                width={1600}
                height={900}
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                onLoad={(event) => adoptPoster(event.currentTarget)}
              />
              {wantsFrames && (
                <canvas
                  ref={canvasRef}
                  aria-hidden
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                    framesReady ? "opacity-100" : "opacity-0",
                  )}
                />
              )}
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 shadow-[inset_0_0_120px_rgba(0,0,0,0.45)]"
            />
          </div>

          <span
            ref={titleBottomRef}
            aria-hidden
            className={cn("flex w-full justify-center", titleBottomClassName)}
          >
            {titleBottom}
          </span>
        </div>

        {children}

        {/* Sits in the corner so it can never collide with the lower title. */}
        <div
          ref={cueRef}
          aria-hidden
          className="absolute right-6 bottom-6 z-10 text-[0.7rem] tracking-[0.35em] text-fg-muted uppercase motion-reduce:hidden"
        >
          Scrollen
        </div>
      </div>
    </section>
  );
}
