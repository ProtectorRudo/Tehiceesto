"use server";

import { redirect } from "next/navigation";
import { clearAffiliateSession, establishAffiliateSession } from "@/lib/affiliate-auth";

export async function loginAffiliate(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const ok = await establishAffiliateSession(email, password);

  if (!ok) redirect("/afiliados?error=credenciales");
  redirect("/afiliados");
}

export async function logoutAffiliate() {
  await clearAffiliateSession();
  redirect("/afiliados");
}
