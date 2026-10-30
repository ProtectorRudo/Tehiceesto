"use client";
import {useState} from "react";
export default function CopyReferralLink({url}:{url:string}){
 const [copied,setCopied]=useState(false);
 return <button type="button" onClick={async()=>{
  try{await navigator.clipboard.writeText(url);setCopied(true)}
  catch{setCopied(false)}
 }} aria-label="Copiar mi enlace de influencer"
 style={{marginTop:14,border:"1px solid #dfb9c9",borderRadius:30,background:"#fff6fa",color:"#873c60",font:"700 12px DM Sans,Arial,sans-serif",padding:"12px 17px",cursor:"pointer"}}>
 {copied?"✓ Enlace copiado":"Copiar mi enlace ↗"}
 </button>;
}