const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

function defaultKey(envName: string) {
  try {
    const parsed = JSON.parse(Deno.env.get(envName) || "{}");
    return typeof parsed.default === "string" ? parsed.default : "";
  } catch {
    return "";
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "apikey, content-type",
      "access-control-allow-methods": "GET, OPTIONS",
      "cache-control": "no-store",
    },
  });
}

function validPublishableKey(req: Request) {
  const supplied = req.headers.get("apikey") || "";
  return [
    defaultKey("SUPABASE_PUBLISHABLE_KEYS"),
    defaultKey("SUPABASE_ANON_KEYS"),
  ].filter(Boolean).includes(supplied);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: json(null).headers });
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  if (!validPublishableKey(req)) return json({ error: "unauthorized" }, 401);

  const code = new URL(req.url).searchParams.get("code")?.trim().toLowerCase() || "";
  if (!/^[a-f0-9]{18}$/.test(code)) return json({ error: "not_found" }, 404);

  const secret = defaultKey("SUPABASE_SECRET_KEYS");
  if (!secret) return json({ error: "server_configuration" }, 500);

  const headers = {
    apikey: secret,
    authorization: `Bearer ${secret}`,
    accept: "application/json",
  };

  const giftQuery = new URL(`${SUPABASE_URL}/rest/v1/gifts`);
  giftQuery.searchParams.set(
    "select",
    "id,public_code,status,template_version,experience_slug,giver_name,recipient_name,story_data,created_at,updated_at,published_at"
  );
  giftQuery.searchParams.set("public_code", `eq.${code}`);
  giftQuery.searchParams.set("limit", "1");

  const giftResponse = await fetch(giftQuery, { headers });
  if (!giftResponse.ok) return json({ error: "lookup_failed" }, 500);
  let gift = (await giftResponse.json())?.[0];
  if (!gift) return json({ error: "not_found" }, 404);

  const orderQuery = new URL(`${SUPABASE_URL}/rest/v1/orders`);
  orderQuery.searchParams.set(
    "select",
    "status,provider,provider_reference,checkout_url,amount_minor,currency,payment_token,paid_at,refunded_amount_minor,updated_at,access_email_sent_at,access_email_last_attempt_at"
  );
  orderQuery.searchParams.set("gift_id", `eq.${gift.id}`);
  orderQuery.searchParams.set("limit", "1");

  const orderResponse = await fetch(orderQuery, { headers });
  if (!orderResponse.ok) return json({ error: "order_lookup_failed" }, 500);
  let order = (await orderResponse.json())?.[0] || null;

  // If an email transport failed when the payment was credited, reopening the
  // private order page retries after a cooldown; it never grants editor access.
  const previousEmailAttempt=Date.parse(String(order?.access_email_last_attempt_at||""));
  const emailRetryDue=order?.status==="approved"&&!order?.access_email_sent_at&&
    (!Number.isFinite(previousEmailAttempt)||Date.now()-previousEmailAttempt>20*60*1000);
  if((order?.status==="pending"||emailRetryDue) && typeof order?.payment_token==="string"){
    try{
      const checkoutAction=order.status==="approved"||(order.checkout_url&&order.provider_reference)?"sync-status":"create";
      const syncResponse=await fetch(
        "https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/tehiceesto-checkout-native",
        {
          method:"POST",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({action:checkoutAction,token:order.payment_token}),
          signal:AbortSignal.timeout(12000),
        },
      );

      if(syncResponse.ok){
        const refreshedOrderResponse=await fetch(orderQuery,{headers});
        if(refreshedOrderResponse.ok){
          order=(await refreshedOrderResponse.json())?.[0]||order;
        }

        const refreshedGiftResponse=await fetch(giftQuery,{headers});
        if(refreshedGiftResponse.ok){
          gift=(await refreshedGiftResponse.json())?.[0]||gift;
        }
      }
    }catch{}
  }

  // This extra product is delivered only if the single combined order
  // is approved by Mercado Pago and the server-written receipt is consistent.
  let hasPackAddOn=false;
  const receipt=gift?.story_data?.checkout;
  const packReceipt=receipt?.addonCode==="pack_juegos_v1"&&
    Number(receipt?.addonAmountMinor)===1000000&&
    Number(receipt?.baseAmountMinor)>0&&
    Number(receipt?.baseAmountMinor)+1000000===Number(order?.amount_minor)&&
    Number(receipt?.totalAmountMinor)===Number(order?.amount_minor);
  if(packReceipt&&order?.status==="approved"&&order.paid_at&&
     Number(order.refunded_amount_minor||0)===0){
    const addonQuery=new URL(SUPABASE_URL+"/rest/v1/gift_upsells");
    addonQuery.searchParams.set("select","status,paid_at,provider_order_id,checkout_url,amount_minor");
    addonQuery.searchParams.set("gift_id","eq."+gift.id);
    addonQuery.searchParams.set("product_code","eq.pack_juegos_v1");
    addonQuery.searchParams.set("limit","1");
    const fetchAddon=async()=>{
      const r=await fetch(addonQuery,{headers,cache:"no-store"});
      return r.ok?(await r.json())?.[0]:null;
    };
    let add=await fetchAddon();
    if(add?.status==="pending"&&typeof order.payment_token==="string"){
      try{
        const r=await fetch(SUPABASE_URL+"/functions/v1/tehiceesto-checkout-native",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({action:"sync-status",token:order.payment_token}),
          signal:AbortSignal.timeout(12000)
        });
        if(r.ok)add=await fetchAddon();
      }catch{}
    }
    hasPackAddOn=Boolean(add?.status==="approved"&&add.paid_at&&
      !add.provider_order_id&&!add.checkout_url&&Number(add.amount_minor)===1000000);
  }

  // Show the optional gift only after verified full payment and activation.
  let extraExperience:null|{slug:string;code:string}=null;
  const secondaryReceipt=gift?.story_data?.checkout||{};
  const secondaryBase=Number(secondaryReceipt.baseAmountMinor);
  const hasSecondaryReceipt=secondaryReceipt.addonCode==="personalized_experience_v1"&&
    ["pack-juegos","trazo-complice"].includes(gift.experience_slug)&&
    Number(secondaryReceipt.addonAmountMinor)===1000000&&
    secondaryBase>0&&secondaryBase+1000000===Number(order?.amount_minor)&&
    Number(secondaryReceipt.totalAmountMinor)===Number(order?.amount_minor);
  if(hasSecondaryReceipt&&order?.status==="approved"&&order.paid_at&&
     Number(order.refunded_amount_minor||0)===0){
    const addonQuery=new URL(SUPABASE_URL+"/rest/v1/gift_upsells");
    addonQuery.searchParams.set("select","addon_gift_id,status,paid_at,provider_order_id,checkout_url,amount_minor");
    addonQuery.searchParams.set("gift_id","eq."+gift.id);
    addonQuery.searchParams.set("product_code","eq.personalized_experience_v1");
    addonQuery.searchParams.set("limit","1");
    const getAddon=async()=>{
      const r=await fetch(addonQuery,{headers,cache:"no-store"});
      return r.ok?(await r.json())?.[0]:null;
    };
    let addon=await getAddon();
    if(addon?.status==="pending"&&order.payment_token){
      try{
        const r=await fetch(SUPABASE_URL+"/functions/v1/tehiceesto-checkout-native",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({action:"sync-status",token:order.payment_token}),
          signal:AbortSignal.timeout(12000)
        });
        if(r.ok)addon=await getAddon();
      }catch{}
    }
    if(addon?.status==="approved"&&addon.paid_at&&
       Number(addon.amount_minor)===1000000&&!addon.provider_order_id&&!addon.checkout_url&&
       addon.addon_gift_id){
      const childUrl=new URL(SUPABASE_URL+"/rest/v1/gifts");
      childUrl.searchParams.set("select","public_code,status,experience_slug");
      childUrl.searchParams.set("id","eq."+addon.addon_gift_id);
      childUrl.searchParams.set("limit","1");
      const childResponse=await fetch(childUrl,{headers,cache:"no-store"});
      const child=childResponse.ok?(await childResponse.json())?.[0]:null;
      if(child&&["paid","published"].includes(child.status)&&
         child.experience_slug===secondaryReceipt.addonExperienceSlug){
        extraExperience={slug:child.experience_slug,code:child.public_code};
      }
    }
  }

  let stage = "received";
  if (gift.status === "published") stage = "ready";
  else if (order?.status === "approved" || gift.status === "paid") stage = "personalize";
  else if (order?.status === "pending" || gift.status === "awaiting_payment") stage = "payment";

  return json({
    code: gift.public_code,
    stage,
    giftStatus: gift.status,
    experienceSlug: gift.experience_slug,
    hasPackAddOn,
    extraExperience,
    templateVersion: gift.template_version||"premium-v1",
    giverName: gift.giver_name,
    recipientName: gift.recipient_name,
    createdAt: gift.created_at,
    updatedAt: gift.updated_at,
    publishedAt: gift.published_at,
    order: order
      ? {
          status: order.status,
          checkoutUrl: typeof order.checkout_url === "string" && /^https:\/\//i.test(order.checkout_url) ? order.checkout_url : null,
          amountMinor: order.amount_minor,
          currency: order.currency,
          paidAt: order.paid_at,
          updatedAt: order.updated_at,
        }
      : null,
    giftUrl: gift.status === "published" ? `https://tehiceesto.com/r/${gift.public_code}` : null,
  });
});