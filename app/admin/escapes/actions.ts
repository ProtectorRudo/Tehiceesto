"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {createAdminSupabase} from "@/lib/supabase/admin";
import {getEscapeRoom,validateEscapeConfig} from "@/data/escape-rooms";
async function requireAdmin(){if(!(await isAdminAuthenticated()))throw new Error("admin_unauthorized")}
function getForm(room:NonNullable<ReturnType<typeof getEscapeRoom>>,formData:FormData){
 const raw:Record<string,unknown>={};
 for(const field of room.fields)raw[field.key]=String(formData.get(field.key)||"");
 return validateEscapeConfig(room,raw);
}
export async function createEscapeGift(formData:FormData){
 await requireAdmin();
 const slug=String(formData.get("room")||"");
 const room=getEscapeRoom(slug);
 if(!room)throw new Error("invalid_room");
 const config=getForm(room,formData);
 const {data,error}=await createAdminSupabase().from("gifts").insert({
  status:"draft",experience_slug:"escape-"+slug,
  giver_name:config.firma||"Alguien especial",
  recipient_name:config.nombre||"Invitado especial",
  occasion:config.evento||room.title,feeling:"Sorpresa",
  opening_text:room.subtitle,closing_text:config.mensaje||room.subtitle,
  scene_recipe:[],story_data:{escapeConfig:config,escapeRoomVersion:"v1"},
  theme_data:{accent:room.accent}
 }).select("public_code").single();
 if(error||!data?.public_code){console.error("escape_create_failed",error?.code);throw new Error("escape_create_failed")}
 redirect("/admin/escapes/"+data.public_code);
}
export async function saveEscapeGift(formData:FormData){
 await requireAdmin();
 const code=String(formData.get("code")||"").trim().toLowerCase();
 if(!/^[a-f0-9]{18}$/.test(code))throw new Error("invalid_code");
 const supabase=createAdminSupabase();
 const {data:gift,error:readError}=await supabase.from("gifts").select("status,experience_slug").eq("public_code",code).single();
 if(readError||!gift)throw new Error("escape_not_found");
 const room=getEscapeRoom(gift.experience_slug.replace(/^escape-/,""));
 if(!room||gift.experience_slug!=="escape-"+room.slug)throw new Error("invalid_escape");
 const config=getForm(room,formData);
 const intent=String(formData.get("intent")||"save");
 if(!["save","publish","unpublish"].includes(intent))throw new Error("invalid_intent");
 const patch:Record<string,unknown>={
  recipient_name:config.nombre||"Invitado especial",
  giver_name:config.firma||"Alguien especial",
  occasion:config.evento||room.title,
  letter_text:config.mensaje,
  closing_text:config.mensaje,
  story_data:{escapeConfig:config,escapeRoomVersion:"v1"}
 };
 if(intent==="publish"){patch.status="published";patch.published_at=new Date().toISOString()}
 if(intent==="unpublish"){patch.status="draft";patch.published_at=null}
 const {error}=await supabase.from("gifts").update(patch).eq("public_code",code);
 if(error){console.error("escape_save_failed",error.code);throw new Error("escape_save_failed")}
 revalidatePath("/admin/escapes");
 revalidatePath("/admin/escapes/"+code);
 revalidatePath("/escape-r/"+code);
 redirect("/admin/escapes/"+code+"?updated=1");
}
