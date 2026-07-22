import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const siteUrl = "https://pilotresto.pro";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PilotResto — Le copilote IA conçu pour les restaurateurs",
    template: "%s — PilotResto",
  },
  description:
    "PilotResto centralise vos opérations, connecte vos outils et aide votre restaurant à fonctionner plus efficacement. La plateforme SaaS nouvelle génération pour restaurateurs modernes.",
  keywords: [
    "logiciel gestion restaurant",
    "plateforme SaaS restaurant",
    "gestion des commandes restaurant",
    "gestion de salle restaurant",
    "analyse performance restaurant",
    "SaaS restauration",
  ],
  authors: [{ name: "PilotResto" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "PilotResto",
    title: "PilotResto — Le copilote IA conçu pour les restaurateurs",
    description:
      "Centralisez vos opérations, connectez vos outils et pilotez votre restaurant depuis une seule interface.",
    images: ["/brand/social-share.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PilotResto — Le copilote IA conçu pour les restaurateurs",
    description:
      "Centralisez vos opérations, connectez vos outils et pilotez votre restaurant depuis une seule interface.",
    images: ["/brand/social-share.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${inter.variable} ${geistMono.variable}`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
