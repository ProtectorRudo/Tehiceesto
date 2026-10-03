import type { Metadata, Viewport } from "next";
import Link from "next/link";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tehiceesto.com"),
  title: "Te Hice Esto — Un regalo que se vive",
  description:
    "Convertimos fotos, audios, cartas y recuerdos en experiencias digitales privadas creadas para una sola persona.",
  openGraph: {
    title: "Te Hice Esto — Un regalo que se vive",
    description:
      "Experiencias digitales privadas hechas con recuerdos reales y diseñadas para una sola persona.",
    url: "https://tehiceesto.com",
    siteName: "Te Hice Esto",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Te Hice Esto — Un regalo que se vive",
    description:
      "Fotos, audios, cartas y recuerdos convertidos en una experiencia creada para una sola persona.",
  },
};

export const viewport: Viewport = {
  themeColor: "#080709",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <Link className="brand brand-studio" href="/">
            <strong>TE HICE ESTO<span>♥</span></strong>
            <small>experiencias privadas</small>
          </Link>
          <nav>
            <Link href="/#experiencias">Experiencias</Link>
            <Link href="/#como-funciona">Cómo funciona</Link>
            <Link className="header-create" href="/crear">Crear una →</Link>
          </nav>
        </header>
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
