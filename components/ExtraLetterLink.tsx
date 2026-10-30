"use client";
import {useEffect,useState} from "react";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
export default function ExtraLetterLink({code}:{code:string}){
 const [active,setActive]=useState(false);
 useEffect(()=>{
  let alive=true;
  if(!url||!key)return;
  void fetch(url+"/functions/v1/upsell-api",{
    method:"POST",cache:"no-store",headers:{"apikey":key,"content-type":"application/json"},
    body:JSON.stringify({action:"status",code})
  }).then(r=>r.ok?r.json():null).then(d=>{if(alive)setActive(Boolean(d?.letterReady));}).catch(()=>{});
  return()=>{alive=false;};
 },[code]);
 if(!active)return null;
 return <a href={"/sorpresa/"+code}
  style={{position:"fixed",bottom:"max(18px, env(safe-area-inset-bottom))",left:14,zIndex:120,
  textDecoration:"none",display:"inline-flex",alignItems:"center",gap:7,color:"#7e435e",
  font:"700 12px Arial,sans-serif",background:"#fff9f1eb",border:"1px solid #e5c4cf",padding:"11px 15px",
  borderRadius:35,boxShadow:"0 7px 23px #643e5029",maxWidth:"calc(100% - 28px)"}}>
  ♡ Una carta más para vos
 </a>;
}
