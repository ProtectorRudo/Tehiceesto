import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "CÓMPLICES — Demo gratis de un desafío | Te Hice Esto",
  description: "Una bóveda, dos personas y un solo celular. Probá gratis el primer desafío de CÓMPLICES; los seis restantes están reservados para la edición completa.",
};

export default function ComplicesDemo() {
  redirect("/juegos/complices/demo.html");
}
