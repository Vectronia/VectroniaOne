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

export const metadata: Metadata = {
  title: "Vectronia",
  description:
    "Vectronia — Automobilkunst zwischen Zeichenstift und Zeitgeschichte.",
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
