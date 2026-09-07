import type { Metadata } from "next";

import { LegalPage } from "@/components/ui/legal-page";
import { LEGAL } from "@/data/legal";

export const metadata: Metadata = {
  title: "Datenschutzerklärung — Vectronia One",
  description: "Wie diese Seite mit personenbezogenen Daten umgeht.",
  robots: { index: false, follow: true },
};

/**
 * Written from what the site measurably does, not from a template.
 *
 * Checked in the browser across the whole page: no request leaves the site's
 * own domain, no cookie is set, and nothing is written to local or session
 * storage. The fonts are downloaded at build time and served from here, so
 * there is no connection to Google either. That is why there is no cookie
 * banner and no consent section — there is nothing to consent to.
 */
export default function Datenschutz() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <p>
        Diese Seite ist bewusst sparsam gebaut. Sie setzt keine Cookies, bindet keine Analyse- oder
        Werbedienste ein und lädt nichts von fremden Servern nach — auch keine Schriftarten. Beim
        Besuch werden daher nur die Daten verarbeitet, die für den Abruf technisch nötig sind, und
        zusätzlich das, was du selbst in das Kontaktformular schreibst.
      </p>

      <h2>Verantwortlich</h2>
      <p>
        {LEGAL.name}
        <br />
        {LEGAL.street}
        <br />
        {LEGAL.city}
        <br />
        E-Mail: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>

      <h2>Aufruf der Seite (Server-Logs)</h2>
      <p>
        Beim Abruf übermittelt dein Browser technisch notwendige Daten, die der Server protokolliert:
      </p>
      <ul>
        <li>IP-Adresse</li>
        <li>Datum und Uhrzeit des Abrufs</li>
        <li>aufgerufene Adresse und übertragene Datenmenge</li>
        <li>Browser- und Betriebssystemangaben sowie die zuvor besuchte Seite</li>
      </ul>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse liegt im sicheren
        und störungsfreien Betrieb der Seite. Diese Daten werden nicht mit anderen Quellen
        zusammengeführt und nicht zur Auswertung des Besuchsverhaltens verwendet. Sie werden nach
        spätestens sieben Tagen gelöscht.
      </p>

      <h2>Kontaktformular</h2>
      <p>
        Über das Formular am Ende der Seite kannst du mir deine E-Mail-Adresse und, wenn du magst,
        eine kurze Nachricht schicken. Beides wird ausschließlich dazu verwendet, deine Anfrage zu
        beantworten.
      </p>
      <p>
        Die Eingaben werden <strong>nicht in einer Datenbank gespeichert</strong> und{" "}
        <strong>nicht an Dritte weitergegeben</strong>. Sie werden unmittelbar als E-Mail an mein
        Postfach weitergeleitet und liegen danach nur dort. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b
        DSGVO, soweit es um die Anbahnung eines Auftrags geht, sonst Art. 6 Abs. 1 lit. f DSGVO.
      </p>
      <p>
        Ich lösche die Nachricht, sobald sie erledigt ist und keine gesetzlichen
        Aufbewahrungspflichten entgegenstehen.
      </p>

      <h2>Hosting</h2>
      <p>
        Die Seite wird bei {LEGAL.host} betrieben. Der Anbieter verarbeitet die oben genannten
        Server-Logdaten in meinem Auftrag; über einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO
        ist er zur Einhaltung des Datenschutzes verpflichtet.
      </p>

      <h2>Schriftarten</h2>
      <p>
        Die verwendeten Schriften werden bereits beim Erstellen der Seite heruntergeladen und von
        diesem Server ausgeliefert. Beim Besuch entsteht dadurch{" "}
        <strong>keine Verbindung zu Google oder einem anderen Anbieter</strong>, und es wird keine
        IP-Adresse dorthin übertragen.
      </p>

      <h2>Verschlüsselung</h2>
      <p>
        Die Seite wird über HTTPS ausgeliefert. Was du in das Formular eingibst, ist auf dem Weg zum
        Server verschlüsselt und von Dritten nicht mitlesbar.
      </p>

      <h2>Deine Rechte</h2>
      <p>Du hast jederzeit das Recht auf</p>
      <ul>
        <li>Auskunft über die zu dir gespeicherten Daten (Art. 15 DSGVO)</li>
        <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
        <li>Löschung (Art. 17 DSGVO) und Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>
          Widerspruch gegen Verarbeitungen, die auf einem berechtigten Interesse beruhen (Art. 21
          DSGVO)
        </li>
      </ul>
      <p>
        Eine formlose E-Mail an <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> genügt. Außerdem
        steht dir ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu; zuständig ist in der
        Regel die Behörde deines Wohnorts oder die meines Sitzes.
      </p>
    </LegalPage>
  );
}
