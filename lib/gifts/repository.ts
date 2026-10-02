import "server-only";
import type { Experience, SceneType } from "@/data/experiences";
import { getExperience } from "@/data/experiences";

type StoredGift = {
  public_code: string;
  status: string;
  experience_slug: string;
  giver_name: string;
  recipient_name: string;
  feeling: string | null;
  opening_text: string | null;
  letter_text: string | null;
  closing_text: string | null;
  scene_recipe: SceneType[] | null;
  story_data: Record<string, unknown> | null;
  theme_data: { accent?: string } | null;
};

function credentials() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return { url: url.replace(/\/$/, ""), secret };
}

export function isGiftDatabaseConfigured() {
  return Boolean(credentials());
}

export async function getPublishedGiftByCode(
  code: string,
): Promise<{ experience: Experience; letterText?: string } | null> {
  const env = credentials();
  if (!env) return null;

  const safeCode = encodeURIComponent(code);
  const endpoint =
    `${env.url}/rest/v1/gifts?select=public_code,status,experience_slug,giver_name,recipient_name,feeling,opening_text,letter_text,closing_text,scene_recipe,story_data,theme_data&public_code=eq.${safeCode}&status=eq.published&limit=1`;

  const response = await fetch(endpoint, {
    headers: {
      apikey: env.secret,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("gift lookup failed", response.status);
    return null;
  }

  const rows = (await response.json()) as StoredGift[];
  const row = rows[0];
  if (!row) return null;

  const base = getExperience(row.experience_slug);
  if (!base) return null;

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
  const env = credentials();
  if (!env) return [];

  const safeLimit = Math.max(1, Math.min(limit, 100));
  const endpoint =
    `${env.url}/rest/v1/gifts?select=public_code,status,experience_slug,giver_name,recipient_name,created_at,published_at&order=created_at.desc&limit=${safeLimit}`;

  const response = await fetch(endpoint, {
    headers: {
      apikey: env.secret,
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
