"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

/** Height of the scroll track, in viewport heights. */
const TRACK_VH = 2.4;
/** Progress by which logo and wordmark have left the stage. */
const MARKS_OUT_AT = 0.16;
/** Progress at which the photograph starts to appear — after the marks. */
const POSTER_IN_AT = 0.17;
/** Progress at which the car has finished landing in the photograph. */
const LANDED_AT = 0.32;
/** When the copy begins to arrive, and how long it takes. */
const TEXT_IN_AT = 0.36;
const TEXT_IN_FOR = 0.24;

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
  /** The line the hero settles on, set beside the photograph. */
  header: string;
  /** One entry per paragraph, revealed once the car has landed. */
  body: string[];
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
  header,
  body,
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
  const stageRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    const car = carRef.current;
    const card = cardRef.current;
    if (!section || !stage || !car || !card) return;

    const ctx = gsap.context(() => {
      // Landing is measured from the two untransformed layout boxes, so the
      // cut-out finishes exactly over the photograph at any viewport. `offset*`
      // rather than getBoundingClientRect, because the latter already includes
      // whatever transform the tween has applied.
      //
      // The two boxes no longer share an offset parent: the car is placed
      // against the stage, while the card sits inside the composition wrapper
      // that lays the photograph out beside the sentence. So each is summed up
      // its own offsetParent chain to the stage, which both have in common.
      // Reading offsetLeft/offsetTop alone put the car 143x251px off the
      // photograph at 1440 wide while landing correctly on a phone, where the
      // wrapper is not positioned differently from the stage.
      const offsetInStage = (el: HTMLElement) => {
        let x = 0;
        let y = 0;
        let node: HTMLElement | null = el;
        while (node && node !== stage) {
          x += node.offsetLeft;
          y += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        return { x, y };
      };

      const landing = () => {
        const target = offsetInStage(card);
        const origin = offsetInStage(car);
        return {
          x: target.x + card.offsetWidth / 2 - (origin.x + car.offsetWidth / 2),
          y: target.y + card.offsetHeight / 2 - (origin.y + car.offsetHeight / 2),
          scale: card.offsetWidth / car.offsetWidth,
        };
      };

      // `filter` is a string, so the treatment tweens through a numeric proxy.
      const tone = { ...ON_DARK };
      const applyTone = () => {
        car.style.filter = `brightness(${tone.brightness}) contrast(${tone.contrast}) saturate(${tone.saturate})`;
      };
      applyTone();

      gsap.set(posterRef.current, { opacity: 0 });
      gsap.set(textRef.current, { opacity: 0, y: 12 });

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

      // 2 — the copy arrives, once the car has settled and not before. The
      // photograph is the subject until then; the sentence is what the hero
      // leaves you with. It rises a little as it fades so the arrival reads as
      // movement rather than as a light being switched on.
      master.to(
        textRef.current,
        { opacity: 1, y: 0, ease: "power2.out", duration: TEXT_IN_FOR },
        TEXT_IN_AT,
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

      <div
        ref={stageRef}
        className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden"
      >
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

        {/*
         * The composition the hero settles into: the photograph on the left,
         * the sentence beside it. The card sits here rather than in the middle
         * of the stage because the cut-out lands wherever the card is — the
         * landing is measured from its layout box — so placing it in the
         * finished layout is all it takes to send the car there.
         *
         * A column on a phone, where "beside" does not exist. The card may
         * shrink there: at 390x667 the whole composition wants 772px of an
         * available 667, and the picture is the only part that can give. It
         * crops rather than pushing the sentence off the screen.
         */}
        <div className="relative z-20 flex h-full w-full max-w-6xl flex-col items-center justify-center gap-6 px-6 py-10 lg:grid lg:h-auto lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-x-16 lg:py-0">
          <div
            ref={cardRef}
            className="relative min-h-0 w-full shrink overflow-hidden rounded-[12px] will-change-transform md:rounded-[16px] lg:col-start-1"
            style={{ aspectRatio: aspect }}
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

          <div ref={textRef} className="text-box-trim w-full lg:col-start-2">
            <h2 className="text-metal font-display text-2xl font-semibold text-balance italic text-center md:text-3xl lg:text-right lg:text-4xl xl:text-5xl">
              {header}
            </h2>
            {body.map((paragraph, index) => (
              <p
                key={paragraph}
                className={cn(
                  "body-copy max-w-[62ch] text-fg-muted",
                  index === 0 ? "mt-5" : "mt-4",
                )}
              >
                {paragraph}
              </p>
            ))}
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
