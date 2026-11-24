import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getExperience} from "@/data/experiences";
import Jar365FreeVisit from "@/components/Jar365FreeVisit";
export const metadata:Metadata={title:"Un año de cosas lindas — Vista especial",robots:{index:false,follow:false,nocache:true},referrer:"no-referrer"};
export default function FreeJar365Page(){
 const experience=getExperience("frasco365");
 if(!experience)notFound();
 return <Jar365FreeVisit experience={experience}/>;
}
