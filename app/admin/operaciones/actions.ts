"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {adminRequest,clearAdminSession,establishAdminSession,isAdminAuthenticated} from "@/lib/admin-auth";

export async function operationsLogin(formData:FormData){
  const key=String(formData.get("accessKey")||"");
  if(!await establishAdminSession(key))redirect("/admin/operaciones?error=1");
  redirect("/admin/operaciones");
}
export async function operationsLogout(){
  await clearAdminSession();
  redirect("/admin/operaciones");
}
export async function markContacted(formData:FormData){
  if(!await isAdminAuthenticated())redirect("/admin/operaciones");
  const orderId=String(formData.get("orderId")||"");
  if(!/^[a-f0-9-]{36}$/.test(orderId))return;
  await adminRequest("markSaleContacted",{orderId});
  revalidatePath("/admin/operaciones");
}
