import type {Metadata} from "next";
import {redirect} from "next/navigation";
export const metadata:Metadata={title:"Meme Match · Demo gratis de 8 parejas | Te Hice Esto",description:"Probá gratis el duelo de memoria para dos en un solo celular: ocho parejas de memes. El Pack completo incluye 48 parejas diferentes y tableros de hasta 96 cartas."};
export default function MemeMatchDemo(){redirect("/juegos/meme-match/demo.html");}
