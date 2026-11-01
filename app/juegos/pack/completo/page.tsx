import type {Metadata} from "next";
import PackCompleto from "./PackCompleto";
export const metadata:Metadata={title:"Mis cuatro juegos completos | Te Hice Esto",robots:{index:false,follow:false,nocache:true}};
export default function PackCompletoPage(){return <PackCompleto/>}
