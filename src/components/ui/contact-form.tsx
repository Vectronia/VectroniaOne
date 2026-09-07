"use client";

import { useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type State = "idle" | "sending" | "sent" | "error";

/**
 * The enquiry field.
 *
 * An address is all it asks for; the message is there for anyone who wants to
 * say what they have in mind, and empty is fine. What the visitor types goes
 * straight to the studio's mailbox and nowhere else.
 */
export function ContactForm({ className }: { className?: string }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const emailId = useId();
  const messageId = useId();
  const statusRef = useRef<HTMLParagraphElement>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const data = new FormData(event.currentTarget);
    setState("sending");
    setError("");
    try {
      const response = await fetch("/api/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          message: data.get("message"),
          company: data.get("company"),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Bitte versuche es später noch einmal.");
      setState("sent");
    } catch (caught) {
      setState("error");
      setError(caught instanceof Error ? caught.message : "Bitte versuche es später noch einmal.");
    }
  }

  if (state === "sent") {
    return (
      <p
        className={cn(
          "body-copy max-w-[62ch] rounded-[12px] bg-white/6 px-5 py-4 text-fg ring-1 ring-white/12",
          className,
        )}
        // Announced to a screen reader the moment it replaces the form.
        role="status"
      >
        Danke — deine Anfrage ist angekommen. Ich melde mich bei dir.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn("max-w-[62ch]", className)}>
      {/*
       * Not a real field. It is off-screen and skipped by keyboard and screen
       * reader alike; only a bot fills it in, which is how the handler tells
       * them apart.
       */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${emailId}-company`}>Firma</label>
        <input id={`${emailId}-company`} name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <label htmlFor={emailId} className="block font-display text-lg text-fg italic">
        Deine E-Mail-Adresse
      </label>
      <input
        id={emailId}
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="name@beispiel.de"
        aria-describedby={state === "error" ? `${emailId}-error` : undefined}
        aria-invalid={state === "error" || undefined}
        className="mt-2 w-full rounded-[10px] bg-white/8 px-4 py-3 text-fg ring-1 ring-white/15 outline-none placeholder:text-fg-muted/60 focus-visible:ring-2 focus-visible:ring-brand-amber"
      />

      <label htmlFor={messageId} className="mt-6 block font-display text-lg text-fg italic">
        Worum geht es? <span className="text-base text-fg-muted">(optional)</span>
      </label>
      <textarea
        id={messageId}
        name="message"
        rows={4}
        placeholder="Fahrzeug, Anlass, Wunschformat — was du magst."
        className="mt-2 w-full resize-y rounded-[10px] bg-white/8 px-4 py-3 text-fg ring-1 ring-white/15 outline-none placeholder:text-fg-muted/60 focus-visible:ring-2 focus-visible:ring-brand-amber"
      />

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-6 cursor-pointer rounded-full bg-brand-amber px-7 py-3 font-display text-lg text-ink-deep italic transition-[background-color,opacity] hover:bg-brand-amber/90 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-amber disabled:cursor-default disabled:opacity-60 motion-reduce:transition-none"
      >
        {state === "sending" ? "wird gesendet …" : "Anfrage senden"}
      </button>

      {state === "error" && (
        <p
          ref={statusRef}
          id={`${emailId}-error`}
          role="alert"
          className="mt-4 text-sm text-brand-amber"
        >
          {error}
        </p>
      )}

      <p className="mt-5 text-sm leading-relaxed text-fg-muted/80">
        Deine Adresse wird ausschließlich für die Antwort auf diese Anfrage verwendet, nicht
        gespeichert und nicht weitergegeben.
      </p>
    </form>
  );
}
