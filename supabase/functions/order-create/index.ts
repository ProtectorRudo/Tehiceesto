import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;

function envDefault(name:string){
  try{
    const parsed=JSON.parse(Deno.env.get(name)||"{}");
    return typeof parsed.default==="string"?parsed.default:"";
  }catch{return "";}
}

const SECRET=envDefault("SUPABASE_SECRET_KEYS");
// SYNCHRONIZED with frozen premium-v3 demo snapshot. Tests guard all nine journeys.
function versionForNewGift(slug:string){
  return slug==="dragon-ball-pareja"?"dragon-ball-v1":slug==="pack-juegos"?"pack-v1":slug==="trazo-complice"?"trazo-v1":slug==="sticker-bomb-amistad"?"sticker-bomb-v2":slug==="club-amigos"?"club-v1":slug==="frasco365"?"jar365-v1":slug==="siete-dias"?"seven-days-v1":slug.startsWith("escape-")?"escape-v1":["pareja","mama","amistad"].includes(slug)?"premium-v5":"premium-v3";
}

const recipes:Record<string,string[]>={
  "dragon-ball-pareja":["dragon-ball"],
  "frasco365":["jar365"],
  "siete-dias":["day1","day2","day3","day4","day5","day6","day7"],
  pareja: ["intro","door","memories","voices","light","stars","everyday","scratch","hold","letter","finale"],
  cumpleanos: ["intro","candles","balloons","memories","light","voices","hold","letter","finale"],
  hijos: ["intro","timeline","memories","voices","light","stars","capsule","hold","letter","finale"],
  abuelos: ["intro","archive","timeline","memories","home","voices","letter","legacy","finale"],
  aniversario: ["intro","timeline","memories","rituals","chapters","letter","future","finale"],
  propuesta: ["intro","origin","memories","reasons","certainty","letter","threshold","proposal"],
  mama: ["intro","childhood","memories","care","sacrifices","voices","letter","finale"],
  papa: ["intro","memories","lessons","presence","inheritance","voices","letter","lookback","finale"],
  amistad: ["intro","door","casefile","memories","insidejokes","incidents","proof","puzzle","letter","pact","finale"],
  "club-amigos": ["club"],
  "sticker-bomb-amistad": ["club"],
  "trazo-complice": ["game"],
  "pack-juegos": ["game"],
  "escape-caso-m": ["intro","letter","finale"],
  "escape-ultima-funcion": ["intro","letter","finale"],
  "escape-ultima-campanada": ["intro","letter","finale"],
};

function cors(origin:string|null){
  const allowed=origin==="https://tehiceesto.com"||origin==="https://www.tehiceesto.com"||origin==="https://viralio.net"||origin==="https://www.viralio.net"||origin?.endsWith(".vercel.app")||origin?.startsWith("http://localhost:");
  return {
    "access-control-allow-origin":allowed?origin!:"https://tehiceesto.com",
    "access-control-allow-headers":"apikey, content-type",
    "access-control-allow-methods":"POST, OPTIONS",
    "content-type":"application/json; charset=utf-8",
    "cache-control":"no-store",
  };
}

function reply(origin:string|null,body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:cors(origin)});
}

function validKey(req:Request){
  const supplied=req.headers.get("apikey")||"";
  return [envDefault("SUPABASE_PUBLISHABLE_KEYS"),envDefault("SUPABASE_ANON_KEYS")].filter(Boolean).includes(supplied);
}

function clean(value:unknown,max:number){
  return String(value||"").trim().slice(0,max);
}

async function sha256(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("");
}

async function requestFingerprint(req:Request){
  const forwarded=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip=forwarded||req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||"unknown";
  const day=new Date().toISOString().slice(0,10);
  return sha256(`${day}:${ip}`);
}

function objectValue(value:unknown){
  return value&&typeof value==="object"&&!Array.isArray(value)
    ?value as Record<string,unknown>
    :{};
}

// Purchase creation never grants browser editing credentials. The buyer gets
// editor access only via their authenticated account after approved payment.
function selfserveStory(contact:{name:string;email:string;whatsapp:string},now:string,
  fingerprint:string,templateRecipe:string[],templateVersion:string){
  return {creator:{submitted:true,mode:"selfserve",submittedAt:now,contact,
    consentAt:now,ipHash:fingerprint,templateRecipe:[...templateRecipe],templateVersion}};
}

async function ensureCheckout(order:{payment_token?:string|null;checkout_url?:string|null},enabled:boolean){
  let checkoutUrl=typeof order.checkout_url==="string"&&order.checkout_url?order.checkout_url:null;
  if(!checkoutUrl&&enabled&&order.payment_token){
    try{
      const response=await fetch("https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/tehiceesto-checkout-native",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({action:"create",token:order.payment_token}),
        signal:AbortSignal.timeout(12000),
      });
      const payload=await response.json().catch(()=>({}));
      if(response.ok&&typeof payload?.checkoutUrl==="string")checkoutUrl=payload.checkoutUrl;
    }catch{}
  }
  return checkoutUrl;
}

async function resolveAffiliateAttribution(
  supabase: ReturnType<typeof createClient>,
  rawToken: unknown,
  orderId: string,
){
  const token=String(rawToken||"").trim();
  if(!/^[A-Za-z0-9_-]{30,90}$/.test(token))return false;

  try{
    const tokenHash=await sha256(token);
    const now=new Date().toISOString();
    const {data:attribution}=await supabase
      .from("affiliate_attribution_tokens")
      .select("affiliate_id,link_id,visitor_id,source,expires_at")
      .eq("token_hash",tokenHash)
      .gt("expires_at",now)
      .maybeSingle();

    if(!attribution)return false;

    const [{data:affiliate},{data:link}]=await Promise.all([
      supabase.from("affiliates")
        .select("id,commission_bps")
        .eq("id",attribution.affiliate_id)
        .maybeSingle(),
      supabase.from("affiliate_links")
        .select("id")
        .eq("id",attribution.link_id)
        .maybeSingle(),
    ]);

    // Pausing stops new referral clicks, but already-issued 30-day
    // attribution tokens remain fair and valid until they expire.
    if(!affiliate||!link)return false;

    const {error}=await supabase.from("affiliate_order_attributions").insert({
      order_id:orderId,
      affiliate_id:affiliate.id,
      link_id:link.id,
      visitor_id:attribution.visitor_id,
      source:attribution.source||null,
      commission_bps_snapshot:Number(affiliate.commission_bps)||0,
    });

    return !error;
  }catch{
    return false;
  }
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return reply(origin,{error:"method_not_allowed"},405);
  if(!validKey(req))return reply(origin,{error:"unauthorized"},401);

  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return reply(origin,{error:"invalid_json"},400);}

  const experienceSlug=clean(body.experienceSlug,40);
  // Preserve the existing production release gate for unfinished templates.
  if(["abuelos","aniversario","propuesta","club-amigos"].includes(experienceSlug)){
    return reply(origin,{error:"experience_coming_soon",message:"Esta experiencia estará disponible próximamente."},409);
  }
  // Buyer only provides email and WhatsApp. The giver name is customized after payment.
  const customerName=clean(body.customerName,100)||"Alguien que te quiere";
  const email=clean(body.email,180).toLowerCase();
  const whatsapp=clean(body.whatsapp,40).replace(/[^0-9+]/g,"");
  const consent=body.consent===true;
  const website=clean(body.website,120);
  const clientRequestId=clean(body.clientRequestId,64).toLowerCase();
  const addonEligible=new Set(["pareja","cumpleanos","hijos","mama","papa","amistad",
    "sticker-bomb-amistad","frasco365","siete-dias","dragon-ball-pareja"]);
  if(body.addSecretLetter!==undefined&&typeof body.addSecretLetter!=="boolean"){
    return reply(origin,{error:"invalid_addon"},400);
  }
  const addSecretLetter=body.addSecretLetter===true;
  if(body.addGamesPack!==undefined&&typeof body.addGamesPack!=="boolean")return reply(origin,{error:"invalid_addon"},400);
  const addGamesPack=body.addGamesPack===true;
  if((addSecretLetter&&addGamesPack)||((addSecretLetter||addGamesPack)&&!addonEligible.has(experienceSlug))){
    return reply(origin,{error:"addon_not_available"},409);
  }
  const optionalGiftSlugs=new Set([
    "pareja","cumpleanos","mama","papa","amistad",
    "club-amigos","sticker-bomb-amistad","frasco365","siete-dias","dragon-ball-pareja",
  ]);
  // A customer buying games can choose ONE complete editable gift experience.
  // The selected slug is whitelisted server-side and frozen into the checkout.
  const addonExperienceSlug=clean(body.addonExperienceSlug,60);
  if(addonExperienceSlug&&(!["pack-juegos","trazo-complice"].includes(experienceSlug)||
      !optionalGiftSlugs.has(addonExperienceSlug))){
    return reply(origin,{error:"addon_not_available"},409);
  }
  if(addonExperienceSlug&&(addGamesPack||addSecretLetter)){
    return reply(origin,{error:"addon_conflict"},409);
  }
  const addOnCode=addonExperienceSlug?"personalized_experience_v1":
    addGamesPack?"pack_juegos_v1":addSecretLetter?"secret_letter_v1":null;

  if(website)return reply(origin,{error:"invalid_input"},400);
  if(clientRequestId&&!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(clientRequestId)){
    return reply(origin,{error:"invalid_request_id"},400);
  }
  if(
    !recipes[experienceSlug]||
    customerName.length<2||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||
    !/^\+?[0-9]{8,15}$/.test(whatsapp)||
    !consent
  )return reply(origin,{error:"invalid_input"},400);

  const db=createClient(SUPABASE_URL,SECRET,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:commerce}=await db
    .from("commerce_settings")
    .select("default_price_minor,currency,auto_checkout_enabled")
    .eq("id","default")
    .maybeSingle();

  // Price trials are controlled by commerce_settings. Keep historical checkout
  // pricing intact when the normal ARS 25,000 price is restored.
  const commercePriceMinor=Number(commerce?.default_price_minor);
  const trialPricing=commercePriceMinor===100000; // ARS 1,000 in minor units.
  const basePriceMinor=experienceSlug==="pack-juegos"&&!trialPricing?2500000:commercePriceMinor;
  if(!Number.isInteger(basePriceMinor)||basePriceMinor<=0)return reply(origin,{error:"price_not_configured"},503);
  const addonPriceMinor=trialPricing?100000:1000000;
  const priceMinor=basePriceMinor+(addOnCode?addonPriceMinor:0);

  const now=new Date().toISOString();
  const fingerprint=await requestFingerprint(req);

  if(clientRequestId){
    const {data:existingOrder}=await db
      .from("orders")
      .select("id,gift_id,status,amount_minor,currency,buyer_email,payment_token,checkout_url")
      .eq("client_request_id",clientRequestId)
      .maybeSingle();

    if(existingOrder){
      if(String(existingOrder.buyer_email||"").toLowerCase()!==email){
        return reply(origin,{error:"request_conflict"},409);
      }

      const {data:existingGift}=await db
        .from("gifts")
        .select("id,public_code,experience_slug,story_data")
        .eq("id",existingOrder.gift_id)
        .maybeSingle();

      if(!existingGift||existingGift.experience_slug!==experienceSlug){
        return reply(origin,{error:"request_conflict"},409);
      }

      // Completed purchases are edited only after authenticated email access.
      if(existingOrder.status!=="pending")return reply(origin,{error:"request_already_completed"},409);
      const existingCheckout=objectValue(objectValue(existingGift.story_data).checkout);
      const existingAddonCode=String(existingCheckout.addonCode||"");
      if(Number(existingOrder.amount_minor)!==priceMinor||
         existingAddonCode!==(addOnCode||"")||
         String(existingCheckout.addonExperienceSlug||"")!==addonExperienceSlug){
        return reply(origin,{error:"request_selection_conflict"},409);
      }
      // Checkout retries never rotate editor tokens or rewrite gift contents.

      const checkoutUrl=await ensureCheckout(existingOrder,commerce?.auto_checkout_enabled===true);
      const {count:attributionCount}=await db
        .from("affiliate_order_attributions")
        .select("*",{count:"exact",head:true})
        .eq("order_id",existingOrder.id);

      return reply(origin,{
        code:existingGift.public_code,
        priceMinor:Number(existingOrder.amount_minor)||priceMinor,
        currency:String(existingOrder.currency||"ARS"),
        checkoutUrl,
        checkoutReady:Boolean(checkoutUrl),
        affiliateAttributed:(attributionCount||0)>0,

        reused:true,
      });
    }
  }

  if(!clientRequestId){
    const retrySince=new Date(Date.now()-2*60*1000).toISOString();
    const {data:recentGifts}=await db
      .from("gifts")
      .select("id,public_code,experience_slug,story_data")
      .eq("experience_slug",experienceSlug)
      .gte("created_at",retrySince)
      .eq("story_data->creator->>ipHash",fingerprint)
      .order("created_at",{ascending:false})
      .limit(3);

    const giftIds=(recentGifts||[]).map(item=>item.id).filter(Boolean);
    if(giftIds.length){
      const {data:recentOrders}=await db
        .from("orders")
        .select("id,gift_id,status,amount_minor,currency,buyer_email,payment_token,checkout_url,created_at")
        .in("gift_id",giftIds)
        .eq("buyer_email",email)
        .eq("status","pending")
        .eq("amount_minor",priceMinor)
        .gte("created_at",retrySince)
        .order("created_at",{ascending:false})
        .limit(1);

      const existingOrder=recentOrders?.[0];
      const existingGift=existingOrder
        ?(recentGifts||[]).find(item=>item.id===existingOrder.gift_id)
        :null;

      if(existingOrder&&existingGift){
        const previousCheckout=objectValue(objectValue(existingGift.story_data).checkout);
        const previousAddon=String(previousCheckout.addonCode||"");
        if(previousAddon!==(addOnCode||"")||
           String(previousCheckout.addonExperienceSlug||"")!==addonExperienceSlug){
          return reply(origin,{error:"request_selection_conflict"},409);
        }
        // A pending retry does not modify the gift or grant editing rights.
        const checkoutUrl=await ensureCheckout(existingOrder,commerce?.auto_checkout_enabled===true);
        const {count:attributionCount}=await db
          .from("affiliate_order_attributions")
          .select("*",{count:"exact",head:true})
          .eq("order_id",existingOrder.id);

        return reply(origin,{
          code:existingGift.public_code,
          priceMinor:Number(existingOrder.amount_minor)||priceMinor,
          currency:String(existingOrder.currency||"ARS"),
          checkoutUrl,
          checkoutReady:Boolean(checkoutUrl),
          affiliateAttributed:(attributionCount||0)>0,

          reused:true,
          retryRecovered:true,
        });
      }
    }
  }

  const since=new Date(Date.now()-60*60*1000).toISOString();
  const {count}=await db
    .from("gifts")
    .select("*",{count:"exact",head:true})
    .gte("created_at",since)
    .eq("story_data->creator->>ipHash",fingerprint);
  if((count||0)>=5)return reply(origin,{error:"too_many_orders"},429);

  const {data:gift,error:giftError}=await db
    .from("gifts")
    .insert({
      status:"awaiting_payment",
      experience_slug:experienceSlug,
      // Freeze each purchase. Pareja v5 matches the finalized demo; v1-v4 gifts remain unchanged.
      template_version:versionForNewGift(experienceSlug),
      giver_name:customerName,
      recipient_name:"A definir",
      scene_recipe:recipes[experienceSlug],
      story_data:{
        ...selfserveStory({name:customerName,email,whatsapp},now,
          fingerprint,recipes[experienceSlug],versionForNewGift(experienceSlug)),
        ...(addOnCode?{checkout:{baseAmountMinor:basePriceMinor,
          addonCode:addOnCode,addonAmountMinor:addonPriceMinor,totalAmountMinor:priceMinor,
          ...(addonExperienceSlug?{addonExperienceSlug}:{})}}:{}),
      },
      theme_data:{},
    })
    .select("id,public_code")
    .single();

  if(giftError||!gift)return reply(origin,{error:"order_create_failed"},500);

  const {data:order,error:orderError}=await db
    .from("orders")
    .insert({
      gift_id:gift.id,
      provider:"mercadopago",
      status:"pending",
      amount_minor:priceMinor,
      currency:"ARS",
      buyer_email:email,
      client_request_id:clientRequestId||null,
    })
    .select("id,payment_token,checkout_url")
    .single();

  if(orderError||!order){
    await db.from("gifts").delete().eq("id",gift.id);
    return reply(origin,{error:"order_create_failed"},500);
  }

  if(addOnCode){
    // Create a distinct, editable gift for the games -> experience offer.
    // Its status remains awaiting_payment until the provider confirms the combined charge.
    let secondGiftId:string|null=null;
    if(addonExperienceSlug){
      const addonVersion=versionForNewGift(addonExperienceSlug);
      const {data:secondGift,error:secondError}=await db.from("gifts").insert({
        status:"awaiting_payment",experience_slug:addonExperienceSlug,
        template_version:addonVersion,
        giver_name:customerName,recipient_name:"A definir",
        scene_recipe:recipes[addonExperienceSlug],
        story_data:{
          ...selfserveStory({name:customerName,email,whatsapp},now,
            fingerprint,recipes[addonExperienceSlug],addonVersion),
          creatorAddOn:{source:"games-checkout",orderId:order.id},
        },
        theme_data:{},
      }).select("id").single();
      if(secondError||!secondGift){
        console.error("experience_addon_create_failed",secondError?.code);
        await db.from("gifts").delete().eq("id",gift.id);
        return reply(origin,{error:"addon_unavailable"},503);
      }
      secondGiftId=secondGift.id;
    }
    // Reserve the addon as a line item within this ONE order, never a second payment.
    // The child gift has no order and cannot be edited by an unpaid customer.
    const {error:addonError}=await db.from("gift_upsells").insert({
      gift_id:gift.id,order_id:order.id,product_code:addOnCode,
      ...(secondGiftId?{addon_gift_id:secondGiftId}:{}),
      amount_minor:addonPriceMinor,currency:"ARS",status:"pending",
    });
    if(addonError){
      console.error("checkout_bundle_reservation_failed",addonError.code);
      if(secondGiftId)await db.from("gifts").delete().eq("id",secondGiftId);
      await db.from("gifts").delete().eq("id",gift.id);
      return reply(origin,{error:"addon_unavailable"},503);
    }
  }

  const affiliateAttributed=await resolveAffiliateAttribution(db,body.affiliateToken,order.id);

  const checkoutUrl=await ensureCheckout(order,commerce?.auto_checkout_enabled===true);

  return reply(origin,{
    code:gift.public_code,
    priceMinor,
    currency:"ARS",
    checkoutUrl,
    checkoutReady:Boolean(checkoutUrl),
    affiliateAttributed,

  });
});