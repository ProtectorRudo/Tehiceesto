"use client";

import {useCallback,useEffect,useRef} from "react";

type Props = {
  code: string;
  recipientName: string;
  giverName: string;
  config: Record<string, unknown>;
  photoUrls: string[];
  voiceUrl: string | null;
};

/** The preview must render the same immutable Dragon Ball HTML used by a published gift. */
export default function DragonBallPreview({code,recipientName,giverName,config,photoUrls,voiceUrl}:Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({
      type:"tehiceesto:dragon-ball:gift",
      payload:{...config,recipientName,giverName,photoUrls,voiceUrl},
    },window.location.origin);
  },[config,recipientName,giverName,photoUrls,voiceUrl]);

  useEffect(()=>{send();},[send]);

  return <iframe
    ref={frame}
    onLoad={send}
    src={"/dragon-ball-pareja.html?mode=gift&code="+encodeURIComponent("studio-preview-"+code)}
    title={"Vista previa de Dragon Ball · Nuestra Saga para "+recipientName}
    allow="autoplay"
    style={{width:"100%",height:"min(78dvh,760px)",minHeight:570,border:0,display:"block",background:"#10245b"}}
  />;
}
