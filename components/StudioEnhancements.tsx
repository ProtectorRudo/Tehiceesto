"use client";

import { useMemo, useState, type FormEvent, type MouseEvent } from "react";
import ExperienceEngine from "@/components/ExperienceEngine";
import SevenDaysExperience from "@/components/SevenDaysExperience";
import SevenDaysSharePanel from "@/components/SevenDaysSharePanel";
import Jar365Editor from "@/components/Jar365Editor";
import StickerBombEditor from "@/components/StickerBombEditor";
import DragonBallEditor, {type DragonCopy} from "@/components/DragonBallEditor";
import DragonBallPreview from "@/components/DragonBallPreview";
import ExtraLetterEditor from "@/components/ExtraLetterEditor";
import Jar365Experience from "@/components/Jar365Experience";
import type { Jar365Note } from "@/data/jar365-notes";
import VoiceRecorder from "@/components/VoiceRecorder";
import GuestVoiceInvites from "@/components/GuestVoiceInvites";
import { getExperience, type SceneType } from "@/data/experiences";
import { normalizeSceneTextOverrides } from "@/data/scene-text";
import {arrangeScenePhotos} from "@/lib/gifts/arrange-scene-photos";
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
  day1:"Día 1 · Mimo",day2:"Día 2 · Luna",day3:"Día 3 · Bruno",
  day4:"Día 4 · Bubi",day5:"Día 5 · Duque",day6:"Día 6 · Pipo",day7:"Día 7 · Rosa",
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

// HEIC previews are not supported in every recipient browser, even if Storage
// accepts the file. Convert when the mobile browser can decode it; otherwise
// return an explicit error rather than saving an invisible photo.
async function browserJpegFromHeic(source:File):Promise<File>{
  const url=URL.createObjectURL(source);
  try {
    const photo=await new Promise<HTMLImageElement>((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(new Error("heic_decode_failed"));
      image.src=url;
    });
    const maxEdge=2400;
    const ratio=Math.min(1,maxEdge/Math.max(photo.naturalWidth,photo.naturalHeight));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(photo.naturalWidth*ratio));
    canvas.height=Math.max(1,Math.round(photo.naturalHeight*ratio));
    const ctx=canvas.getContext("2d");
    if(!ctx)throw new Error("heic_decode_failed");
    ctx.drawImage(photo,0,0,canvas.width,canvas.height);
    const blob=await new Promise<Blob>((resolve,reject)=>
      canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("heic_decode_failed")),"image/jpeg",0.88)
    );
    return new File([blob],source.name.replace(/\.(heic|heif)$/i,"")+".jpg",{
      type:"image/jpeg",lastModified:source.lastModified
    });
  }finally{URL.revokeObjectURL(url);}
}

type SelectedText = { scene: string; source: string; current: string };

export default function StudioEnhancements({ access, ownerToken, gift, initialMedia, onError, onNotice, onPublished }: Props) {
  const [media, setMedia] = useState<StudioMedia[]>(initialMedia);
  const [dragonDraft,setDragonDraft] = useState<DragonCopy|null>(null);
  const [sceneContent, setSceneContent] = useState(() => normalizeSceneTextOverrides(gift.story_data?.sceneContent));
  const [preview, setPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [jarNotes,setJarNotes] = useState<Jar365Note[]>([]);
  const [jarPreviewVersion,setJarPreviewVersion] = useState(0);
  const [editingCopy, setEditingCopy] = useState(false);
  const [selected, setSelected] = useState<SelectedText | null>(null);
  const [copyValue, setCopyValue] = useState("");
  const [uploading, setUploading] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [photoPicker,setPhotoPicker]=useState<{kind:"dragon";slot:number}|{kind:"slot";scene:SceneType;slot:number}|{kind:"media";mediaId:string}|{kind:"audio";mediaId:string}|null>(null);
  const [photoSlots,setPhotoSlots]=useState<Record<string,{mediaId:string}>>(()=>
    gift.story_data?.photoSlots&&typeof gift.story_data.photoSlots==="object"&&!Array.isArray(gift.story_data.photoSlots)
      ? gift.story_data.photoSlots as Record<string,{mediaId:string}>:{});
  const [photoAssignment,setPhotoAssignment]=useState<{slot:number;mediaId:string;revision:number}|null>(null);
  const [photoRevision,setPhotoRevision]=useState(0);

  const model = getExperience(gift.experience_slug);
  const orderedMedia = useMemo(() => [...media].sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0)), [media]);
  const scenes = useMemo(() => (
    Array.isArray(gift.scene_recipe) && gift.scene_recipe.length ? gift.scene_recipe : model?.recipe || []
  ), [gift.scene_recipe, model]);
  const signedPhotos = arrangeScenePhotos(orderedMedia.filter(m=>m.kind==="image"&&m.url),photoSlots,scenes)
    .map(({item:m,scene})=>({
      url:m.url as string,caption:m.caption||undefined,scene:scene as SceneType,
      fit:m.metadata?.fit==="contain"?"contain" as const:"cover" as const,
      position:(["center","top","bottom","left","right"].includes(String(m.metadata?.position))?m.metadata?.position:"center") as "center"|"top"|"bottom"|"left"|"right",
    }));
  const soundtrack = orderedMedia.find(m => m.kind === "audio" && m.url && m.metadata?.role === "soundtrack");
  const audioMedia = orderedMedia.filter(m => m.kind === "audio" && m.url && m.metadata?.role !== "soundtrack").map(m => ({url:m.url as string,caption:m.caption || undefined,scene:m.metadata?.scene as SceneType|undefined}));
  const videoMedia = orderedMedia.filter(m => m.kind === "video" && m.url).map(m => ({url:m.url as string,caption:m.caption || undefined}));
  // Never use the generic experience engine to preview a purchased Dragon Ball saga.
  const savedDragonConfig = gift.story_data?.dragonBall;
  const dragonConfig:Record<string,unknown> = dragonDraft || (
    savedDragonConfig && typeof savedDragonConfig === "object" && !Array.isArray(savedDragonConfig)
      ? savedDragonConfig as Record<string,unknown> : {}
  );
  const dragonPhotoUrls = Array.isArray(dragonConfig.photoMediaIds)
    ? dragonConfig.photoMediaIds.slice(0,3).map(id=>orderedMedia.find(m=>m.id===id && m.kind==="image")?.url || "")
    : ["","",""];
  const dragonVoiceUrl = orderedMedia.find(m=>m.id===dragonConfig.voiceMediaId && m.kind==="audio")?.url || null;

  async function refreshMedia():Promise<void> {
    const response = await action(access, "openStudio");
    const rows:StudioMedia[]=Array.isArray(response.media) ? response.media : [];
    setMedia(rows);
  }

  async function togglePreview() {
    if (preview) {setPreview(false);setEditingCopy(false);return;}
    if (previewLoading || uploading) return;
    setPreviewLoading(true);
    try {await refreshMedia();setPreview(true);}
    catch(error){onError(displayError(error));}
    finally {setPreviewLoading(false);}
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

  async function uploadFile(source: File, scene: string, replacing?:StudioMedia): Promise<boolean> {
    if (source.size <= 0 || source.size > 50*1024*1024) { onError("Máximo 50 MB por archivo."); return false; }
    // WhatsApp often exports .opus/.ogg with a missing or generic MIME type.
    const ext = source.name.toLowerCase().split(".").pop() || "";
    const inferredMime: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", jpe: "image/jpeg",
      png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif",
      opus: "audio/opus", oga: "audio/ogg", ogg: "audio/ogg",
      m4a: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav",
      webm: "audio/webm", aac: "audio/mp4",
    };
    const rawMime = (source.type || "").toLowerCase().split(";")[0];
    const normalizedMime = rawMime === "image/jpg" || rawMime === "image/pjpeg" ? "image/jpeg" : rawMime === "audio/x-wav" ? "audio/wav" : rawMime;
    const mimeType = (normalizedMime && normalizedMime !== "application/octet-stream" && normalizedMime !== "application/ogg")
      ? normalizedMime : (inferredMime[ext] || normalizedMime);
    if (!/^(image\/(jpeg|png|webp|heic|heif)|audio\/(mpeg|mp4|webm|wav|x-m4a|m4a|ogg|opus)|video\/(mp4|webm|quicktime))$/.test(mimeType)) {
      onError("Archivo no compatible. Podés usar también audios de WhatsApp (.opus y .ogg)."); return false;
    }
    setUploading(source.name); setProgress(0);
    try {
      const file = mimeType === "image/heic" || mimeType === "image/heif"
        ? await browserJpegFromHeic(source)
        : source.type === mimeType ? source : new File([source],source.name,{type:mimeType,lastModified:source.lastModified});
      const prepared = await action(access, "prepareStudioUpload", {
        fileName:file.name, mimeType:file.type, size:file.size,
        ...(replacing?{replacingMediaId:replacing.id}:{}),
      });
      if (typeof prepared.token !== "string" || !prepared.token) throw new Error("upload_signature_missing");
      // For mobile photos prefer the signed object upload: live TUS requests were
      // rejected with 400/Invalid Compact JWS. Larger media retain resumability
      // with an automatic signed-upload fallback.
      const uploadSigned = async () => {
        const {createClient} = await import("@supabase/supabase-js");
        const storage = createClient(projectUrl,publicKey,{
          auth:{persistSession:false,autoRefreshToken:false},
        }).storage.from("gift-media");
        const {error} = await storage.uploadToSignedUrl(prepared.path,prepared.token,file,{
          contentType:file.type,
        });
        if (error) throw error;
        setProgress(100);
      };
      const uploadResumable = async () => {
        const tus = await import("tus-js-client");
        const endpoint = new URL("/storage/v1/upload/resumable",projectUrl).toString().replace(".supabase.co/",".storage.supabase.co/");
        await new Promise<void>((resolve,reject) => {
          const upload = new tus.Upload(file,{
            endpoint,retryDelays:[0,1000,3000,5000],chunkSize:6*1024*1024,
            uploadDataDuringCreation:true,removeFingerprintOnSuccess:true,
            headers:{"x-signature":prepared.token},
            metadata:{bucketName:"gift-media",objectName:prepared.path,contentType:file.type,cacheControl:"3600"},
            onProgress(sent,total){setProgress(Math.round(sent/total*100));},
            onError:reject,onSuccess(){resolve();},
          });
          upload.start();
        });
      };
      if (file.size <= 6*1024*1024) {
        await uploadSigned();
      } else {
        try {await uploadResumable();}
        catch {setProgress(0);await uploadSigned();}
      }
      if(replacing) {
        if(prepared.kind!==replacing.kind)throw Error("invalid_media_replacement");
        await action(access,"replaceStudioMedia",{
          mediaId:replacing.id,storagePath:prepared.path,kind:replacing.kind,
          originalName:file.name,mimeType:file.type,size:file.size,
        });
      }else{
        await action(access, "registerStudioMedia", {
          storagePath:prepared.path,kind:prepared.kind,originalName:file.name,
          mimeType:file.type,size:file.size,scene,
        });
      }
      await refreshMedia();
      onNotice(replacing?("El "+(replacing.kind==="audio"?"audio":"archivo")+" se reemplazó conservando su lugar en la experiencia."):"Archivo incorporado a tu regalo.");
      return true;
    } catch (error) { onError(error instanceof Error&&error.message==="heic_decode_failed"
        ? "Tu teléfono no pudo convertir esta foto HEIC. Guardala como JPG o PNG y volvé a seleccionarla."
        : displayError(error)); return false; }
    finally { setUploading(""); setProgress(0); }
  }

  function choosePreviewPhoto(event:MouseEvent<HTMLDivElement>){
    const target=event.target;
    if(!(target instanceof Element))return;

    // FIRST identify the exact, editable position in the experience. A single
    // uploaded photo may be reused in several different scenes. Replacing its
    // storage object would unexpectedly edit all those other memories too.
    const image=target.closest("img");
    const card=target.closest<HTMLElement>(
      ".memory-card,.thi-mama-memory-card,.friend-polaroid,.secret-gallery-frame,"+
      ".club-polaroid,.polaroid,.thi-attached-photo,.photo-frame,figure"
    );
    const photoSurface=target.closest(".memory-image,.thi-mama-memory-photo");
    if(card&&(image||photoSurface)){
      const shell=target.closest<HTMLElement>("[data-current-scene]");
      const classes=(target.closest("section")?.className||"").toString().split(/\\s+/);
      const detected=classes.map(name=>
        name.match(/^scene-(.+)$/)?.[1]||
        name.match(/^thi-(?:scene-)?(memories|timeline|gallery|childhood|origin)$/)?.[1]
      ).find(value=>value&&scenes.includes(value as SceneType));
      const candidate=shell?.dataset.currentScene||detected||
        (["memories","gallery","day7","club"] as SceneType[]).find(scene=>scenes.includes(scene))||
        scenes[0];
      if(candidate&&scenes.includes(candidate as SceneType)){
        const scene=candidate as SceneType;
        const siblingCards=Array.from(card.parentElement?.children||[]).filter(element=>
          element.matches(".memory-card,.thi-mama-memory-card,.friend-polaroid,.secret-gallery-frame,.club-polaroid,.polaroid,.thi-attached-photo,.photo-frame")||
          (element.matches("figure")&&!!element.querySelector("img"))
        );
        const slot=Math.max(0,Math.min(19,siblingCards.indexOf(card)));
        event.preventDefault();
        event.stopPropagation();
        setSelected(null);
        setPhotoPicker({kind:"slot",scene,slot});
        return;
      }
    }

    // Outside a visual scene, a directly displayed personal file is edited
    // by its file ID. In particular, an audio player is never a photo slot.
    const audio=target.closest("audio");
    if(audio){
      const existing=orderedMedia.find(item=>item.kind==="audio"&&item.url&&
        (item.url===audio.currentSrc||item.url===audio.getAttribute("src")));
      if(existing){
        event.preventDefault();event.stopPropagation();
        setSelected(null);setPhotoPicker({kind:"audio",mediaId:existing.id});
        return;
      }
    }
    if(image){
      const clickedUrl=image.getAttribute("src")||"";
      const existing=orderedMedia.find(item=>item.kind==="image"&&item.url&&
        (item.url===clickedUrl||item.url===image.currentSrc));
      if(existing){
        event.preventDefault();event.stopPropagation();
        setSelected(null);setPhotoPicker({kind:"media",mediaId:existing.id});
        return;
      }
    }
    chooseText(event);
  }

  async function assignScenePhoto(scene:SceneType,slot:number,mediaId:string){
    if(busy)return false;
    setBusy(true);
    try{
      await action(access,"saveStudioPhotoSlot",{scene,slot,mediaId});
      setPhotoSlots(prev=>{
        const next={...prev};const key=scene+":"+slot;
        if(mediaId)next[key]={mediaId};else delete next[key];
        return next;
      });
      setPhotoPicker(null);
      onNotice("Imagen guardada en este lugar exacto de la experiencia.");
      return true;
    }catch(error){onError(displayError(error));return false;}
    finally{setBusy(false);}
  }

  async function assignDragonPhoto(slot:number,mediaId:string){
    if(busy)return;
    if(!dragonDraft){onError("Abrí nuevamente la vista previa para terminar de cargar el editor.");return;}
    const ids=[0,1,2].map(i=>i===slot?mediaId:dragonDraft.photoMediaIds[i]||"");
    const next={...dragonDraft,photoMediaIds:ids};
    setBusy(true);
    try{
      await action(access,"saveDragonBall",{dragonBall:next});
      setDragonDraft(next);setPhotoRevision(v=>v+1);
      setPhotoAssignment({slot,mediaId,revision:photoRevision+1});
      setPhotoPicker(null);
      onNotice("Foto del recuerdo actualizada y guardada en tu saga.");
    }catch(error){onError(displayError(error));}
    finally{setBusy(false);}
  }

  async function chooseExistingPhoto(mediaId:string){
    if(!photoPicker||busy)return;
    if(photoPicker.kind==="dragon"){await assignDragonPhoto(photoPicker.slot,mediaId);return;}
    if(photoPicker.kind==="slot"){await assignScenePhoto(photoPicker.scene,photoPicker.slot,mediaId);return;}
    const selected=orderedMedia.find(m=>m.id===photoPicker.mediaId&&m.kind==="image");
    const replacement=orderedMedia.find(m=>m.id===mediaId&&m.kind==="image");
    if(!selected||!replacement){onError("No encontramos la fotografía seleccionada.");return;}
    if(selected.id===replacement.id){setPhotoPicker(null);return;}
    const preferred=selected.metadata?.scene;
    const natural=(["memories","gallery","day7","club"] as SceneType[]).find(name=>scenes.includes(name))||scenes[0];
    const scene=(preferred&&scenes.includes(preferred as SceneType)?preferred:natural) as SceneType;
    const candidates=orderedMedia.filter(m=>m.kind==="image"&&
      ((m.metadata?.scene&&scenes.includes(m.metadata.scene as SceneType)?m.metadata.scene:natural)===scene));
    const slot=Math.max(0,candidates.findIndex(m=>m.id===selected.id));
    // No list-wide reorder: it could also reorder audios or move photos
    // between different scenes. The slot override is the source of truth.
    await assignScenePhoto(scene,slot,replacement.id);
  }

  async function uploadReplacement(file:File){
    if(!photoPicker||busy||uploading)return false;
    if(photoPicker.kind==="audio"){
      if(!file.type.startsWith("audio/")&&!/\.(mp3|m4a|mp4|wav|webm|ogg|opus)$/i.test(file.name)){
        onError("Seleccioná un audio MP3, M4A, WAV, WebM, OGG u OPUS.");return false;
      }
      const original=orderedMedia.find(item=>item.id===photoPicker.mediaId&&item.kind==="audio");
      if(!original){onError("Este audio ya no está disponible.");return false;}
      const ok=await uploadFile(file,original.metadata?.scene||scenes[0]||"intro",original);
      if(ok)setPhotoPicker(null);
      return ok;
    }
    if(!file.type.startsWith("image/")&&!/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)){
      onError("Seleccioná una fotografía JPG, PNG, WebP o HEIC.");return false;
    }
    if(photoPicker.kind==="media"){
      const old=orderedMedia.find(item=>item.id===photoPicker.mediaId&&item.kind==="image");
      if(!old){onError("La foto ya no está disponible.");return false;}
      const ok=await uploadFile(file,old.metadata?.scene||scenes[0]||"intro",old);
      if(ok)setPhotoPicker(null);
      return ok;
    }
    if(orderedMedia.length>=30){onError("Alcanzaste el máximo de archivos. Eliminá una foto que no uses antes de subir otra.");return false;}
    const before=new Set(orderedMedia.map(item=>item.id));
    const ok=await uploadFile(file,photoPicker.kind==="slot"?photoPicker.scene:(scenes[0]||"intro"));
    if(!ok)return false;
    try{
      await refreshMedia();
      const response=await action(access,"openStudio");
      const rows:StudioMedia[]=Array.isArray(response.media)?response.media:[];
      const newPhoto=rows.find(item=>item.kind==="image"&&!before.has(item.id));
      if(!newPhoto){onError("La foto se subió, pero no pudimos seleccionarla automáticamente. Elegila desde esta galería.");return false;}
      if(photoPicker.kind==="slot")await assignScenePhoto(photoPicker.scene,photoPicker.slot,newPhoto.id);
      else await assignDragonPhoto(photoPicker.slot,newPhoto.id);
      return true;
    }catch(error){onError(displayError(error));return false;}
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
      <ExtraLetterEditor code={access.code} editorToken={access.editorToken} />
      {gift.experience_slug==="dragon-ball-pareja" && <DragonBallEditor access={access} gift={gift} media={media} onError={onError} onNotice={onNotice} onDraftChange={setDragonDraft} photoAssignment={photoAssignment}/>}
      {gift.experience_slug==="sticker-bomb-amistad" && <StickerBombEditor key={access.code} access={access} gift={gift} media={media} onError={onError} onNotice={onNotice} onRefreshMedia={refreshMedia}/>}
      {gift.experience_slug==="siete-dias" && <SevenDaysSharePanel code={access.code} editorToken={access.editorToken} />}
      {gift.experience_slug==="frasco365" && <Jar365Editor code={access.code} editorToken={access.editorToken} onNotesChange={(notes)=>{setJarNotes(notes);setJarPreviewVersion(version=>version+1);}} />}
      {gift.experience_slug!=="frasco365" && <section className={styles.studioSection}>
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
              disabled={Boolean(uploading)||busy||orderedMedia.length>=30} onChange={async event => {
                const input=event.currentTarget;
                const list=Array.from(input.files || []).slice(0,30);
                let failed=0;
                for (const file of list) {
                  if (!await uploadFile(file,scenes.includes("memories" as SceneType)?"memories":scenes[0]||"intro")) failed++;
                }
                input.value="";
                if (failed) onError(`${failed} de ${list.length} archivos no se pudieron subir. Revisá el formato y volvé a intentar.`);
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
              {(item.kind==="audio"||item.kind==="image") && <button type="button" disabled={busy||Boolean(uploading)} onClick={()=>setPhotoPicker({kind:item.kind==="audio"?"audio":"media",mediaId:item.id})}>Reemplazar {item.kind==="audio"?"audio":"foto"}</button>}
              <button disabled={busy||idx===0} onClick={()=>void moveMedia(item,-1)} aria-label="Mover antes">↑</button>
              <button disabled={busy||idx===orderedMedia.length-1} onClick={()=>void moveMedia(item,1)} aria-label="Mover después">↓</button>
              <button disabled={busy} onClick={()=>void deleteMedia(item)}>Quitar</button>
            </div>
          </article>
        )}</div>}
      </section>}
      {gift.experience_slug!=="sticker-bomb-amistad" && <section className={styles.studioSection}>
        <div className={styles.studioHeading}>
          <span className={styles.eyebrow}>VISTA PREVIA DEL MODELO ORIGINAL</span>
          <h2>Viví tu experiencia</h2>
          <p>{gift.experience_slug==="frasco365"?"Abrí una demo de tu frasco con tus frases guardadas. Probá los papelitos sin consumir las aperturas de la persona que lo recibe.":gift.experience_slug==="dragon-ball-pareja"?"Revisá las nueve escenas originales de Dragon Ball. Tocá cualquiera de los tres recuerdos para elegir o cambiar su foto, sin salir de la escena.":"Revisá el recorrido con tus datos. Tocá una foto para reemplazarla; también podés personalizar textos sin alterar el modelo original."}</p>
        </div>
        <div className={styles.previewActions}>
          <button className={styles.ghost} type="button" disabled={previewLoading || Boolean(uploading)} onClick={()=>void togglePreview()}>{previewLoading?"Actualizando fotos…":preview?"Cerrar vista previa":"Abrir vista previa →"}</button>
          {preview && gift.experience_slug!=="frasco365" && gift.experience_slug!=="dragon-ball-pareja" && <button className={styles.ghost} type="button" onClick={()=>{setEditingCopy(!editingCopy);setSelected(null)}}>{editingCopy?"Terminar edición de textos":"Personalizar textos de las escenas"}</button>}
        </div>
        {preview && model && <div className={styles.previewWindow} onClickCapture={gift.experience_slug==="dragon-ball-pareja"?undefined:choosePreviewPhoto}>
          {editingCopy && gift.experience_slug!=="dragon-ball-pareja" && <p className={styles.editModeLabel} role="status">MODO EDICIÓN · Tocá una frase del recorrido para cambiarla</p>}
          {gift.experience_slug==="dragon-ball-pareja" ?
            <DragonBallPreview code={access.code} recipientName={gift.recipient_name} giverName={gift.giver_name}
              config={dragonConfig} photoUrls={dragonPhotoUrls} voiceUrl={dragonVoiceUrl}
              onPhotoClick={slot=>{setPhotoPicker({kind:"dragon",slot});setSelected(null);}} /> : gift.experience_slug==="frasco365" ?
            <Jar365Experience key={access.code+"-"+jarPreviewVersion} experience={{...model,demoGiver:gift.giver_name,demoRecipient:gift.recipient_name}} previewNotes={jarNotes} /> : gift.experience_slug==="siete-dias" ?
            <SevenDaysExperience
              experience={{...model,demoGiver:gift.giver_name,demoRecipient:gift.recipient_name}}
              sceneTextOverrides={sceneContent}
              photoMedia={signedPhotos}
              audioMedia={audioMedia}
              editing={editingCopy}
              onTextSelect={selection=>{setSelected(selection);setCopyValue(selection.current);}}
              onPhotoClick={slot=>{
                const photo=orderedMedia.filter(m=>m.kind==="image"&&m.url)[slot];
                if(photo)setPhotoPicker({kind:"media",mediaId:photo.id});
                else onError("Todavía no hay una foto para este lugar. Subila desde Materiales personales.");
              }}
              onAudioClick={()=>{
                const voice=orderedMedia.find(m=>m.kind==="audio"&&m.url&&m.metadata?.role!=="soundtrack");
                if(voice)setPhotoPicker({kind:"audio",mediaId:voice.id});
              }}
            /> :
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
          />}
        </div>}
        {photoPicker && <div className={styles.copyModal} role="dialog" aria-modal="true" aria-label="Cambiar fotografía">
          <div className={styles.copyPanel} style={{maxWidth:530,maxHeight:"88dvh",overflowY:"auto"}}>
            <span className={styles.eyebrow}>EDITAR FOTOGRAFÍA</span>
            <h3>{photoPicker.kind==="dragon"?"Elegí la foto para este recuerdo":photoPicker.kind==="slot"?"Elegí una foto para esta escena":photoPicker.kind==="audio"?"Reemplazar el audio de este momento":"Cambiar la foto del recorrido"}</h3>
            <p>El archivo elegido se reemplaza en su mismo lugar. Los demás recuerdos y las animaciones permanecen intactos.</p>
            {photoPicker.kind==="audio" && <VoiceRecorder disabled={busy||Boolean(uploading)} onSave={uploadReplacement}/>}
            <label className={styles.primary} style={{display:"block",textAlign:"center",cursor:busy||Boolean(uploading)?"wait":"pointer",margin:"14px 0"}}>
              {uploading?"Subiendo archivo…":photoPicker.kind==="audio"?"Subir una grabación de mi teléfono":"Elegir una foto de mi teléfono"}
              <input aria-label="Subir una foto de reemplazo" type="file" accept={photoPicker.kind==="audio"?"audio/*,.mp3,.m4a,.mp4,.wav,.ogg,.opus,.webm":"image/*,.heic,.heif"}
                style={{position:"absolute",width:1,height:1,opacity:0}}
                disabled={busy||Boolean(uploading)||((photoPicker.kind==="dragon"||photoPicker.kind==="slot")&&orderedMedia.length>=30)}
                onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void uploadReplacement(file);e.currentTarget.value="";}}/>
            </label>
            {photoPicker.kind!=="audio" && orderedMedia.some(item=>item.kind==="image") && <>
              <p style={{fontWeight:700}}>O elegí una foto que ya subiste</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10,margin:"12px 0"}}>
                {orderedMedia.filter(item=>item.kind==="image"&&item.url).map((item,i)=>
                  <button type="button" key={item.id} disabled={busy||Boolean(uploading)}
                    onClick={()=>void chooseExistingPhoto(item.id)}
                    aria-label={"Usar foto "+(i+1)}
                    style={{background:"#f8f1e8",border:"2px solid #c8b6a9",borderRadius:12,padding:5,cursor:"pointer"}}>
                    <img src={item.url||""} alt={"Foto guardada "+(i+1)} style={{display:"block",width:"100%",aspectRatio:"1",objectFit:"cover",borderRadius:8}}/>
                    <span style={{display:"block",fontSize:12,fontWeight:800,marginTop:5,color:"#251928"}}>Foto {i+1}</span>
                  </button>)}
              </div>
            </>}
            {(photoPicker.kind==="dragon"||photoPicker.kind==="slot") && <button type="button" className={styles.ghost} disabled={busy}
              onClick={()=>void (photoPicker.kind==="dragon"?assignDragonPhoto(photoPicker.slot,""):assignScenePhoto(photoPicker.scene,photoPicker.slot,""))}>Mostrar imagen original</button>}
            <div className={styles.previewActions} style={{marginTop:18}}>
              <button className={styles.ghost} type="button" disabled={busy||Boolean(uploading)} onClick={()=>setPhotoPicker(null)}>Cancelar</button>
            </div>
          </div>
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
      </section>}
      <section className={styles.studioSection}>
        <div className={styles.studioHeading}><span className={styles.eyebrow}>ÚLTIMO PASO</span><h2>Tu regalo está listo para compartir</h2><p>Cuando termines de revisar los textos y recuerdos, publicalo. El recorrido se mantiene idéntico al modelo original, con tus datos personales.</p></div>
        <label className={styles.publishConfirm}><input type="checkbox" checked={confirmPublish} onChange={e=>setConfirmPublish(e.target.checked)} /> Revisé nombres, fotos, audios y mensajes y quiero publicar esta experiencia.</label>
        <button className={styles.primary} disabled={busy||!confirmPublish} onClick={()=>void publishGift()}>Publicar mi regalo →</button>
      </section>
    </div>
  );
}
