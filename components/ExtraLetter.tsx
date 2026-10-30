"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import "./extra-letter.css";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
export default function ExtraLetter({code}:{code:string}){
 const [text,setText]=useState("");
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  if(!url||!key){setLoading(false);return;}
  void fetch(url+"/functions/v1/upsell-api",{
   method:"POST",cache:"no-store",headers:{"apikey":key,"content-type":"application/json"},
   body:JSON.stringify({action:"read-letter",code})
  }).then(async r=>r.ok?r.json():null).then(d=>{if(d&&typeof d.text==="string")setText(d.text);}).catch(()=>{}).finally(()=>setLoading(false));
 },[code]);
 return <main className="extra-letter-shell">
  <header><Link href={"/r/"+code}>← Volver a mi regalo</Link><span>TE HICE ESTO ♡</span></header>
  <article className="extra-letter-paper">
   <span className="extra-letter-eyebrow">ALGO MÁS QUE QUERÍA DECIRTE</span>
   <h1>Una carta <em>solo para vos.</em></h1>
   {loading?<p>Abriendo tu carta…</p>:text?<p className="extra-letter-body">{text}</p>:<p>Esta carta todavía no está disponible.</p>}
   <div className="extra-letter-signature">Con cariño ♡</div>
  </article>
 </main>;
}
