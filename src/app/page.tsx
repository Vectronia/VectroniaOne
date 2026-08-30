import { HeroScrub } from "@/components/ui/hero-scrub";
import { IntroPanel } from "@/components/ui/intro-panel";
import { KineticGallery } from "@/components/ui/kinetic-gallery";
import { StaticBackdrop } from "@/components/ui/static-backdrop";
import { galleryArtworks, heroArtwork } from "@/data/artworks";

const INTRO_HEADER = "Ein Unikat verdient ein Unikat";

const INTRO_BODY = [
  "Jedes Auto trägt seine eigene Geschichte: wie es entstanden ist, welche Rekorde es gebrochen hat — und fast immer auch die eines Menschen, der sich vorgenommen hatte, genau dieses eine zu besitzen. Durch Zufall, durch jahrelanges Sparen oder durch die eigene Restauration.",
  "Diese Geschichte halte ich fest. Jede Zeichnung entsteht als Einzelanfertigung, von Hand, für ein bestimmtes Fahrzeug — und bleibt ein Unikat, gerade in einer Zeit, in der sich Bilder beliebig vervielfältigen lassen. So einzigartig wie das Auto selbst, seine Besitzer und die gemeinsamen Wege.",
];

/**
 * Both hero titles are brand artwork rather than text. They sit inside
 * `aria-hidden` wrappers and carry `alt=""`; the section's real heading is
 * rendered for assistive tech by HeroScrub itself.
 */
const WORDMARK_WIDTHS = [640, 1280, 1920, 2560];

export default function Home() {
  return (
    <main>
      <StaticBackdrop revealAfter="#hero" />

      <HeroScrub
        id="hero"
        heading="Vectronia One — Automobilkunst"
        accentHex="#11383b"
        posterSrc={heroArtwork.src}
        posterSrcSet={heroArtwork.srcSet}
        posterSizes="(max-width: 768px) 96vw, min(96vw, 96svh)"
        posterAlt={heroArtwork.alt}
        // Wordmark sits left of centre from the start.
        titleTopClassName="justify-start pl-[3vw] md:pl-[5vw]"
        titleTop={
          // eslint-disable-next-line @next/next/no-img-element -- pre-rendered renditions of the Illustrator wordmark
          <img
            src="/brand/vectronia-one-1920.webp"
            srcSet={WORDMARK_WIDTHS.map((w) => `/brand/vectronia-one-${w}.webp ${w}w`).join(", ")}
            sizes="(max-width: 768px) 88vw, 74vw"
            alt=""
            width={1728}
            height={128}
            fetchPriority="high"
            decoding="async"
            className="h-auto w-[88vw] max-w-[62rem] md:w-[74vw]"
          />
        }
        // The mark is oversized and overhangs the right edge at rest; the
        // parting tween slides it fully into frame before wiping it off.
        titleBottomClassName="justify-end pr-[2vw]"
        titleBottomRestX="16vw"
        titleBottom={
          // eslint-disable-next-line @next/next/no-img-element -- pre-rendered renditions of the Illustrator mark
          <img
            src="/brand/vectronia-mark-640.webp"
            srcSet="/brand/vectronia-mark-320.webp 320w, /brand/vectronia-mark-640.webp 640w, /brand/vectronia-mark-960.webp 960w"
            sizes="(max-width: 768px) 11rem, 20rem"
            alt=""
            width={960}
            height={952}
            decoding="async"
            className="h-[clamp(8rem,22vh,14rem)] w-auto"
          />
        }
      />

      <IntroPanel id="inhalt" artwork={heroArtwork} header={INTRO_HEADER} body={INTRO_BODY} />

      <KineticGallery label="Werke" artworks={galleryArtworks} />
    </main>
  );
}
