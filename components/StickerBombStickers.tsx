"use client";

import styles from "./sticker-bomb-experience.module.css";

/**
 * Sticker art recovered from the original friendship direction: whimsical
 * illustrated cats & dogs, character personalities and tactile speech cards.
 * The editorial/text schema and twelve chapter ids remain unchanged.
 */
const characterCatalog = {
 milo:{name:"Milo",role:"EL DRAMÁTICO",animal:"cat",base:"#e8bc96",shade:"#b7775c",accent:"#c43873"},
 luna:{name:"Luna",role:"LA QUE SABE TODO",animal:"cat",base:"#ddd0c0",shade:"#a9948a",accent:"#8b59bb"},
 bruno:{name:"Bruno",role:"EL DE LOS PLANES",animal:"dog",base:"#edc68f",shade:"#ae7b52",accent:"#489bb0"},
 mora:{name:"Mora",role:"LA CONSEJERA",animal:"cat",base:"#f2cfb4",shade:"#b48382",accent:"#d96688"},
 pipo:{name:"Pipo",role:"EL DE LOS SNACKS",animal:"dog",base:"#dfc4a4",shade:"#ab886d",accent:"#65a997"},
} as const;

const stickers={
 confidente:{character:"mora",title:"TE CUENTO ALGO CORTITO",subtitle:"8 minutos de audio después…",mood:"surprised",extra:"☕"},
 familia:{character:"luna",title:"FAMILIA SIN PAPELES",subtitle:"ADOPCIÓN EMOCIONAL APROBADA",mood:"wink",extra:"♡"},
 memes:{character:"milo",title:"MEME DEALER",subtitle:"EL CONTEXTO ES OPCIONAL",mood:"laugh",extra:"✳"},
 audios:{character:"pipo",title:"UN AUDIO RAPIDITO",subtitle:"Duración: 08:42",mood:"surprised",extra:"♫"},
 plans:{character:"bruno",title:"VOLVEMOS TEMPRANO",subtitle:"JAJAJA, CLARO",mood:"wink",extra:"✈"},
 rescue:{character:"mora",title:"ABRAZOS 24/7",subtitle:"SERVICIO INCONDICIONAL",mood:"warm",extra:"♥"},
 chaos:{character:"milo",title:"¡NO FUE MI IDEA!",subtitle:"HAY PRUEBAS EN MI CONTRA",mood:"surprised",extra:"⚡"},
 moments:{character:"luna",title:"NO PUBLIQUES ESA FOTO",subtitle:"EVIDENCIA CONFIDENCIAL",mood:"shocked",extra:"▧"},
 code:{character:"pipo",title:"YO SÍ ENTENDÍ",subtitle:"HABLAMOS EN STICKERS",mood:"wink",extra:"✳"},
 time:{character:"bruno",title:"¿DÓNDE QUEDAMOS?",subtitle:"COMO SI FUERA AYER",mood:"warm",extra:"∞"},
 future:{character:"milo",title:"PLAN TRANQUILO",subtitle:"QUÉ PODRÍA SALIR MAL",mood:"laugh",extra:"★"},
 letter:{character:"mora",title:"NO ESTOY LLORANDO",subtitle:"SE ME METIÓ UN AMIGO EN EL OJO",mood:"warm",extra:"♡"},
} as const;
export type StickerBombChapterId=keyof typeof stickers;

function IllustratedCharacter({id,mood}:{id:keyof typeof characterCatalog;mood:string}){
 const ch=characterCatalog[id];
 const dog=ch.animal==="dog";
 return <svg className={styles.realStickerIllustration} viewBox="0 0 220 196" fill="none" role="img" aria-label={"Ilustración de "+ch.name}>
  {/* A die-cut silhouette and the illustrated face reproduce the original cat scrapbook language. */}
  <path d={dog?"M55 46Q18 19 15 75L21 120Q29 156 64 164Q110 186 157 164Q202 158 209 113L205 72Q194 24 162 49Q116 13 55 46Z":"M41 82L41 15Q72 25 89 47Q110 40 132 47Q153 23 185 15L185 83Q200 128 173 164Q150 186 110 185Q70 185 47 162Q19 124 41 82Z"} fill="white" stroke="white" strokeWidth="14" strokeLinejoin="round"/>
  <path d={dog?"M55 46Q18 19 15 75L21 120Q29 156 64 164Q110 186 157 164Q202 158 209 113L205 72Q194 24 162 49Q116 13 55 46Z":"M41 82L41 15Q72 25 89 47Q110 40 132 47Q153 23 185 15L185 83Q200 128 173 164Q150 186 110 185Q70 185 47 162Q19 124 41 82Z"} fill={ch.base} stroke="#5f4350" strokeWidth="4" strokeLinejoin="round"/>
  {dog?<><path d="M51 51Q10 44 21 104Q36 123 55 112" fill={ch.shade} stroke="#5f4350" strokeWidth="4"/><path d="M162 51Q214 43 201 106Q186 124 168 112" fill={ch.shade} stroke="#5f4350" strokeWidth="4"/></>:<><path d="M55 41L55 76L82 57Z" fill="#f7dfd9"/><path d="M170 41L141 57L170 76Z" fill="#f7dfd9"/></>}
  <ellipse cx="110" cy="110" rx="66" ry="57" fill={ch.shade} opacity=".35"/>
  <ellipse cx="78" cy="132" rx="14" ry="7" fill="#dd7892" opacity=".55"/>
  <ellipse cx="146" cy="132" rx="14" ry="7" fill="#dd7892" opacity=".55"/>
  {mood==="wink"?<><path d="M68 100Q84 91 94 101" stroke="#45323c" strokeWidth="7" strokeLinecap="round"/><ellipse cx="139" cy="98" rx="8" ry="12" fill="#45323c"/></>:mood==="shocked"?<><ellipse cx="82" cy="100" rx="14" ry="17" fill="white"/><ellipse cx="139" cy="100" rx="14" ry="17" fill="white"/><circle cx="85" cy="100" r="7" fill="#45323c"/><circle cx="137" cy="100" r="7" fill="#45323c"/></>:<><ellipse cx="82" cy="100" rx="8" ry="12" fill="#45323c"/><ellipse cx="139" cy="100" rx="8" ry="12" fill="#45323c"/></>}
  <path d="M100 116Q110 111 121 116L110 127Z" fill="#bd7181" stroke="#805568" strokeWidth="2" strokeLinejoin="round"/>
  {mood==="surprised"||mood==="shocked"?<ellipse cx="110" cy="145" rx="12" ry="15" fill="#633b4b"/>:<path d={mood==="laugh"?"M87 138Q110 173 133 138Z":"M92 139Q110 154 128 139"} stroke="#633b4b" fill={mood==="laugh"?"#633b4b":"none"} strokeWidth="4" strokeLinecap="round"/>}
  {!dog&&<g stroke="#775362" strokeWidth="2.6" strokeLinecap="round"><path d="M63 130L32 123M62 138L27 138M156 130L188 123M157 138L191 138"/></g>}
  <path d="M60 81Q78 72 89 79M132 79Q146 73 160 83" stroke="#735463" strokeWidth="3" strokeLinecap="round" opacity=".45"/>
  {id==="milo"&&<g aria-hidden="true"><path d="M65 91Q80 88 95 93L94 111Q80 118 67 108Z" fill="#292635" stroke="#fff8df" strokeWidth="3"/><path d="M125 93Q141 88 155 91L153 108Q139 118 125 111Z" fill="#292635" stroke="#fff8df" strokeWidth="3"/><path d="M94 98Q110 90 125 98" stroke="#292635" strokeWidth="5"/><path d="M68 97L58 94M154 97L164 94" stroke="#292635" strokeWidth="4" strokeLinecap="round"/></g>}
  {id==="luna"&&<g aria-hidden="true"><path d="M134 55Q115 29 129 23Q144 20 151 43Q160 20 176 28Q185 38 160 54" fill="#d65086" stroke="#fff8f6" strokeWidth="4"/><circle cx="151" cy="48" r="10" fill="#f5ce6c" stroke="#fff8f6" strokeWidth="3"/></g>}
  {id==="bruno"&&<g aria-hidden="true"><path d="M87 58L108 6L139 61Z" fill="#58b8ca" stroke="#fffdf8" strokeWidth="5" strokeLinejoin="round"/><path d="M96 44L129 44" stroke="#f4c665" strokeWidth="8"/><circle cx="108" cy="9" r="8" fill="#ec779a" stroke="#fff" strokeWidth="3"/></g>}
  {id==="mora"&&<g aria-hidden="true"><circle cx="169" cy="57" r="8" fill="#fae26c"/><circle cx="155" cy="57" r="10" fill="#f7a9be" stroke="#fff" strokeWidth="2"/><circle cx="182" cy="57" r="10" fill="#f7a9be" stroke="#fff" strokeWidth="2"/><circle cx="169" cy="43" r="10" fill="#f7a9be" stroke="#fff" strokeWidth="2"/><circle cx="169" cy="71" r="10" fill="#f7a9be" stroke="#fff" strokeWidth="2"/><circle cx="169" cy="57" r="9" fill="#f9dc7d"/></g>}
  {id==="pipo"&&<g aria-hidden="true"><path d="M63 65Q63 18 113 23Q161 23 166 65Z" fill="#669d83" stroke="#fff9eb" strokeWidth="5"/><path d="M56 69Q108 55 178 66Q160 88 63 78Z" fill="#457962" stroke="#fff9eb" strokeWidth="4"/><circle cx="111" cy="44" r="9" fill="#f5d881"/></g>}
  <path d="M178 35l8 11 13-6-7 14 11 9-15-1-5 14-3-15-15-2 14-8Z" fill={ch.accent} stroke="white" strokeWidth="4" strokeLinejoin="round"/>
 </svg>;
}

export default function StickerBombStickers({chapter,personalLine,collected,onCollect}:{chapter:string;personalLine?:string;collected:boolean;onCollect:()=>void;}){
 if(!(chapter in stickers))return null;
 const id=chapter as StickerBombChapterId;
 const item=stickers[id],character=characterCatalog[item.character];
 return <section className={styles.realStickerSection} aria-label={"Sticker interactivo de "+character.name}>
  <div className={styles.realStickerPaper}>
   <div className={styles.realStickerHeader}><span>STICKER Nº {String(Object.keys(stickers).indexOf(id)+1).padStart(2,"0")}</span><span>COLECCIÓN · {character.role}</span></div>
   <div className={styles.realStickerGrid}>
    <button
     className={styles.realStickerButton+(collected?" "+styles.realStickerCollected:"")}
     style={{"--stickerAccent":character.accent} as React.CSSProperties}
     type="button"
     aria-pressed={collected}
     aria-label={(collected?"Volver a pegar":"Despegar")+" el sticker de "+character.name+": "+item.title}
     onClick={onCollect}>
      <span className={styles.realStickerDieCut}>
       <span className={styles.realStickerExtra} aria-hidden="true">{item.extra}</span>
       <IllustratedCharacter id={item.character} mood={item.mood}/>
       <strong className={styles.realStickerTag}>{item.title}</strong>
      </span>
      <span className={styles.realStickerTap}>{collected?"✓ DESPEGADO":"TOCÁ PARA DESPEGAR ↗"}</span>
    </button>
    <div className={styles.realStickerMessage} aria-live="polite">
     <span className={styles.realStickerEyebrow}>{collected?"STICKER DESBLOQUEADO":"ESPERANDO QUE LO DESPEGUES..."}</span>
     <div className={styles.realStickerBubble}><span aria-hidden="true">❝</span><p>{collected?item.subtitle:"Este sticker tiene algo para decirte. Tocá el personaje para descubrirlo."}</p></div>
     {collected&&personalLine&&<p className={styles.realStickerPersonal}>{personalLine}</p>}
     <span className={styles.realStickerSignature}>— {character.name}, {character.role.toLowerCase()}</span>
    </div>
   </div>
  </div>
 </section>;
}
