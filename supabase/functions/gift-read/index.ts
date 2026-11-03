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

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
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
    "id,template_version,experience_slug,giver_name,recipient_name,occasion,feeling,opening_text,letter_text,closing_text,music_url,scene_recipe,story_data,theme_data,reactions_enabled,expires_at"
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

  // A discounted second gift is public only while the parent games purchase
  // remains fully approved. The public code alone is not proof of payment.
  const addonLookup=new URL(SUPABASE_URL+"/rest/v1/gift_upsells");
  addonLookup.searchParams.set("select","gift_id,order_id,status,paid_at,amount_minor,provider_order_id,checkout_url");
  addonLookup.searchParams.set("addon_gift_id","eq."+gift.id);
  addonLookup.searchParams.set("product_code","eq.personalized_experience_v1");
  addonLookup.searchParams.set("limit","1");
  const addonRes=await fetch(addonLookup,{headers:dbHeaders,cache:"no-store"});
  if(!addonRes.ok)return json({error:"authorization_unavailable"},503);
  const addon=(await addonRes.json())?.[0]||null;
  if(addon||gift.story_data?.creatorAddOn?.source==="games-checkout"){
    if(!addon||addon.status!=="approved"||!addon.paid_at||
       Number(addon.amount_minor)!==1000000||addon.provider_order_id||addon.checkout_url){
      return json({error:"not_found"},404);
    }
    const orderLookup=new URL(SUPABASE_URL+"/rest/v1/orders");
    orderLookup.searchParams.set("select","gift_id,status,provider,paid_at,amount_minor,refunded_amount_minor");
    orderLookup.searchParams.set("id","eq."+addon.order_id);
    orderLookup.searchParams.set("limit","1");
    const orderRes=await fetch(orderLookup,{headers:dbHeaders,cache:"no-store"});
    if(!orderRes.ok)return json({error:"authorization_unavailable"},503);
    const original=(await orderRes.json())?.[0]||null;
    if(!original||original.gift_id!==addon.gift_id||original.status!=="approved"||
      original.provider!=="mercadopago"||!original.paid_at||
      Number(original.refunded_amount_minor)!==0)return json({error:"not_found"},404);
    const parentLookup=new URL(SUPABASE_URL+"/rest/v1/gifts");
    parentLookup.searchParams.set("select","experience_slug,story_data");
    parentLookup.searchParams.set("id","eq."+addon.gift_id);
    parentLookup.searchParams.set("limit","1");
    const parentRes=await fetch(parentLookup,{headers:dbHeaders,cache:"no-store"});
    if(!parentRes.ok)return json({error:"authorization_unavailable"},503);
    const parent=(await parentRes.json())?.[0]||null;
    const c=parent?.story_data?.checkout||{},total=Number(original.amount_minor),base=Number(c.baseAmountMinor);
    if(!["pack-juegos","trazo-complice"].includes(String(parent?.experience_slug))||
      c.addonCode!=="personalized_experience_v1"||
      c.addonExperienceSlug!==gift.experience_slug||
      Number(c.addonAmountMinor)!==1000000||Number(c.totalAmountMinor)!==total||
      !Number.isInteger(base)||base<=0||base+1000000!==total){
      return json({error:"not_found"},404);
    }
  }

  const mediaQuery = new URL(`${SUPABASE_URL}/rest/v1/gift_media`);
  mediaQuery.searchParams.set(
    "select",
    "id,kind,storage_path,caption,sort_order,metadata"
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
        id: item.id,
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
  const rawStory=publicGift.story_data&&typeof publicGift.story_data==="object"&&!Array.isArray(publicGift.story_data)
    ?publicGift.story_data as Record<string,unknown>
    :{};
  // Checkout references and gift linkage are internal; only emotional content is public.
  const {creator:_privateCreator,creatorAddOn:_privateAddon,checkout:_privateCheckout,...safeStory}=rawStory;
  publicGift.story_data=safeStory;

  return json({
    gift: publicGift,
    media: signedMedia,
  });
});
