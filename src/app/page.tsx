import type { Metadata } from "next";

import { BrandDrawer } from "@/components/ui/brand-drawer";
import { HeroStage } from "@/components/ui/hero-stage";
import { IntroPanel } from "@/components/ui/intro-panel";
import { KineticGallery } from "@/components/ui/kinetic-gallery";
import { SiteFooter } from "@/components/ui/site-footer";
import { StaticBackdrop } from "@/components/ui/static-backdrop";
import { ContactForm } from "@/components/ui/contact-form";
import {
  contactPhoto,
  galleryArtworks,
  heroArtwork,
  passionPhotos,
  processPhoto,
} from "@/data/artworks";
import { LEGAL } from "@/data/legal";
import { SITE_URL } from "@/lib/site";

/**
 * The address this page is to be indexed under.
 *
 * Hostinger keeps the site reachable under its own preview host as well as
 * under the domain, and two addresses serving the same page can be counted as
 * two pages, splitting whatever either has earned. This names the real one.
 * It sits here rather than in the layout because metadata is inherited: set on
 * the layout, Impressum and Datenschutz would each claim to be the home page.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The two Instagram accounts, in the order they are offered.
 *
 * The second is a different body of work, not a second address for the same
 * one, so it says what it is rather than being listed as an equal alternative:
 * someone here for a drawing of their own car has no reason to follow it, and
 * someone who does want it would otherwise never know it exists.
 */
const INSTAGRAM = [
  { handle: "vectronia_one_art", note: "Autokunst, Auftragsarbeiten und Zeichnungen von Treffen." },
  { handle: "vectronia", note: "Interesse an fantasievolleren Bildern? Die stehen hier." },
];

/**
 * What the site is, written for a machine.
 *
 * A search engine reads the words on the page well enough; what it cannot
 * infer is that "Vectronia One" and the person drawing are the same thing,
 * which is exactly what a search for either name needs to know.
 *
 * The postal address is deliberately only the town. The full one is on the
 * Impressum because the law asks for it there; repeating it in machine-
 * readable form on every page hands it to address harvesters and buys nothing
 * a search for the name does not already get from the locality.
 */
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "Vectronia One",
      inLanguage: "de-DE",
      publisher: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: LEGAL.name,
      alternateName: "Vectronia One",
      jobTitle: "Illustrationsdesignerin",
      url: `${SITE_URL}/`,
      email: `mailto:${LEGAL.email}`,
      image: `${SITE_URL}/og-vectronia-one.jpg`,
      address: {
        "@type": "PostalAddress",
        addressLocality: LEGAL.city.replace(/^\d+\s*/, ""),
        addressCountry: "DE",
      },
      sameAs: INSTAGRAM.map(({ handle }) => `https://www.instagram.com/${handle}/`),
      knowsAbout: [
        "Automobilillustration",
        "Unikat-Zeichnungen",
        "Live-Zeichnen auf Autotreffen",
        "Tuschezeichnung",
      ],
    },
  ],
};

const INTRO_HEADER = "Ein Unikat verdient ein Unikat";

const INTRO_BODY = [
  "Jedes Auto trägt seine eigene Geschichte: wie es entstanden ist, welche Rekorde es gebrochen hat — und fast immer auch die eines Menschen, der sich vorgenommen hatte, genau dieses eine zu besitzen. Durch Zufall, durch jahrelanges Sparen oder durch die eigene Restauration.",
  "Diese Geschichte halte ich fest. Jede Zeichnung entsteht als Einzelanfertigung, von Hand, für ein bestimmtes Fahrzeug. Dieser Prozess garantiert ein Unikat, gerade in einer Zeit, in der sich Bilder beliebig vervielfältigen lassen. So einzigartig wie das Auto selbst, seine Besitzer und die gemeinsamen Wege.",
];

const PROCESS_HEADER = "Der Prozess eines Werkes";

const PROCESS_BODY = [
  "Ein Werk kann auf verschiedenen Wegen entstehen. Nach einem Foto — oder vor Ort, wo ich Details genauer wahrnehme und in Ansicht und Bildaufbau freier bin. Für Autotreffen lasse ich mich buchen und skizziere direkt am Fahrzeug. Ebenso kann eine Vorlage aus meinem Skizzenbuch groß ausgeführt werden, auf Wunsch in einer eigenen Farbgebung.",
  "Gearbeitet wird mit Tinte, Grafitstift, Kohle oder Ölpastellkreide — auf Aquarell-, Stein- und Zeichenpapier oder auf Leinwand.",
  <>
    Aus meiner Sammlung gebe ich außerdem Einzelstücke ab. Kontaktiere mich auch gerne dafür
    mit dem Formular, das du im{" "}
    <a href="#kontakt" className="copy-link">
      Kontakt
    </a>{" "}
    finden kannst.
  </>,
];

const PASSION_HEADER = "Das Ausleben einer Leidenschaft";

const PASSION_BODY = [
  "2020 bin ich von Leverkusen nach Hamburg gezogen. Dort begann meine Ausbildung zur Illustrationsdesignerin an der HTK in Bahrenfeld, die ich Ende 2023 mit dem Diplom abgeschlossen habe. Nun habe ich beschlossen, meine Leidenschaft f\u00fcr Autos mit dieser Arbeit zu verschwei\u00dfen.",
  "Schon als Kind habe ich auf Autofahrten die Stra\u00dfen beobachtet und jede Marke und jedes Modell laut benannt. Als ich dann Serien wie Knight Rider und Transformers zu sehen begann, dachte ich unseren Familienwagen kurzerhand zum Superauto um. Von da an half ich beim Reifenwechsel und bei der Pflege, und 2017 ging er in meinen Besitz \u00fcber \u2014 wo er vermutlich auch bleiben wird.",
  "Inzwischen habe ich einen eigenen Traumwagen vor Augen: einen Datsun 240Z in Blau, genau so einen, wie ich ihn in Japan auf einer Hakone-Tour bereits gemietet habe. Diese Fahrt war wie ein wahr gewordener Traum. Durch meine Arbeit stehe ich mit vielen Autobegeisterten in Kontakt und erfahre, auf wie unterschiedlichen Wegen sie zu ihrem Traumwagen gekommen sind; das inspiriert und motiviert mich immer wieder. Ich w\u00fcnsche mir, dass sich mit meinen Werken die Begeisterung f\u00fcr ein Fahrzeug \u2014 welcher Art auch immer \u2014 genauso wahrhaftig festhalten l\u00e4sst. Denn genau das ist es, was diese Gemeinschaft zusammenh\u00e4lt und besonders macht.",
];

const CONTACT_HEADER = "Sprechen wir über dein Fahrzeug";

const CONTACT_BODY = [
  "Ob nach einem Foto, vor Ort auf einem Treffen oder als gro\u00dfe Ausf\u00fchrung einer Skizzenbuchseite \u2014 schreib mir, was dir vorschwebt. Eine E-Mail-Adresse gen\u00fcgt, alles Weitere kl\u00e4ren wir in Ruhe miteinander.",
];

const WORDMARK_WIDTHS = [640, 1280, 1920, 2560];

/**
 * The cut-out artwork, taken from the supplied heroStart.psd. Its alpha was
 * lifted from that file's car layer and applied to the full-resolution
 * original, keeping the original frame so it registers on the photograph
 * exactly and the car does not shift as it lands.
 */
const CUTOUT_SRC = "/hero/car-1920.webp";
const CUTOUT_SRCSET = [960, 1440, 1920, 2560]
  .map((w) => `/hero/car-${w}.webp ${w}w`)
  .join(", ");

export default function Home() {
  return (
    <main>
      {/*
       * Read by crawlers, invisible to readers. Next renders this as written;
       * the content is ours, so there is nothing here to escape.
       */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <StaticBackdrop revealAfter="#hero" />
      <BrandDrawer
        revealWith="#werke"
        links={[
          { label: "Start" },
          { label: "Werke", targetId: "werke" },
          { label: "Der Prozess eines Werkes", targetId: "prozess" },
          { label: "Das Ausleben einer Leidenschaft", targetId: "leidenschaft" },
          { label: "Kontakt", targetId: "kontakt" },
        ]}
      />

      <HeroStage
        id="hero"
        heading="Vectronia One — Automobilkunst"
        header={INTRO_HEADER}
        body={INTRO_BODY}
        accentHex="#11383b"
        aspect={heroArtwork.aspect}
        artworkAlt={heroArtwork.alt}
        cutoutSrc={CUTOUT_SRC}
        cutoutSrcSet={CUTOUT_SRCSET}
        posterSrc={heroArtwork.src}
        posterSrcSet={heroArtwork.srcSet}
        logo={
          // eslint-disable-next-line @next/next/no-img-element -- pre-rendered renditions of the mark, cut out in Photoshop
          <img
            src="/brand/vectronia-mark-960.webp"
            srcSet="/brand/vectronia-mark-640.webp 640w, /brand/vectronia-mark-960.webp 960w, /brand/vectronia-mark-1440.webp 1440w"
            sizes="(max-width: 768px) 112vw, 114vh"
            alt=""
            width={960}
            height={952}
            fetchPriority="high"
            decoding="async"
            className="h-full w-auto max-w-none"
          />
        }
        wordmark={
          // eslint-disable-next-line @next/next/no-img-element -- pre-rendered renditions of the wordmark, cut out in Photoshop
          <img
            src="/brand/vectronia-one-1920.webp"
            srcSet={WORDMARK_WIDTHS.map((w) => `/brand/vectronia-one-${w}.webp ${w}w`).join(", ")}
            sizes="(max-width: 768px) 90vw, 65vw"
            alt=""
            width={1920}
            height={142}
            decoding="async"
            className="h-auto w-full"
          />
        }
      />

      <KineticGallery id="werke" label="Werke" artworks={galleryArtworks} />

      {/*
       * The same photograph that closes the gallery, shown here in the position
       * the artwork holds in "Ein Unikat verdient ein Unikat" — so it reads as
       * having travelled out of the grid into place.
       */}
      <IntroPanel
        id="prozess"
        artwork={processPhoto}
        header={PROCESS_HEADER}
        body={PROCESS_BODY}
      />

      {/*
       * Two photographs rather than one: Japan first, because that is the trip
       * the closing sentence points back to, and the Opel last, where the text
       * leaves it — in the garage.
       */}
      <IntroPanel
        id="leidenschaft"
        artwork={passionPhotos}
        header={PASSION_HEADER}
        body={PASSION_BODY}
      />

      {/* The page closes mirrored: the copy and the field on the left, the
          sheet on the right, so the last panel reads the other way round. */}
      <IntroPanel
        id="kontakt"
        reversed
        bare
        artwork={contactPhoto}
        header={CONTACT_HEADER}
        body={CONTACT_BODY}
      >
        <ContactForm />

        {/*
         * Under the form rather than beside it: the form is what this section
         * is for, and a link out sitting level with it would compete for the
         * same attention.
         */}
        <div className="mt-12 max-w-[62ch] border-t border-white/10 pt-8">
          <h3 className="font-display text-lg text-fg italic">Auf Instagram</h3>
          <ul className="mt-4 space-y-4">
            {INSTAGRAM.map(({ handle, note }) => (
              <li key={handle}>
                <a
                  href={`https://www.instagram.com/${handle}/`}
                  // A link leaving the site opens in its own tab, and `noopener`
                  // keeps the opened page from reaching back into this one.
                  target="_blank"
                  rel="me noopener noreferrer"
                  className="copy-link font-display text-lg italic"
                >
                  @{handle}
                </a>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted/80">{note}</p>
              </li>
            ))}
          </ul>
        </div>
      </IntroPanel>

      <SiteFooter />
    </main>
  );
}
