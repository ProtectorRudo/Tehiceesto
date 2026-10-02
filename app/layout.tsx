import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Te Hice Esto — Un regalo que no se abre. Se vive.",
  description:
    "Experiencias digitales personalizadas con fotos, cartas, recuerdos, juegos y sorpresas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            TE HICE ESTO<span>♥</span>
          </Link>
          <nav>
            <Link href="/#experiencias">Experiencias</Link>
            <Link href="/crear">Crear regalo</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
