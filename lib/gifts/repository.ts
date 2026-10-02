import "server-only";
import type { Experience, SceneType } from "@/data/experiences";
import { getExperience } from "@/data/experiences";

type EdgeGift = {
  experience_slug: string;
  giver_name: string;
  recipient_name: string;
  occasion: string | null;
  feeling: string | null;
  opening_text: string | null;
  letter_text: string | null;
  closing_text: string | null;
  music_url: string | null;
  scene_recipe: SceneType[] | null;
  story_data: Record<string, unknown> | null;
  theme_data: { accent?: string } | null;
  reactions_enabled: boolean;
};

type EdgeMedia = {
  kind: "image" | "video" | "audio";
  caption: string | null;
  sort_order: number;
  metadata: Record<string, unknown> | null;
  url: string | null;
};

type GiftReadResponse = {
  gift: EdgeGift;
  media: EdgeMedia[];
};

function publicCredentials() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return null;

  return {
    url: url.replace(/\/$/, ""),
    publishableKey,
  };
}

function adminCredentials() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) return null;

  return {
    url: url.replace(/\/$/, ""),
    secret,
  };
}

export function isGiftDatabaseConfigured() {
  return Boolean(publicCredentials());
}

export function isAdminDatabaseConfigured() {
  return Boolean(adminCredentials());
}

export async function getPublishedGiftByCode(
  code: string,
): Promise<{
  experience: Experience;
  letterText?: string;
  photoMedia?: {
    url: string;
    caption?: string;
    fit?: "cover" | "contain";
    position?: "center" | "top" | "bottom" | "left" | "right";
  }[];
  audioMedia?: { url: string; caption?: string }[];
  videoMedia?: { url: string; caption?: string }[];
}> {
  const env = publicCredentials();
  if (!env) {
    throw new Error("gift_backend_not_configured");
  }

  const endpoint =
    `${env.url}/functions/v1/gift-read?code=${encodeURIComponent(code)}`;

  const response = await fetch(endpoint, {
    headers: {
      apikey: env.publishableKey,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    throw new Error("gift_not_found");
  }

  if (!response.ok) {
    console.error("gift-read edge function failed", response.status);
    throw new Error("gift_backend_error");
  }

  const payload = (await response.json()) as GiftReadResponse;
  const row = payload.gift;

  const base = getExperience(row.experience_slug);
  if (!base) {
    throw new Error("gift_experience_not_found");
  }

  const orderedMedia = [...(payload.media || [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const photoMedia = orderedMedia
    .filter((item) => item.kind === "image" && item.url)
    .map((item) => ({
      url: item.url as string,
      caption: item.caption || undefined,
      fit: item.metadata?.fit === "contain" ? "contain" as const : "cover" as const,
      position:
        ["center", "top", "bottom", "left", "right"].includes(
          String(item.metadata?.position || ""),
        )
          ? (item.metadata?.position as "center" | "top" | "bottom" | "left" | "right")
          : "center",
    }));

  const audioMedia = orderedMedia
    .filter((item) => item.kind === "audio" && item.url)
    .map((item) => ({
      url: item.url as string,
      caption: item.caption || undefined,
    }));

  const videoMedia = orderedMedia
    .filter((item) => item.kind === "video" && item.url)
    .map((item) => ({
      url: item.url as string,
      caption: item.caption || undefined,
    }));

  return {
    experience: {
      ...base,
      demoGiver: row.giver_name,
      demoRecipient: row.recipient_name,
      opening: row.opening_text || base.opening,
      closing: row.closing_text || base.closing,
      recipe:
        Array.isArray(row.scene_recipe) && row.scene_recipe.length > 0
          ? row.scene_recipe
          : base.recipe,
      accent: row.theme_data?.accent || base.accent,
    },
    letterText: row.letter_text || undefined,
    photoMedia: photoMedia.length > 0 ? photoMedia : undefined,
    audioMedia: audioMedia.length > 0 ? audioMedia : undefined,
    videoMedia: videoMedia.length > 0 ? videoMedia : undefined,
  };
}

export type AdminGiftSummary = {
  public_code: string;
  status: string;
  experience_slug: string;
  giver_name: string;
  recipient_name: string;
  created_at: string;
  published_at: string | null;
};

export async function listRecentGifts(limit = 30): Promise<AdminGiftSummary[]> {
  const env = adminCredentials();
  if (!env) return [];

  const safeLimit = Math.max(1, Math.min(limit, 100));
  const endpoint =
    `${env.url}/rest/v1/gifts?select=public_code,status,experience_slug,giver_name,recipient_name,created_at,published_at&order=created_at.desc&limit=${safeLimit}`;

  const response = await fetch(endpoint, {
    headers: {
      apikey: env.secret,
      Authorization: `Bearer ${env.secret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("admin gift listing failed", response.status);
    return [];
  }

  return (await response.json()) as AdminGiftSummary[];
}


export type AdminGiftDetail = {
  id: string;
  public_code: string;
  status: string;
  experience_slug: string;
  giver_name: string;
  recipient_name: string;
  occasion: string | null;
  feeling: string | null;
  opening_text: string | null;
  letter_text: string | null;
  closing_text: string | null;
  music_url: string | null;
  scene_recipe: SceneType[];
  story_data: {
    relationship?: string;
    keyDate?: string;
    anecdote?: string;
  } | null;
  theme_data: { accent?: string } | null;
  published_at: string | null;
  created_at: string;
};

export type AdminGiftMedia = {
  id: string;
  kind: "image" | "video" | "audio";
  storage_path: string;
  caption: string | null;
  sort_order: number;
  metadata: {
    originalName?: string;
    mimeType?: string;
    size?: number;
    fit?: "cover" | "contain";
    position?: "center" | "top" | "bottom" | "left" | "right";
  } | null;
  signed_url: string | null;
};

export async function getAdminGiftByCode(code: string): Promise<{
  gift: AdminGiftDetail;
  media: AdminGiftMedia[];
} | null> {
  const { createAdminSupabase } = await import("@/lib/supabase/admin");
  const supabase = createAdminSupabase();

  const { data: gift, error } = await supabase
    .from("gifts")
    .select("*")
    .eq("public_code", code)
    .single();

  if (error || !gift) return null;

  const { data: mediaRows, error: mediaError } = await supabase
    .from("gift_media")
    .select("id,kind,storage_path,caption,sort_order,metadata")
    .eq("gift_id", gift.id)
    .order("sort_order", { ascending: true });

  if (mediaError) {
    console.error(mediaError);
    throw new Error("admin_media_lookup_failed");
  }

  const media = (mediaRows || []) as Omit<AdminGiftMedia, "signed_url">[];
  const paths = media.map((item) => item.storage_path);

  let signedByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed, error: signedError } = await supabase.storage
      .from("gift-media")
      .createSignedUrls(paths, 60 * 60);

    if (signedError) {
      console.error(signedError);
    } else {
      signedByPath = new Map(
        (signed || [])
          .filter((item) => item.signedUrl)
          .map((item) => [item.path, item.signedUrl as string]),
      );
    }
  }

  return {
    gift: gift as AdminGiftDetail,
    media: media.map((item) => ({
      ...item,
      signed_url: signedByPath.get(item.storage_path) || null,
    })),
  };
}
