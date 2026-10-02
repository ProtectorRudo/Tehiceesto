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
  photoUrls?: string[];
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

  const photoUrls = (payload.media || [])
    .filter((item) => item.kind === "image" && item.url)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => item.url as string);

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
    photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
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
