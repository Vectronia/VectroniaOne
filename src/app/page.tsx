import { BrandDrawer } from "@/components/ui/brand-drawer";
import { HeroStage } from "@/components/ui/hero-stage";
import { IntroPanel } from "@/components/ui/intro-panel";
import { KineticGallery } from "@/components/ui/kinetic-gallery";
import { StaticBackdrop } from "@/components/ui/static-backdrop";
import { galleryArtworks, heroArtwork } from "@/data/artworks";

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
        revealWith="#inhalt"
        links={[
          { label: "Start" },
          { label: "Ein Unikat verdient ein Unikat", targetId: "inhalt" },
          { label: "Werke", targetId: "werke" },
          { label: "Der Prozess eines Werkes", targetId: "prozess" },
        ]}
      />

      <HeroStage
        id="hero"
        heading="Vectronia One — Automobilkunst"
        accentHex="#11383b"
        aspect={heroArtwork.aspect}
        artworkAlt={heroArtwork.alt}
        cutoutSrc={CUTOUT_SRC}
        cutoutSrcSet={CUTOUT_SRCSET}
        posterSrc={heroArtwork.src}
        posterSrcSet={heroArtwork.srcSet}
        logo={
          // eslint-disable-next-line @next/next/no-img-element -- pre-rendered renditions of the Illustrator mark
          <img
            src="/brand/vectronia-mark-960.webp"
            srcSet="/brand/vectronia-mark-640.webp 640w, /brand/vectronia-mark-960.webp 960w"
            sizes="(max-width: 768px) 58vh, 114vh"
            alt=""
            width={960}
            height={952}
            fetchPriority="high"
            decoding="async"
            className="h-full w-auto max-w-none"
          />
        }
        wordmark={
          // eslint-disable-next-line @next/next/no-img-element -- pre-rendered renditions of the Illustrator wordmark
          <img
            src="/brand/vectronia-one-1920.webp"
            srcSet={WORDMARK_WIDTHS.map((w) => `/brand/vectronia-one-${w}.webp ${w}w`).join(", ")}
            sizes="(max-width: 768px) 86vw, 65vw"
            alt=""
            width={1728}
            height={128}
            decoding="async"
            className="h-auto w-full"
          />
        }
      />

      <IntroPanel id="inhalt" artwork={heroArtwork} header={INTRO_HEADER} body={INTRO_BODY} />

      <KineticGallery id="werke" label="Werke" artworks={galleryArtworks} />

      {/*
       * PLACEHOLDER artwork — this panel is meant to carry the photograph of
       * the sketchbook being drawn at a show, which is also to sit last in the
       * gallery and travel into this position. That file has not arrived; the
       * uploads hold no raster image at all. Swapping it is one prop.
       */}
      <IntroPanel
        id="prozess"
        artwork={heroArtwork}
        header={PROCESS_HEADER}
        body={PROCESS_BODY}
      />
    </main>
  );
}
