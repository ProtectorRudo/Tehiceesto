"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminSupabase, getStorageUploadEndpoint } from "@/lib/supabase/admin";
import { getExperience, experiences, type SceneType } from "@/data/experiences";
import { normalizeSceneTextOverrides } from "@/data/scene-text";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const allowedMime = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/wav",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const allSceneTypes = Array.from(
  new Set<SceneType>([
    ...experiences.flatMap((item) => item.recipe),
    "video",
  ]),
);

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("admin_unauthorized");
  }
}

function cleanCode(code: string) {
  const normalized = code.trim().toLowerCase();
  if (!/^[a-f0-9]{18}$/.test(normalized)) {
    throw new Error("invalid_gift_code");
  }
  return normalized;
}

function cleanFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "archivo";

  return ext ? `${base}.${ext}` : base;
}

function mediaKind(mime: string): "image" | "audio" | "video" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  throw new Error("unsupported_media_type");
}

export async function createGiftAction(formData: FormData) {
  await requireAdmin();

  const experienceSlug = String(formData.get("experienceSlug") || "");
  const giverName = String(formData.get("giverName") || "").trim();
  const recipientName = String(formData.get("recipientName") || "").trim();
  const feeling = String(formData.get("feeling") || "").trim() || null;
  const occasion = String(formData.get("occasion") || "").trim() || null;

  const experience = getExperience(experienceSlug);
  if (!experience || !giverName || !recipientName) {
    throw new Error("invalid_gift_input");
  }

  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("gifts")
    .insert({
      status: "draft",
      experience_slug: experience.slug,
      giver_name: giverName,
      recipient_name: recipientName,
      feeling,
      occasion,
      opening_text: experience.opening,
      closing_text: experience.closing,
      scene_recipe: experience.recipe,
      theme_data: { accent: experience.accent },
      story_data: {},
    })
    .select("public_code")
    .single();

  if (error || !data?.public_code) {
    console.error(error);
    throw new Error("gift_create_failed");
  }

  redirect(`/admin/gifts/${data.public_code}`);
}

export async function saveGiftContentAction(formData: FormData) {
  await requireAdmin();

  const code = cleanCode(String(formData.get("code") || ""));
  const supabase = createAdminSupabase();

  const recipeRaw = String(formData.get("sceneRecipe") || "[]");
  let sceneRecipe: SceneType[] = [];
  try {
    const parsed = JSON.parse(recipeRaw);
    if (Array.isArray(parsed)) {
      sceneRecipe = parsed.filter((value): value is SceneType =>
        allSceneTypes.includes(value as SceneType),
      );
    }
  } catch {
    throw new Error("invalid_scene_recipe");
  }

  if (sceneRecipe.length === 0) {
    throw new Error("empty_scene_recipe");
  }

  const { data: currentGift } = await supabase
    .from("gifts")
    .select("story_data")
    .eq("public_code", code)
    .single();

  const existingStoryData =
    currentGift?.story_data &&
    typeof currentGift.story_data === "object" &&
    !Array.isArray(currentGift.story_data)
      ? currentGift.story_data
      : {};

  const storyData = {
    ...existingStoryData,
    relationship: String(formData.get("relationship") || "").trim(),
    keyDate: String(formData.get("keyDate") || "").trim(),
    anecdote: String(formData.get("anecdote") || "").trim(),
  };

  const { error } = await supabase
    .from("gifts")
    .update({
      giver_name: String(formData.get("giverName") || "").trim(),
      recipient_name: String(formData.get("recipientName") || "").trim(),
      occasion: String(formData.get("occasion") || "").trim() || null,
      feeling: String(formData.get("feeling") || "").trim() || null,
      opening_text: String(formData.get("openingText") || "").trim() || null,
      letter_text: String(formData.get("letterText") || "").trim() || null,
      closing_text: String(formData.get("closingText") || "").trim() || null,
      music_url: String(formData.get("musicUrl") || "").trim() || null,
      scene_recipe: sceneRecipe,
      story_data: storyData,
    })
    .eq("public_code", code);

  if (error) {
    console.error(error);
    throw new Error("gift_update_failed");
  }

  revalidatePath(`/admin/gifts/${code}`);
  revalidatePath(`/admin/gifts/${code}/preview`);
}

export async function saveSceneCopyOverrideAction(input: {
  code: string;
  scene: string;
  source: string;
  replacement: string;
}) {
  await requireAdmin();

  const code = cleanCode(input.code);
  const scene = input.scene.trim() as SceneType;
  const source = input.source.trim();
  const replacement = input.replacement.trim();

  if (!allSceneTypes.includes(scene)) throw new Error("invalid_scene_type");
  if (!source || source.length > 5000 || replacement.length > 5000) {
    throw new Error("invalid_scene_copy");
  }

  const supabase = createAdminSupabase();
  const { data: gift, error: giftError } = await supabase
    .from("gifts")
    .select("story_data")
    .eq("public_code", code)
    .single();

  if (giftError || !gift) throw new Error("gift_not_found");

  const storyData =
    gift.story_data &&
    typeof gift.story_data === "object" &&
    !Array.isArray(gift.story_data)
      ? { ...gift.story_data }
      : {};

  const sceneContent = normalizeSceneTextOverrides(
    (storyData as Record<string, unknown>).sceneContent,
  );

  sceneContent[scene] = {
    ...(sceneContent[scene] || {}),
    [source]: replacement,
  };

  const { error } = await supabase
    .from("gifts")
    .update({
      story_data: {
        ...storyData,
        sceneContent,
      },
    })
    .eq("public_code", code);

  if (error) throw new Error("scene_copy_update_failed");

  revalidatePath(`/admin/gifts/${code}`);
  revalidatePath(`/admin/gifts/${code}/preview`);
  revalidatePath(`/r/${code}`);

  return { ok: true };
}

export async function removeSceneCopyOverrideAction(input: {
  code: string;
  scene: string;
  source: string;
}) {
  await requireAdmin();

  const code = cleanCode(input.code);
  const scene = input.scene.trim() as SceneType;
  const source = input.source.trim();

  if (!allSceneTypes.includes(scene) || !source) {
    throw new Error("invalid_scene_copy");
  }

  const supabase = createAdminSupabase();
  const { data: gift, error: giftError } = await supabase
    .from("gifts")
    .select("story_data")
    .eq("public_code", code)
    .single();

  if (giftError || !gift) throw new Error("gift_not_found");

  const storyData =
    gift.story_data &&
    typeof gift.story_data === "object" &&
    !Array.isArray(gift.story_data)
      ? { ...gift.story_data }
      : {};

  const sceneContent = normalizeSceneTextOverrides(
    (storyData as Record<string, unknown>).sceneContent,
  );

  if (sceneContent[scene]) {
    delete sceneContent[scene][source];
    if (Object.keys(sceneContent[scene]).length === 0) {
      delete sceneContent[scene];
    }
  }

  const { error } = await supabase
    .from("gifts")
    .update({
      story_data: {
        ...storyData,
        sceneContent,
      },
    })
    .eq("public_code", code);

  if (error) throw new Error("scene_copy_remove_failed");

  revalidatePath(`/admin/gifts/${code}`);
  revalidatePath(`/admin/gifts/${code}/preview`);
  revalidatePath(`/r/${code}`);

  return { ok: true };
}

export async function prepareMediaUploadAction(input: {
  code: string;
  fileName: string;
  mimeType: string;
  size: number;
}) {
  await requireAdmin();

  const code = cleanCode(input.code);
  if (!allowedMime.has(input.mimeType) || input.size <= 0 || input.size > MAX_FILE_SIZE) {
    throw new Error("invalid_media");
  }

  const supabase = createAdminSupabase();
  const { data: gift, error: giftError } = await supabase
    .from("gifts")
    .select("id")
    .eq("public_code", code)
    .single();

  if (giftError || !gift) {
    throw new Error("gift_not_found");
  }

  const safeName = cleanFileName(input.fileName);
  const storagePath = `${code}/${randomUUID()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from("gift-media")
    .createSignedUploadUrl(storagePath);

  if (error || !data?.token) {
    console.error(error);
    throw new Error("signed_upload_failed");
  }

  return {
    storagePath,
    token: data.token,
    endpoint: getStorageUploadEndpoint(),
    bucketName: "gift-media",
    kind: mediaKind(input.mimeType),
  };
}

export async function registerMediaAction(input: {
  code: string;
  storagePath: string;
  kind: "image" | "audio" | "video";
  originalName: string;
  mimeType: string;
  size: number;
}) {
  await requireAdmin();
  const code = cleanCode(input.code);
  const supabase = createAdminSupabase();

  const { data: gift, error: giftError } = await supabase
    .from("gifts")
    .select("id")
    .eq("public_code", code)
    .single();

  if (giftError || !gift) {
    throw new Error("gift_not_found");
  }

  if (!input.storagePath.startsWith(`${code}/`)) {
    throw new Error("invalid_storage_path");
  }

  const { count } = await supabase
    .from("gift_media")
    .select("*", { count: "exact", head: true })
    .eq("gift_id", gift.id);

  const { error } = await supabase.from("gift_media").insert({
    gift_id: gift.id,
    kind: input.kind,
    storage_path: input.storagePath,
    sort_order: count || 0,
    metadata: {
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      fit: "cover",
      position: "center",
      ...(input.kind === "audio" ? { role: "voice" } : {}),
    },
  });

  if (error) {
    console.error(error);
    throw new Error("media_register_failed");
  }

  revalidatePath(`/admin/gifts/${code}`);
  revalidatePath(`/admin/gifts/${code}/preview`);
}

export async function updateMediaAction(input: {
  code: string;
  mediaId: string;
  caption: string;
  fit: "cover" | "contain";
  position: "center" | "top" | "bottom" | "left" | "right";
  role?: "voice" | "soundtrack";
}) {
  await requireAdmin();
  const code = cleanCode(input.code);
  const supabase = createAdminSupabase();

  const { data: gift } = await supabase
    .from("gifts")
    .select("id")
    .eq("public_code", code)
    .single();

  if (!gift) throw new Error("gift_not_found");

  const { data: media } = await supabase
    .from("gift_media")
    .select("kind,metadata")
    .eq("id", input.mediaId)
    .eq("gift_id", gift.id)
    .single();

  if (!media) throw new Error("media_not_found");

  const role =
    media.kind === "audio" && input.role === "soundtrack"
      ? "soundtrack"
      : media.kind === "audio"
        ? "voice"
        : undefined;

  if (role === "soundtrack") {
    const { data: otherAudio } = await supabase
      .from("gift_media")
      .select("id,metadata")
      .eq("gift_id", gift.id)
      .eq("kind", "audio")
      .neq("id", input.mediaId);

    for (const other of otherAudio || []) {
      const otherMetadata = {
        ...(other.metadata || {}),
        role: "voice",
      };
      const { error: roleError } = await supabase
        .from("gift_media")
        .update({ metadata: otherMetadata })
        .eq("id", other.id)
        .eq("gift_id", gift.id);

      if (roleError) throw new Error("media_soundtrack_role_failed");
    }
  }

  const metadata = {
    ...(media.metadata || {}),
    fit: input.fit,
    position: input.position,
    ...(role ? { role } : {}),
  };

  const { error } = await supabase
    .from("gift_media")
    .update({
      caption: input.caption.trim() || null,
      metadata,
    })
    .eq("id", input.mediaId)
    .eq("gift_id", gift.id);

  if (error) throw new Error("media_update_failed");

  revalidatePath(`/admin/gifts/${code}`);
  revalidatePath(`/admin/gifts/${code}/preview`);
}

export async function reorderMediaAction(input: {
  code: string;
  mediaIds: string[];
}) {
  await requireAdmin();
  const code = cleanCode(input.code);
  const supabase = createAdminSupabase();

  const { data: gift } = await supabase
    .from("gifts")
    .select("id")
    .eq("public_code", code)
    .single();

  if (!gift) throw new Error("gift_not_found");

  for (let index = 0; index < input.mediaIds.length; index += 1) {
    const { error } = await supabase
      .from("gift_media")
      .update({ sort_order: index })
      .eq("id", input.mediaIds[index])
      .eq("gift_id", gift.id);

    if (error) throw new Error("media_reorder_failed");
  }

  revalidatePath(`/admin/gifts/${code}`);
  revalidatePath(`/admin/gifts/${code}/preview`);
}

export async function deleteMediaAction(input: {
  code: string;
  mediaId: string;
}) {
  await requireAdmin();
  const code = cleanCode(input.code);
  const supabase = createAdminSupabase();

  const { data: gift } = await supabase
    .from("gifts")
    .select("id")
    .eq("public_code", code)
    .single();

  if (!gift) throw new Error("gift_not_found");

  const { data: media } = await supabase
    .from("gift_media")
    .select("storage_path")
    .eq("id", input.mediaId)
    .eq("gift_id", gift.id)
    .single();

  if (!media) throw new Error("media_not_found");

  const { error: storageError } = await supabase.storage
    .from("gift-media")
    .remove([media.storage_path]);

  if (storageError) {
    console.error(storageError);
    throw new Error("media_storage_delete_failed");
  }

  const { error } = await supabase
    .from("gift_media")
    .delete()
    .eq("id", input.mediaId)
    .eq("gift_id", gift.id);

  if (error) throw new Error("media_delete_failed");

  revalidatePath(`/admin/gifts/${code}`);
  revalidatePath(`/admin/gifts/${code}/preview`);
}

export async function publishGiftAction(codeInput: string) {
  await requireAdmin();
  const code = cleanCode(codeInput);
  const supabase = createAdminSupabase();

  const { error } = await supabase
    .from("gifts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("public_code", code);

  if (error) throw new Error("gift_publish_failed");

  revalidatePath("/admin");
  revalidatePath(`/admin/gifts/${code}`);
  revalidatePath(`/r/${code}`);

  return { ok: true };
}

export async function unpublishGiftAction(codeInput: string) {
  await requireAdmin();
  const code = cleanCode(codeInput);
  const supabase = createAdminSupabase();

  const { error } = await supabase
    .from("gifts")
    .update({
      status: "draft",
      published_at: null,
    })
    .eq("public_code", code);

  if (error) throw new Error("gift_unpublish_failed");

  revalidatePath("/admin");
  revalidatePath(`/admin/gifts/${code}`);
  revalidatePath(`/r/${code}`);

  return { ok: true };
}
