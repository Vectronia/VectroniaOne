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
  /** Technique and support, shown under the title. */
  meta: string;
  /** Paper weight and sheet size, shown under the medium. Absent where unknown. */
  format?: string;
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
  tinte1: {
    title: "Porsche 911 mit integriertem Schriftzug",
    meta: "Tinte auf feinkörnigem Aquarellpapier",
    format: "300 g/m² · 29,7 × 42 cm",
    alt: "Lavierte Tuschezeichnung eines Porsche 911 in Ockertönen; der Schriftzug „Porsche“ ist in dieselbe Linie eingeflochten.",
  },
  tinte2: {
    title: "Nissan GT-R mit integriertem Schriftzug",
    meta: "Tinte auf feinkörnigem Aquarellpapier",
    format: "300 g/m² · 29,7 × 42 cm",
    alt: "Lavierte Tuschezeichnung eines Nissan GT-R von vorn in Rottönen; der Schriftzug „Nissan“ läuft aus der Seitenlinie heraus.",
  },
  tinte3: {
    title: "Chevrolet Corvette Stingray mit integriertem Schriftzug",
    meta: "Tinte auf feinkörnigem Aquarellpapier",
    format: "300 g/m² · 29,7 × 42 cm",
    alt: "Lavierte Tuschezeichnung einer Chevrolet Corvette Stingray aus erhöhter Perspektive in Blautönen; der Schriftzug „Corvette“ überlagert die Karosserie.",
  },
  volvo: {
    title: "Volvo 145 Kombi",
    meta: "Aquarell auf feinkörnigem Aquarellpapier",
    format: "300 g/m² · 29,7 × 42 cm",
    alt: "Zeichnung eines orangefarbenen Volvo 145 Kombi auf einem Blatt: hinten die Seitenansicht, davor groß die Dreiviertelansicht von vorn mit dem Volvo-Emblem im Kühlergrill.",
  },
  volvo2: {
    title: "Volvo Amazon",
    meta: "Aquarell auf feinkörnigem Aquarellpapier",
    format: "300 g/m² · 29,7 × 42 cm",
    alt: "Zeichnung eines schwarzen Volvo Amazon in drei Studien: Dreiviertelansicht von vorn, Heckansicht und ein Blick in den Innenraum mit rot gepolsterten Sitzen und großem Lenkrad.",
  },
  volvo3: {
    title: "Citroën ID",
    meta: "Aquarell auf feinkörnigem Aquarellpapier",
    format: "300 g/m² · 29,7 × 42 cm",
    alt: "Zeichnung einer hellgrünen Citroën ID mit der Startnummer 4 in Dreiviertelansicht von vorn; darüber verläuft eine gepunktete Route von „Berlin“ nach „Peking“.",
  },
  l: {
    title: "Ford Ka mit Meeresschnecke",
    meta: "Ölpastellkreide auf feinkörnigem Aquarellpapier",
    format: "300 g/m² · 29,7 × 42 cm",
    alt: "Ölpastellzeichnung eines gelb-orangen Ford Ka in Dreiviertelansicht von vorn links vor rosafarbenem Grund; dahinter windet sich eine violett-blaue Form wie eine Meeresschnecke.",
  },
  buch5: {
    title: "Formel-1-Tribut an Max Verstappen",
    meta: "Polychromos-Stift auf gebundenem Skizzenpapier",
    alt: "Großformatige Studie über eine Skizzenbuch-Doppelseite: zwei Formel-1-Rennwagen dicht hintereinander in Nahaufnahme, darunter das handschriftliche Zitat „The only place that matters is first — M. Verstappen“.",
  },
  buch8: {
    title: "Wiesmann MF 4S Roadster mit Logo-Tribut",
    meta: "Polychromos-Stift auf gebundenem Skizzenpapier",
    alt: "Skizzenbuch-Doppelseite mit einem Wiesmann MF 4S Roadster in Dreiviertelansicht, darüber eine Reihe gezeichneter Rundinstrumente und der Schriftzug „Wiesmann“.",
  },
  buch6: {
    title: "Porsche 911 Typ 953 und Renault 5 Turbo",
    meta: "Polychromos-Stift auf gebundenem Skizzenpapier",
    alt: "Skizzenbuch-Doppelseite mit einem Porsche 911 Typ 953 in Dreiviertelansicht und zwei Studien eines Renault 5 Turbo mit ausgestellten Kotflügeln.",
  },
  "buch6-1": {
    title: "Aston Martin Valhalla",
    meta: "Polychromos-Stift auf gebundenem Skizzenpapier",
    alt: "Skizzenbuch-Doppelseite mit einer großformatigen Studie eines Aston Martin Valhalla von schräg vorn.",
  },
  "buch3-1": {
    title: "Tribut an den japanischen Markt",
    meta: "Polychromos-Stift auf gebundenem Skizzenpapier",
    alt: "Skizzenbuch-Doppelseite mit japanischen Fahrzeugen — unter anderem ein Coupé, ein Roadster mit der Aufschrift „S 800“ und ein Kombi — dazu die gezeichneten Schriftzüge „Trueno“, „Honda“ und „Subaru“.",
  },
  buch3: {
    title: "Studien nach Mercedes-Benz",
    meta: "Polychromos-Stift auf gebundenem Skizzenpapier",
    alt: "Aufgeschlagene Skizzenbuch-Doppelseite mit vier Studien klassischer Mercedes-Benz-Modelle aus verschiedenen Blickwinkeln, dazu handschriftliche Notizen.",
  },
  buch4: {
    title: "Holz am Chrysler Town & Country, im Kontrast ein DeTomaso",
    meta: "Polychromos-Stift auf gebundenem Skizzenpapier",
    alt: "Skizzenbuch-Doppelseite mit einem Chrysler Town & Country, dessen Holzbeplankung ausgearbeitet ist, daneben zum Kontrast ein keilförmiger DeTomaso und eine Detailstudie einer Radkappe.",
  },
  "buch4-5-1": {
    title: "Eigene Kreationen als Inhaltsverzeichnis",
    meta: "Polychromos-Stift auf gebundenem Skizzenpapier",
    alt: "Skizzenbuch-Doppelseite als Inhaltsverzeichnis: eigene Fahrzeugentwürfe rund um den diagonalen Schriftzug „CONTENT“ angeordnet, dazu die Skizze eines Motorrads mit der Aufschrift „CBF 500“.",
  },
  "buch4-5-2": {
    title: "F-14 Tomcat mit einem Pantera",
    meta: "Polychromos-Stift auf gebundenem Skizzenpapier",
    alt: "Skizzenbuch-Doppelseite mit einer detaillierten Studie eines Kampfflugzeugs vom Typ F-14 Tomcat, darüber ein keilförmiger DeTomaso Pantera.",
  },
  skizze: {
    title: "Lamborghini Countach",
    meta: "Bleistift auf Steinpapier",
    format: "192 g/m² · 14,8 × 10,5 cm",
    alt: "Schnelle Bleistiftskizze eines Lamborghini Countach von schräg hinten, signiert.",
  },
  "buch4-5": {
    title: "Coupé in Blaugrau",
    meta: "Tusche und Aquarell",
    alt: "Aquarell- und Tuschezeichnung eines Coupés der 1970er Jahre in Dreiviertelansicht von vorn links, in Blau- und Grautönen auf weißem Papier.",
  },
};

/**
 * Order of the plates in the gallery — deliberate, not the file-system order.
 *
 * Sorted by technique the seven coloured sheets filled the first two rows and
 * left everything after them graphite. They now sit on positions 1, 3, 6, 8,
 * 11, 13 and 16, which was searched rather than guessed: every row of three
 * carries colour, the three columns hold 3/2/3 of them so none reads as a
 * stripe, the two columns of the narrow grid hold 4/4, and the gaps alternate
 * evenly. The strongest sheets are spaced apart within that, so the Ford Ka
 * and the two ink drawings never meet.
 */
const ORDER = [
  "tinte1",
  "buch5",
  "volvo3",
  "buch8",
  "buch6",
  "l",
  "buch6-1",
  "volvo2",
  "buch3-1",
  "buch3",
  "tinte2",
  "buch4",
  "tinte3",
  "buch4-5-1",
  "buch4-5-2",
  "volvo",
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

/**
 * The two photographs that carry "Das Ausleben einer Leidenschaft".
 *
 * Like the process photograph these stay out of the generated manifest: they
 * are pictures of a person and a car, not plates, and they never appear in the
 * gallery. Both sources are around 1.5k wide, so they ship at 960 and 1440.
 */
export const passionPhotos: Artwork[] = [
  {
    slug: "japan-datsun",
    title: "Fairlady",
    meta: "Fotografie, Hakone",
    alt: "Die Zeichnerin lehnt l\u00e4chelnd auf der Motorhaube eines blauen Datsun 240Z; im Hintergrund eine bewaldete H\u00fcgelkette in Hakone.",
    width: 1748,
    height: 1166,
    aspect: 1.4991,
    src: "/photo/japan-datsun-1440.webp",
    srcSet: "/photo/japan-datsun-960.webp 960w, /photo/japan-datsun-1440.webp 1440w",
  },
  {
    slug: "konfeti",
    title: "Konfeti",
    meta: "Fotografie",
    alt: "Ein schwarzer Opel Vectra B Caravan mit goldenen Felgen und dem Kennzeichen \u201eKONFETI\u201c steht in Dreiviertelansicht von vorn auf einem Sandweg zwischen D\u00fcnengras.",
    width: 1536,
    height: 1024,
    aspect: 1.5,
    src: "/photo/konfeti-1440.webp",
    srcSet: "/photo/konfeti-960.webp 960w, /photo/konfeti-1440.webp 1440w",
  },
];

/** Everything else, in reading order, with the photograph pinned to the end. */
export const galleryArtworks = [...ORDER.map(build), processPhoto];
