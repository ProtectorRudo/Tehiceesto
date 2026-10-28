import type { Metadata } from "next";
import TodaviaExperience from "@/components/TodaviaExperience";
import "./todavia.css";

export const metadata: Metadata = {
  title: "TODAVÍA — El museo de los recuerdos que aún no vivimos | Te Hice Esto",
  description: "Una experiencia romántica cinematográfica. Tres recuerdos, una sala imposible y un futuro que todavía no existe.",
  robots: { index: false, follow: false },
};

export default function TodaviaPage() {
  return <TodaviaExperience />;
}