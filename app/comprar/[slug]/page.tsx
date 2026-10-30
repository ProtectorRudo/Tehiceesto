import {notFound} from "next/navigation";
import type {Metadata} from "next";
import QuickCheckout from "@/components/QuickCheckout";
import {publicExperiences} from "@/data/experiences";

type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;
 const experience=publicExperiences.find(e=>e.slug===slug);
 return {title:experience?"Comprar "+experience.title+" · Te Hice Esto":"Experiencia · Te Hice Esto"};
}
export default async function ComprarExperiencia({params}:Props){
 const {slug}=await params;
 const experience=publicExperiences.find(e=>e.slug===slug);
 if(!experience||slug==="frasco365")notFound();
 return <QuickCheckout experience={experience}/>;
}
