"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { hashAffiliatePassword } from "@/lib/affiliate-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function createAffiliateAction(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim().slice(0, 100);
  const email = String(formData.get("email") || "").trim().toLowerCase().slice(0, 200);
  const whatsapp = String(formData.get("whatsapp") || "").trim().slice(0, 40) || null;
  const password = String(formData.get("password") || "");
  const requestedSlug = slugify(String(formData.get("slug") || name));
  const percent = Number(formData.get("commissionPercent") || 20);
  const commissionBps = Math.round(percent * 100);

  if (
    name.length < 2 ||
    !email.includes("@") ||
    password.length < 10 ||
    requestedSlug.length < 3 ||
    commissionBps < 0 ||
    commissionBps > 5000
  ) {
    redirect("/admin/affiliates?notice=datos-invalidos");
  }

  const supabase = createAdminSupabase();
  const { data: duplicate } = await supabase
    .from("affiliates")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (duplicate) redirect("/admin/affiliates?notice=email-existente");

  const credentials = hashAffiliatePassword(password);
  const { data: affiliate, error } = await supabase
    .from("affiliates")
    .insert({
      slug: requestedSlug,
      name,
      email,
      whatsapp,
      commission_bps: commissionBps,
      password_salt: credentials.salt,
      password_hash: credentials.hash,
    })
    .select("id")
    .single();

  if (error || !affiliate) {
    console.error("affiliate_create_failed", error);
    redirect("/admin/affiliates?notice=no-se-pudo-crear");
  }

  const { error: linkError } = await supabase.from("affiliate_links").insert({
    affiliate_id: affiliate.id,
    code: requestedSlug,
    label: "Principal",
  });

  if (linkError) {
    await supabase.from("affiliates").delete().eq("id", affiliate.id);
    console.error("affiliate_link_create_failed", linkError);
    redirect("/admin/affiliates?notice=link-duplicado");
  }

  revalidatePath("/admin/affiliates");
  redirect("/admin/affiliates?notice=creado");
}

export async function setAffiliateStatusAction(formData: FormData) {
  await requireAdmin();
  const affiliateId = String(formData.get("affiliateId") || "");
  const status = String(formData.get("status") || "") === "paused" ? "paused" : "active";
  const supabase = createAdminSupabase();

  const { error } = await supabase
    .from("affiliates")
    .update({ status })
    .eq("id", affiliateId);

  if (error) throw new Error("affiliate_status_update_failed");
  revalidatePath("/admin/affiliates");
}

export async function payAffiliateAction(formData: FormData) {
  await requireAdmin();
  const affiliateId = String(formData.get("affiliateId") || "");
  const reference = String(formData.get("reference") || "").trim().slice(0, 120) || null;
  const supabase = createAdminSupabase();

  const { error } = await supabase.rpc("record_affiliate_payout", {
    p_affiliate_id: affiliateId,
    p_provider_reference: reference,
    p_notes: "Liquidación registrada desde panel Te Hice Esto",
  });

  if (error) {
    console.error("affiliate_payout_failed", error);
    redirect("/admin/affiliates?notice=sin-comisiones-pendientes");
  }

  revalidatePath("/admin/affiliates");
  redirect("/admin/affiliates?notice=liquidado");
}
