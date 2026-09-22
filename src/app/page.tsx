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

const INTRO_HEADER = "Ein Unikat verdient ein Unikat";

const INTRO_BODY = [
  "Jedes Auto trägt seine eigene Geschichte: wie es entstanden ist, welche Rekorde es gebrochen hat — und fast immer auch die eines Menschen, der sich vorgenommen hatte, genau dieses eine zu besitzen. Durch Zufall, durch jahrelanges Sparen oder durch die eigene Restauration.",
  "Diese Geschichte halte ich fest. Jede Zeichnung entsteht als Einzelanfertigung, von Hand, für ein bestimmtes Fahrzeug — und bleibt ein Unikat, gerade in einer Zeit, in der sich Bilder beliebig vervielfältigen lassen. So einzigartig wie das Auto selbst, seine Besitzer und die gemeinsamen Wege.",
];

const PROCESS_HEADER = "Der Prozess eines Werkes";

const PROCESS_BODY = [
  "Ein Werk kann auf verschiedenen Wegen entstehen. Nach einem Foto — oder vor Ort, wo ich Details genauer wahrnehme und in Ansicht und Bildaufbau freier bin. Für Autotreffen lasse ich mich buchen und skizziere direkt am Fahrzeug. Ebenso kann eine Vorlage aus meinem Skizzenbuch groß ausgeführt werden, auf Wunsch in einer eigenen Farbgebung.",
  "Gearbeitet wird mit Tinte, Grafitstift, Kohle oder Ölpastellkreide — auf Aquarell-, Stein- und Zeichenpapier oder auf Leinwand.",
  "Aus meiner Sammlung gebe ich außerdem Einzelstücke ab. Preise für Einzelaufträge auf Anfrage.",
];

const PASSION_HEADER = "Das Ausleben einer Leidenschaft";

const PASSION_BODY = [
  "2020 bin ich von Leverkusen nach Hamburg gezogen. Dort begann meine Ausbildung zur Illustrationsdesignerin an der HTK in Bahrenfeld, die ich Ende 2023 mit dem Diplom abgeschlossen habe. Nun habe ich beschlossen, meine Leidenschaft f\u00fcr Autos mit dieser Arbeit zu verschwei\u00dfen.",
  "Schon als Kind habe ich auf Autofahrten die Stra\u00dfen beobachtet und jede Marke und jedes Modell laut benannt \u2014 zum Leidwesen meiner Eltern. Als ich dann Serien wie Knight Rider und Transformers zu sehen begann, dachte ich unseren Familienwagen kurzerhand zum Superauto um. Von da an half ich beim Reifenwechsel und bei der Pflege, und 2017 ging er in meinen Besitz \u00fcber \u2014 wo er vermutlich auch bleiben wird.",
  "Inzwischen habe ich einen eigenen Traumwagen vor Augen: einen Datsun 240Z in Blau, genau so einen, wie ich ihn in Japan auf einer Hakone-Tour bereits gemietet habe. Diese Fahrt hat den Wunsch nur unterstrichen. Durch meine Arbeit stehe ich mit vielen Autobegeisterten in Kontakt und erfahre, auf wie unterschiedlichen Wegen sie zu ihrem Traumwagen gekommen sind; das inspiriert und motiviert mich immer wieder. Ich w\u00fcnsche mir, dass sich mit meinen Werken die Begeisterung f\u00fcr ein Fahrzeug \u2014 welcher Art auch immer \u2014 genauso wahrhaftig festhalten l\u00e4sst. Denn genau das ist es, was diese Gemeinschaft zusammenh\u00e4lt und besonders macht.",
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
      </IntroPanel>

      <SiteFooter />
    </main>
  );
}
