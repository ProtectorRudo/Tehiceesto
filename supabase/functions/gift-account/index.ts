import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;

function defaultKey(envName:string){
  try{
    const parsed=JSON.parse(Deno.env.get(envName)||"{}");
    return typeof parsed.default==="string"?parsed.default:"";
  }catch{return ""}
}

const SECRET_KEY=defaultKey("SUPABASE_SECRET_KEYS");
const PUBLIC_KEY=defaultKey("SUPABASE_PUBLISHABLE_KEYS")||defaultKey("SUPABASE_ANON_KEYS");

function adminClient(){
  return createClient(SUPABASE_URL,SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}

function cors(origin:string|null){
  const allowed=
    origin==="https://protectorrudo.github.io"||
    origin==="https://tehiceesto.com"||
    origin==="https://www.tehiceesto.com"||
    origin==="https://viralio.net"||
    origin?.endsWith(".vercel.app")||
    origin?.startsWith("http://localhost:");
  return {
    "access-control-allow-origin":allowed?origin!:"https://tehiceesto.com",
    "access-control-allow-headers":"apikey, authorization, content-type",
    "access-control-allow-methods":"POST, OPTIONS",
    "content-type":"application/json; charset=utf-8",
    "cache-control":"no-store",
  };
}

function json(origin:string|null,body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:cors(origin)});
}

function validPublishableKey(req:Request){
  const supplied=req.headers.get("apikey")||"";
  return [defaultKey("SUPABASE_PUBLISHABLE_KEYS"),defaultKey("SUPABASE_ANON_KEYS")]
    .filter(Boolean).includes(supplied);
}

function normalizeEmail(value:unknown){
  const email=String(value||"").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:"";
}

function cleanCode(value:unknown){
  const code=String(value||"").trim().toLowerCase();
  if(!/^[a-f0-9]{18}$/.test(code))throw new Error("invalid_code");
  return code;
}

function newStudioToken(){
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(byte=>byte.toString(16).padStart(2,"0")).join("");
}

async function sha256(value:string){
  const bytes=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("");
}

async function authenticatedEmail(req:Request){
  const auth=req.headers.get("authorization")||"";
  const token=auth.replace(/^Bearer\s+/i,"").trim();
  if(!token)return "";
  const {data,error}=await adminClient().auth.getUser(token);
  if(error||!data.user?.email)return "";
  return normalizeEmail(data.user.email);
}


const EXPERIENCE_NAMES:Record<string,string>={
  pareja:"para tu pareja",mama:"para mamá",papa:"para papá",abuelos:"para tus abuelos",
  cumpleanos:"de cumpleaños",cumple:"de cumpleaños",amistad:"para una amistad",
  "club-amigos":"del Club de Amigos de Toda la Vida",
  "trazo-complice":"del juego Trazo Cómplice (versión completa)",
  "pack-juegos":"del Pack de 4 Juegos",
  propuesta:"para una propuesta especial",aniversario:"de aniversario",
};
function safeHtml(value:unknown){
  return String(value||"").replace(/[&<>"']/g,(character)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;",
  }[character]||character));
}
function premiumMail(name:string,experience:string,actionLink:string,isPurchase:boolean,combined=false){
  const firstName=safeHtml(name.trim().split(/\s+/)[0]||"");
  const experienceName=safeHtml(EXPERIENCE_NAMES[experience]||"personalizada");
  const link=safeHtml(actionLink);
  const game=experience==="trazo-complice";
  const pack=experience==="pack-juegos";
  const title=combined?"¡Tus juegos y tu regalo ya son tuyos!":pack?"¡Tu Pack de 3 Juegos ya es tuyo!":game?"¡Trazo Cómplice completo es tuyo!":isPurchase?"Tu regalo ya está listo para personalizar.":"Tus recuerdos siguen esperándote.";
  const intro=combined?"Tu compra está confirmada: tenés acceso a los juegos y a una experiencia personalizada adicional con el descuento especial del 60%. Entrá a Mis regalos con el mismo correo para abrir tus juegos y personalizar tu experiencia con nombres, fotos, mensajes y audios.":pack?"Tu pago está confirmado. Ya tenés acceso a ENTRE DOS, CÓMPLICES y TRAZO CÓMPLICE. Tocá el botón para entrar a tu sala privada con el mismo correo de la compra. Un solo celular, tres formas de jugar y ninguna descarga.":game?"Tu compra está confirmada. Entrá a Mis regalos con este enlace privado y tocá «Jugar versión completa» para disfrutar las 1.274 palabras, 11 categorías y tres dificultades. Un solo celular para dos personas.":isPurchase
    ?"Tu pago está confirmado. Ingresá a Mis regalos para personalizar tu experiencia "+experienceName+" con tus palabras, nombres, fotos y audios. El diseño, las escenas y los efectos ya están preparados. Después podés publicar y compartir el regalo desde tu cuenta."
    :"Este acceso privado te permite continuar editando y compartiendo tus experiencias desde Mis regalos.";
  const greeting=firstName?"Hola, "+firstName+".":"Hola.";
  const button=combined?"Ver mis juegos y editar mi regalo":pack?"Entrar a mis tres juegos":game?"Entrar y jugar completo":isPurchase?"Entrar a Mis regalos y editar":"Entrar a Mis regalos";
  const html=[
    '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
    '<body style="margin:0;background:#f5f1ec;color:#292321;font-family:Arial,Helvetica,sans-serif;">',
    '<div style="display:none;font-size:1px;max-height:0;overflow:hidden;opacity:0;">',
    pack?'Compraste los tres juegos del Pack Te Hice Esto. Entrá y jugá.':game?'Compraste Trazo Cómplice completo. Entrá a Mis regalos para jugar.':isPurchase?'Tu compra está confirmada: entrá a Mis regalos para editar y compartir.':'Tu acceso privado a Te Hice Esto está listo.',
    '</div><div style="padding:34px 12px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:580px;margin:auto;border:1px solid #e9e0d7;background:#fffdf9;border-radius:20px;overflow:hidden;">',
    '<tr><td style="padding:36px 32px 22px;text-align:center;"><div style="font-size:12px;font-weight:700;letter-spacing:3px;color:#7d5853;">TE HICE ESTO</div>',
    '<div style="width:44px;height:1px;background:#d8a79d;margin:22px auto 0;"></div></td></tr>',
    '<tr><td style="padding:8px 38px 30px;"><div style="font-size:14px;color:#966e69;margin-bottom:14px;">',greeting,'</div>',
    '<h1 style="font-size:31px;line-height:1.18;letter-spacing:-.8px;font-family:Georgia,serif;font-weight:400;margin:0 0 22px;color:#302522;">',title,'</h1>',
    '<p style="font-size:15px;line-height:1.85;color:#685d57;margin:0 0 17px;">',intro,'</p>',
    pack?'<p style="font-size:14px;color:#88685e;margin:0 0 22px;">Los tres juegos están incluidos en una sola compra. Las salas de escape se venden por separado.</p>':game?'<p style="font-size:14px;color:#88685e;margin:0 0 22px;">Tus cartas ya están listas. Una vez dentro de Mis regalos, seleccioná «Jugar versión completa».</p>':isPurchase?'<p style="font-size:14px;color:#88685e;margin:0 0 22px;">Tu experiencia '+experienceName+' ya tiene su espacio reservado. Podés agregar palabras, fotografías y audios a tu ritmo.</p>':'',
    '<div style="text-align:center;padding:14px 0 26px;"><a href="',link,'" style="background:#382a29;border-radius:40px;color:#ffffff;display:inline-block;font-weight:700;text-decoration:none;padding:17px 30px;font-size:14px;">',button,' &nbsp;→</a></div>',
    '<p style="color:#817772;font-size:13px;line-height:1.75;margin:0;">El acceso es personal. Por seguridad, no compartas este correo. No necesitás instalar nada ni recordar una contraseña.</p>',
    '</td></tr><tr><td style="padding:26px 32px;background:#f9f4ee;text-align:center;">',
    '<p style="font-family:Georgia,serif;font-style:italic;color:#6a5551;font-size:17px;margin:0 0 12px;">Hay cosas que merecen algo más que un mensaje.</p>',
    '<p style="font-size:12px;line-height:1.8;color:#94837b;margin:0;">¿Necesitás ayuda? Escribinos por WhatsApp: +54 9 221 565-3163.<br>Con cariño, el equipo de Te Hice Esto.</p>',
    '</td></tr></table></div></body></html>'
  ].join("");
  const text=[greeting,title,intro,
    pack?"Abrí https://tehiceesto.com/juegos/pack/completo para acceder a tus tres juegos.":game?"Trazo Cómplice está listo. Elegí Jugar versión completa desde Mis regalos.":isPurchase?"Tu experiencia "+(EXPERIENCE_NAMES[experience]||"personalizada")+" está lista para personalizar desde Mis regalos.":"",
    button+": "+actionLink,
    "Este enlace es privado. No lo compartas.",
    "¿Necesitás ayuda? WhatsApp: +54 9 221 565-3163.",
    "Con cariño, Te Hice Esto."].filter(Boolean).join("\n\n");
  return {html,text,subject:pack?"¡Tus tres juegos ya están listos! ♥ Te Hice Esto":game?"Trazo Cómplice completo ♥ Tus cartas ya te esperan":isPurchase?"Gracias por elegir Te Hice Esto ♥ Tu regalo te espera":"Tu acceso privado a Te Hice Esto ♥"};
}
async function sendCustomAccessEmail(email:string,redirect:string,code:string,orderGiftId:string,portalBase="https://tehiceesto.com/mis-regalos"){
  let apiKey=(Deno.env.get("RESEND_API_KEY")||"").trim();
  const db=adminClient();
  if(!apiKey){
    const {data,error}=await db.rpc("tehiceesto_private_resend_key");
    if(error){
      console.error("thi_email_secret_lookup_failed",error.code||"rpc_error");
      return {ok:false,status:503};
    }
    apiKey=String(data||"").trim();
  }
  if(!apiKey)return null; // Legacy transport only while no provider has been configured.
  let gift:any=null;
  if(code){
    const {data}=await db.from("gifts").select("id,public_code,giver_name,experience_slug,template_version,story_data")
      .eq("public_code",code).maybeSingle();
    if(data){
      const {data:owned}=await db.from("orders").select("id").eq("gift_id",data.id)
        .eq("buyer_email",email).eq("status","approved").limit(1).maybeSingle();
      if(owned)gift=data;
    }
  }
  if(!gift&&orderGiftId){
    const {data}=await db.from("gifts").select("id,public_code,giver_name,experience_slug,template_version,story_data")
      .eq("id",orderGiftId).maybeSingle();
    if(data&&!code)gift=data;
  }
  // The buyer of a newly team-managed experience receives a purchase
  // acknowledgement, NOT a self-service editor invitation or auth token.
  // Verify ownership above before entering this branch. Historic purchases
  // (including old "assisted" flags without this marker) stay untouched.
  const creator=gift?.story_data?.creator;
  if(code&&gift&&creator?.mode==="assisted"&&creator?.fulfillmentVersion==="team-managed-v1"){
    const experienceName=safeHtml(EXPERIENCE_NAMES[String(gift.experience_slug)]||"personalizada");
    const title="¡Recibimos tu pedido! ♥";
    const message="Mercado Pago confirmó tu compra de una experiencia "+experienceName+
      ". Nuestro equipo se comunicará con vos usando los datos de contacto de tu pedido para reunir los nombres, recuerdos, textos, fotografías y audios necesarios. "+
      "Nosotros preparamos tu regalo respetando las escenas y los efectos del modelo elegido. "+
      "Cuando esté revisado, recibirás el enlace para compartirlo.";
    const support="https://wa.me/5492215653163";
    const html='<div style="background:#f7f2ec;padding:32px 12px;color:#332926;font:15px Arial,sans-serif">'+
      '<div style="max-width:580px;margin:auto;background:#fffdfa;border:1px solid #e7ded5;border-radius:20px;padding:32px">'+
      '<div style="font-size:12px;letter-spacing:3px;color:#8b6a65;font-weight:bold">TE HICE ESTO</div>'+
      '<h1 style="font:normal 33px Georgia,serif;margin:28px 0 20px">'+title+'</h1>'+
      '<p style="line-height:1.9;color:#655853">'+message+'</p>'+
      '<p style="line-height:1.8;color:#655853">¿Querés consultarnos algo? <a href="'+support+'" style="color:#664d45">Escribinos por WhatsApp</a>.</p>'+
      '<p style="font-size:12px;color:#998681;margin-top:24px">Guardá este correo como constancia de tu pedido.</p></div></div>';
    try{
      const sender=(Deno.env.get("TEHICEESTO_EMAIL_FROM")||"Te Hice Esto <hola@tehiceesto.com>").trim();
      const response=await fetch("https://api.resend.com/emails",{
        method:"POST",
        headers:{"authorization":"Bearer "+apiKey,"content-type":"application/json"},
        body:JSON.stringify({from:sender,to:[email],subject:title,html,
          text:[title,message,"Consultas: "+support,"Con cariño, Te Hice Esto."].join("\\n\\n"),
          reply_to:"hola@tehiceesto.com",
          tags:[{name:"product",value:"tehiceesto"},{name:"flow",value:"assisted_purchase"}]}),
        signal:AbortSignal.timeout(12000),
      });
      if(!response.ok){
        console.error("thi_assisted_receipt_rejected",response.status);
        return {ok:false,status:response.status===429?429:503};
      }
      return {ok:true,status:200};
    }catch{
      console.error("thi_assisted_receipt_unreachable");
      return {ok:false,status:503};
    }
  }
  let combined=false;
  if(gift&&["pack-juegos","trazo-complice"].includes(gift.experience_slug)){
    try{
      const addons=await approvedExperienceExtras(db,email);
      combined=addons.some((x:any)=>x.parentGiftId===gift.id);
    }catch{combined=false}
  }
  const targetBase=combined?"https://tehiceesto.com/mis-regalos":
    portalBase==="https://tehiceesto.com/juegos/pack/completo"?portalBase:
    gift?.experience_slug==="sticker-bomb-amistad"?"https://tehiceesto.com/experiencias/sticker-bomb-amistad/editar":
    gift?.experience_slug==="pack-juegos"?"https://tehiceesto.com/juegos/pack/completo":portalBase;
  const safeRedirect=new URL(targetBase);
  if(gift?.public_code&&code)safeRedirect.searchParams.set("regalo",gift.public_code);
  const {data:link,error:linkError}=await db.auth.admin.generateLink({
    type:"magiclink",email,options:{redirectTo:safeRedirect.toString()},
  });
  // Deliver a first-party URL with a one-time token hash. Never email Supabase's
  // action_link: its redirect may fall back to the auth project's localhost SITE_URL.
  const hashedToken=String(link?.properties?.hashed_token||"").trim();
  if(linkError||!hashedToken||!/^[a-f0-9]{32,128}$/i.test(hashedToken)){
    console.error("thi_access_generate_link_failed",linkError?.message||"missing_hashed_token");
    return {ok:false,status:503};
  }
  // IMPORTANT: GoTrue can issue a recovery token for an existing confirmed
  // account even when generateLink was requested as magiclink. The verification
  // type returned by GoTrue must be carried through to verifyOtp; hardcoding
  // magiclink makes valid links fail with "One-time token not found".
  const returnedType=String(link?.properties?.verification_type||"").toLowerCase();
  let actionType="";
  try { actionType=new URL(String(link?.properties?.action_link||"")).searchParams.get("type")||""; } catch {}
  const verificationType=(returnedType||actionType).toLowerCase();
  if(!["magiclink","recovery","signup","invite","email"].includes(verificationType)){
    console.error("thi_access_unknown_verification_type",verificationType||"missing");
    return {ok:false,status:503};
  }
  const brandedAccess=new URL(targetBase);
  if(gift?.public_code&&code)brandedAccess.searchParams.set("regalo",gift.public_code);
  brandedAccess.hash=new URLSearchParams({token_hash:hashedToken,type:verificationType}).toString();
  const mail=premiumMail(String(gift?.giver_name||""),
    portalBase==="https://tehiceesto.com/juegos/pack/completo"?"pack-juegos":String(gift?.experience_slug||""),
    brandedAccess.toString(),Boolean(code),combined);
  const sender=(Deno.env.get("TEHICEESTO_EMAIL_FROM")||"Te Hice Esto <hola@tehiceesto.com>").trim();
  try{
    const response=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{"authorization":"Bearer "+apiKey,"content-type":"application/json"},
      body:JSON.stringify({
        from:sender,to:[email],
        subject:mail.subject,html:mail.html,text:mail.text,
        reply_to:"hola@tehiceesto.com",
        tags:[{name:"product",value:"tehiceesto"},{name:"flow",value:code?"purchase":"account_recovery"}],
      }),
      signal:AbortSignal.timeout(12000),
    });
    if(!response.ok){
      console.error("thi_email_provider_rejected",response.status);
      return {ok:false,status:503};
    }
    return {ok:true,status:200};
  }catch{
    console.error("thi_email_provider_unreachable");
    return {ok:false,status:503};
  }
}

// A manual license is not payment approval. Always bind it to the verified
// buyer's email and the exact order/gift; a gift code alone never authorizes it.
async function complimentaryGrantsForEmail(db:any,email:string){
  const {data:orders,error:orderError}=await db.from("orders")
    .select("id,gift_id,paid_at,created_at")
    .eq("buyer_email",email).order("created_at",{ascending:false}).limit(100);
  if(orderError)throw Error("complimentary_order_lookup_failed");
  if(!orders?.length)return [];
  const byOrder=new Map(orders.map((o:any)=>[o.id,o]));
  const {data:grants,error}=await db.from("complimentary_access_grants")
    .select("order_id,gift_id,product_code,expires_at")
    .in("order_id",orders.map((o:any)=>o.id)).is("revoked_at",null);
  if(error)throw Error("complimentary_access_unavailable");
  const now=Date.now();
  return (grants||[]).filter((g:any)=>{
    const owner=byOrder.get(g.order_id);
    return owner&&owner.gift_id===g.gift_id&&
      (!g.expires_at||Date.parse(g.expires_at)>now);
  }).map((g:any)=>({...g,purchasedAt:byOrder.get(g.order_id).paid_at||byOrder.get(g.order_id).created_at}));
}

/** Only verified paid and non-refunded orders can confer the discounted pack. */
async function discountedPacksForEmail(db:any,email:string){
  const {data:orders,error:orderError}=await db.from("orders")
    .select("id,gift_id,amount_minor,paid_at,created_at")
    .eq("buyer_email",email).eq("status","approved").eq("provider","mercadopago")
    .not("paid_at","is",null).eq("refunded_amount_minor",0)
    .order("created_at",{ascending:false}).limit(100);
  if(orderError)throw Error("bundle_order_lookup_failed");
  if(!orders?.length)return [];
  const byId=new Map(orders.map((o:any)=>[o.id,o]));
  const {data:extras,error:extrasError}=await db.from("gift_upsells")
    .select("order_id,amount_minor,paid_at,provider_order_id,checkout_url")
    .in("order_id",orders.map((o:any)=>o.id))
    .eq("product_code","pack_juegos_v1").eq("status","approved")
    .not("paid_at","is",null).is("provider_order_id",null).is("checkout_url",null);
  if(extrasError)throw Error("bundle_extra_lookup_failed");
  if(!extras?.length)return [];
  const ids=[...new Set(extras.map((e:any)=>byId.get(e.order_id)?.gift_id).filter(Boolean))];
  const {data:gifts,error:giftsError}=await db.from("gifts")
    .select("id,public_code,story_data").in("id",ids);
  if(giftsError)throw Error("bundle_gift_lookup_failed");
  const byGift=new Map((gifts||[]).map((g:any)=>[g.id,g]));
  return extras.flatMap((e:any)=>{
    const order=byId.get(e.order_id),gift=byGift.get(order?.gift_id);
    const story=gift?.story_data;
    const c=story&&typeof story==="object"&&typeof story.checkout==="object"?story.checkout:{};
    const base=Number(c.baseAmountMinor),total=Number(order?.amount_minor);
    const good=e.amount_minor===1000000&&c.addonCode==="pack_juegos_v1"&&
      Number(c.addonAmountMinor)===1000000&&Number(c.totalAmountMinor)===total&&
      base>0&&base+1000000===total;
    return good?[{code:gift.public_code,purchasedAt:order.paid_at||order.created_at}]:[];
  });
}

/** Authenticated, full-payment-only entitlement for a game buyer's one extra gift.
 * No synthetic orders: a separate gift stays linked to its original paid order. */
async function approvedExperienceExtras(db:any,email:string){
  const {data:paidOrders,error:ordersError}=await db.from("orders")
    .select("id,gift_id,amount_minor,paid_at,created_at")
    .eq("buyer_email",email).eq("status","approved").eq("provider","mercadopago")
    .eq("refunded_amount_minor",0).not("paid_at","is",null)
    .order("created_at",{ascending:false}).limit(100);
  if(ordersError)throw Error("experience_addon_orders_failed");
  if(!paidOrders?.length)return [];
  const paidById=new Map(paidOrders.map((o:any)=>[o.id,o]));
  const {data:links,error:linkError}=await db.from("gift_upsells")
    .select("order_id,addon_gift_id,amount_minor,paid_at,provider_order_id,checkout_url,status")
    .in("order_id",paidOrders.map((o:any)=>o.id))
    .eq("product_code","personalized_experience_v1").eq("status","approved")
    .not("paid_at","is",null).is("provider_order_id",null).is("checkout_url",null);
  if(linkError)throw Error("experience_addon_links_failed");
  if(!links?.length)return [];
  const parentIds=[...new Set(links.map((a:any)=>paidById.get(a.order_id)?.gift_id).filter(Boolean))];
  const childIds=[...new Set(links.map((a:any)=>a.addon_gift_id).filter(Boolean))];
  if(!parentIds.length||!childIds.length)return [];
  const {data:gifts,error:giftsError}=await db.from("gifts")
    .select("id,public_code,status,template_version,experience_slug,giver_name,recipient_name,published_at,story_data")
    .in("id",[...new Set([...parentIds,...childIds])]);
  if(giftsError)throw Error("experience_addon_gifts_failed");
  const byId=new Map((gifts||[]).map((g:any)=>[g.id,g]));
  const allowed=new Set(["pareja","cumpleanos","mama","papa","amistad",
    "club-amigos","sticker-bomb-amistad","frasco365","siete-dias"]);
  return links.flatMap((link:any)=>{
    const order=paidById.get(link.order_id);
    const parent=byId.get(order?.gift_id),child=byId.get(link.addon_gift_id);
    const meta=parent?.story_data?.checkout||{};
    const base=Number(meta.baseAmountMinor),total=Number(order?.amount_minor);
    const valid=Boolean(parent&&child&&["pack-juegos","trazo-complice"].includes(parent.experience_slug)&&
      allowed.has(child.experience_slug)&&child.experience_slug===meta.addonExperienceSlug&&
      ["paid","published"].includes(child.status)&&
      Number(link.amount_minor)===1000000&&
      meta.addonCode==="personalized_experience_v1"&&
      Number(meta.addonAmountMinor)===1000000&&Number(meta.totalAmountMinor)===total&&
      base>0&&base+1000000===total);
    return valid?[{gift:child,parentGiftId:parent.id,purchasedAt:order.paid_at||order.created_at}]:[];
  });
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return json(origin,{error:"method_not_allowed"},405);
  if(!validPublishableKey(req))return json(origin,{error:"unauthorized"},401);

  let body:Record<string,unknown>;
  try{body=await req.json()}catch{return json(origin,{error:"invalid_json"},400)}
  const action=String(body.action||"");

  if(action==="requestLink"){
    const email=normalizeEmail(body.email);
    if(!email)return json(origin,{error:"invalid_email"},400);

    const db=adminClient();
    const {data:order}=await db
      .from("orders")
      .select("id,gift_id")
      .eq("buyer_email",email)
      .eq("status","approved")
      .limit(1)
      .maybeSingle();

    // Never reveal whether an email has purchases.
    if(!order)return json(origin,{ok:true});

    let giftCode="";
    try{giftCode=body.code?cleanCode(body.code):""}catch{giftCode=""}
    // Pack sign-in links only target a verified approved purchase; never reveal ownership.
    if(body.portal==="pack"){
      const {data:packOrders}=await db.from("orders").select("gift_id")
        .eq("buyer_email",email).eq("status","approved").order("created_at",{ascending:false}).limit(50);
      const ids=(packOrders||[]).map(item=>item.gift_id).filter(Boolean);
      if(!ids.length)return json(origin,{ok:true});
      const {data:packGift}=await db.from("gifts").select("public_code")
        .in("id",ids).eq("experience_slug","pack-juegos").limit(1).maybeSingle();
      if(packGift){
        giftCode=String(packGift.public_code||"");
      }else{
        try{
          const combos=await discountedPacksForEmail(db,email);
          if(!combos.length)return json(origin,{ok:true});
          giftCode=String(combos[0].code||"");
        }catch{return json(origin,{error:"verification_unavailable"},503)}
      }
    }
    if(body.portal==="stickers"){
      const {data:stickerOrders}=await db.from("orders").select("gift_id").eq("buyer_email",email).eq("status","approved").order("created_at",{ascending:false}).limit(50);
      const ids=(stickerOrders||[]).map(x=>x.gift_id).filter(Boolean);
      if(!ids.length)return json(origin,{ok:true});
      const {data:stickerGift}=await db.from("gifts").select("public_code").in("id",ids).eq("experience_slug","sticker-bomb-amistad").limit(1).maybeSingle();
      if(!stickerGift)return json(origin,{ok:true});
      giftCode=String(stickerGift.public_code||"");
    }
    const redirect=new URL(body.portal==="stickers"?"https://tehiceesto.com/experiencias/sticker-bomb-amistad/editar":body.portal==="pack"?"https://tehiceesto.com/juegos/pack/completo":"https://tehiceesto.com/mis-regalos");
    if(giftCode)redirect.searchParams.set("regalo",giftCode);

    try{
      const portalBase=body.portal==="stickers"?"https://tehiceesto.com/experiencias/sticker-bomb-amistad/editar":body.portal==="pack"?"https://tehiceesto.com/juegos/pack/completo":body.portal==="pages"?"https://protectorrudo.github.io/tehiceesto/mi-cuenta/":body.portal==="edge"?"https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/mi-cuenta":"https://tehiceesto.com/mis-regalos";
      const premium=await sendCustomAccessEmail(email,portalBase,giftCode,String(order.gift_id||""),portalBase);
      if(premium)return json(origin,premium.ok?{ok:true}:{error:"email_unavailable"},premium.status);
      const response=await fetch(
        `${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(redirect.toString())}`,
        {
          method:"POST",
          headers:{"apikey":PUBLIC_KEY,"content-type":"application/json"},
          body:JSON.stringify({email,create_user:true}),
          signal:AbortSignal.timeout(12000),
        },
      );
      if(!response.ok){
        const status=response.status===429?429:503;
        return json(origin,{error:status===429?"email_rate_limited":"email_unavailable"},status);
      }
      return json(origin,{ok:true});
    }catch{
      return json(origin,{error:"email_unavailable"},503);
    }
  }

  const email=await authenticatedEmail(req);
  if(!email)return json(origin,{error:"account_unauthorized"},401);

  if(action==="list"){
    const db=adminClient();
    const {data:orders,error:ordersError}=await db
      .from("orders")
      .select("gift_id,status,created_at,paid_at")
      .eq("buyer_email",email)
      .eq("status","approved")
      .order("created_at",{ascending:false})
      .limit(50);
    if(ordersError)return json(origin,{error:"account_list_failed"},500);

    let complimentary:any[]=[];
    try{complimentary=await complimentaryGrantsForEmail(db,email)}
    catch{return json(origin,{error:"account_list_failed"},503)}
    const ids=[...new Set([
      ...(orders||[]).map(item=>item.gift_id),
      ...complimentary.filter(g=>g.product_code==="dragon-ball-pareja").map(g=>g.gift_id)
    ].filter(Boolean))];
    if(!ids.length)return json(origin,{email,gifts:[]});

    const {data:gifts,error:giftsError}=await db
      .from("gifts")
      .select("id,public_code,status,template_version,experience_slug,giver_name,recipient_name,published_at,created_at,story_data")
      .in("id",ids);
    if(giftsError)return json(origin,{error:"account_list_failed"},500);

    const byId=new Map((gifts||[]).map(gift=>[gift.id,gift]));
    const result=(orders||[]).map(order=>{
      const gift=byId.get(order.gift_id);
      if(!gift)return null;
      return {
        code:gift.public_code,
        status:gift.status,
        experienceSlug:gift.experience_slug,
        templateVersion:gift.template_version||"premium-v1",
        giverName:gift.giver_name,
        recipientName:gift.recipient_name,
        publishedAt:gift.published_at,
        assisted:gift.story_data?.creator?.mode==="assisted"&&
          gift.story_data?.creator?.fulfillmentVersion==="team-managed-v1",
        purchasedAt:order.paid_at||order.created_at,
      };
    }).filter(Boolean);

    // Manual, documented support licenses for test orders are distinct from
    // the Mercado Pago ledger and never treated as paid transactions.
    for(const grant of complimentary.filter(g=>g.product_code==="dragon-ball-pareja")){
      const gift=byId.get(grant.gift_id);
      if(!gift||gift.experience_slug!=="dragon-ball-pareja")continue;
      if(result.some((x:any)=>x.code===gift.public_code))continue;
      result.push({
        code:gift.public_code,status:gift.status,experienceSlug:gift.experience_slug,
        templateVersion:gift.template_version||"dragon-ball-v1",
        giverName:gift.giver_name,recipientName:gift.recipient_name,
        publishedAt:gift.published_at,purchasedAt:grant.purchasedAt,
        assisted:gift.story_data?.creator?.mode==="assisted"&&
          gift.story_data?.creator?.fulfillmentVersion==="team-managed-v1",
        complimentary:true
      });
    }

    // Add one synthetic library card for the discounted 4-game pack.
    // This is not a fake order and never unlocks another gift's editor.
    if(!result.some((g:any)=>g.experienceSlug==="pack-juegos")){
      try{
        const extras=await discountedPacksForEmail(db,email);
        if(extras.length)result.push({
          code:"pack-addon-"+extras[0].code,status:"paid",experienceSlug:"pack-juegos",
          templateVersion:"pack-v1",giverName:"",recipientName:"Mis cuatro juegos",
          publishedAt:null,purchasedAt:extras[0].purchasedAt
        });
        else {
          const grant=complimentary.find(g=>g.product_code==="pack_juegos_v1");
          const originalGift=grant&&byId.get(grant.gift_id);
          if(grant&&originalGift&&originalGift.story_data?.checkout?.addonCode==="pack_juegos_v1")
            result.push({
              code:"pack-addon-"+originalGift.public_code,status:"complimentary",
              experienceSlug:"pack-juegos",templateVersion:"pack-v1",
              giverName:"",recipientName:"Mis cuatro juegos",
              publishedAt:null,purchasedAt:grant.purchasedAt,complimentary:true
            });
        }
      }catch{return json(origin,{error:"account_list_failed"},503)}
    }
    // Add purchased secondary experiences, each with its own genuine gift ID,
    // when and only when the combined Mercado Pago payment remains valid.
    try{
      const addons=await approvedExperienceExtras(db,email);
      for(const {gift,purchasedAt} of addons){
        if(result.some((x:any)=>x.code===gift.public_code))continue;
        result.push({
          code:gift.public_code,status:gift.status,experienceSlug:gift.experience_slug,
          templateVersion:gift.template_version||"premium-v1",
          giverName:gift.giver_name,recipientName:gift.recipient_name,
          publishedAt:gift.published_at,purchasedAt,
          assisted:gift.story_data?.creator?.mode==="assisted"&&
            gift.story_data?.creator?.fulfillmentVersion==="team-managed-v1",
        });
      }
    }catch{return json(origin,{error:"account_list_failed"},503)}
    return json(origin,{email,gifts:result});
  }

  if(action==="open"){
    let code:string;
    try{code=cleanCode(body.code)}catch{return json(origin,{error:"invalid_code"},400)}
    const db=adminClient();

    const {data:gift}=await db
      .from("gifts")
      .select("id,story_data,template_version,experience_slug")
      .eq("public_code",code)
      .maybeSingle();
    if(!gift)return json(origin,{error:"gift_not_found"},404);

    const {data:order}=await db
      .from("orders")
      .select("id")
      .eq("gift_id",gift.id)
      .eq("buyer_email",email)
      .eq("status","approved")
      .limit(1)
      .maybeSingle();
    if(!order){
      try{
        const grants=await complimentaryGrantsForEmail(db,email);
        const authorized=grants.some((g:any)=>g.gift_id===gift.id&&
          g.product_code==="dragon-ball-pareja"&&gift.experience_slug==="dragon-ball-pareja");
        if(!authorized){
          const addons=await approvedExperienceExtras(db,email);
          if(!addons.some((x:any)=>x.gift.id===gift.id))
            return json(origin,{error:"gift_not_found"},404);
        }
      }catch{return json(origin,{error:"account_open_failed"},503)}
    }

    const rawStory=gift.story_data&&typeof gift.story_data==="object"&&!Array.isArray(gift.story_data)
      ?gift.story_data as Record<string,unknown>
      :{};
    const rawCreator=rawStory.creator&&typeof rawStory.creator==="object"&&!Array.isArray(rawStory.creator)
      ?rawStory.creator as Record<string,unknown>
      :{};

    // This immutable marker is created only for new team-managed purchases.
    // Previous customers retain their original editor access, even if an old
    // record happened to contain creator.mode="assisted".
    if(rawCreator.mode==="assisted"&&rawCreator.fulfillmentVersion==="team-managed-v1"){
      return json(origin,{error:"managed_by_team"},403);
    }
    // Ownership was verified using the authenticated buyer email and an approved order.
    const editorToken=newStudioToken();
    const editorTokenHash=await sha256(editorToken);
    const existingHashes:string[]=[];
    const primaryHash=String(rawCreator.editorTokenHash||"").trim().toLowerCase();
    if(/^[a-f0-9]{64}$/.test(primaryHash))existingHashes.push(primaryHash);
    if(Array.isArray(rawCreator.editorTokenHashes)){
      for(const item of rawCreator.editorTokenHashes){
        const hash=String(item||"").trim().toLowerCase();
        if(/^[a-f0-9]{64}$/.test(hash)&&!existingHashes.includes(hash))existingHashes.push(hash);
      }
    }
    const editorTokenHashes=[...existingHashes.filter(hash=>hash!==editorTokenHash),editorTokenHash].slice(-8);
    const creator={
      ...rawCreator,
      mode:"selfserve",
      editorTokenHash,
      editorTokenHashes,
      accountOpenedAt:new Date().toISOString(),
    };

    const {error}=await db
      .from("gifts")
      .update({story_data:{...rawStory,creator}})
      .eq("id",gift.id);
    if(error)return json(origin,{error:"account_open_failed"},500);

    return json(origin,{ok:true,editorToken,code});
  }

  return json(origin,{error:"unknown_action"},400);
});
