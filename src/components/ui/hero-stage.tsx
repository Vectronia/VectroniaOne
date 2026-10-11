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
/**
 * Progress by which the cut-out has left the stage to the left.
 *
 * A little longer than the marks: the car is the thing being watched, and it
 * leaves last of the three rather than racing them off.
 */
const CAR_OUT_AT = 0.22;
/**
 * When the photograph appears, and by when it is fully there.
 *
 * It waits for an empty stage. Started earlier it rose while the cut-out was
 * still crossing the frame on its way out, and the two read as one muddled
 * movement rather than as a stage clearing and a photograph taking its place.
 */
const POSTER_IN_AT = CAR_OUT_AT;
const POSTER_IN_UNTIL = 0.36;
/** When the copy begins to arrive, and how long it takes. */
const TEXT_IN_AT = 0.36;
const TEXT_IN_FOR = 0.24;

/**
 * How the cut-out is treated while it floats on the dark ground.
 *
 * Taken from the supplied heroStart.psd, whose brightness/contrast layer sits
 * at -70/0 over the car. Fitting that against the flattened file gives
 * brightness(0.685) to within 3.2/255, and no contrast or saturation change.
 * It never leaves that ground now, so the treatment is set once and left.
 */
const ON_DARK = { brightness: 0.685, contrast: 1, saturate: 1 };

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
  /** The framed photograph the hero settles on, beside the sentence. */
  posterSrc: string;
  posterSrcSet?: string;
  /** Describes that photograph: it is the section's subject, not decoration. */
  posterAlt: string;
  /** Describes the cut-out, which is artwork in its own right. */
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
  posterAlt,
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
  const carRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const car = carRef.current;
    if (!section || !car) return;

    const ctx = gsap.context(() => {
      // How far the cut-out has to travel to be gone.
      //
      // Measured rather than given as a percentage of its own width: the car
      // sits at a different place on a phone than on a desktop, so the same
      // percentage leaves it half on screen at one size and far past the edge
      // at another. `offsetLeft` is read against the stage, which the car is
      // positioned against and which spans the viewport, and the extra width
      // covers the shadow the drawing carries with it.
      const exit = () => -(car.offsetLeft + car.offsetWidth * 1.08);

      car.style.filter = `brightness(${ON_DARK.brightness}) contrast(${ON_DARK.contrast}) saturate(${ON_DARK.saturate})`;

      const copy = [headRef.current, bodyRef.current];

      gsap.set(posterRef.current, { opacity: 0 });
      gsap.set(copy, { opacity: 0, y: 12 });

      const master = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
      });

      // 1 — the stage clears. Mark and cut-out go left, wordmark right.
      //
      // The marks finish before the photograph is far along, because it may
      // not show while they are still on screen: it used to reach 27% opacity
      // with the wordmark barely moved, so a grey rectangle rose straight
      // through the lettering. `power2.in` starts slow, so most of the travel
      // happens in the last part of that window — the fade below waits for it.
      master.to(logoRef.current, { xPercent: -140, ease: "power2.in", duration: MARKS_OUT_AT }, 0);
      master.to(wordRef.current, { xPercent: 140, ease: "power2.in", duration: MARKS_OUT_AT }, 0);
      master.to(cueRef.current, { opacity: 0, ease: "power1.in", duration: 0.06 }, 0);
      master.to(car, { x: exit, ease: "power2.in", duration: CAR_OUT_AT }, 0);
      // The photograph appears on an empty stage, once the cut-out has left.
      master.to(
        posterRef.current,
        { opacity: 1, ease: "power1.inOut", duration: POSTER_IN_UNTIL - POSTER_IN_AT },
        POSTER_IN_AT,
      );

      // 2 — the copy arrives, once the car has settled and not before. The
      // photograph is the subject until then; the sentence is what the hero
      // leaves you with. It rises a little as it fades so the arrival reads as
      // movement rather than as a light being switched on.
      master.to(copy, { opacity: 1, y: 0, ease: "power2.out", duration: TEXT_IN_FOR }, TEXT_IN_AT);

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

        {/*
         * The composition the hero settles into: the photograph on the left,
         * the sentence beside it.
         *
         * A column on a phone, where "beside" does not exist. The card may
         * shrink there: at 390x667 the whole composition wants far more than
         * the 667 it has, and the picture is the only part that can give. It
         * crops rather than pushing the sentence off the screen.
         *
         * The rhythm between the three is the 40px the other sections use,
         * but tied to the viewport height rather than fixed, so a short
         * screen spends its slack on the photograph instead of on air. At
         * 844 tall it is exactly 40px; it gives up 8px of that by 667.
         */}
        <div className="relative z-20 flex h-full w-full max-w-6xl flex-col items-center justify-center gap-y-[clamp(1.25rem,4.74vh,2.5rem)] px-6 py-[clamp(1.25rem,4.74vh,2.5rem)] lg:grid lg:h-auto lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-x-16 lg:gap-y-5 lg:py-0">
          {/*
           * Heading, picture, text — the order every other section reads in,
           * and on a phone that is the order on the screen. Beside the picture
           * the heading keeps the same place in the reading order; only the
           * grid puts it in the second column.
           */}
          <h2
            ref={headRef}
            // The same steps as every other section's heading, so the hero
            // does not read as a smaller relative of the rest.
            className="text-metal font-display w-full text-center text-3xl font-semibold text-balance italic md:text-4xl lg:col-start-2 lg:row-start-1 lg:text-right lg:text-5xl"
          >
            {header}
          </h2>

          {/*
           * The picture gives way on a short screen — but only by getting
           * smaller, never by getting squarer. It is a photograph of a person,
           * and a frame squashed out of proportion crops her rather than
           * resizing her: at 390x667 the composition wants far more height
           * than it has, and a frame left free to flatten took the picture
           * down to a letterbox.
           *
           * So the shrinking happens on this outer box, which carries the
           * proportions and the width; the card inside takes its height from
           * it and derives its own width, staying in proportion whatever is
           * left. `min-h-0` is what allows a flex child to fall below its
           * content height at all.
           */}
          <div
            // Beside the sentence the picture takes the height of the whole
            // text — heading and copy — instead of standing centred against
            // it with air above and below. In a column, above the text, it
            // keeps its own proportions and may shrink; the custom property
            // carries them so the rule can be dropped at lg, which an inline
            // aspect-ratio could not be, since a style beats a class.
            className="flex min-h-0 w-full shrink justify-center aspect-[var(--shot)] lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:aspect-auto lg:self-stretch"
            style={{ "--shot": aspect } as React.CSSProperties}
          >
            <div
              className="relative h-full max-w-full overflow-hidden rounded-[12px] aspect-[var(--shot)] md:rounded-[16px] lg:aspect-auto lg:w-full"
            >
              <div
                ref={posterRef}
                className="absolute inset-0 shadow-[0_20px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- fixed art direction */}
                <img
                  src={posterSrc}
                  srcSet={posterSrcSet}
                  sizes="(max-width: 768px) 96vw, min(96vw, 92svh)"
                  alt={posterAlt}
                  width={1748}
                  height={1166}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div
            ref={bodyRef}
            className="hero-copy text-box-trim w-full lg:col-start-2 lg:row-start-2"
          >
            {body.map((paragraph, index) => (
              <p
                key={paragraph}
                className={cn("body-copy max-w-[62ch] text-fg-muted", index > 0 && "mt-4")}
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
