import type {Metadata} from "next";
import QuickCheckout from "@/components/QuickCheckout";
export const metadata:Metadata={title:"Desbloquear Trazo Cómplice · Te Hice Esto",description:"Comprá Trazo Cómplice completo con 1.274 palabras para dibujar y adivinar con un solo teléfono."};
export default function ComprarTrazo(){return <QuickCheckout experience={{slug:"trazo-complice",title:"Trazo Cómplice — versión completa",short:"1.274 palabras, 11 categorías, 3 niveles. Un solo celular, todas las rondas.",eyebrow:"Juego completo"}}/>}
