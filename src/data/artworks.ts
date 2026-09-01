import generated from "./artworks.generated.json";

/**
 * Editorial metadata for the artworks.
 *
 * Dimensions and renditions come from `artworks.generated.json`, which
 * `scripts/build-artwork.py` rewrites from the source PSDs. Titles, captions
 * and alt text are authored here so re-running the script never overwrites
 * them — and so a missing description fails the build rather than shipping an
 * unlabelled image.
 */
export type ArtworkCopy = {
  title: string;
  /** Medium and year, shown under the title. */
  meta: string;
  /** Describes what is drawn, for anyone who cannot see it. */
  alt: string;
};

export type Artwork = ArtworkCopy & {
  slug: string;
  width: number;
  height: number;
  aspect: number;
  src: string;
  srcSet: string;
};

const COPY: Record<string, ArtworkCopy> = {
  "buch4-5": {
    title: "Coupé in Blaugrau",
    meta: "Tusche und Aquarell, 2016",
    alt: "Aquarell- und Tuschezeichnung eines Coupés der 1970er Jahre in Dreiviertelansicht von vorn links, in Blau- und Grautönen auf weißem Papier.",
  },
  tinte1: {
    title: "Porsche in Ocker",
    meta: "Tusche laviert",
    alt: "Lavierte Tuschezeichnung eines Porsche-Sportwagens in Ockertönen; der Schriftzug „Porsche“ ist in dieselbe Linie eingeflochten.",
  },
  tinte2: {
    title: "GT-R in Rot",
    meta: "Tusche laviert",
    alt: "Lavierte Tuschezeichnung eines Nissan GT-R von vorn in Rottönen; der Schriftzug „Nissan“ läuft aus der Seitenlinie heraus.",
  },
  tinte3: {
    title: "Corvette in Blau",
    meta: "Tusche laviert",
    alt: "Lavierte Tuschezeichnung einer Chevrolet Corvette aus erhöhter Perspektive in Blautönen; der Schriftzug „Corvette“ überlagert die Karosserie.",
  },
  l: {
    title: "Kleinwagen mit Rauchwolke",
    meta: "Ölpastell, 2013",
    alt: "Ölpastellzeichnung eines gelben Kleinwagens vor rosafarbenem Grund, dahinter eine violett-blaue Rauch- oder Wolkenformation.",
  },
  skizze: {
    title: "Keilform",
    meta: "Bleistift",
    alt: "Schnelle Bleistiftskizze eines keilförmigen Supersportwagens der 1970er Jahre von schräg hinten, signiert.",
  },
  buch3: {
    title: "Limousinen-Studien",
    meta: "Skizzenbuch, Bleistift",
    alt: "Aufgeschlagene Skizzenbuch-Doppelseite mit vier Bleistiftstudien klassischer Limousinen und Coupés aus verschiedenen Blickwinkeln, mit handschriftlichen Notizen.",
  },
  "buch3-1": {
    title: "Japanese Cars",
    meta: "Skizzenbuch, Bleistift",
    alt: "Skizzenbuch-Doppelseite mit japanischen Fahrzeugen — unter anderem ein Coupé, ein Roadster mit der Aufschrift „S 800“ und ein Kombi — dazu die gezeichneten Schriftzüge „Trueno“, „Honda“ und „Subaru“.",
  },
  buch4: {
    title: "Pantera und Kombi",
    meta: "Skizzenbuch, Bleistift",
    alt: "Skizzenbuch-Doppelseite mit einem keilförmigen Sportwagen, einem großen amerikanischen Kombi und einer Detailstudie einer Radkappe.",
  },
  "buch4-5-1": {
    title: "Continent",
    meta: "Skizzenbuch, Bleistift",
    alt: "Skizzenbuch-Doppelseite mit zahlreichen Fahrzeugstudien um einen diagonalen Schriftzug „Continent“ herum angeordnet.",
  },
  "buch4-5-2": {
    title: "Tomcat",
    meta: "Skizzenbuch, Bleistift",
    alt: "Skizzenbuch-Doppelseite mit einer detaillierten Bleistiftstudie eines Kampfflugzeugs vom Typ F-14 Tomcat, darüber ein keilförmiger Sportwagen.",
  },
  buch5: {
    title: "The only place that matters is first",
    meta: "Skizzenbuch, Bleistift",
    alt: "Großformatige Bleistiftstudie zweier Formel-1-Rennwagen in Nahaufnahme über eine Skizzenbuch-Doppelseite, darunter das handschriftliche Zitat „The only place that matters is first“.",
  },
  buch6: {
    title: "911 und Turbo 2",
    meta: "Skizzenbuch, Bleistift",
    alt: "Skizzenbuch-Doppelseite mit einem Porsche 911 in Dreiviertelansicht und zwei Studien eines Rallye-Kleinwagens mit ausgestellten Kotflügeln.",
  },
  "buch6-1": {
    title: "Mittelmotor",
    meta: "Skizzenbuch, Bleistift",
    alt: "Skizzenbuch-Doppelseite mit einer großformatigen Bleistiftstudie eines modernen Mittelmotor-Hypersportwagens von schräg vorn.",
  },
  buch8: {
    title: "Wiesmann",
    meta: "Skizzenbuch, Bleistift",
    alt: "Skizzenbuch-Doppelseite mit einem Roadster in Dreiviertelansicht, darüber eine Reihe gezeichneter Rundinstrumente und der Schriftzug „Wiesmann“.",
  },
};

/** Order of the plates in the gallery — deliberate, not the file-system order. */
const ORDER = [
  "tinte1",
  "tinte2",
  "tinte3",
  "l",
  "buch5",
  "buch8",
  "buch6",
  "buch6-1",
  "buch3-1",
  "buch3",
  "buch4",
  "buch4-5-1",
  "buch4-5-2",
  "skizze",
];

type GeneratedArtwork = {
  slug: string;
  source: string;
  width: number;
  height: number;
  aspect: number;
  widths: number[];
};

const bySlug = new Map((generated as GeneratedArtwork[]).map((a) => [a.slug, a]));

function build(slug: string): Artwork {
  const asset = bySlug.get(slug);
  if (!asset) {
    throw new Error(
      `Artwork "${slug}" is listed but missing from artworks.generated.json — re-run scripts/build-artwork.py.`,
    );
  }
  const copy = COPY[slug];
  if (!copy) {
    throw new Error(`Artwork "${slug}" has no title or alt text in src/data/artworks.ts.`);
  }
  return {
    ...copy,
    slug,
    width: asset.width,
    height: asset.height,
    aspect: asset.aspect,
    src: `/artwork/${slug}-${asset.widths[asset.widths.length - 1]}.webp`,
    srcSet: asset.widths.map((w) => `/artwork/${slug}-${w}.webp ${w}w`).join(", "),
  };
}

/** The plate shown in the hero. */
export const heroArtwork = build("buch4-5");

/**
 * The photograph that closes the gallery and carries the process panel.
 *
 * Not part of the generated manifest: it is a photograph rather than one of
 * the scanned drawings, and it is pinned last rather than taking a place in
 * the reading order above.
 */
export const processPhoto: Artwork = {
  slug: "artstalking",
  title: "Vor Ort",
  meta: "Fotografie",
  alt: "Eine zeichnende Person hält ein aufgeschlagenes Skizzenbuch mit zwei Fahrzeugstudien; dahinter steht auf einer Oldtimermesse ein hellblauer Kombi der 1970er Jahre.",
  width: 1531,
  height: 1018,
  aspect: 1.5039,
  src: "/artwork/artstalking-1440.webp",
  srcSet: "/artwork/artstalking-960.webp 960w, /artwork/artstalking-1440.webp 1440w",
};

/** Everything else, in reading order, with the photograph pinned to the end. */
export const galleryArtworks = [...ORDER.map(build), processPhoto];
