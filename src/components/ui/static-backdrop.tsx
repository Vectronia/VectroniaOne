"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Total drift of the backdrop across the whole page, in viewport heights. */
const DRIFT_VH = 0.12;

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
 * A fixed backdrop that appears once the hero has scrolled past.
 *
 * It is static by construction — being fixed, it never moves on its own. The
 * only motion is a slow drift tied to scroll position, so it responds to the
 * reader rather than animating at them.
 */
export function StaticBackdrop({ revealAfter }: StaticBackdropProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
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

      gsap.to(layerRef.current, {
        yPercent: -DRIFT_VH * 100,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
        },
      });
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
      <div
        ref={layerRef}
        className="absolute -inset-y-[15%] inset-x-0 bg-[image:var(--gradient-page)]"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 60%)",
        }}
      />
    </div>
  );
}
