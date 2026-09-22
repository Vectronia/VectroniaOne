import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Supplied with the layout as a TTF, so it is served from the repo rather
// than fetched from Google Fonts.
const quattrocento = localFont({
  src: "./fonts/Quattrocento-Regular.ttf",
  variable: "--font-quattrocento",
  weight: "400",
  style: "normal",
  display: "swap",
});

const TITLE = "Vectronia One \u2013 Auto-Illustratorin f\u00fcr Unikat-Zeichnungen";
const DESCRIPTION =
  "Autokunst als Unikat, von Hand gezeichnet \u2013 nach Foto oder live auf Autotreffen und Events. Echtes Handwerk, ein Geschenk f\u00fcr Autofans.";

/*
 * Written to the room the search result actually gives, measured in the font
 * Google sets them in: the title comes to 508px against a cut-off near 600,
 * the description to 865px against about 920. Both stay whole rather than
 * ending in an ellipsis.
 *
 * The keywords sit in the sentences instead of being listed. Strung together
 * as a title they measured 1278px \u2014 more than twice the width shown \u2014 so
 * everything after the third would have been cut anyway, and Google rewrites
 * titles it reads as a keyword list.
 */
/**
 * The absolute address the social image is resolved against.
 *
 * The page is prerendered, so Next resolves `og:image` at build time and has
 * no request to take the host from: without this it writes localhost into the
 * tag and no shared link shows a picture. The live domain is the default, so
 * a plain build is already correct; NEXT_PUBLIC_SITE_URL overrides it for a
 * preview or staging deployment.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vectronia-one.de";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // Names the artist for the "author" line search engines and readers show.
  authors: [{ name: "Vectronia One" }],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "de_DE",
    siteName: "Vectronia One",
    images: [
      {
        url: "/og-vectronia-one.jpg",
        width: 1200,
        height: 630,
        alt: "Tuschezeichnung eines Coup\u00e9s der 1970er Jahre, darunter der Schriftzug Vectronia One.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-vectronia-one.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // No maximumScale / userScalable: pinch-zoom must stay available.
  themeColor: "#071119",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${cormorant.variable} ${quattrocento.variable}`}>
      <body className="antialiased">
        <a
          href="#inhalt"
          className="sr-only rounded-md focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-amber focus:px-4 focus:py-2 focus:font-medium focus:text-ink-deep"
        >
          Zum Inhalt springen
        </a>
        {children}
      </body>
    </html>
  );
}
