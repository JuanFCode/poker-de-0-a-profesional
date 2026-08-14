import type { Metadata } from "next";
import { Bodoni_Moda, IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "De 0 a profesional · Curso de poker",
    template: "%s · Poker de 0 a profesional",
  },
  description:
    "Ruta completa y gratuita para aprender Texas Hold'em: reglas claras, estrategia preflop y postflop, matemáticas de mesa, bankroll y herramientas para practicar.",
  keywords: ["poker", "texas holdem", "estrategia", "rangos", "pot odds", "bankroll", "curso"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${bodoni.variable} ${newsreader.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col">
        <div className="relative z-10 flex min-h-full flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
