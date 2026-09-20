import type { Metadata } from "next";
import { EB_Garamond, Lato } from "next/font/google";
import "./globals.css";

// DESIGN.md › Typography. UI text is Lucida Grande (the system Aqua font) on
// Macs; Lato is the open-source humanist fallback for machines without Lucida
// Grande, so non-Mac browsers still read as Aqua rather than default sans.
const garamond = EB_Garamond({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-eb-garamond" });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-lato" });

export const metadata: Metadata = {
  title: "Y2K OS — Patina",
  description: "Taste packs for AI coding agents. Y2K is pack #1.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-tone="pink" className={`${garamond.variable} ${lato.variable}`}>
      <body>{children}</body>
    </html>
  );
}
