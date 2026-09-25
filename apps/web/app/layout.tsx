import type { Metadata } from "next";
import { EB_Garamond, Lato } from "next/font/google";
import "./globals.css";

// DESIGN.md › Typography. UI text is Lucida Grande (the system Aqua font) on
// Macs; Lato is the open-source humanist fallback for machines without Lucida
// Grande, so non-Mac browsers still read as Aqua rather than default sans.
const garamond = EB_Garamond({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-eb-garamond" });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-lato" });

// Where this copy of the site lives (next.config.ts). The share card
// (opengraph-image.jpg) and the page's address are made absolute from it;
// Next sets the base path in front of the card's path itself, so the base
// carries it only where the build has none. The card's title, description
// and Twitter's large card follow from the rest.
const SITE = `${process.env.NEXT_PUBLIC_SITE}/`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_PATH ? "/" : SITE, SITE),
  title: "Patina OS — Aqua × millennium for coding agents",
  description: "Put Patina's DESIGN.md in a project and your coding agent builds Mac OS X Aqua in a millennium tone, not Inter on a grey card.",
  openGraph: { type: "website", url: SITE, siteName: "Patina OS", locale: "en_GB" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-tone="pink" className={`${garamond.variable} ${lato.variable}`}>
      <body>{children}</body>
    </html>
  );
}
