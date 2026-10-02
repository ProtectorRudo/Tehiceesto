"use server";

import { redirect } from "next/navigation";
import {
  clearAdminSession,
  establishAdminSession,
} from "@/lib/admin-auth";

export async function loginAdmin(formData: FormData) {
  const key = String(formData.get("accessKey") || "");
  const ok = await establishAdminSession(key);

  if (!ok) {
    redirect("/admin?error=1");
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin");
}
