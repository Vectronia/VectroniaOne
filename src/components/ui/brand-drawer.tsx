"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type BrandDrawerLink = {
  label: string;
  /** Element id to scroll to; omit for the top of the page. */
  targetId?: string;
};

/**
 * How far up the screen the section named by `revealWith` must have come
 * before the mark appears — 0.7 puts it just past a third of the way in.
 */
const REVEAL_AT = 0.7;

export type BrandDrawerProps = {
  /** The tab appears once this element has come up the screen. */
  revealWith: string;
  links: BrandDrawerLink[];
  className?: string;
};

/**
 * The small mark that carries the brand once the hero is behind the reader.
 *
 * It doubles as the way back to the top and as the handle for the navigation
 * drawer: pressing it opens the panel, whose first entry returns home. One
 * control cannot both scroll and open, so the panel carries the home link.
 */
export function BrandDrawer({ revealWith, links, className }: BrandDrawerProps) {
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const tabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Appears with the section it belongs to and stays for the rest of the page,
  // so the way back is never more than one press away — but steps aside again
  // if the reader returns to the hero. There it would sit on the hero's own
  // heading, and the way home is where you already are.
  //
  // The observer watches that section rather than the hero: the hero is several
  // viewports tall, and an observer never fires while you move around inside a
  // single element, so the tab would have stayed hidden.
  //
  // The root is shortened from below so the mark waits until the section has
  // genuinely started, rather than arriving on the hero's last frame. The
  // decision is read off the section's own top edge, not off isIntersecting:
  // once it has scrolled off the top the section no longer intersects, and the
  // mark must stay.
  useEffect(() => {
    const target = document.querySelector(revealWith);
    if (!target) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setRevealed(entry.boundingClientRect.top < window.innerHeight * REVEAL_AT);
      },
      { threshold: 0, rootMargin: `0px 0px -${Math.round((1 - REVEAL_AT) * 100)}% 0px` },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [revealWith]);

  const close = useCallback(() => {
    setOpen(false);
    tabRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("a, button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      // Keep Tab inside the open panel.
      const focusable = panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const go = (link: BrandDrawerLink) => {
    close();
    const target = link.targetId ? document.getElementById(link.targetId) : null;
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={cn("fixed top-0 left-0 z-40", className)}>
      <button
        ref={tabRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        // Slides in from the left edge when it is first needed. The mark stands
        // on the page with nothing behind it; only the glow answers the pointer.
        className={cn(
          "group relative m-3 flex cursor-pointer items-center justify-center rounded-full p-2.5",
          "transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)] motion-reduce:transition-none",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-amber",
          revealed ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-[130%] opacity-0",
        )}
      >
        {/*
         * The glow. A radial gradient rather than a blurred disc: it fades to
         * nothing well inside its own box, so there is no edge to see at any
         * size, and it costs no filter pass. It sits under the mark and only
         * appears once the pointer or the keyboard is on the button.
         */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -inset-2 -z-10 rounded-full opacity-0",
            "transition-opacity duration-500 ease-[var(--ease-out-expo)] motion-reduce:transition-none",
            "group-hover:opacity-100 group-focus-visible:opacity-100",
          )}
          style={{
            background:
              "radial-gradient(circle closest-side, color-mix(in srgb, var(--color-brand-amber) 40%, transparent) 0%, color-mix(in srgb, var(--color-brand-amber) 24%, transparent) 40%, color-mix(in srgb, var(--color-brand-amber) 8%, transparent) 66%, transparent 100%)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-rendered renditions of the mark, cut out in Photoshop */}
        <img
          src="/brand/vectronia-mark-320.webp"
          srcSet="/brand/vectronia-mark-320.webp 320w, /brand/vectronia-mark-640.webp 640w"
          sizes="40px"
          alt=""
          width={320}
          height={317}
          decoding="async"
          className="h-9 w-9 object-contain md:h-10 md:w-10"
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Menü schließen"
            onClick={close}
            tabIndex={-1}
            className="fixed inset-0 -z-10 cursor-default bg-black/30"
          />
          <div
            ref={panelRef}
            id={panelId}
            className="absolute top-[4.5rem] left-3 min-w-56 rounded-2xl bg-brand-navy/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/15 backdrop-blur-md"
          >
            <nav aria-label="Hauptmenü">
              <ul className="flex flex-col">
                {links.map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => go(link)}
                      className="w-full cursor-pointer rounded-xl px-4 py-3 text-left font-display text-lg text-fg-muted italic transition-colors hover:bg-white/8 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-amber motion-reduce:transition-none"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
