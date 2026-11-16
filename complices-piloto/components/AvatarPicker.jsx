"use client";
import {useRef,useState} from "react";

export function AvatarCircle({name,src,size="large"}){
 return <span className={"cp-avatar cp-avatar-"+size} aria-label={"Foto de "+(name||"integrante")}>
  {src?<img src={src} alt={name?"Foto de "+name:"Foto de perfil"}/>:<span aria-hidden="true">♡</span>}
 </span>;
}
async function imageToJpeg(file){
 if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Elegí una foto JPG, PNG o WebP.");
 if(file.size>6*1024*1024)throw new Error("La foto debe pesar menos de 6 MB.");
 const bitmap=await createImageBitmap(file);
 try{
  const size=480,canvas=document.createElement("canvas");
  canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext("2d");
  if(!ctx)throw new Error("Tu navegador no pudo preparar la imagen.");
  const cut=Math.min(bitmap.width,bitmap.height);
  const x=(bitmap.width-cut)/2,y=(bitmap.height-cut)/2;
  ctx.fillStyle="#ffffff";ctx.fillRect(0,0,size,size);
  ctx.drawImage(bitmap,x,y,cut,cut,0,0,size,size);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("No se pudo convertir la foto")),"image/jpeg",.84));
  if(blob.size>2*1024*1024)throw new Error("La imagen supera el tamaño permitido.");
  return blob;
 }finally{bitmap.close?.()}
}
export default function AvatarPicker({db,user,member,src,onSaved}){
 const input=useRef(null),[saving,setSaving]=useState(false),[error,setError]=useState("");
 async function choose(event){
  const file=event.target.files?.[0];event.target.value="";
  if(!file||!member||!user||saving)return;
  setSaving(true);setError("");
  try{
   const blob=await imageToJpeg(file);
   const path=member.space_id+"/"+user.id+"/avatar.jpg";
   const {error:uploadError}=await db.storage.from("cp-avatars").upload(path,blob,{contentType:"image/jpeg",cacheControl:"60",upsert:true});
   if(uploadError)throw uploadError;
   const {data,error:memberError}=await db.from("cp_members").update({avatar_path:path}).eq("user_id",user.id).select("avatar_path").single();
   if(memberError||data?.avatar_path!==path)throw memberError||new Error("No se pudo guardar la foto en tu perfil");
   await onSaved?.();
  }catch(err){setError("No pude guardar la foto: "+(err?.message||"error inesperado"))}
  finally{setSaving(false)}
 }
 async function remove(){
  if(saving||!member?.avatar_path)return;
  setSaving(true);setError("");
  try{
   const path=member.avatar_path;
   const {error:dbError}=await db.from("cp_members").update({avatar_path:null}).eq("user_id",user.id);
   if(dbError)throw dbError;
   const {error:storageError}=await db.storage.from("cp-avatars").remove([path]);
   if(storageError)throw storageError;
   await onSaved?.();
  }catch(err){setError("No pude quitar la foto: "+(err?.message||"error inesperado"))}
  finally{setSaving(false)}
 }
 return <div className="cp-photo-picker">
  <AvatarCircle name={member?.display_name||"Vos"} src={src}/>
  <div className="cp-photo-picker-actions">
   <strong>Tu foto de perfil</strong>
   <span>Visible únicamente para ustedes dos.</span>
   <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label="Elegir foto de perfil" onChange={choose}/>
   <button type="button" disabled={saving} className="cp-photo-action" onClick={()=>input.current?.click()}>{saving?"Guardando…":member?.avatar_path?"Cambiar foto":"Elegir foto"}</button>
   {member?.avatar_path&&<button type="button" className="cp-photo-remove" disabled={saving} onClick={remove}>Quitar foto</button>}
  </div>
  {error&&<p className="cp-photo-error" role="alert">{error}</p>}
 </div>;
}
