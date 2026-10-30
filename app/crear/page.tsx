import type { Metadata } from "next";
import StudioFooter from "@/components/StudioFooter";
import CreatorWizard from "@/components/CreatorWizard";
import "./selection-grid.css";

export const metadata: Metadata = {
  title: "Elegí tu experiencia — Te Hice Esto",
  description:
    "Descubrí nuestras experiencias personalizables en una cuadrícula con demos interactivas y elegí tu regalo.",
};

export default function CreatePage() {
  return (
    <main className="creator-page studio-page">
      <div className="creator-backdrop" />
      <div className="studio-public-intro">
        <span className="studio-eyebrow">UNA HISTORIA QUE MERECE SU LUGAR</span>
        <h1>El regalo más lindo es <em>el que lleva algo de vos.</em></h1>
        <p>Elegí una experiencia, dejá tu email y WhatsApp y pagá. Después la personalizamos para esa persona.</p>
        <div className="studio-trustbar"><span>Hecho a medida</span><span>Privado y personal</span><span>Para abrir desde el celular</span></div>
      </div>
      <CreatorWizard />
      <StudioFooter />
    </main>
  );
}
