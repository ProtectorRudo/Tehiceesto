"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Memory = { title: string; date: string; words: string; image: string };
type Story = { to: string; from: string; promise: string; memories: Memory[] };

const initialStory: Story = {
  to: "Sofía",
  from: "Julián",
  promise: "Todos los lugares que todavía nos esperan.",
  memories: [
    { title: "El comienzo", date: "CAPÍTULO I", words: "Hay días que parecen normales, hasta que conocés a alguien que lo cambia todo.", image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1000&auto=format&fit=crop&q=82" },
    { title: "El instante eterno", date: "CAPÍTULO II", words: "Algunas miradas duran apenas un segundo. Otras se quedan a vivir en nosotros.", image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1000&auto=format&fit=crop&q=82" },
    { title: "Nuestro lugar", date: "CAPÍTULO III", words: "Descubrí que el hogar no siempre es una casa. A veces, es una persona.", image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1000&auto=format&fit=crop&q=82" },
  ],
};

const stages = ["La invitación", "El museo", "Los recuerdos", "La sala imposible", "El futuro"];
const stars = Array.from({ length: 25 }, (_, i) => ({
  left: `${(i * 41.7 + 11) % 100}%`,
  top: `${(i * 29.3 + 7) % 90}%`,
  delay: `${(i % 9) * -0.66}s`,
  size: `${1 + (i % 3)}px`,
}));
const clean = (value: string, limit = 80) => value.replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, limit);
const xml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function Ornament({ size = 40 }: { size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100" fill="none"><path d="M50 5 C53 38 62 47 95 50 C62 53 53 62 50 95 C47 62 38 53 5 50 C38 47 47 38 50 5Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="50" cy="50" r="7" fill="currentColor"/><path d="M50 0V14M50 86V100M0 50H14M86 50H100" stroke="currentColor" opacity=".55"/></svg>;
}

function MuseumObject({ kind }: { kind: number }) {
  if (kind === 0) return <svg className="td-object td-camera" viewBox="0 0 210 170" fill="none" aria-hidden="true"><defs><linearGradient id="tdCamera" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#dfc99c"/><stop offset=".28" stopColor="#6c5a44"/><stop offset=".8" stopColor="#1e211e"/><stop offset="1" stopColor="#a58752"/></linearGradient><radialGradient id="tdLens"><stop stopColor="#aab7b0"/><stop offset=".23" stopColor="#1c3438"/><stop offset=".75" stopColor="#070f15"/><stop offset="1" stopColor="#987b4b"/></radialGradient></defs><rect x="34" y="40" width="141" height="91" rx="14" fill="url(#tdCamera)" stroke="#bba477" strokeWidth="2"/><rect x="52" y="26" width="50" height="21" rx="5" fill="#6d624e" stroke="#c7b181"/><rect x="144" y="30" width="20" height="12" rx="3" fill="#b6a17a"/><circle cx="108" cy="84" r="39" fill="#302d26" stroke="#d2bd8c" strokeWidth="4"/><circle cx="108" cy="84" r="30" fill="url(#tdLens)" stroke="#3c4743" strokeWidth="5"/><circle cx="108" cy="84" r="11" fill="#0a1e29" stroke="#9da99f"/><circle cx="154" cy="59" r="6" fill="#ede1b6"/><path d="M44 117h120" stroke="#c6b183" opacity=".5"/></svg>;
  if (kind === 1) return <svg className="td-object td-watch" viewBox="0 0 210 170" fill="none" aria-hidden="true"><defs><linearGradient id="tdGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f7dc9d"/><stop offset=".5" stopColor="#8b6639"/><stop offset="1" stopColor="#f2d38e"/></linearGradient></defs><circle cx="108" cy="91" r="61" fill="#302b23" stroke="url(#tdGold)" strokeWidth="12"/><circle cx="108" cy="91" r="48" fill="#eee4cf" stroke="#9b845e" strokeWidth="2"/><circle cx="108" cy="91" r="3" fill="#6d5631"/>{Array.from({length:12},(_,i)=>{let a=i*Math.PI/6;return <line key={i} x1={108+Math.sin(a)*37} y1={91-Math.cos(a)*37} x2={108+Math.sin(a)*43} y2={91-Math.cos(a)*43} stroke="#665638" strokeWidth="2"/>})}<path d="M108 91L103 58M108 91l24 13" stroke="#605036" strokeWidth="3" strokeLinecap="round"/><rect x="96" y="13" width="24" height="19" rx="8" stroke="url(#tdGold)" strokeWidth="6"/><circle cx="108" cy="10" r="7" stroke="#bca16b" strokeWidth="3"/></svg>;
  return <svg className="td-object td-key" viewBox="0 0 210 170" fill="none" aria-hidden="true"><defs><linearGradient id="tdKey" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f3da99"/><stop offset=".48" stopColor="#6a4d2d"/><stop offset="1" stopColor="#d5ad68"/></linearGradient></defs><g transform="rotate(-40 105 85)" stroke="url(#tdKey)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"><circle cx="105" cy="40" r="23"/><circle cx="105" cy="40" r="10" strokeWidth="3"/><path d="M105 64V139h20v-14h-20m0-16h-14"/></g></svg>;
}

export default function TodaviaExperience() {
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState<number[]>([]);
  const [story, setStory] = useState<Story>(initialStory);
  const [editing, setEditing] = useState(false);
  const [sound, setSound] = useState(false);
  const [charge, setCharge] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [photoOverrides, setPhotoOverrides] = useState<string[]>([]);
  const audioRef = useRef<AudioContext | null>(null);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overrideRef = useRef<string[]>([]);

  useEffect(() => () => { overrideRef.current.forEach((url) => URL.revokeObjectURL(url)); audioRef.current?.close().catch(() => {}); }, []);
  const tone = useCallback((notes = [440, 554.37, 659.25]) => {
    if (!sound || typeof window === "undefined") return;
    try {
      const Ctx = window.AudioContext;
      if (!Ctx) return;
      const ctx = audioRef.current && audioRef.current.state !== "closed" ? audioRef.current : new Ctx();
      audioRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();
      notes.forEach((hz, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = "sine"; osc.frequency.value = hz;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.09 + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.55 + i * 0.07);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.07); osc.stop(ctx.currentTime + 1.65 + i * 0.07);
      });
    } catch { /* Visual experience remains fully usable without audio. */ }
  }, [sound]);

  const enter = () => { tone([293.66, 440, 587.33]); setStep(1); };
  const viewMemory = (index: number) => { setActive(index); tone(); setStep(2); setSeen((old) => old.includes(index) ? old : [...old, index]); };
  const proceed = () => { if (seen.length < 3) return; tone([392, 493.88, 783.99]); setStep(3); };
  const reset = () => { if (holdRef.current) clearTimeout(holdRef.current); setCharge(false); setCompleted(false); setSeen([]); setStep(0); };
  const finish = () => { if (holdRef.current) clearTimeout(holdRef.current); holdRef.current = null; setCharge(false); setCompleted(true); tone([293.66, 369.99, 440, 587.33]); setStep(4); };
  const startHold = () => { if (holdRef.current || completed) return; setCharge(true); holdRef.current = setTimeout(finish, 1650); };
  const cancelHold = () => { if (holdRef.current) clearTimeout(holdRef.current); holdRef.current = null; setCharge(false); };

  const updateMemory = (index: number, field: "title" | "words", value: string) => {
    setStory((old) => ({ ...old, memories: old.memories.map((m, i) => i === index ? { ...m, [field]: value.slice(0, field === "title" ? 45 : 180) } : m) }));
  };
  const uploadPhoto = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 6 * 1024 * 1024) { event.target.value = ""; return; }
    const url = URL.createObjectURL(file); overrideRef.current.push(url);
    setPhotoOverrides((prev) => { const next = [...prev]; next[index] = url; return next; });
  };
  const download = () => {
    if (typeof document === "undefined") return;
    const to = xml(clean(story.to, 40) || "Vos"); const from = xml(clean(story.from, 40) || "Alguien que te ama");
    const promise = xml(clean(story.promise, 100) || "Todo lo que todavía nos espera");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1520" viewBox="0 0 1080 1520"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0a1515"/><stop offset="1" stop-color="#1d2924"/></linearGradient></defs><rect width="1080" height="1520" fill="url(#b)"/><rect x="65" y="65" width="950" height="1390" rx="24" fill="none" stroke="#c9ab72" stroke-width="3"/><rect x="83" y="83" width="914" height="1354" rx="18" fill="none" stroke="#c9ab72" stroke-opacity=".4"/><text x="540" y="230" font-size="32" letter-spacing="12" text-anchor="middle" fill="#cbb989" font-family="Georgia">TE HICE ESTO</text><text x="540" y="630" font-size="128" text-anchor="middle" fill="#f9f0db" font-family="Georgia">TODAVÍA</text><text x="540" y="710" font-size="24" letter-spacing="4" text-anchor="middle" fill="#b9a988" font-family="Arial">EL MUSEO DE LO QUE NOS ESPERA</text><path d="M310 785h460" stroke="#bba475"/><text x="540" y="910" font-size="52" text-anchor="middle" fill="#f5e9d0" font-family="Georgia">${to} + ${from}</text><text x="540" y="1020" font-size="27" text-anchor="middle" fill="#d1c4ac" font-family="Georgia">UN PASE PARA TODOS NUESTROS MAÑANAS</text><text x="540" y="1110" font-size="25" text-anchor="middle" fill="#c9b78d" font-family="Georgia">${promise.length>46 ? promise.slice(0,46)+"…" : promise}</text><text x="540" y="1340" font-size="23" letter-spacing="5" text-anchor="middle" fill="#a89b7f" font-family="Arial">NUESTRO PRÓXIMO CAPÍTULO • SIN FECHA DE VENCIMIENTO</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "Todavia-nuestro-futuro.svg"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const memory = story.memories[active];
  return <main className={`td-root td-step-${step}`}>
    <div className="td-grain" aria-hidden="true"/>
    <div className="td-particles" aria-hidden="true">{stars.map((s,i)=><span key={i} style={{left:s.left,top:s.top,width:s.size,height:s.size,animationDelay:s.delay}}/>)}</div>
    <header className="td-nav"><Link href="/" className="td-brand" aria-label="Te Hice Esto - inicio">TE HICE ESTO <span>✦</span></Link><span className="td-nav-middle">UNA EXPERIENCIA PARA SENTIR</span><div className="td-nav-actions"><button type="button" onClick={()=>{setSound(v=>!v);}} aria-label={sound?"Silenciar sonido":"Activar sonido"} title="Sonido">{sound?"♫ SONIDO ON":"♫ SONIDO OFF"}</button><button type="button" onClick={()=>setEditing(true)} className="td-edit-btn" aria-label="Personalizar esta demostración">✎ PERSONALIZAR</button></div></header>
    <div className="td-progress" aria-label={`Escena ${step+1} de 5`}><span style={{width:`${((step+1)/5)*100}%`}}/></div>

    {step === 0 && <section className="td-scene td-intro" key="intro"><div className="td-arch-background" aria-hidden="true"><div className="td-arch-door"/></div><div className="td-center td-intro-center"><span className="td-overline">INVITACIÓN PRIVADA · EXPOSICIÓN N.º 001</span><div className="td-mini-star"><Ornament size={38}/></div><h1>TODAVÍA<span className="td-period">.</span></h1><p className="td-intro-sub">El museo de los recuerdos<br/><em>que aún no vivimos.</em></p><div className="td-gold-rule"/><p className="td-script-line">Para {story.to || "alguien especial"}. Hay un lugar reservado para vos.</p><button type="button" className="td-ticket" onClick={enter} aria-label="Abrir la invitación y entrar al museo"><div className="td-ticket-left"><span>ADMISIÓN ÚNICA</span><strong>01</strong><small>UN VIAJE PARA DOS</small></div><div className="td-ticket-right"><span>UN REGALO DE {story.from || "ALGUIEN ESPECIAL"}</span><strong>ENTRAR AL MUSEO <b>↗</b></strong><small>ESTE BOLETO NO CADUCA</small></div></button><span className="td-small-note">TOCÁ EL BOLETO PARA COMENZAR · 4 MIN</span></div><div className="td-intro-bottom">EXISTEN HISTORIAS QUE NO TERMINAN EN LA ÚLTIMA PÁGINA</div></section>}

    {step === 1 && <section className="td-scene td-gallery" key="gallery"><div className="td-gallery-architecture" aria-hidden="true"><div className="td-gallery-ceiling"/><div className="td-gallery-wall"/><div className="td-gallery-floor"/><div className="td-gallery-vanishing"/></div><div className="td-gallery-content"><div className="td-scene-heading"><div className="td-overline">SALA I · LOS INSTANTES QUE NOS TRAJERON ACÁ</div><h2>Cada historia merece <em>un museo.</em></h2><p>Elegí una pieza. Dentro de cada una hay algo que vale la pena recordar.</p></div><div className="td-exhibits">{story.memories.map((item,i)=><button type="button" className={`td-display td-display-${i} ${seen.includes(i)?"td-seen":""}`} key={i} onClick={()=>viewMemory(i)} aria-label={`Descubrir recuerdo ${i+1}: ${item.title}`}><span className="td-display-light"/><span className="td-display-case"><MuseumObject kind={i}/></span><span className="td-display-base"><small>PIEZA 0{i+1} {seen.includes(i)?"· VISTA":""}</small><strong>{item.title}</strong><span>DESCUBRIR <b>↗</b></span></span></button>)}</div><div className="td-gallery-bottom"><span>{seen.length} DE 3 RECUERDOS DESCUBIERTOS</span><span className="td-discovery-dots">{story.memories.map((_,i)=><i key={i} className={seen.includes(i)?"on":""}/>)}</span><button type="button" className="td-text-button" onClick={proceed} disabled={seen.length !== 3}>{seen.length===3?"ENTRAR A LA ÚLTIMA SALA ↗":"LA ÚLTIMA SALA ESTÁ CERRADA · DESCUBRÍ LAS 3 PIEZAS"}</button></div></div></section>}

    {step === 2 && <section className="td-scene td-memory" key={`memory-${active}`}><div className="td-memory-photo" style={{backgroundImage:`linear-gradient(90deg,rgba(5,13,14,.94) 0%,rgba(5,13,14,.62) 48%,rgba(5,13,14,.30) 100%),url("${photoOverrides[active] || memory.image}")`}}/><div className="td-memory-art"><div className="td-memory-frame"><div className="td-photo-inside" style={{backgroundImage:`url("${photoOverrides[active] || memory.image}")`}}/><span className="td-photo-dust"/></div><div className="td-memory-caption">ARCHIVO PRIVADO / 0{active+1}</div></div><div className="td-memory-copy"><span className="td-overline">{memory.date} · PIEZA 0{active+1}</span><Ornament size={33}/><h2>{memory.title}</h2><p>“{memory.words}”</p><div className="td-memory-signature">Una parte de nosotros, para siempre.</div><button className="td-gold-button" type="button" onClick={()=>{tone([440,587.33,880]);setStep(1)}}>VOLVER AL MUSEO <span>↗</span></button></div></section>}

    {step === 3 && <section className="td-scene td-void" key="void"><div className="td-void-door" aria-hidden="true"/><div className="td-void-content"><span className="td-overline">SALA II · LA PIEZA AUSENTE</span><h2>Hay un recuerdo<br/><em>que todavía no existe.</em></h2><p>Esta sala está vacía por una razón.<br/>El momento más hermoso de nuestra historia <strong>aún nos está esperando.</strong></p><div className="td-orb-wrap"><div className={`td-orb-light ${charge?"td-charging":""}`}><div className="td-orb-satellite"/><button type="button" className="td-orb-btn" onPointerDown={startHold} onPointerUp={cancelHold} onPointerCancel={cancelHold} onPointerLeave={cancelHold} onKeyDown={(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();finish()}}} aria-label="Mantené presionada la esfera para descubrir el futuro"><Ornament size={61}/></button></div><span className="td-hold-label">{charge?"UN RECUERDO ESTÁ POR NACER…":"MANTENÉ PRESIONADA LA LUZ"}</span></div><button className="td-accessible-skip" type="button" onClick={finish}>¿NO PODÉS MANTENER? TOCÁ PARA REVELAR</button></div></section>}

    {step === 4 && <section className="td-scene td-final" key="final"><div className="td-sunrise" aria-hidden="true"><div className="td-sun-disc"/><div className="td-mountains td-mountain-back"/><div className="td-mountains td-mountain-front"/><div className="td-reflection"/></div><div className="td-final-content"><span className="td-overline">LA ÚLTIMA SALA · NUESTRA PRÓXIMA HISTORIA</span><div className="td-final-ornament"><Ornament size={42}/></div><h2>Lo mejor de nosotros<br/><em>todavía no pasó.</em></h2><div className="td-final-note"><span>PARA {story.to || "VOS"}</span><p>Si pudiera elegir con quién vivir cada mañana, cada viaje, cada aventura y cada pequeño milagro…</p><strong>Te elegiría a vos. Otra vez. Siempre.</strong><p className="td-promise">{story.promise}</p><span className="td-signature">Con amor, {story.from || "yo"}.</span></div><div className="td-final-actions"><button className="td-gold-button" type="button" onClick={download}>GUARDAR NUESTRO BOLETO ↓</button><button className="td-outline-button" type="button" onClick={reset}>VOLVER A VIVIRLO ↺</button></div><Link className="td-create-link" href="/crear">Quiero regalar una experiencia así ↗</Link><span className="td-small-note">ESTA ES UNA DEMOSTRACIÓN PERSONALIZABLE · NO GUARDA TUS FOTOS EN UN SERVIDOR</span></div></section>}

    {step!==0 && step!==4 && <button type="button" className="td-restart" onClick={reset} aria-label="Volver al principio">↺ REINICIAR</button>}
    <div className="td-chapter" aria-live="polite">{stages[step]} <span>0{step+1} / 05</span></div>

    {editing && <div className="td-modal-shade" role="presentation" onMouseDown={(e)=>{if(e.target===e.currentTarget)setEditing(false)}}><section className="td-editor" role="dialog" aria-modal="true" aria-labelledby="td-editor-heading"><button className="td-editor-close" type="button" onClick={()=>setEditing(false)} aria-label="Cerrar">✕</button><span className="td-overline">ESTUDIO DE PERSONALIZACIÓN</span><h2 id="td-editor-heading">Hacela <em>tuya.</em></h2><p>Probá cómo se siente con nombres, fotografías y recuerdos. Todo queda únicamente en esta pestaña; todavía no es un pedido.</p><div className="td-form-row"><label>Para quién<input maxLength={40} value={story.to} onChange={(e)=>setStory(v=>({...v,to:e.target.value}))}/></label><label>De quién<input maxLength={40} value={story.from} onChange={(e)=>setStory(v=>({...v,from:e.target.value}))}/></label></div><label>Una promesa para el futuro<input maxLength={100} value={story.promise} onChange={(e)=>setStory(v=>({...v,promise:e.target.value}))}/></label><div className="td-edit-memories">{story.memories.map((m,i)=><div className="td-edit-memory" key={i}><strong>RECUERDO 0{i+1}</strong><input aria-label={`Título recuerdo ${i+1}`} maxLength={45} value={m.title} onChange={e=>updateMemory(i,"title",e.target.value)}/><textarea aria-label={`Mensaje recuerdo ${i+1}`} maxLength={180} rows={2} value={m.words} onChange={e=>updateMemory(i,"words",e.target.value)}/><label className="td-upload">{photoOverrides[i]?"✓ FOTO CARGADA · CAMBIAR":"+ SUBIR FOTO (MÁX. 6 MB)"}<input aria-label={`Foto recuerdo ${i+1}`} accept="image/*" type="file" onChange={e=>uploadPhoto(i,e)}/></label></div>)}</div><button className="td-gold-button td-save" type="button" onClick={()=>{setEditing(false);reset()}}>GUARDAR Y VER MI HISTORIA ↗</button><span className="td-small-note">Las fotos se usan localmente para esta vista previa y se descartan al cerrar la pestaña.</span></section></div>}
  </main>;
}