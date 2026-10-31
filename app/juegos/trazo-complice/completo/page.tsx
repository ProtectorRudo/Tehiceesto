import type {Metadata} from "next";import TrazoCompleto from "./TrazoCompleto";
export const metadata:Metadata={title:"Trazo Cómplice completo · Te Hice Esto",description:"Juego completo para quienes compraron Trazo Cómplice.",robots:{index:false,follow:false,nocache:true}};
export default function JuegoCompleto(){return <TrazoCompleto/>}