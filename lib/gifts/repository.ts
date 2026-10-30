import {adminRequest} from "@/lib/admin-auth";
import "server-only";
import type { Experience, SceneType } from "@/data/experiences";
import { getExperience } from "@/data/experiences";
import { normalizeSceneTextOverrides, type SceneTextOverrides } from "@/data/scene-text";

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
  return Boolean(publicCredentials());
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
  soundtrackMedia?: { url: string; caption?: string };
  videoMedia?: { url: string; caption?: string }[];
  storyContext?: {
    keyDate?: string;
    anecdote?: string;
  };
  sceneTextOverrides?: SceneTextOverrides;
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

  const soundtrackItem = orderedMedia.find(
    (item) =>
      item.kind === "audio" &&
      item.url &&
      item.metadata?.role === "soundtrack",
  );

  const soundtrackMedia = soundtrackItem
    ? {
        url: soundtrackItem.url as string,
        caption: soundtrackItem.caption || undefined,
      }
    : undefined;

  const audioMedia = orderedMedia
    .filter(
      (item) =>
        item.kind === "audio" &&
        item.url &&
        item.metadata?.role !== "soundtrack",
    )
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
    soundtrackMedia,
    videoMedia: videoMedia.length > 0 ? videoMedia : undefined,
    storyContext: row.story_data
      ? {
          keyDate:
            typeof row.story_data.keyDate === "string"
              ? row.story_data.keyDate
              : undefined,
          anecdote:
            typeof row.story_data.anecdote === "string"
              ? row.story_data.anecdote
              : undefined,
        }
      : undefined,
    sceneTextOverrides: normalizeSceneTextOverrides(
      row.story_data?.sceneContent,
    ),
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
  const payload=await adminRequest("listGifts");
  const gifts=Array.isArray(payload?.gifts)?payload.gifts:[];
  return gifts.slice(0,Math.max(1,Math.min(limit,100))).map((row:Record<string,any>)=>({
    public_code:String(row.public_code||""),
    status:String(row.status||"draft"),
    experience_slug:String(row.experience_slug||""),
    giver_name:String(row.giver_name||""),
    recipient_name:String(row.recipient_name||""),
    created_at:String(row.created_at||""),
    published_at:row.published_at?String(row.published_at):null
  }));
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
    sceneContent?: SceneTextOverrides;
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
    role?: "voice" | "soundtrack";
  } | null;
  signed_url: string | null;
};

export async function getAdminGiftByCode(code:string):Promise<{
  gift:AdminGiftDetail;media:AdminGiftMedia[];
}|null>{
  if(!/^[a-f0-9]{18}$/.test(code))return null;
  const payload=await adminRequest("getGift",{code});
  if(!payload?.gift)return null;
  const rows=Array.isArray(payload.media)?payload.media:[];
  const media:AdminGiftMedia[]=rows.map((row:Record<string,any>)=>({
    id:String(row.id||""),
    kind:row.kind,
    storage_path:String(row.storage_path||""),
    caption:row.caption||null,
    sort_order:Number(row.sort_order||0),
    metadata:row.metadata||null,
    signed_url:typeof row.url==="string"?row.url:null,
  }));
  return {gift:payload.gift as AdminGiftDetail,media};
}
