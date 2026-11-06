import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Hasta el infinito… y un poquito más · Te Hice Esto",
  description: "Una experiencia romántica interactiva que se descubre tocando la Tierra, el Sol y el universo hasta llegar a algo inmenso.",
  robots: { index: false, follow: false },
};

/** Source of truth: public/infinito/experience.js + experience.css.
 * Demo content is configurable via THI_INFINITO_CONFIG (recipient, giver, finalLetter, signoff, photoUrl, audioUrl).
 * Never customize the structure/animation for purchased instances. */
export default function InfinitoPage() {
  return (
    <>
      <link rel="stylesheet" href="/infinito/experience.css?v=2" />
      <div id="infinito-app"><p style={{ minHeight: "100vh", background: "#070b18", color: "#f8efe3", display: "grid", placeItems: "center", margin: 0 }}>Preparando un pequeño universo para vos…</p></div>
      <Script src="/infinito/experience.js?v=2" strategy="afterInteractive" />
    </>
  );
}
