import type { Metadata } from "next";
import Jar365Checkout from "@/components/Jar365Checkout";
export const metadata:Metadata={title:"Regalá 365 papelitos · Te Hice Esto",description:"Un frasco digital con 365 frases genuinas para abrir durante un año."};
export default function ComprarFrasco365(){return <Jar365Checkout/>;}
