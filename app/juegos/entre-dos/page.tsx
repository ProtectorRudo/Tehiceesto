import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ENTRE DOS — Demo gratis de 9 cartas | Te Hice Esto",
  description: "Jugá una muestra gratis de ENTRE DOS para parejas: nueve preguntas fijas, tres etapas y una revelación final. La edición completa incluye 90 cartas.",
};

export default function EntreDosDemoPage() {
  redirect("/juegos/entre-dos/demo.html");
}
