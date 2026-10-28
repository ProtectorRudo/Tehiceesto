import type { Metadata } from "next";
import GuestVoicePage from "./GuestVoicePage";

export const metadata: Metadata = {
  title: "Dejá tu voz · Te Hice Esto",
  description: "Una invitación privada para grabar un mensaje de voz especial.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function VoiceInvitePage() {
  return <GuestVoicePage />;
}
