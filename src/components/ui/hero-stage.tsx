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
/** Progress by which logo and wordmark have left the stage. */
const MARKS_OUT_AT = 0.144;
/** Progress at which the photograph starts to appear — after the marks. */
const POSTER_IN_AT = 0.15;
/** Progress at which the photograph has taken the whole screen. */
const FILLED_AT = 0.68;
/**
 * How much further it drifts forward over the rest of the track.
 *
 * The hero ends inside the picture rather than pulling back out of it, so
 * there is nothing left to animate after it fills the screen — and a frozen
 * image under a moving page reads as a stall. This keeps it creeping forward
 * until the section scrolls away.
 */
const SETTLE_DRIFT = 1.06;

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

/*
 * Rest geometry is measured off heroStart.psd rather than eyeballed. Its layer
 * frames carry transparent padding, so the painted bounds were read from each
 * layer's alpha and expressed against the file's 1366x768 canvas:
 *
 *   logo      (-38,62)-(836,927)    112.63vh tall, left -4.95vh (= -2.78vw at 16:9)
 *   car       (631,178)-(1241,509)  43.10vh tall, centre 68.52vw / 44.73vh
 *   wordmark  (445,558)-(1325,624)  64.42vw wide, left 32.58vw, top 72.66vh
 *
 * The car's frame is larger than the car: inside the shipped asset the artwork
 * occupies x 3.23-99.06%, y 25.18-97.47%. Solving for a frame that puts the car
 * on the reference position gives 59.62vh x 82.83vh at left calc(68.52vw -
 * 42.36vh), top 8.17vh — the classes below.
 *
 * A phone follows a second reference, mobileStart.psd, on a 390x844 canvas --
 * a different composition, not a squeezed one: the wordmark moves to the head
 * of the screen, the logo sits mid-left, and the car crosses the foot and
 * bleeds off the right edge. Read the same way:
 *
 *   wordmark  (20,76)-(372,103)    90.26vw wide, left 5.13vw, top 9.00vh
 *   logo      (-68,139)-(367,571)  111.54vw wide, left -17.44vw, top 16.47vh
 *   car       (12,475)-(526,754)   131.79vw wide, left 3.08vw, top 56.28vh
 *
 * Solving the car's frame back from its painted target gives 137.52vw wide at
 * left -1.36vw, top 44.76vh -- landing the painted car within 0.1px of the
 * reference. The three are sized in vw rather than vh so the horizontal
 * framing, which is what carries this composition, holds on any phone; only
 * the vertical has slack to give.
 *
 * The logo and the car are capped against the height as well. Width alone put
 * the car 19px past the bottom edge of a 375x620 screen -- a phone showing its
 * browser bars. The caps are the reference's own proportions, 51.18vh and
 * 45.74vh, so at 390x844 they change nothing and only a short screen ever
 * meets them.
 *
 * The classes are written out in full because Tailwind only emits what it can
 * read literally.
 *
 * None of the three may be placed with a translate utility. GSAP writes the
 * whole `transform` property, so a CSS translate is erased the moment a tween
 * touches the element — and the landing maths reads `offset*`, which never saw
 * the translate in the first place. Centring is done with left/top instead;
 * with translate utilities the cut-out missed the photograph by 245px at 390px
 * wide while landing correctly on a desktop viewport.
 */

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
 * At rest the composition reproduces the supplied reference: the mark stands
 * large against the left edge, the cut-out floats on the dark ground, and the
 * wordmark runs along the lower edge. Scrolling clears the marks to either side
 * and carries the cut-out into the framed photograph, where its treatment
 * resolves to the photograph's own.
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
  const seamRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const car = carRef.current;
    const card = cardRef.current;
    if (!section || !car || !card) return;

    const ctx = gsap.context(() => {
      const immerseScale = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const baseW = Math.min(vw * 0.96, vh * CARD_VH * aspect);
        const baseH = Math.min(vh * CARD_VH, (vw * 0.96) / aspect);
        if (baseW <= 0 || baseH <= 0) return 1.5;
        return Math.max(vw / baseW, vh / baseH) * IMMERSE_OVERFILL;
      };

      // Landing is measured from the two untransformed layout boxes, so the
      // cut-out finishes exactly over the photograph at any viewport. `offset*`
      // rather than getBoundingClientRect, because the latter already includes
      // whatever transform the tween has applied.
      const landing = () => ({
        x: card.offsetLeft + card.offsetWidth / 2 - (car.offsetLeft + car.offsetWidth / 2),
        y: card.offsetTop + card.offsetHeight / 2 - (car.offsetTop + car.offsetHeight / 2),
        scale: card.offsetWidth / car.offsetWidth,
      });

      // `filter` is a string, so the treatment tweens through a numeric proxy.
      const tone = { ...ON_DARK };
      const applyTone = () => {
        car.style.filter = `brightness(${tone.brightness}) contrast(${tone.contrast}) saturate(${tone.saturate})`;
      };
      applyTone();

      gsap.set(card, { scale: 1, transformOrigin: "50% 50%" });
      gsap.set(posterRef.current, { opacity: 0 });
      gsap.set(seamRef.current, { opacity: 0 });

      // Card and cut-out scale together once landed, so they stay registered.
      const zoom = { value: 1 };
      const applyZoom = () => {
        gsap.set(card, { scale: zoom.value });
        gsap.set(car, { scale: landing().scale * zoom.value });
      };

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
      //
      // They finish well before the car lands, because the photograph may not
      // show while they are still on screen: it used to reach 27% opacity with
      // the wordmark barely moved, so a grey rectangle rose straight through
      // the lettering. `power2.in` starts slow, so most of the travel happens
      // in the last part of that window — the fade below waits for it.
      master.to(logoRef.current, { xPercent: -140, ease: "power2.in", duration: MARKS_OUT_AT }, 0);
      master.to(wordRef.current, { xPercent: 140, ease: "power2.in", duration: MARKS_OUT_AT }, 0);
      master.to(cueRef.current, { opacity: 0, ease: "power1.in", duration: 0.06 }, 0);
      master.to(
        car,
        {
          x: () => landing().x,
          y: () => landing().y,
          scale: () => landing().scale,
          ease: "power2.inOut",
          duration: LANDED_AT,
        },
        0,
      );
      master.to(
        tone,
        { ...IN_PHOTO, ease: "power1.inOut", duration: LANDED_AT, onUpdate: applyTone },
        0,
      );
      // The photograph only appears once the marks are off the stage, and is
      // fully there by the time the cut-out settles onto it.
      master.to(
        posterRef.current,
        { opacity: 1, ease: "power1.inOut", duration: LANDED_AT - POSTER_IN_AT },
        POSTER_IN_AT,
      );

      // 2 — the photograph takes the screen and stays taken. It used to shrink
      // back to a card over the last fifth, which put the same picture on
      // screen twice in a row: once as a card the hero handed back, then again
      // in the panel below. Now the hero ends inside it and the page scrolls
      // out of the picture instead of the picture withdrawing from the page.
      master.to(
        zoom,
        {
          value: () => immerseScale(),
          ease: "power2.in",
          duration: FILLED_AT - LANDED_AT,
          onUpdate: applyZoom,
        },
        LANDED_AT,
      );
      master.to(
        zoom,
        {
          value: () => immerseScale() * SETTLE_DRIFT,
          ease: "none",
          duration: 1 - FILLED_AT,
          onUpdate: applyZoom,
        },
        FILLED_AT,
      );
      // 3 — the lower edge melts into the ground the next section starts on.
      // Without it the picture met the panel as a hard light-to-dark line,
      // which is the one place the handover reads as a cut rather than a
      // transition. It stays clear while you are inside the picture.
      master.to(
        seamRef.current,
        { opacity: 1, ease: "power2.in", duration: 1 - FILLED_AT },
        FILLED_AT,
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

        <div
          ref={logoRef}
          aria-hidden
          className="pointer-events-none absolute top-[16.47vh] left-[-17.44vw] z-10 h-[min(110.61vw,51.18vh)] will-change-transform md:top-[8.07vh] md:left-[-4.95vh] md:h-[112.63vh]"
        >
          {logo}
        </div>

        {/* The photograph the cut-out lands in. */}
        <div
          ref={cardRef}
          className="relative z-20 overflow-hidden rounded-[12px] will-change-transform md:rounded-[16px]"
          style={{
            width: `min(96vw, calc(${CARD_VH * 100}svh * ${aspect}))`,
            height: `min(${CARD_VH * 100}svh, 96vw / ${aspect})`,
            aspectRatio: aspect,
          }}
        >
          <div
            ref={posterRef}
            aria-hidden
            className="absolute inset-0 shadow-[0_20px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed art direction */}
            <img
              src={posterSrc}
              srcSet={posterSrcSet}
              sizes="(max-width: 768px) 96vw, min(96vw, 92svh)"
              alt=""
              width={1600}
              height={1151}
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* The cut-out, at the reference position until it is carried across. */}
        <div
          ref={carRef}
          className="absolute top-[44.76vh] left-[-1.36vw] z-30 h-[min(98.98vw,45.74vh)] w-[min(137.52vw,63.55vh)] will-change-[transform,filter] md:top-[8.17vh] md:left-[calc(68.52vw-42.36vh)] md:h-[59.62vh] md:w-[82.83vh]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed art direction */}
          <img
            src={cutoutSrc}
            srcSet={cutoutSrcSet}
            sizes="(max-width: 768px) 138vw, 83svh"
            alt={artworkAlt}
            width={1920}
            height={1382}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>

        <div
          ref={wordRef}
          aria-hidden
          className="pointer-events-none absolute top-[9vh] left-[5.13vw] z-10 w-[90.26vw] will-change-transform md:top-[72.66vh] md:left-[32.58vw] md:w-[64.42vw]"
        >
          {wordmark}
        </div>

        {/* Closes the seam to the section below; see phase 3 above. */}
        <div
          ref={seamRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-[26vh]"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--color-brand-teal) 56%, #000) 100%)",
          }}
        />

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
