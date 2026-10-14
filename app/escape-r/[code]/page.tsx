import {notFound} from "next/navigation";
import EscapeFrame from "@/components/EscapeFrame";
import {getEscapeRoom,validateEscapeConfig} from "@/data/escape-rooms";
import {createAdminSupabase} from "@/lib/supabase/admin";
export const dynamic="force-dynamic";
export const metadata={robots:{index:false,follow:false,noarchive:true},title:"Una experiencia privada · Te Hice Esto"};
export default async function PrivateEscape({params}:{params:Promise<{code:string}>}){
 const {code}=await params;
 if(!/^[a-f0-9]{18}$/.test(code))notFound();
 const {data,error}=await createAdminSupabase().from("gifts").select("experience_slug,story_data,status,expires_at").eq("public_code",code).eq("status","published").maybeSingle();
 if(error||!data)notFound();
 if(data.expires_at&&new Date(data.expires_at).getTime()<Date.now())notFound();
 const room=getEscapeRoom(data.experience_slug.replace(/^escape-/,""));
 if(!room||data.experience_slug!=="escape-"+room.slug)notFound();
 const raw=data.story_data&&typeof data.story_data==="object"&&!Array.isArray(data.story_data)?data.story_data.escapeConfig:null;
 if(!raw||typeof raw!=="object"||Array.isArray(raw))notFound();
 let config:Record<string,string>;
 try{config=validateEscapeConfig(room,raw as Record<string,unknown>)}catch{notFound()}
 return <EscapeFrame room={room} config={config} customer/>;
}
