"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {adminRequest,isAdminAuthenticated} from "@/lib/admin-auth";
import {getExperience,type SceneType} from "@/data/experiences";
const MAX_SIZE=50*1024*1024;
const mimeTypes=new Set(["image/jpeg","image/png","image/webp","image/heic","audio/mpeg","audio/mp4","audio/webm","audio/wav","video/mp4","video/webm","video/quicktime"]);
async function requireAdmin(){if(!await isAdminAuthenticated())throw Error("admin_unauthorized")}
async function command(action:string,body:Record<string,unknown>={}){
 await requireAdmin();
 const result=await adminRequest(action,body);
 if(!result||result.error)throw Error(String(result?.error||"admin_operation_failed"));
 return result;
}
const codeCheck=(code:string)=>{const c=code.trim().toLowerCase();if(!/^[a-f0-9]{18}$/.test(c))throw Error("invalid_code");return c};
const refresh=(code:string)=>{revalidatePath("/admin");revalidatePath("/admin/gifts/"+code);revalidatePath("/admin/gifts/"+code+"/preview");revalidatePath("/r/"+code);};

export async function createGiftAction(formData:FormData){
 const experienceSlug=String(formData.get("experienceSlug")||"");
 const giverName=String(formData.get("giverName")||"").trim();
 const recipientName=String(formData.get("recipientName")||"").trim();
 if(!getExperience(experienceSlug)||!giverName||!recipientName)throw Error("invalid_gift");
 const r=await command("createGift",{experienceSlug,giverName,recipientName,feeling:String(formData.get("feeling")||""),occasion:String(formData.get("occasion")||"")});
 const code=codeCheck(String(r.code||""));redirect("/admin/gifts/"+code);
}
export async function saveGiftContentAction(formData:FormData){
 const code=codeCheck(String(formData.get("code")||""));
 let sceneRecipe:SceneType[]=[];
 try{const parsed=JSON.parse(String(formData.get("sceneRecipe")||"[]"));if(Array.isArray(parsed))sceneRecipe=parsed;}catch{throw Error("invalid_recipe")}
 if(!sceneRecipe.length)throw Error("invalid_recipe");
 await command("updateGift",{
  code,sceneRecipe,
  giverName:String(formData.get("giverName")||""),
  recipientName:String(formData.get("recipientName")||""),
  occasion:String(formData.get("occasion")||""),
  feeling:String(formData.get("feeling")||""),
  openingText:String(formData.get("openingText")||""),
  letterText:String(formData.get("letterText")||""),
  closingText:String(formData.get("closingText")||""),
  musicUrl:String(formData.get("musicUrl")||""),
  relationship:String(formData.get("relationship")||""),
  keyDate:String(formData.get("keyDate")||""),
  anecdote:String(formData.get("anecdote")||""),
 });
 refresh(code);
}
export async function saveSceneCopyOverrideAction(input:{code:string;scene:string;source:string;replacement:string}){
 const code=codeCheck(input.code);await command("saveSceneCopyOverride",{...input,code});refresh(code);return {ok:true};
}
export async function removeSceneCopyOverrideAction(input:{code:string;scene:string;source:string}){
 const code=codeCheck(input.code);await command("removeSceneCopyOverride",{...input,code});refresh(code);return {ok:true};
}
export async function prepareMediaUploadAction(input:{code:string;fileName:string;mimeType:string;size:number}){
 const code=codeCheck(input.code);
 if(!mimeTypes.has(input.mimeType)||input.size<=0||input.size>MAX_SIZE)throw Error("invalid_media");
 const r=await command("prepareUpload",{...input,code});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
 if(!url)throw Error("supabase_not_configured");
 const projectRef=new URL(url).hostname.split(".")[0];
 return {storagePath:String(r.path||""),token:String(r.token||""),endpoint:"https://"+projectRef+".storage.supabase.co/storage/v1/upload/resumable",bucketName:"gift-media",kind:input.mimeType.startsWith("image/")?"image" as const:input.mimeType.startsWith("audio/")?"audio" as const:"video" as const};
}
export async function registerMediaAction(input:{code:string;storagePath:string;kind:"image"|"audio"|"video";originalName:string;mimeType:string;size:number}){
 const code=codeCheck(input.code);await command("registerMedia",{...input,code});refresh(code);
}
export async function updateMediaAction(input:{code:string;mediaId:string;caption:string;fit:"cover"|"contain";position:"center"|"top"|"bottom"|"left"|"right";role?:"voice"|"soundtrack"}){
 const code=codeCheck(input.code);await command("updateMedia",{...input,code});refresh(code);
}
export async function reorderMediaAction(input:{code:string;mediaIds:string[]}){
 const code=codeCheck(input.code);await command("reorderMedia",{...input,code});refresh(code);
}
export async function deleteMediaAction(input:{code:string;mediaId:string}){
 const code=codeCheck(input.code);await command("deleteMedia",{...input,code});refresh(code);
}
export async function publishGiftAction(codeInput:string){
 const code=codeCheck(codeInput);await command("publish",{code});refresh(code);
}
export async function unpublishGiftAction(codeInput:string){
 const code=codeCheck(codeInput);await command("unpublish",{code});refresh(code);
}
