"use client";
import {useCallback,useRef} from "react";
type Props={code:string;receiverName:string;senderName:string;config:Record<string,unknown>;photoUrls:string[];voiceUrl?:string|null};
export default function DragonBallGift({code,receiverName,senderName,config,photoUrls,voiceUrl}:Props){
 const frame=useRef<HTMLIFrameElement>(null);
 const send=useCallback(()=>{
  const target=frame.current?.contentWindow;
  if(!target)return;
  target.postMessage({type:"tehiceesto:dragon-ball:gift",payload:{
   ...config,recipientName:receiverName,giverName:senderName,photoUrls,voiceUrl
  }},window.location.origin);
 },[config,receiverName,senderName,photoUrls,voiceUrl]);
 return <main style={{position:"fixed",inset:0,background:"#10245b"}}>
   <iframe ref={frame} onLoad={send} src={"/dragon-ball-pareja.html?mode=gift&code="+encodeURIComponent(code)}
    title={"Dragon Ball · Nuestra Saga para "+receiverName}
    allow="autoplay" style={{width:"100%",height:"100%",border:0,display:"block"}}
   />
 </main>;
}
