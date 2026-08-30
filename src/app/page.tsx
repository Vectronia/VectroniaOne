
import { HeroScrub } from "@/components/ui/hero-scrub";

const HERO_WIDTHS = [960, 1440, 1920, 2560];

export default function Home() {
  return (
    <main>
      <HeroScrub
        heading="Vectronia — Automobilkunst"
        titleTop="Vectronia"
        titleBottom="Classics"
        posterSrc="/hero/capri-1920.webp"
        posterSrcSet={HERO_WIDTHS.map((w) => `/hero/capri-${w}.webp ${w}w`).join(", ")}
        posterSizes="(max-width: 768px) 96vw, min(96vw, 128svh)"
        posterAlt="Aquarell- und Tuschezeichnung eines Coupés der 1970er Jahre in Dreiviertelansicht, signiert und auf 2016 datiert."
        accentHex="#12303f"
      />

      <section
        id="inhalt"
        className="relative bg-[image:var(--gradient-page)] px-6 py-24 md:py-32"
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- pre-rendered renditions; the metallic mesh does not survive SVG export */}
          <img
            src="/brand/vectronia-lockup-1040.webp"
            srcSet="/brand/vectronia-lockup-520.webp 520w, /brand/vectronia-lockup-1040.webp 1040w"
            sizes="min(80vw, 26rem)"
            alt="Vectronia"
            width={1040}
            height={605}
            loading="lazy"
            decoding="async"
            className="h-auto w-[min(80vw,26rem)]"
          />
          <p className="max-w-[60ch] text-balance text-fg-muted md:text-lg">
            Platzhalter für den ersten Inhaltsabschnitt. Er steht hier, damit der
            Übergang aus dem Hero sichtbar wird — Text und Struktur folgen, sobald
            du sie freigibst.
          </p>
        </div>
      </section>
    </main>
  );
}
