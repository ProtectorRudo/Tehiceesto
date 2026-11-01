import type {Metadata} from "next";
import QuickCheckout from "@/components/QuickCheckout";
export const metadata:Metadata={title:"Pack de 4 Juegos · $25.000 ARS | Te Hice Esto",description:"Trazo Cómplice, Entre Dos, Cómplices y Meme Match completos con un solo pago. Las salas de escape se venden por separado."};
export default function ComprarPack(){return <QuickCheckout experience={{slug:"pack-juegos",title:"El Pack para Jugar Juntos",short:"Cuatro juegos completos, un solo celular y una sola compra.",eyebrow:"Pack de 4 Juegos"}}/>}
