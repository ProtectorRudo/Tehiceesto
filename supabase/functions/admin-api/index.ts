import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

function defaultKey(envName: string) {
  try {
    const parsed = JSON.parse(Deno.env.get(envName) || "{}");
    return typeof parsed.default === "string" ? parsed.default : "";
  } catch {
    return "";
  }
}

const SECRET_KEY = defaultKey("SUPABASE_SECRET_KEYS");

function adminClient() {
  return createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function cors(origin: string | null) {
  const allowed = origin === "https://viralio.net" || origin === "https://tehiceesto.com" || origin === "https://www.tehiceesto.com" || origin?.endsWith(".vercel.app");
  return {
    "access-control-allow-origin": allowed ? origin! : "https://viralio.net",
    "access-control-allow-headers": "apikey, content-type, x-admin-session",
    "access-control-allow-methods": "POST, OPTIONS",
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  };
}

function json(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}

function validPublishableKey(req: Request) {
  const supplied = req.headers.get("apikey") || "";
  return [
    defaultKey("SUPABASE_PUBLISHABLE_KEYS"),
    defaultKey("SUPABASE_ANON_KEYS"),
  ].filter(Boolean).includes(supplied);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function sessionValid(req: Request) {
  const token = req.headers.get("x-admin-session") || "";
  if (!token) return false;

  const hash = await sha256(token);
  const supabase = adminClient();
  const { data } = await supabase
    .from("admin_sessions")
    .select("id")
    .eq("token_hash", hash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return Boolean(data);
}

function cleanCode(value: unknown) {
  const code = String(value || "").trim().toLowerCase();
  if (!/^[a-f0-9]{18}$/.test(code)) throw new Error("invalid_code");
  return code;
}

const allowedScenes = new Set([
  "intro","door","memories","light","stars","scratch","hold","letter","finale","candles",
  "balloons","timeline","voices","quiz","vault","capsule","proposal","video",
  "archive","home","legacy","rituals","chapters","future",
  "origin","reasons","certainty","threshold"
]);

const defaultRecipes: Record<string, string[]> = {
  pareja:["intro","door","memories","stars","scratch","letter","finale"],
  cumpleanos:["intro","candles","balloons","memories","voices","letter","finale"],
  hijos:["intro","timeline","memories","light","stars","capsule","hold","letter","finale"],
  abuelos:["intro","archive","timeline","memories","home","voices","letter","legacy","finale"],
  aniversario:["intro","timeline","memories","rituals","chapters","letter","future","finale"],
  propuesta:["intro","origin","memories","reasons","certainty","letter","threshold","proposal"],
  "mama-papa":["intro","memories","voices","stars","letter","scratch","finale"],
  amistad:["intro","quiz","memories","balloons","scratch","letter","finale"],
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  if (req.method !== "POST") return json(origin, { error: "method_not_allowed" }, 405);
  if (!validPublishableKey(req)) return json(origin, { error: "unauthorized" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(origin, { error: "invalid_json" }, 400);
  }

  const action = String(body.action || "");
  const supabase = adminClient();

  if (action === "login") {
    const accessKey = String(body.accessKey || "");
    if (!accessKey || accessKey.length > 200) {
      return json(origin, { error: "invalid_credentials" }, 401);
    }

    const secretHash = await sha256(accessKey);
    const { data: access } = await supabase
      .from("admin_access")
      .select("id")
      .eq("name", "primary")
      .eq("secret_hash", secretHash)
      .maybeSingle();

    if (!access) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return json(origin, { error: "invalid_credentials" }, 401);
    }

    await supabase
      .from("admin_sessions")
      .delete()
      .lt("expires_at", new Date().toISOString());

    const token = randomToken();
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("admin_sessions")
      .insert({ token_hash: tokenHash, expires_at: expiresAt });

    if (error) return json(origin, { error: "session_create_failed" }, 500);

    return json(origin, { token, expiresAt });
  }

  if (!(await sessionValid(req))) {
    return json(origin, { error: "admin_session_required" }, 401);
  }

  if (action === "logout") {
    const token = req.headers.get("x-admin-session") || "";
    const hash = await sha256(token);
    await supabase.from("admin_sessions").delete().eq("token_hash", hash);
    return json(origin, { ok: true });
  }

  if (action === "listGifts") {
    const { data, error } = await supabase
      .from("gifts")
      .select("public_code,status,experience_slug,giver_name,recipient_name,created_at,published_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return json(origin, { error: "list_failed" }, 500);
    return json(origin, { gifts: data || [] });
  }

  if (action === "createGift") {
    const experienceSlug = String(body.experienceSlug || "");
    const giverName = String(body.giverName || "").trim();
    const recipientName = String(body.recipientName || "").trim();
    if (!defaultRecipes[experienceSlug] || !giverName || !recipientName) {
      return json(origin, { error: "invalid_input" }, 400);
    }

    const { data, error } = await supabase
      .from("gifts")
      .insert({
        status: "draft",
        experience_slug: experienceSlug,
        giver_name: giverName,
        recipient_name: recipientName,
        occasion: String(body.occasion || "").trim() || null,
        feeling: String(body.feeling || "").trim() || null,
        scene_recipe: defaultRecipes[experienceSlug],
        story_data: { script: {} },
      })
      .select("public_code")
      .single();

    if (error || !data) return json(origin, { error: "create_failed" }, 500);
    return json(origin, { code: data.public_code });
  }

  if (action === "getGift") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    const { data: gift, error } = await supabase
      .from("gifts")
      .select("*")
      .eq("public_code", code)
      .maybeSingle();

    if (error) return json(origin, { error: "gift_lookup_failed" }, 500);
    if (!gift) return json(origin, { error: "gift_not_found" }, 404);

    const { data: mediaRows, error: mediaError } = await supabase
      .from("gift_media")
      .select("id,kind,storage_path,caption,sort_order,metadata")
      .eq("gift_id", gift.id)
      .order("sort_order", { ascending: true });

    if (mediaError) return json(origin, { error: "media_lookup_failed" }, 500);

    const media = mediaRows || [];
    const paths = media.map((item) => item.storage_path);
    let signedMap = new Map<string, string>();

    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from("gift-media")
        .createSignedUrls(paths, 60 * 60);

      signedMap = new Map(
        (signed || [])
          .filter((item) => item.path && item.signedUrl)
          .map((item) => [item.path!, item.signedUrl!]),
      );
    }

    const safeGift = { ...gift };
    delete safeGift.id;

    return json(origin, {
      gift: safeGift,
      media: media.map((item) => ({
        ...item,
        url: signedMap.get(item.storage_path) || null,
      })),
    });
  }

  if (action === "updateGift") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    const recipe = Array.isArray(body.sceneRecipe)
      ? body.sceneRecipe.filter((scene) => allowedScenes.has(String(scene))).map(String)
      : [];

    if (recipe.length === 0) return json(origin, { error: "empty_recipe" }, 400);

    const script = body.script && typeof body.script === "object" && !Array.isArray(body.script)
      ? body.script
      : {};
    let scriptSize = 0;
    try { scriptSize = JSON.stringify(script).length; } catch { return json(origin, { error: "invalid_script" }, 400); }
    if (scriptSize > 120000) return json(origin, { error: "script_too_large" }, 400);

    const { error } = await supabase
      .from("gifts")
      .update({
        giver_name: String(body.giverName || "").trim(),
        recipient_name: String(body.recipientName || "").trim(),
        occasion: String(body.occasion || "").trim() || null,
        feeling: String(body.feeling || "").trim() || null,
        opening_text: String(body.openingText || "").trim() || null,
        letter_text: String(body.letterText || "").trim() || null,
        closing_text: String(body.closingText || "").trim() || null,
        music_url: String(body.musicUrl || "").trim() || null,
        scene_recipe: recipe,
        story_data: {
          relationship: String(body.relationship || "").trim(),
          keyDate: String(body.keyDate || "").trim(),
          anecdote: String(body.anecdote || "").trim(),
          script,
        },
      })
      .eq("public_code", code);

    if (error) return json(origin, { error: "update_failed" }, 500);
    return json(origin, { ok: true });
  }

  if (action === "prepareUpload") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    const fileName = String(body.fileName || "archivo")
      .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);
    const mimeType = String(body.mimeType || "");
    const size = Number(body.size || 0);

    if (size <= 0 || size > 50 * 1024 * 1024 || !/^(image|audio|video)\//.test(mimeType)) {
      return json(origin, { error: "invalid_media" }, 400);
    }

    const { data: gift } = await supabase
      .from("gifts").select("id").eq("public_code", code).maybeSingle();
    if (!gift) return json(origin, { error: "gift_not_found" }, 404);

    const path = `${code}/${crypto.randomUUID()}-${fileName}`;
    const { data, error } = await supabase.storage
      .from("gift-media")
      .createSignedUploadUrl(path);

    if (error || !data) return json(origin, { error: "upload_prepare_failed" }, 500);

    return json(origin, { path, token: data.token });
  }

  if (action === "registerMedia") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    const storagePath = String(body.storagePath || "");
    if (!storagePath.startsWith(`${code}/`)) return json(origin, { error: "invalid_path" }, 400);

    const { data: gift } = await supabase
      .from("gifts").select("id,scene_recipe").eq("public_code", code).maybeSingle();
    if (!gift) return json(origin, { error: "gift_not_found" }, 404);

    const recipe = Array.isArray(gift.scene_recipe) ? gift.scene_recipe.map(String) : [];
    const preferredScene = String(body.kind || "") === "audio"
      ? "voices"
      : String(body.kind || "") === "video"
        ? "video"
        : "memories";
    const defaultScene = recipe.includes(preferredScene) ? preferredScene : (recipe[0] || preferredScene);

    const { count } = await supabase
      .from("gift_media")
      .select("*", { count: "exact", head: true })
      .eq("gift_id", gift.id);

    const { error } = await supabase.from("gift_media").insert({
      gift_id: gift.id,
      kind: String(body.kind || ""),
      storage_path: storagePath,
      sort_order: count || 0,
      metadata: {
        originalName: String(body.originalName || ""),
        mimeType: String(body.mimeType || ""),
        size: Number(body.size || 0),
        fit: "cover",
        position: "center",
        scene: defaultScene,
      },
    });

    if (error) return json(origin, { error: "media_register_failed" }, 500);
    return json(origin, { ok: true });
  }

  if (action === "updateMedia") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }
    const mediaId = String(body.mediaId || "");

    const { data: gift } = await supabase.from("gifts").select("id,scene_recipe").eq("public_code", code).maybeSingle();
    if (!gift) return json(origin, { error: "gift_not_found" }, 404);

    const { data: media } = await supabase
      .from("gift_media").select("metadata").eq("id", mediaId).eq("gift_id", gift.id).maybeSingle();
    if (!media) return json(origin, { error: "media_not_found" }, 404);

    const fit = body.fit === "contain" ? "contain" : "cover";
    const position = ["center","top","bottom","left","right"].includes(String(body.position))
      ? String(body.position) : "center";
    const recipe = Array.isArray(gift.scene_recipe) ? gift.scene_recipe.map(String) : [];
    const requestedScene = String(body.scene || "");
    const scene = recipe.includes(requestedScene)
      ? requestedScene
      : (String(media.metadata?.scene || "") || recipe[0] || "memories");

    const { error } = await supabase
      .from("gift_media")
      .update({
        caption: String(body.caption || "").trim() || null,
        metadata: { ...(media.metadata || {}), fit, position, scene },
      })
      .eq("id", mediaId).eq("gift_id", gift.id);

    if (error) return json(origin, { error: "media_update_failed" }, 500);
    return json(origin, { ok: true });
  }

  if (action === "reorderMedia") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }
    const ids = Array.isArray(body.mediaIds) ? body.mediaIds.map(String) : [];
    const { data: gift } = await supabase.from("gifts").select("id").eq("public_code", code).maybeSingle();
    if (!gift) return json(origin, { error: "gift_not_found" }, 404);

    for (let i = 0; i < ids.length; i += 1) {
      const { error } = await supabase.from("gift_media")
        .update({ sort_order: i }).eq("id", ids[i]).eq("gift_id", gift.id);
      if (error) return json(origin, { error: "media_reorder_failed" }, 500);
    }
    return json(origin, { ok: true });
  }

  if (action === "deleteMedia") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }
    const mediaId = String(body.mediaId || "");
    const { data: gift } = await supabase.from("gifts").select("id").eq("public_code", code).maybeSingle();
    if (!gift) return json(origin, { error: "gift_not_found" }, 404);

    const { data: media } = await supabase
      .from("gift_media").select("storage_path").eq("id", mediaId).eq("gift_id", gift.id).maybeSingle();
    if (!media) return json(origin, { error: "media_not_found" }, 404);

    await supabase.storage.from("gift-media").remove([media.storage_path]);
    await supabase.from("gift_media").delete().eq("id", mediaId).eq("gift_id", gift.id);
    return json(origin, { ok: true });
  }

  if (action === "publish" || action === "unpublish") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    const published = action === "publish";
    const { error } = await supabase.from("gifts").update({
      status: published ? "published" : "draft",
      published_at: published ? new Date().toISOString() : null,
    }).eq("public_code", code);

    if (error) return json(origin, { error: "publish_failed" }, 500);
    return json(origin, { ok: true });
  }

  return json(origin, { error: "unknown_action" }, 400);
});
