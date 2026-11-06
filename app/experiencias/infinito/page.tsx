import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "El problema más lindo del universo · Te Hice Esto",
  description: "Una expedición imposible que hace reír, sorprende y revela un regalo personal en siete descubrimientos.",
  robots: { index: false, follow: false },
};

/** MODELO DE EXPERIENCIA, no un regalo individual.
 * La fuente visual/funcional es /infinito/odisea.js + odisea.css.
 * Las instancias personalizadas cambian solo THI_INFINITO_CONFIG
 * (recipient, sender, memories, photo, note, signature, recording).
 * Ningún checkout ni experiencia vendida se modifica en esta preview.
 */
export default function InfinitoPage() {
  return (
    <>
      <link rel="stylesheet" href="/infinito/odisea.css?v=3" />
      <div id="infinito-app">
        <p style={{ minHeight: "100svh", display: "grid", placeItems: "center", margin: 0, background: "#070b19", color: "#f8efe6", fontFamily: "Georgia,serif" }}>
          Preparando una expedición para vos… ✦
        </p>
      </div>
      <Script src="/infinito/odisea.js?v=3" strategy="afterInteractive" />
    </>
  );
}
