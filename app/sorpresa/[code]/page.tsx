import {notFound} from "next/navigation";
import type {Metadata} from "next";
import ExtraLetter from "@/components/ExtraLetter";
export const metadata:Metadata={title:"Una carta para vos · Te Hice Esto",robots:{index:false,follow:false,nocache:true}};
export const dynamic="force-dynamic";
export default async function ExtraPage({params}:{params:Promise<{code:string}>}){
 const {code}=await params;
 if(!/^[a-f0-9]{18}$/.test(code))notFound();
 return <ExtraLetter code={code}/>;
}
