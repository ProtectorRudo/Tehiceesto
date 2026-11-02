"use client";

import {useCallback,useEffect,useRef} from "react";

type Props = {
  code: string;
  recipientName: string;
  giverName: string;
  config: Record<string, unknown>;
  photoUrls: string[];
  voiceUrl: string | null;
  onPhotoClick?: (slot: number) => void;
};

/** The preview must render the same immutable Dragon Ball HTML used by a published gift. */
export default function DragonBallPreview({code,recipientName,giverName,config,photoUrls,voiceUrl,onPhotoClick}:Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const photoHandler = useRef(onPhotoClick);
  useEffect(()=>{photoHandler.current=onPhotoClick;},[onPhotoClick]);
  const handleLoad = useCallback(() => {
    send();
    const doc=frame.current?.contentDocument;
    if(!doc)return;
    // Editor-only capture: prevent the model\u0027s flipMemory handler from
    // rebuilding the scene and scrolling the preview back to the top.
    doc.addEventListener("click",(event:globalThis.MouseEvent)=>{
      const target=event.target;
      if(!(target instanceof doc.defaultView!.Element))return;
      const card=target.closest(".origin-panels .polaroid");
      if(!card)return;
      const cards=Array.from(doc.querySelectorAll(".origin-panels .polaroid"));
      const slot=cards.indexOf(card);
      if(slot<0||slot>2)return;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      photoHandler.current?.(slot);
    },true);
  },[send]);
  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({
      type:"tehiceesto:dragon-ball:gift",
      payload:{...config,recipientName,giverName,photoUrls,voiceUrl},
    },window.location.origin);
  },[config,recipientName,giverName,photoUrls,voiceUrl]);

  useEffect(()=>{send();},[send]);

  return <iframe
    ref={frame}
    onLoad={handleLoad}
    src={"/dragon-ball-pareja.html?mode=gift&code="+encodeURIComponent("studio-preview-"+code)}
    title={"Vista previa de Dragon Ball · Nuestra Saga para "+recipientName}
    allow="autoplay"
    style={{width:"100%",height:"min(78dvh,760px)",minHeight:570,border:0,display:"block",background:"#10245b"}}
  />;
}
