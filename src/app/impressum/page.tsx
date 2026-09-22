import type { Metadata } from "next";

import { LegalPage } from "@/components/ui/legal-page";
import { LEGAL } from "@/data/legal";

export const metadata: Metadata = {
  title: "Impressum — Vectronia One",
  description: "Anbieterkennzeichnung nach § 5 DDG.",
  // Nothing to gain from having these two in a search index.
  robots: { index: false, follow: true },
};

export default function Impressum() {
  return (
    <LegalPage title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        {LEGAL.name}
        <br />
        {LEGAL.careOf && (
          <>
            {LEGAL.careOf}
            <br />
          </>
        )}
        {LEGAL.street}
        <br />
        {LEGAL.city}
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        {LEGAL.phone && (
          <>
            <br />
            Telefon: {LEGAL.phone}
          </>
        )}
      </p>

      <h2>Umsatzsteuer</h2>
      <p>
        {LEGAL.vatId ? (
          <>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {LEGAL.vatId}</>
        ) : LEGAL.smallBusiness ? (
          <>
            Gemäß § 19 UStG wird keine Umsatzsteuer berechnet und daher auch nicht in Rechnungen
            ausgewiesen (Kleinunternehmerregelung).
          </>
        ) : (
          <>Eine Umsatzsteuer-Identifikationsnummer liegt nicht vor.</>
        )}
      </p>

      <h2>Verantwortlich für den Inhalt</h2>
      <p>
        {LEGAL.name}, Anschrift wie oben.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Sämtliche auf dieser Seite gezeigten Zeichnungen, Fotografien und Texte sind urheberrechtlich
        geschützt. Jede Verwendung außerhalb der gesetzlich zugelassenen Fälle bedarf meiner
        vorherigen schriftlichen Zustimmung.
      </p>

      <h2>Streitbeilegung</h2>
      <p>
        Ich bin nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </LegalPage>
  );
}
