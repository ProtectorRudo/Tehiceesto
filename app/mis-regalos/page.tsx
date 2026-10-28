import type { Metadata } from "next";
import AccountPortal from "./AccountPortal";

export const metadata: Metadata = {
  title: "Mis regalos · Te Hice Esto",
  description: "Tu espacio privado para guardar, personalizar y compartir experiencias.",
  robots: { index: false, follow: false, nocache: true },
};

export default function MyGiftsPage() {
  return <AccountPortal />;
}
