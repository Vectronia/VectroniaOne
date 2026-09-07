import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

/**
 * Takes the contact form and mails it on, over SMTP, to the studio's own
 * mailbox.
 *
 * Nothing is stored and nothing is passed to a third party: the address the
 * visitor types is used for this one message and then only exists in that
 * mailbox. That is the reason for running our own handler rather than posting
 * to a form service — no processor outside the host ever sees it.
 *
 * Configured entirely from the environment, so no address or password is ever
 * committed:
 *
 *   SMTP_HOST      smtp.hostinger.com
 *   SMTP_PORT      465
 *   SMTP_USER      the mailbox the site sends from
 *   SMTP_PASSWORD  its password
 *   CONTACT_TO     where enquiries should land (defaults to SMTP_USER)
 *
 * Needs a Node runtime. On hosting that only serves static files this route
 * does not exist, and the form says so rather than pretending to have sent.
 */
export const runtime = "nodejs";

/** Long enough for any real address, short enough to reject a paste-bomb. */
const MAX_EMAIL = 254;
const MAX_MESSAGE = 4000;

/**
 * Deliberately loose: something@something.tld with no spaces. Anything
 * stricter starts rejecting valid addresses, and the real proof that an
 * address works is the reply arriving.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function config() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, CONTACT_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return null;
  return {
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 465),
    user: SMTP_USER,
    password: SMTP_PASSWORD,
    to: CONTACT_TO ?? SMTP_USER,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { email, message, company } = (body ?? {}) as Record<string, unknown>;

  // Honeypot: a field no person sees and no person fills in. Bots fill every
  // field they find, so anything here is automated — answered with a success
  // so the sender learns nothing from the difference.
  if (typeof company === "string" && company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const address = typeof email === "string" ? email.trim() : "";
  if (!address || address.length > MAX_EMAIL || !EMAIL.test(address)) {
    return NextResponse.json(
      { error: "Bitte gib eine gültige E-Mail-Adresse an." },
      { status: 400 },
    );
  }

  const text = typeof message === "string" ? message.trim().slice(0, MAX_MESSAGE) : "";

  const settings = config();
  if (!settings) {
    console.error("Kontaktformular: SMTP ist nicht konfiguriert.");
    return NextResponse.json(
      { error: "Das Formular ist gerade nicht erreichbar. Bitte versuche es später noch einmal." },
      { status: 503 },
    );
  }

  try {
    const transport = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      // 465 is implicit TLS; anything else negotiates STARTTLS. Either way the
      // connection is encrypted before the address crosses it.
      secure: settings.port === 465,
      auth: { user: settings.user, pass: settings.password },
    });

    await transport.sendMail({
      // The envelope sender stays the site's own mailbox — sending as the
      // visitor would fail SPF and land the mail in spam. Their address goes
      // in Reply-To, so answering still writes to them.
      from: `"Vectronia One — Anfrage" <${settings.user}>`,
      to: settings.to,
      replyTo: address,
      subject: `Anfrage über die Webseite — ${address}`,
      text: text
        ? `${text}\n\n—\nAbsender: ${address}`
        : `Kontaktwunsch ohne Nachricht.\n\n—\nAbsender: ${address}`,
    });
  } catch (error) {
    console.error("Kontaktformular: Versand fehlgeschlagen.", error);
    return NextResponse.json(
      { error: "Die Nachricht konnte nicht gesendet werden. Bitte versuche es später noch einmal." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
