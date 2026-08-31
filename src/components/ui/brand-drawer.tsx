"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type BrandDrawerLink = {
  label: string;
  /** Element id to scroll to; omit for the top of the page. */
  targetId?: string;
};

export type BrandDrawerProps = {
  /** The tab appears once this element comes into view, and then stays. */
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

  // Appears with the section it belongs to, and stays for the rest of the page
  // so the way back is never more than one press away.
  //
  // The observer watches that section rather than the hero: the hero is several
  // viewports tall, and an observer never fires while you move around inside a
  // single element, so the tab would have stayed hidden.
  useEffect(() => {
    const target = document.querySelector(revealWith);
    if (!target) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0 },
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
        // Slides in from the left edge when it is first needed.
        className={cn(
          "m-3 flex cursor-pointer items-center justify-center rounded-full bg-brand-navy/70 p-2.5 ring-1 ring-white/15 backdrop-blur-sm",
          "transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)] motion-reduce:transition-none",
          "hover:bg-brand-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber",
          revealed ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-[130%] opacity-0",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-rendered renditions of the Illustrator mark */}
        <img
          src="/brand/vectronia-mark-320.webp"
          alt=""
          width={320}
          height={318}
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
