"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Experience } from "@/data/experiences";
import type { SceneTextOverrides } from "@/data/scene-text";
import "./seven-days.css";

export const sevenDaysTitles = [
  "Asalto de besos", "Ridículamente besable", "El caso del corazón robado",
  "Abrazo de emergencia", "El privilegio de tus besos", "Hay algo que confesarte",
  "Todo lo que sos para mí",
] as const;

export type SevenDaysProps = {
  experience: Experience;
  sceneTextOverrides?: SceneTextOverrides;
  photoMedia?: {url:string;caption?:string}[];
  audioMedia?: {url:string;caption?:string}[];
  singleDay?: number;
  editing?: boolean;
  onTextSelect?: (selection:{scene:string;source:string;current:string})=>void;
};

function safeScript(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g,"\\u003e").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
}

export default function SevenDaysExperience({
  experience, sceneTextOverrides = {}, photoMedia = [], audioMedia = [],
  singleDay, editing = false, onTextSelect,
}: SevenDaysProps) {
  const [day, setDay] = useState(singleDay || 1);
  const [markup, setMarkup] = useState("");
  const [error, setError] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const currentDay = singleDay || day;
  const copy = sceneTextOverrides["day"+currentDay] || {};
  const copyJson = JSON.stringify(copy);
  const mediaJson = JSON.stringify({photos:photoMedia.map(x=>x.url),audio:audioMedia.map(x=>x.url)});
  const config = useMemo(() => {
    const media = JSON.parse(mediaJson) as {photos:string[];audio:string[]};
    return {
      recipient:experience.demoRecipient,
      sender:experience.demoGiver,
      // Day 7 has real image/audio slots; all other scenes retain their approved artwork.
      finalPhotos:media.photos.slice(0,4),
      finalAudio:media.audio[0] || "",
      days:{},
    };
  },[experience.demoRecipient,experience.demoGiver,mediaJson]);

  useEffect(() => {
    let alive = true;
    setMarkup("");
    setError(false);
    fetch("/siete-dias/dia-"+String(currentDay).padStart(2,"0")+".html")
      .then(async response => {
        if (!response.ok) throw new Error("chapter_unavailable");
        return response.text();
      })
      .then(source => {
        if (!alive) return;
        const setup = `<script>
window.TEHICEESTO_GIFT = ${safeScript(config)};
window.__TEHICEESTO_COPY = ${copyJson.replace(/</g,"\\u003c")};
(function() {
  const copy=window.__TEHICEESTO_COPY;
  const apply=function(root){
    if (!root) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while ((node=walker.nextNode())) {
      const parent=node.parentElement;
      if (!parent || parent.closest('script,style,svg,textarea')) continue;
      const raw=node.nodeValue || '';
      const trimmed=raw.trim();
      if (Object.prototype.hasOwnProperty.call(copy,trimmed)) {
        const replacement=copy[trimmed];
        if (typeof replacement==='string' && replacement!==trimmed) {
          node.nodeValue=raw.replace(trimmed,replacement);
        }
      }
    }
  };
  const init=()=>{
    apply(document.body);
    const observer=new MutationObserver(mutations=>{
      for(const m of mutations) {
        if(m.type==='characterData') apply(m.target.parentElement);
        else for(const node of m.addedNodes) if(node.nodeType===1) apply(node);
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
<\/script>`;
        setMarkup(source.replace("</head>", setup+"</head>"));
      })
      .catch(() => alive && setError(true));
    return () => { alive=false; };
  },[currentDay,config,copyJson]);

  const attachEditor = () => {
    if (!editing || !onTextSelect) return;
    const doc=frameRef.current?.contentDocument;
    if (!doc) return;
    doc.addEventListener("click", (event) => {
      const target=event.target as Element | null;
      if (!target || target.closest("script,style,svg")) return;
      const el=target.closest("button,h1,h2,h3,p,span,em,b,strong,small,label,div") || target;
      const walker=doc.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      let node=walker.nextNode();
      while (node && !(node.nodeValue||"").trim()) node=walker.nextNode();
      const visible=(node?.nodeValue||"").trim();
      if (!visible || visible.length>5000) return;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      const source=Object.entries(copy).find(([,value])=>value===visible)?.[0]||visible;
      onTextSelect({scene:"day"+currentDay,source,current:copy[source]??visible});
    }, true);
  };

  return <main className="seven-days-experience experience-shell" data-current-scene={"day"+currentDay}>
    {!singleDay && <nav className="seven-days-nav" aria-label="Elegir sorpresa de la semana">
      <div className="seven-days-nav-brand"><b>TE HICE ESTO <span>♥</span></b><small>UN POQUITO DE MÍ, CADA DÍA</small></div>
      <div className="seven-days-nav-count">DÍA {String(currentDay).padStart(2,"0")} / 07</div>
      <div className="seven-days-nav-controls">
        <button type="button" aria-label="Día anterior" disabled={day===1} onClick={()=>setDay(x=>Math.max(1,x-1))}>‹</button>
        <button type="button" aria-label="Día siguiente" disabled={day===7} onClick={()=>setDay(x=>Math.min(7,x+1))}>›</button>
      </div>
    </nav>}
    {!singleDay && <div className="seven-days-tabs" aria-label="Siete capítulos">
      {sevenDaysTitles.map((title,i)=><button type="button" key={title} className={currentDay===i+1?"active":""} onClick={()=>setDay(i+1)} aria-current={currentDay===i+1?"step":undefined}>{String(i+1).padStart(2,"0")}</button>)}
    </div>}
    {editing && <p className="seven-days-edit-hint">MODO EDICIÓN · Tocá cualquier frase del capítulo para personalizarla.</p>}
    {error && <p className="seven-days-error" role="alert">No se pudo cargar el capítulo. Reintentá la página.</p>}
    {!error && <iframe
      key={currentDay+"-"+String(editing)}
      ref={frameRef}
      className="seven-days-frame"
      title={"Día "+currentDay+": "+sevenDaysTitles[currentDay-1]}
      srcDoc={markup}
      onLoad={attachEditor}
      sandbox="allow-scripts allow-same-origin"
      allow="autoplay"
    />}
  </main>;
}
