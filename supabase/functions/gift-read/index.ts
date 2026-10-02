const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "apikey, content-type",
      "cache-control": "no-store",
    },
  });
}

function defaultKey(envName: string) {
  try {
    const parsed = JSON.parse(Deno.env.get(envName) || "{}");
    return typeof parsed.default === "string" ? parsed.default : "";
  } catch {
    return "";
  }
}

function validPublishableKey(req: Request) {
  const supplied = req.headers.get("apikey") || "";
  const key = defaultKey("SUPABASE_PUBLISHABLE_KEYS");
  return Boolean(key && supplied && supplied === key);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "apikey, content-type",
        "access-control-allow-methods": "GET, OPTIONS",
      },
    });
  }

  if (req.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!validPublishableKey(req)) {
    return json({ error: "unauthorized" }, 401);
  }

  const code = new URL(req.url).searchParams.get("code")?.trim().toLowerCase() || "";
  if (!/^[a-f0-9]{18}$/.test(code)) {
    return json({ error: "not_found" }, 404);
  }

  const secret = defaultKey("SUPABASE_SECRET_KEYS");
  if (!secret) {
    return json({ error: "server_configuration" }, 500);
  }

  const dbHeaders = {
    apikey: secret,
    authorization: `Bearer ${secret}`,
    accept: "application/json",
  };

  const giftQuery = new URL(`${SUPABASE_URL}/rest/v1/gifts`);
  giftQuery.searchParams.set(
    "select",
    "id,experience_slug,giver_name,recipient_name,occasion,feeling,opening_text,letter_text,closing_text,music_url,scene_recipe,story_data,theme_data,reactions_enabled,expires_at"
  );
  giftQuery.searchParams.set("public_code", `eq.${code}`);
  giftQuery.searchParams.set("status", "eq.published");
  giftQuery.searchParams.set("limit", "1");

  const giftResponse = await fetch(giftQuery, { headers: dbHeaders });
  if (!giftResponse.ok) {
    return json({ error: "gift_lookup_failed" }, 500);
  }

  const gifts = await giftResponse.json();
  const gift = gifts?.[0];

  if (!gift) {
    return json({ error: "not_found" }, 404);
  }

  if (gift.expires_at && Date.parse(gift.expires_at) <= Date.now()) {
    return json({ error: "not_found" }, 404);
  }

  const mediaQuery = new URL(`${SUPABASE_URL}/rest/v1/gift_media`);
  mediaQuery.searchParams.set(
    "select",
    "kind,storage_path,caption,sort_order,metadata"
  );
  mediaQuery.searchParams.set("gift_id", `eq.${gift.id}`);
  mediaQuery.searchParams.set("order", "sort_order.asc");

  const mediaResponse = await fetch(mediaQuery, { headers: dbHeaders });
  if (!mediaResponse.ok) {
    return json({ error: "media_lookup_failed" }, 500);
  }

  const media = await mediaResponse.json();

  let signedMedia = media;
  if (Array.isArray(media) && media.length > 0) {
    const signResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/gift-media`,
      {
        method: "POST",
        headers: {
          ...dbHeaders,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          expiresIn: 3600,
          paths: media.map((item: { storage_path: string }) => item.storage_path),
        }),
      },
    );

    if (!signResponse.ok) {
      return json({ error: "media_sign_failed" }, 500);
    }

    const signed = await signResponse.json();
    signedMedia = media.map((item: Record<string, unknown>, index: number) => {
      const signedItem = signed?.[index];
      const signedPath = signedItem?.signedURL || signedItem?.signedUrl || null;

      return {
        kind: item.kind,
        caption: item.caption,
        sort_order: item.sort_order,
        metadata: item.metadata,
        url: signedPath
          ? `${SUPABASE_URL}/storage/v1${signedPath}`
          : null,
      };
    });
  }

  const { id: _internalId, expires_at: _expiresAt, ...publicGift } = gift;

  return json({
    gift: publicGift,
    media: signedMedia,
  });
});
