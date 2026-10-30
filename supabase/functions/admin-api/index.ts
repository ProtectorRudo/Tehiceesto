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
  "origin","reasons","certainty","threshold",
  "childhood","care","sacrifices","return",
  "lessons","presence","inheritance","lookback",
  "casefile","insidejokes","incidents","proof","pact"
]);

const defaultRecipes: Record<string, string[]> = {
  pareja:["intro","door","memories","voices","light","stars","scratch","hold","letter","finale"],
  cumpleanos:["intro","candles","balloons","memories","light","voices","hold","letter","finale"],
  hijos:["intro","timeline","memories","light","stars","capsule","hold","letter","finale"],
  abuelos:["intro","archive","timeline","memories","home","voices","letter","legacy","finale"],
  aniversario:["intro","timeline","memories","rituals","chapters","letter","future","finale"],
  propuesta:["intro","origin","memories","reasons","certainty","letter","threshold","proposal"],
  mama:["intro","childhood","memories","care","sacrifices","voices","letter","finale"],
  papa:["intro","memories","lessons","presence","inheritance","voices","letter","lookback","finale"],
  "mama-papa":["intro","childhood","memories","care","sacrifices","voices","letter","finale"],
  amistad:["intro","casefile","memories","insidejokes","incidents","proof","letter","pact","finale"],
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
    // Match the configured administrator key from the private, RLS-protected table.
    // No credential hashes belong in source code or deployment bundles.
    const { data: access, error: accessError } = await supabase
      .from("admin_access")
      .select("id")
      .eq("name", "primary")
      .eq("secret_hash", secretHash)
      .maybeSingle();

    if (accessError) {
      console.error("admin_login_lookup_failed", accessError.code || "unknown");
      return json(origin, { error: "admin_temporarily_unavailable" }, 503);
    }
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

  if (action === "getCommerceSettings") {
    const { data, error } = await supabase
      .from("commerce_settings")
      .select("default_price_minor,currency,auto_checkout_enabled,updated_at")
      .eq("id", "default")
      .maybeSingle();

    if (error) return json(origin, { error: "commerce_settings_failed" }, 500);

    return json(origin, {
      settings: data || {
        default_price_minor: null,
        currency: "ARS",
        auto_checkout_enabled: false,
        updated_at: null,
      },
    });
  }

  if (action === "updateCommerceSettings") {
    const rawPrice = body.defaultPriceMinor;
    const defaultPriceMinor =
      rawPrice === null || rawPrice === undefined || rawPrice === ""
        ? null
        : Number(rawPrice);
    const autoCheckoutEnabled = body.autoCheckoutEnabled === true;

    if (
      defaultPriceMinor !== null &&
      (!Number.isInteger(defaultPriceMinor) ||
        defaultPriceMinor <= 0 ||
        defaultPriceMinor > 2_000_000_000)
    ) {
      return json(origin, { error: "invalid_default_price" }, 400);
    }

    if (autoCheckoutEnabled && defaultPriceMinor === null) {
      return json(origin, { error: "default_price_required" }, 400);
    }

    const { error } = await supabase
      .from("commerce_settings")
      .upsert(
        {
          id: "default",
          default_price_minor: defaultPriceMinor,
          currency: "ARS",
          auto_checkout_enabled: autoCheckoutEnabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (error) return json(origin, { error: "commerce_settings_update_failed" }, 500);

    return json(origin, {
      ok: true,
      settings: {
        default_price_minor: defaultPriceMinor,
        currency: "ARS",
        auto_checkout_enabled: autoCheckoutEnabled,
      },
    });
  }

  if (action === "listGifts") {
    const { data, error } = await supabase
      .from("gifts")
      .select("id,public_code,status,experience_slug,giver_name,recipient_name,created_at,published_at,story_data")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return json(origin, { error: "list_failed" }, 500);

    const giftRows = data || [];
    const giftIds = giftRows.map((gift) => gift.id);
    const { data: orderRows } = giftIds.length
      ? await supabase
          .from("orders")
          .select("gift_id,status,amount_minor,currency,provider,checkout_url")
          .in("gift_id", giftIds)
      : { data: [] as Record<string, unknown>[] };

    const orderMap = new Map((orderRows || []).map((order: any) => [order.gift_id, order]));
    const gifts = giftRows.map((gift) => {
      const { id, ...safeGift } = gift;
      return { ...safeGift, order: orderMap.get(id) || null };
    });

    return json(origin, { gifts });
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
        template_version: "premium-v1",
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

    const { data: order } = await supabase
      .from("orders")
      .select("status,provider,provider_reference,checkout_url,amount_minor,currency,paid_at,created_at,updated_at")
      .eq("gift_id", gift.id)
      .maybeSingle();

    return json(origin, {
      gift: safeGift,
      order: order || null,
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

    const { data: existingGift } = await supabase
      .from("gifts")
      .select("story_data")
      .eq("public_code", code)
      .maybeSingle();
    const existingStoryData = existingGift?.story_data && typeof existingGift.story_data === "object" && !Array.isArray(existingGift.story_data)
      ? existingGift.story_data
      : {};

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
          ...existingStoryData,
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

  if (action === "saveSceneCopyOverride" || action === "removeSceneCopyOverride") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    const scene = String(body.scene || "").trim();
    const source = String(body.source || "").trim();
    const replacement = String(body.replacement || "").trim();

    if (!allowedScenes.has(scene) || !source || source.length > 5000 || replacement.length > 5000) {
      return json(origin, { error: "invalid_scene_copy" }, 400);
    }

    const { data: gift, error: giftError } = await supabase
      .from("gifts")
      .select("id,story_data")
      .eq("public_code", code)
      .maybeSingle();
    if (giftError) return json(origin, { error: "gift_lookup_failed" }, 500);
    if (!gift) return json(origin, { error: "gift_not_found" }, 404);

    const storyData = gift.story_data && typeof gift.story_data === "object" && !Array.isArray(gift.story_data)
      ? { ...gift.story_data }
      : {};
    const rawSceneContent = storyData.sceneContent && typeof storyData.sceneContent === "object" && !Array.isArray(storyData.sceneContent)
      ? storyData.sceneContent
      : {};
    const sceneContent: Record<string, Record<string,string>> = {};
    for (const [sceneKey, entries] of Object.entries(rawSceneContent as Record<string, unknown>)) {
      if (!entries || typeof entries !== "object" || Array.isArray(entries)) continue;
      const clean: Record<string,string> = {};
      for (const [sourceKey, value] of Object.entries(entries as Record<string,unknown>)) {
        if (typeof value === "string" && sourceKey.trim()) clean[sourceKey]=value;
      }
      if (Object.keys(clean).length) sceneContent[sceneKey]=clean;
    }

    const sceneEntries = { ...(sceneContent[scene] || {}) };
    if (action === "saveSceneCopyOverride") {
      sceneEntries[source] = replacement;
      sceneContent[scene] = sceneEntries;
    } else {
      delete sceneEntries[source];
      if (Object.keys(sceneEntries).length) sceneContent[scene] = sceneEntries;
      else delete sceneContent[scene];
    }

    const { error } = await supabase
      .from("gifts")
      .update({ story_data: { ...storyData, sceneContent } })
      .eq("id", gift.id);
    if (error) return json(origin, { error: "scene_copy_update_failed" }, 500);

    return json(origin, { ok: true, sceneContent });
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
        ...(String(body.kind || "") === "audio" ? { role: "voice" } : {}),
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
      .from("gift_media").select("kind,metadata").eq("id", mediaId).eq("gift_id", gift.id).maybeSingle();
    if (!media) return json(origin, { error: "media_not_found" }, 404);

    const fit = body.fit === "contain" ? "contain" : "cover";
    const position = ["center","top","bottom","left","right"].includes(String(body.position))
      ? String(body.position) : "center";
    const recipe = Array.isArray(gift.scene_recipe) ? gift.scene_recipe.map(String) : [];
    const requestedScene = String(body.scene || "");
    const scene = recipe.includes(requestedScene)
      ? requestedScene
      : (String(media.metadata?.scene || "") || recipe[0] || "memories");
    const role = media.kind === "audio" && String(body.role || "") === "soundtrack"
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
        .neq("id", mediaId);

      for (const other of otherAudio || []) {
        const { error: roleError } = await supabase
          .from("gift_media")
          .update({ metadata: { ...(other.metadata || {}), role: "voice" } })
          .eq("id", other.id)
          .eq("gift_id", gift.id);
        if (roleError) return json(origin, { error: "media_soundtrack_role_failed" }, 500);
      }
    }

    const { error } = await supabase
      .from("gift_media")
      .update({
        caption: String(body.caption || "").trim() || null,
        metadata: { ...(media.metadata || {}), fit, position, scene, ...(role ? { role } : {}) },
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

  if (action === "prepareAutomaticCheckout") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    const amountMinor = Number(body.amountMinor);
    if (!Number.isInteger(amountMinor) || amountMinor <= 0 || amountMinor > 2_000_000_000) {
      return json(origin, { error: "invalid_amount" }, 400);
    }

    const { data: gift } = await supabase
      .from("gifts")
      .select("id,status,story_data")
      .eq("public_code", code)
      .maybeSingle();
    if (!gift) return json(origin, { error: "gift_not_found" }, 404);
    if (gift.status === "published") return json(origin, { error: "already_published" }, 409);

    const { data: existing } = await supabase
      .from("orders")
      .select("id,status,payment_token")
      .eq("gift_id", gift.id)
      .maybeSingle();

    if (existing?.status === "approved") {
      return json(origin, { error: "payment_already_approved" }, 409);
    }

    let order;
    if (existing) {
      const { data, error } = await supabase
        .from("orders")
        .update({
          provider: "mercadopago",
          status: "pending",
          amount_minor: amountMinor,
          currency: "ARS",
          paid_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("payment_token")
        .single();
      if (error || !data) return json(origin, { error: "checkout_prepare_failed" }, 500);
      order = data;
    } else {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          gift_id: gift.id,
          provider: "mercadopago",
          status: "pending",
          amount_minor: amountMinor,
          currency: "ARS",
        })
        .select("payment_token")
        .single();
      if (error || !data) return json(origin, { error: "checkout_prepare_failed" }, 500);
      order = data;
    }

    if (gift.story_data?.creator?.submitted) {
      await supabase.from("gifts").update({ status: "awaiting_payment" }).eq("id", gift.id);
    }

    return json(origin, {
      paymentToken: order.payment_token,
      amountMinor,
      currency: "ARS",
    });
  }

  if (action === "setPaymentStatus") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    const status = String(body.status || "");
    if (!["pending","approved","rejected","refunded","cancelled"].includes(status)) {
      return json(origin, { error: "invalid_payment_status" }, 400);
    }

    const rawAmount = body.amountMinor;
    const amountMinor = rawAmount === null || rawAmount === undefined || rawAmount === ""
      ? null
      : Number(rawAmount);
    if (amountMinor !== null && (!Number.isInteger(amountMinor) || amountMinor < 0 || amountMinor > 2_000_000_000)) {
      return json(origin, { error: "invalid_amount" }, 400);
    }

    const { data: gift } = await supabase
      .from("gifts")
      .select("id,status,story_data")
      .eq("public_code", code)
      .maybeSingle();
    if (!gift) return json(origin, { error: "gift_not_found" }, 404);

    const providerReference = String(body.providerReference || "").trim().slice(0, 200) || null;
    const rawCheckoutUrl = String(body.checkoutUrl || "").trim().slice(0, 1000);
    const checkoutUrl = rawCheckoutUrl && /^https:\/\//i.test(rawCheckoutUrl) ? rawCheckoutUrl : null;
    if (rawCheckoutUrl && !checkoutUrl) return json(origin, { error: "invalid_checkout_url" }, 400);

    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("gift_id", gift.id)
      .maybeSingle();

    const orderPatch = {
      provider: "mercadopago",
      provider_reference: providerReference,
      checkout_url: checkoutUrl,
      amount_minor: amountMinor,
      currency: "ARS",
      status,
      paid_at: status === "approved" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { error: orderError } = existing
      ? await supabase.from("orders").update(orderPatch).eq("id", existing.id)
      : await supabase.from("orders").insert({ gift_id: gift.id, ...orderPatch });

    if (orderError) return json(origin, { error: "payment_update_failed" }, 500);

    if (gift.status !== "published" && gift.story_data?.creator?.submitted) {
      const nextGiftStatus = status === "approved" ? "paid" : "awaiting_payment";
      await supabase.from("gifts").update({ status: nextGiftStatus }).eq("id", gift.id);
    }

    return json(origin, { ok: true, status });
  }

  if (action === "publish" || action === "unpublish") {
    let code: string;
    try { code = cleanCode(body.code); } catch { return json(origin, { error: "invalid_code" }, 400); }

    const { data: gift } = await supabase
      .from("gifts")
      .select("id,status,story_data")
      .eq("public_code", code)
      .maybeSingle();
    if (!gift) return json(origin, { error: "gift_not_found" }, 404);

    const published = action === "publish";
    if (published && gift.story_data?.creator?.submitted) {
      const { data: order } = await supabase
        .from("orders")
        .select("status")
        .eq("gift_id", gift.id)
        .maybeSingle();
      if (order?.status !== "approved") {
        return json(origin, { error: "payment_required" }, 409);
      }
    }

    const { error } = await supabase.from("gifts").update({
      status: published ? "published" : (gift.story_data?.creator?.submitted ? "paid" : "draft"),
      published_at: published ? new Date().toISOString() : null,
    }).eq("id", gift.id);

    if (error) return json(origin, { error: "publish_failed" }, 500);
    return json(origin, { ok: true });
  }

  return json(origin, { error: "unknown_action" }, 400);
});
