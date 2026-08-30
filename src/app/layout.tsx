import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";

import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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
    <html lang="de" className={`${cormorant.variable} ${montserrat.variable}`}>
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
