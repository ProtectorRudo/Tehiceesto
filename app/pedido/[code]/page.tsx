import {notFound} from "next/navigation";
import type {Metadata} from "next";
import PostPurchase from "@/components/PostPurchase";
export const metadata:Metadata={title:"Tu compra · Te Hice Esto",robots:{index:false,follow:false,nocache:true}};
export const dynamic="force-dynamic";
export default async function PedidoPage({params}:{params:Promise<{code:string}>}){
 const {code}=await params;
 if(!/^[a-f0-9]{18}$/.test(code))notFound();
 return <PostPurchase code={code}/>;
}
