import type { Metadata } from "next";
import StudioFooter from "@/components/StudioFooter";
import CreatorWizard from "@/components/CreatorWizard";

export const metadata: Metadata = {
  title: "Crear una experiencia — Te Hice Esto",
  description:
    "Elegí para quién es, contá la historia y armá una primera versión privada de su experiencia.",
};

export default function CreatePage() {
  return (
    <main className="creator-page studio-page">
      <div className="creator-backdrop" />
      <div className="studio-public-intro">
        <span className="studio-eyebrow">UNA HISTORIA QUE MERECE SU LUGAR</span>
        <h1>El regalo más lindo es <em>el que lleva algo de vos.</em></h1>
        <p>Elegí una experiencia y contanos a quién querés sorprender. Lo verdaderamente especial empieza con sus recuerdos.</p>
        <div className="studio-trustbar"><span>Hecho a medida</span><span>Privado y personal</span><span>Para abrir desde el celular</span></div>
      </div>
      <CreatorWizard />
      <StudioFooter />
    </main>
  );
}
