"use client";

import { useMemo, useState, type FormEvent, type MouseEvent } from "react";
import ExperienceEngine from "@/components/ExperienceEngine";
import VoiceRecorder from "@/components/VoiceRecorder";
import GuestVoiceInvites from "@/components/GuestVoiceInvites";
import { getExperience, type SceneType } from "@/data/experiences";
import { normalizeSceneTextOverrides } from "@/data/scene-text";
import styles from "@/app/mis-regalos/account.module.css";

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export type StudioMedia = {
  id: string;
  kind: "image" | "audio" | "video";
  caption: string | null;
  sort_order: number;
  url?: string | null;
  metadata?: {
    originalName?: string;
    mimeType?: string;
    role?: string;
    fit?: string;
    position?: string;
    scene?: string;
    size?: number;
  } | null;
};
export type StudioGift = {
  experience_slug: string;
  giver_name: string;
  recipient_name: string;
  scene_recipe?: SceneType[];
  theme_data?: { accent?: string };
  opening_text?: string | null;
  closing_text?: string | null;
  letter_text?: string | null;
  story_data?: Record<string, unknown> | null;
  status?: string;
};
export type StudioAccess = { code: string; editorToken: string };
type Props = {
  access: StudioAccess;
  ownerToken: string;
  gift: StudioGift;
  initialMedia: StudioMedia[];
  onError: (value: string) => void;
  onNotice: (value: string) => void;
  onPublished: () => void;
};

async function action(access: StudioAccess, name: string, payload: Record<string, unknown> = {}) {
  const response = await fetch(projectUrl + "/functions/v1/creator-api", {
    method: "POST",
    cache: "no-store",
    headers: { "apikey": publicKey, "content-type": "application/json" },
    body: JSON.stringify({ action: name, code: access.code, editorToken: access.editorToken, ...payload }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(typeof data.error === "string" ? data.error : "studio_failed");
  return data;
}

const sceneLabels: Record<string, string> = {
  intro:"Entrada",door:"La puerta",memories:"Recuerdos",stars:"Estrellas",scratch:"Sorpresa",
  letter:"Carta",finale:"Final",candles:"Velas",balloons:"Globos",timeline:"Línea del tiempo",
  voices:"Voces",quiz:"Preguntas",vault:"Cofre",capsule:"Cápsula",proposal:"Propuesta",video:"Video",
  archive:"Archivo",home:"Hogar",legacy:"Legado",rituals:"Rituales",chapters:"Capítulos",
  future:"Futuro",origin:"Origen",reasons:"Razones",certainty:"Certeza",threshold:"Umbral",
  light:"Luz",hold:"Corazón",childhood:"Infancia",care:"Cuidados",sacrifices:"Sacrificios",
  return:"Regreso",lessons:"Lecciones",presence:"Presencia",inheritance:"Herencia",
  lookback:"Mirar atrás",casefile:"Expediente",insidejokes:"Bromas",incidents:"Anécdotas",
  proof:"Pruebas",pact:"Pacto",invitation:"Invitación",portal:"Portal",gallery:"Galería",
  timepiece:"Reloj",recording:"Grabación",clues:"Pistas",confession:"Confesión",
  passage:"Pasaje",reveal:"Revelación",keepsake:"Recuerdo",
};
function displayError(value: unknown): string {
  const msg = value instanceof Error ? value.message : "";
  if (msg === "payment_required") return "La compra aún no está acreditada.";
  if (msg === "studio_unauthorized") return "Tu permiso de edición venció. Volvé a abrir el regalo.";
  if (msg === "invalid_media") return "Este archivo no es compatible o supera los 50 MB.";
  if (msg === "media_limit") return "Este regalo alcanzó el máximo de 30 archivos.";
  if (msg === "upload_prepare_failed") return "No se pudo preparar la carga. Intentá nuevamente.";
  return "No se pudo completar la operación. Revisá tu conexión e intentá de nuevo.";
}

type SelectedText = { scene: string; source: string; current: string };

export default function StudioEnhancements({ access, ownerToken, gift, initialMedia, onError, onNotice, onPublished }: Props) {
  const [media, setMedia] = useState<StudioMedia[]>(initialMedia);
  const [sceneContent, setSceneContent] = useState(() => normalizeSceneTextOverrides(gift.story_data?.sceneContent));
  const [preview, setPreview] = useState(false);
  const [editingCopy, setEditingCopy] = useState(false);
  const [selected, setSelected] = useState<SelectedText | null>(null);
  const [copyValue, setCopyValue] = useState("");
  const [uploading, setUploading] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const model = getExperience(gift.experience_slug);
  const orderedMedia = useMemo(() => [...media].sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0)), [media]);
  const scenes = useMemo(() => (
    Array.isArray(gift.scene_recipe) && gift.scene_recipe.length ? gift.scene_recipe : model?.recipe || []
  ), [gift.scene_recipe, model]);
  const signedPhotos = orderedMedia.filter(m => m.kind === "image" && m.url).map(m => ({
    url: m.url as string, caption:m.caption || undefined,
    fit: m.metadata?.fit === "contain" ? "contain" as const : "cover" as const,
    position: (["center","top","bottom","left","right"].includes(String(m.metadata?.position)) ? m.metadata?.position : "center") as "center" | "top" | "bottom" | "left" | "right",
  }));
  const soundtrack = orderedMedia.find(m => m.kind === "audio" && m.url && m.metadata?.role === "soundtrack");
  const audioMedia = orderedMedia.filter(m => m.kind === "audio" && m.url && m.metadata?.role !== "soundtrack").map(m => ({url:m.url as string,caption:m.caption || undefined}));
  const videoMedia = orderedMedia.filter(m => m.kind === "video" && m.url).map(m => ({url:m.url as string,caption:m.caption || undefined}));

  async function refreshMedia() {
    const response = await action(access, "openStudio");
    setMedia(Array.isArray(response.media) ? response.media : []);
  }

  function chooseText(event: MouseEvent<HTMLDivElement>) {
    if (!editingCopy) return;
    const element = event.target;
    if (!(element instanceof Element)) return;
    const shell = element.closest<HTMLElement>(".experience-shell");
    if (!shell) return;
    const scene = shell.dataset.currentScene;
    if (!scene || !scenes.includes(scene as SceneType)) return;
    const target = element.closest("p,h1,h2,h3,h4,small,strong,em,span,button,label") || element;
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node && !(node.textContent || "").trim()) node = walker.nextNode();
    const text = (node?.textContent || "").trim();
    if (!text || text.length > 5000) return;
    event.preventDefault(); event.stopPropagation();
    const entries = sceneContent[scene] || {};
    const source = Object.entries(entries).find(([, replacement]) => replacement === text)?.[0] || text;
    setSelected({scene, source, current: entries[source] ?? text});
    setCopyValue(entries[source] ?? text);
  }

  async function saveText() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const isRestore = copyValue === selected.source;
      const name = isRestore ? "restoreStudioSceneText" : "saveStudioSceneText";
      await action(access, name, {
        scene:selected.scene, source:selected.source,
        ...(isRestore ? {} : {replacement:copyValue}),
      });
      setSceneContent(old => {
        const next = {...old, [selected.scene]: {...(old[selected.scene] || {})}};
        if (isRestore) {
          delete next[selected.scene][selected.source];
          if (Object.keys(next[selected.scene]).length === 0) delete next[selected.scene];
        } else next[selected.scene][selected.source] = copyValue;
        return next;
      });
      setSelected(null);
      onNotice("Texto de la escena guardado correctamente.");
    } catch (error) { onError(displayError(error)); }
    finally { setBusy(false); }
  }

  async function uploadFile(source: File, scene: string): Promise<boolean> {
    if (source.size <= 0 || source.size > 50*1024*1024) { onError("Máximo 50 MB por archivo."); return false; }
    // WhatsApp often exports .opus/.ogg with a missing or generic MIME type.
    const ext = source.name.toLowerCase().split(".").pop() || "";
    const inferredMime: Record<string, string> = {
      opus: "audio/opus", oga: "audio/ogg", ogg: "audio/ogg",
      m4a: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav",
      webm: "audio/webm", aac: "audio/mp4",
    };
    const rawMime = (source.type || "").toLowerCase().split(";")[0];
    const mimeType = (rawMime && rawMime !== "application/octet-stream" && rawMime !== "application/ogg")
      ? (rawMime === "audio/x-wav" ? "audio/wav" : rawMime)
      : (inferredMime[ext] || rawMime);
    if (!/^(image\/(jpeg|png|webp|heic|heif)|audio\/(mpeg|mp4|webm|wav|x-m4a|m4a|ogg|opus)|video\/(mp4|webm|quicktime))$/.test(mimeType)) {
      onError("Archivo no compatible. Podés usar también audios de WhatsApp (.opus y .ogg)."); return false;
    }
    const file = source.type === mimeType ? source : new File([source], source.name, { type: mimeType, lastModified: source.lastModified });
    setUploading(file.name); setProgress(0);
    try {
      const prepared = await action(access, "prepareStudioUpload", {
        fileName:file.name, mimeType:file.type, size:file.size,
      });
      const tus = await import("tus-js-client");
      const endpoint = projectUrl.replace(/\.supabase\.co\/?$/, ".storage.supabase.co").replace(/\/$/, "") + "/storage/v1/upload/resumable";
      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint,
          retryDelays:[0,1000,3000,5000],
          chunkSize:6*1024*1024,
          uploadDataDuringCreation:true,
          removeFingerprintOnSuccess:true,
          headers:{"x-signature":prepared.token},
          metadata:{bucketName:"gift-media",objectName:prepared.path,contentType:file.type,cacheControl:"3600"},
          onProgress(sent,total){setProgress(Math.round(sent/total*100));},
          onError:reject,onSuccess(){resolve();},
        });
        upload.start();
      });
      await action(access, "registerStudioMedia", {
        storagePath:prepared.path,kind:prepared.kind,originalName:file.name,
        mimeType:file.type,size:file.size,scene,
      });
      await refreshMedia();
      onNotice("Archivo incorporado a tu regalo.");
      return true;
    } catch (error) { onError(displayError(error)); return false; }
    finally { setUploading(""); setProgress(0); }
  }

  async function updateMedia(item: StudioMedia, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await action(access,"updateStudioMedia", {
        mediaId:item.id,
        caption:String(form.get("caption") || ""),
        fit:String(form.get("fit") || "cover"),
        position:String(form.get("position") || "center"),
        role:String(form.get("role") || "voice"),
        scene:String(form.get("scene") || ""),
      });
      await refreshMedia();
      onNotice("Archivo actualizado.");
    } catch (error) { onError(displayError(error)); }
    finally { setBusy(false); }
  }

  async function deleteMedia(item: StudioMedia) {
    if (busy || !window.confirm("¿Quitar este archivo de la experiencia?")) return;
    setBusy(true);
    try {
      await action(access,"deleteStudioMedia",{mediaId:item.id});
      await refreshMedia(); onNotice("Archivo eliminado.");
    } catch (error) { onError(displayError(error)); }
    finally { setBusy(false); }
  }

  async function moveMedia(item: StudioMedia, delta: number) {
    if (busy) return;
    const ids=orderedMedia.map(m=>m.id);
    const pos=ids.indexOf(item.id), next=pos+delta;
    if (next<0 || next>=ids.length) return;
    [ids[pos],ids[next]]=[ids[next],ids[pos]];
    setBusy(true);
    try {
      await action(access,"reorderStudioMedia",{mediaIds:ids});
      await refreshMedia(); onNotice("Orden actualizado.");
    } catch (error) { onError(displayError(error)); }
    finally { setBusy(false); }
  }

  async function publishGift() {
    if (busy || !confirmPublish) return;
    setBusy(true);
    try {
      await action(access,"publishStudio");
      onNotice("¡Tu regalo está publicado! Ya podés compartir su enlace privado.");
      setConfirmPublish(false);
      onPublished();
    } catch (error) { onError(displayError(error)); }
    finally { setBusy(false); }
  }

  return (
    <div className={styles.enhancement}>
      <section className={styles.studioSection}>
        <div className={styles.studioHeading}>
          <span className={styles.eyebrow}>MATERIALES PERSONALES</span>
          <h2>Fotos, voces y momentos</h2>
          <p>Subí las imágenes, los audios y los videos de tu historia. Cada archivo queda guardado de forma privada.</p>
        </div>

        <VoiceRecorder
          disabled={Boolean(uploading) || busy || orderedMedia.length >= 30}
          onSave={(file) => uploadFile(file, scenes.includes("voices" as SceneType) ? "voices" : scenes.includes("recording" as SceneType) ? "recording" : scenes[0] || "intro")}
        />
        <GuestVoiceInvites code={access.code} bearer={ownerToken} onError={onError} onRefresh={refreshMedia} />
        <div className={styles.uploadRow}>
          <label className={styles.uploadButton}>
            + Incorporar archivos
            <input aria-label="Seleccionar archivos" type="file" multiple
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,audio/mpeg,audio/mp4,audio/webm,audio/wav,audio/ogg,audio/opus,.opus,.ogg,.oga,.m4a,video/mp4,video/webm,video/quicktime"
              disabled={Boolean(uploading)} onChange={async event => {
                const list=Array.from(event.target.files || []).slice(0,30);
                for (const file of list) await uploadFile(file,scenes.includes("memories" as SceneType)?"memories":scenes[0]||"intro");
                event.target.value="";
              }} />
          </label>
          <span>{orderedMedia.length} / 30 archivos · Máximo 50 MB cada uno</span>
        </div>
        <details className={styles.whatsAppAudioHelp}>
          <summary>¿Ya te mandaron un audio por WhatsApp? Mirá cómo incorporarlo sin enviártelo por correo.</summary>
          <p><strong>En iPhone:</strong> mantené apretado el audio, elegí «Reenviar», tocá el ícono «Compartir» y «Guardar en Archivos». Después elegilo desde «Incorporar archivos».</p>
          <p><strong>En Android:</strong> mantené presionado el audio, seleccioná «Compartir» (puede estar en los tres puntos) y guardalo en Archivos o Drive. Después seleccionalo acá.</p>
          <p>También podés descargarlo desde WhatsApp Web en una computadora. Aceptamos los formatos habituales de WhatsApp: OPUS y OGG.</p>
        </details>
        {uploading && <div className={styles.progress} role="status">
          <span>Subiendo {uploading} · {progress}%</span>
          <div><i style={{width:progress+"%"}} /></div>
        </div>}
        {orderedMedia.length === 0 ? <p className={styles.emptyHint}>Todavía no cargaste archivos. Empezá por una foto que tenga un significado especial.</p> :
        <div className={styles.mediaGrid}>{orderedMedia.map((item,idx) =>
          <article key={item.id} className={styles.mediaCard}>
            <div className={styles.mediaPreview}>
              {item.kind==="image" && item.url && <img src={item.url} alt={item.caption||"Foto"} loading="lazy" style={{objectFit:item.metadata?.fit==="contain"?"contain":"cover",objectPosition:item.metadata?.position||"center"}} />}
              {item.kind==="audio" && item.url && <audio src={item.url} controls preload="metadata" />}
              {item.kind==="video" && item.url && <video src={item.url} controls preload="metadata" />}
            </div>
            <span className={styles.mediaName}>{item.metadata?.originalName || "Archivo "+(idx+1)}</span>
            <form className={styles.mediaFields} onSubmit={e => void updateMedia(item,e)}>
              <label>Descripción / recuerdo<input name="caption" defaultValue={item.caption||""} maxLength={1000} placeholder="Escribí algo especial" /></label>
              <label>Escena<select name="scene" defaultValue={item.metadata?.scene||scenes[0]}>{scenes.map(s=><option key={s} value={s}>{sceneLabels[s]||s}</option>)}</select></label>
              {item.kind==="image" && <div className={styles.mediaOptions}>
                <label>Encuadre<select name="fit" defaultValue={item.metadata?.fit||"cover"}><option value="cover">Llenar marco</option><option value="contain">Ver completa</option></select></label>
                <label>Posición<select name="position" defaultValue={item.metadata?.position||"center"}><option value="center">Centro</option><option value="top">Arriba</option><option value="bottom">Abajo</option><option value="left">Izquierda</option><option value="right">Derecha</option></select></label>
              </div>}
              {item.kind==="audio" && <label>Uso<select name="role" defaultValue={item.metadata?.role||"voice"}><option value="voice">Mensaje de voz</option><option value="soundtrack">Música de fondo</option></select></label>}
              <button className={styles.ghost} disabled={busy} type="submit">Guardar archivo</button>
            </form>
            <div className={styles.mediaActions}>
              <button disabled={busy||idx===0} onClick={()=>void moveMedia(item,-1)} aria-label="Mover antes">↑</button>
              <button disabled={busy||idx===orderedMedia.length-1} onClick={()=>void moveMedia(item,1)} aria-label="Mover después">↓</button>
              <button disabled={busy} onClick={()=>void deleteMedia(item)}>Quitar</button>
            </div>
          </article>
        )}</div>}
      </section>
      <section className={styles.studioSection}>
        <div className={styles.studioHeading}>
          <span className={styles.eyebrow}>VISTA PREVIA DEL MODELO ORIGINAL</span>
          <h2>Viví tu experiencia</h2>
          <p>Revisá el recorrido con tus datos. Podés seleccionar textos en la vista previa y cambiarlos sin alterar los efectos ni las animaciones.</p>
        </div>
        <div className={styles.previewActions}>
          <button className={styles.ghost} type="button" onClick={() => setPreview(!preview)}>{preview?"Cerrar vista previa":"Abrir vista previa →"}</button>
          {preview && <button className={styles.ghost} type="button" onClick={()=>{setEditingCopy(!editingCopy);setSelected(null)}}>{editingCopy?"Terminar edición de textos":"Personalizar textos de las escenas"}</button>}
        </div>
        {preview && model && <div className={styles.previewWindow} onClickCapture={chooseText}>
          {editingCopy && <p className={styles.editModeLabel} role="status">MODO EDICIÓN · Tocá una frase del recorrido para cambiarla</p>}
          <ExperienceEngine
            experience={{...model,
              demoGiver:gift.giver_name,demoRecipient:gift.recipient_name,
              opening:gift.opening_text||model.opening,
              closing:gift.closing_text||model.closing,
              recipe:scenes,
              accent:gift.theme_data?.accent||model.accent,
            }}
            letterText={gift.letter_text||undefined}
            photoMedia={signedPhotos}
            audioMedia={audioMedia}
            soundtrackMedia={soundtrack?.url?{url:soundtrack.url,caption:soundtrack.caption||undefined}:undefined}
            videoMedia={videoMedia}
            storyContext={{keyDate:String(gift.story_data?.keyDate||""),anecdote:String(gift.story_data?.anecdote||"")}}
            sceneTextOverrides={sceneContent}
          />
        </div>}
        {selected && <div className={styles.copyModal} role="dialog" aria-modal="true" aria-label="Editar texto de escena">
          <div className={styles.copyPanel}>
            <span className={styles.eyebrow}>{sceneLabels[selected.scene]||selected.scene}</span>
            <h3>Hacé tuya esta frase</h3>
            <p className={styles.copySource}>Original: {selected.source}</p>
            <textarea rows={5} value={copyValue} onChange={e=>setCopyValue(e.target.value)} maxLength={5000} />
            <div className={styles.previewActions}>
              <button className={styles.ghost} disabled={busy} onClick={()=>setSelected(null)}>Cancelar</button>
              <button className={styles.primary} disabled={busy} onClick={()=>void saveText()}>{busy?"Guardando…":"Guardar frase →"}</button>
            </div>
          </div>
        </div>}
      </section>
      <section className={styles.studioSection}>
        <div className={styles.studioHeading}><span className={styles.eyebrow}>ÚLTIMO PASO</span><h2>Tu regalo está listo para compartir</h2><p>Cuando termines de revisar los textos y recuerdos, publicalo. El recorrido se mantiene idéntico al modelo original, con tus datos personales.</p></div>
        <label className={styles.publishConfirm}><input type="checkbox" checked={confirmPublish} onChange={e=>setConfirmPublish(e.target.checked)} /> Revisé nombres, fotos, audios y mensajes y quiero publicar esta experiencia.</label>
        <button className={styles.primary} disabled={busy||!confirmPublish} onClick={()=>void publishGift()}>Publicar mi regalo →</button>
      </section>
    </div>
  );
}
