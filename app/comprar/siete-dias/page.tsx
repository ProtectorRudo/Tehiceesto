import type { Metadata } from "next";
import SevenDaysCheckout from "@/components/SevenDaysCheckout";
export const metadata:Metadata={
  title:"Comprar Un poquito de mí, cada día · Te Hice Esto",
  description:"Siete capítulos premium personalizables, uno por cada día. Pago único, experiencia para regalar desde el celular.",
};
export default function SevenDaysCheckoutPage(){return <SevenDaysCheckout/>;}
