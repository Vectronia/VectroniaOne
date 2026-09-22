#!/usr/bin/env node
/**
 * Checks the mail settings before the site goes anywhere near them.
 *
 *   node scripts/test-smtp.mjs                  nur anmelden, nichts senden
 *   node scripts/test-smtp.mjs --senden         zusätzlich eine Testmail schicken
 *
 * Reads .env.local, which is never committed. The password stays on your
 * machine — it is not printed, not logged and not sent anywhere except to the
 * mail server it belongs to.
 */
import { readFileSync } from "node:fs";
import { createTransport } from "nodemailer";

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    console.log("Hinweis: keine .env.local gefunden — nutze die Werte aus der Umgebung.\n");
  }
}

/**
 * Nodemailer reports a refused or unresolved connection as ESOCKET, the same
 * code it uses for a TLS mismatch, so those two are told apart by the
 * underlying message before the code is consulted.
 */
const BY_MESSAGE = [
  [
    /ENOTFOUND|EAI_AGAIN/,
    "Der Servername ist unbekannt.\n" +
      "  • Tippfehler in SMTP_HOST?\n" +
      "  • Hostinger-Postfach: smtp.hostinger.com · Titan: smtp.titan.email",
  ],
  [
    /ECONNREFUSED/,
    "Der Server hat die Verbindung abgewiesen.\n" +
      "  • Stimmt der Port? 465 für SSL, 587 für STARTTLS.\n" +
      "  • Stimmt SMTP_HOST? Hostinger-Postfach: smtp.hostinger.com · Titan: smtp.titan.email",
  ],
];

const HINTS = {
  EAUTH:
    "Benutzername oder Passwort stimmen nicht.\n" +
    "  • SMTP_USER muss die VOLLSTÄNDIGE Adresse sein (kunst@vectronia-one.de), nicht nur „kunst“.\n" +
    "  • Das Passwort ist das des Postfachs, nicht das deines Hoster-Kontos.",
  ECONNECTION:
    "Der Server war nicht erreichbar.\n" +
    "  • Stimmt SMTP_HOST? Bei Hostinger-Postfächern smtp.hostinger.com, bei Titan smtp.titan.email.\n" +
    "  • Port 465 braucht SSL, Port 587 STARTTLS — probiere den jeweils anderen.",
  ETIMEDOUT:
    "Zeitüberschreitung. Häufig blockiert ein Netzwerk oder eine Firewall den Port.\n" +
    "  • Probiere Port 587 statt 465.",
  ESOCKET:
    "Die Verbindung kam nicht sauber zustande — meist passt der Port nicht zur Verschlüsselung.\n" +
    "  • 465 = SSL, 587 = STARTTLS.",
};

async function main() {
  loadEnv();
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const to = process.env.CONTACT_TO ?? user;

  const missing = [
    ["SMTP_HOST", host],
    ["SMTP_USER", user],
    ["SMTP_PASSWORD", pass],
  ].filter(([, v]) => !v).map(([k]) => k);

  if (missing.length) {
    console.error(`Es fehlen: ${missing.join(", ")}`);
    console.error("Lege .env.local nach dem Vorbild von .env.example an.");
    process.exit(1);
  }

  console.log(`Server   ${host}:${port} (${port === 465 ? "SSL" : "STARTTLS"})`);
  console.log(`Postfach ${user}`);
  console.log(`Passwort ${"•".repeat(8)} (${pass.length} Zeichen)\n`);

  const transport = createTransport({
    host, port, secure: port === 465, auth: { user, pass },
    connectionTimeout: 15000, greetingTimeout: 15000,
  });

  try {
    await transport.verify();
    console.log("✓ Verbindung und Anmeldung erfolgreich.");
  } catch (error) {
    console.error("✗ Fehlgeschlagen.\n");
    console.error(`  Meldung: ${error.message}`);
    const hint =
      BY_MESSAGE.find(([pattern]) => pattern.test(error.message ?? ""))?.[1] ??
      HINTS[error.code] ??
      HINTS[error.responseCode];
    if (hint) console.error(`\n  ${hint}`);
    process.exit(1);
  }

  if (!process.argv.includes("--senden")) {
    console.log("\nZum Senden einer Testmail:  node scripts/test-smtp.mjs --senden");
    return;
  }

  try {
    const info = await transport.sendMail({
      from: `"Vectronia One — Test" <${user}>`,
      to,
      subject: "Testmail von der Webseite",
      text: "Wenn diese Nachricht angekommen ist, funktioniert das Kontaktformular.",
    });
    console.log(`✓ Testmail an ${to} verschickt (${info.messageId}).`);
    console.log("  Schau auch im Spam-Ordner nach, falls sie nicht auftaucht.");
  } catch (error) {
    console.error(`✗ Versand fehlgeschlagen: ${error.message}`);
    process.exit(1);
  }
}

main();
