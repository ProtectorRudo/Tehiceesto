import type {Metadata} from "next";
import QuickCheckout from "@/components/QuickCheckout";
import {getExperience} from "@/data/experiences";
export const metadata:Metadata={title:"Comprar Un poquito de mí, cada día · Te Hice Esto",description:"Una compra rápida y siete capítulos personalizables."};
export default function ComprarSieteDias(){
 const experience=getExperience("siete-dias")!;
 return <QuickCheckout experience={experience}/>;
}
