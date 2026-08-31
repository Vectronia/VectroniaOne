"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Auralis from "@/components/ui/auralis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Brand palette ordered by luminance — brightest first.
 *
 * The shader reads [0] as the broad field and [1] as the glow, so the order
 * decides how much of each colour the page carries.
 */
const FIELD_COLORS = ["#e5ad43", "#11383b", "#191c28"];

/** Field drift with nobody scrolling — just enough to not read as a still. */
const IDLE_SPEED = 0.02;
/** Field time added per 1000px scrolled. */
const SCROLL_BOOST = 0.55;

export type StaticBackdropProps = {
  /** Selector for the element the backdrop fades in behind, e.g. the hero. */
  revealAfter: string;
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
 * The page's backdrop: a WebGL field fixed behind everything, revealed once the
 * hero has scrolled past.
 *
 * It does not animate at the reader — scrolling is what drives it, with only a
 * slight drift at rest. Under reduced motion Auralis renders a single frame and
 * the backdrop is visible from the start.
 */
export function StaticBackdrop({ revealAfter }: StaticBackdropProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const trigger = document.querySelector(revealAfter);
    if (!trigger) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        rootRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger,
            start: "bottom 90%",
            end: "bottom 40%",
            scrub: true,
          },
        },
      );
    }, rootRef);

    return () => ctx.revert();
  }, [reduced, revealAfter]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      // Visible from the start under reduced motion, where nothing fades it in.
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-0 motion-reduce:opacity-100"
    >
      <Auralis
        colors={FIELD_COLORS}
        speed={IDLE_SPEED}
        scrollBoost={SCROLL_BOOST}
        grain={0.35}
        maxDpr={1}
        height="100%"
        // Also the fallback when WebGL is unavailable or software-rendered.
        className="h-full bg-[image:var(--gradient-page)]"
      />
      {/* Keeps the field from competing with the content laid over it. */}
      <div className="absolute inset-0 bg-brand-navy/45" />
    </div>
  );
}
