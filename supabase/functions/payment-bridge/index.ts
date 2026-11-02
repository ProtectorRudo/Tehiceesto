import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;

function defaultKey(name:string){
  try{
    const parsed=JSON.parse(Deno.env.get(name)||"{}");
    return typeof parsed.default==="string"?parsed.default:"";
  }catch{return "";}
}

const SECRET_KEY=defaultKey("SUPABASE_SECRET_KEYS");
const PUBLIC_KEY=defaultKey("SUPABASE_PUBLISHABLE_KEYS")||defaultKey("SUPABASE_ANON_KEYS");

function client(){
  return createClient(SUPABASE_URL,SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
function declaredAddOnCode(story:unknown){
  if(!story||typeof story!=="object")return "";
  const checkout=(story as Record<string,unknown>).checkout;
  if(!checkout||typeof checkout!=="object")return "";
  const code=String((checkout as Record<string,unknown>).addonCode||"");
  return ["secret_letter_v1","pack_juegos_v1","personalized_experience_v1"].includes(code)?code:"";
}
function isBundledExtra(story:unknown,orderMinor:unknown,addonCode:unknown,addonMinor:unknown){
  if(!story||typeof story!=="object")return false;
  const val=story as Record<string,unknown>;
  const meta=val.checkout&&typeof val.checkout==="object"?val.checkout as Record<string,unknown>:{};
  const addon=Number(addonMinor),base=Number(meta.baseAmountMinor),total=Number(orderMinor);
  return String(meta.addonCode)===String(addonCode)&&
    ["secret_letter_v1","pack_juegos_v1","personalized_experience_v1"].includes(String(addonCode))&&
    addon===1000000&&Number(meta.addonAmountMinor)===addon&&
    Number(meta.totalAmountMinor)===total&&
    Number.isInteger(base)&&base>0&&base+addon===total;
}

function reply(body:unknown,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"no-store",
      "x-content-type-options":"nosniff",
      "access-control-allow-origin":"*",
      "access-control-allow-headers":"content-type, apikey",
      "access-control-allow-methods":"POST, OPTIONS",
    },
  });
}

function cleanToken(value:unknown){
  const token=String(value||"").trim().toLowerCase();
  if(!/^[a-f0-9]{48}$/.test(token)) throw new Error("invalid_token");
  return token;
}

function hex(buffer:ArrayBuffer){
  return Array.from(new Uint8Array(buffer)).map(x=>x.toString(16).padStart(2,"0")).join("");
}

async function hmac(token:string,message:string){
  const key=await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(token),
    {name:"HMAC",hash:"SHA-256"},
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message)));
}

function constantTimeEqual(a:string,b:string){
  if(a.length!==b.length)return false;
  let result=0;
  for(let i=0;i<a.length;i++)result|=a.charCodeAt(i)^b.charCodeAt(i);
  return result===0;
}

async function sendAccessEmail(email:string,code:string){
  if(!PUBLIC_KEY||!email||!code)return {ok:false,status:503};
  try{
    const response=await fetch(`${SUPABASE_URL}/functions/v1/gift-account`,{
      method:"POST",
      headers:{apikey:PUBLIC_KEY,"content-type":"application/json"},
      body:JSON.stringify({action:"requestLink",email,code}),
      signal:AbortSignal.timeout(12000),
    });
    return {ok:response.ok,status:response.status};
  }catch{
    return {ok:false,status:503};
  }
}

// Operational notices are an independent, best-effort transport. They never
// confer gift access and must not affect verified Mercado Pago state.
function escapeHtml(value:unknown){
  return String(value??"").replace(/[&<>"']/g,(c)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;",
  })[c]||c);
}
async function sendOpsNotice(orderId:string,email:string,slug:string,amountMinor:number){
  // Environment overrides are supported, but Vault is the production source
  // of truth. This private RPC is callable only by service_role.
  let destination=String(Deno.env.get("TEHICEESTO_OPS_EMAIL")||"").trim();
  if(!destination){
    const {data,error}=await client().rpc("tehiceesto_private_ops_email");
    if(error){
      console.error("ops_email_lookup_failed",error.code||"rpc_error");
      return {ok:false,error:"ops_recipient_not_configured"};
    }
    destination=String(data||"").trim();
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)||destination.length>254){
    return {ok:false,error:"ops_recipient_not_configured"};
  }
  let apiKey=String(Deno.env.get("RESEND_API_KEY")||"").trim();
  if(!apiKey){
    const {data,error}=await client().rpc("tehiceesto_private_resend_key");
    if(error||!data)return {ok:false,error:"email_transport_not_configured"};
    apiKey=String(data).trim();
  }
  if(!apiKey)return {ok:false,error:"email_transport_not_configured"};
  const from=String(Deno.env.get("TEHICEESTO_EMAIL_FROM")||"Te Hice Esto <hola@tehiceesto.com>").trim();
  const displayedAmount=new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(amountMinor/100);
  const safeOrder=escapeHtml(orderId),safeEmail=escapeHtml(email),safeExperience=escapeHtml(slug),safeAmount=escapeHtml(displayedAmount);
  const heading="Nueva compra acreditada · Te Hice Esto";
  const textBody=[
    "Mercado Pago confirmó una nueva compra.",
    "Experiencia: "+slug,
    "Importe: "+displayedAmount,
    "Comprador: "+email,
    "Pedido: "+orderId,
    "Revisá el pedido desde el panel privado de operaciones.",
    "https://tehiceesto.vercel.app/admin/operaciones",
  ].join("\n");
  const htmlBody=`<main style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#352b36"><h1>${heading}</h1><p>Mercado Pago confirmó una nueva compra.</p><p><strong>Experiencia:</strong> ${safeExperience}</p><p><strong>Importe:</strong> ${safeAmount}</p><p><strong>Comprador:</strong> ${safeEmail}</p><p><strong>Pedido:</strong> ${safeOrder}</p><p><a href="https://tehiceesto.vercel.app/admin/operaciones">Abrir panel privado de operaciones</a></p></main>`;
  try{
    const response=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{authorization:"Bearer "+apiKey,"content-type":"application/json","Idempotency-Key":"thi-ops-"+orderId},
      body:JSON.stringify({from,to:[destination],subject:heading,html:htmlBody,text:textBody,
        tags:[{name:"product",value:"tehiceesto"},{name:"flow",value:"paid_order_ops"}]}),
      signal:AbortSignal.timeout(12000),
    });
    if(!response.ok)return {ok:false,error:response.status===429?"email_rate_limited":"ops_delivery_unavailable"};
    return {ok:true,error:null};
  }catch{return {ok:false,error:"ops_delivery_unavailable"};}
}

// A signed request is not proof of payment: the purchase reference can appear
// in provider metadata. Reconcile every non-pending state against Mercado Pago.
function verifiedProviderStatus(raw:string,detail:string){
  if(raw==="refunded"||detail==="refunded")return "refunded";
  if(raw==="processed"&&(detail==="accredited"||detail==="partially_refunded"))return "approved";
  if(raw==="failed")return "rejected";
  if(["canceled","cancelled","expired"].includes(raw))return "cancelled";
  return "pending";
}
function verifiedProviderRefund(order:Record<string,unknown>,amountMinor:number,raw:string,detail:string){
  if(raw==="refunded"||detail==="refunded")return amountMinor;
  const transactions=order.transactions&&typeof order.transactions==="object"
    ?order.transactions as Record<string,unknown>:{};
  const refunds=Array.isArray(transactions.refunds)?transactions.refunds:[];
  let total=0;
  for(const value of refunds){
    if(!value||typeof value!=="object")continue;
    const item=value as Record<string,unknown>;
    if(!["processed","refunded"].includes(String(item.status||"").toLowerCase()))continue;
    const num=Number(item.amount);
    if(Number.isFinite(num)&&num>=0)total+=Math.round(num*100);
  }
  return Math.min(amountMinor,Math.max(0,total));
}
async function verifyProviderOrder(providerOrderId:string,token:string,status:string,
  amountMinor:number,hasRefundAmount:boolean,requestedRefundMinor:number){
  const accessToken=String(Deno.env.get("TEHICEESTO_MP_ACCESS_TOKEN")||"").trim();
  if(!accessToken)return {ok:false,error:"provider_auth_unavailable",http:503};
  if(!/^ORD[A-Za-z0-9_-]{6,160}$/.test(providerOrderId))
    return {ok:false,error:"invalid_provider_reference",http:409};
  let data:Record<string,unknown>;
  try{
    const response=await fetch("https://api.mercadopago.com/v1/orders/"+encodeURIComponent(providerOrderId),{
      headers:{Authorization:"Bearer "+accessToken,accept:"application/json"},
      signal:AbortSignal.timeout(10000),
    });
    if(!response.ok)return {ok:false,error:"provider_verification_unavailable",http:503};
    data=await response.json() as Record<string,unknown>;
  }catch{return {ok:false,error:"provider_verification_unavailable",http:503};}
  const raw=String(data.status||"").toLowerCase();
  const detail=String(data.status_detail||"").toLowerCase();
  if(String(data.id||"")!==providerOrderId||
     String(data.external_reference||"")!=="thi_"+token||
     !Number.isFinite(Number(data.total_amount))||
     Math.round(Number(data.total_amount)*100)!==amountMinor||
     verifiedProviderStatus(raw,detail)!==status){
    return {ok:false,error:"provider_verification_mismatch",http:409};
  }
  // The refund total is also verified when the caller supplies it.
  if(hasRefundAmount&&verifiedProviderRefund(data,amountMinor,raw,detail)!==requestedRefundMinor){
    return {ok:false,error:"provider_refund_mismatch",http:409};
  }
  return {ok:true,error:"",http:200};
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:reply({}).headers});
  if(req.method!=="POST")return reply({error:"method_not_allowed"},405);

  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return reply({error:"invalid_json"},400);}

  let token:string;
  try{token=cleanToken(body.token);}catch{return reply({error:"not_found"},404);}

  const supabase=client();
  const {data:order,error:orderError}=await supabase
    .from("orders")
    .select("id,gift_id,status,provider_reference,checkout_url,amount_minor,refunded_amount_minor,currency,payment_token,paid_at,buyer_email,access_email_sent_at,access_email_last_attempt_at,access_email_error,ops_notice_sent_at,ops_notice_last_attempt_at,ops_notice_error")
    .eq("payment_token",token)
    .maybeSingle();

  if(orderError)return reply({error:"lookup_failed"},500);
  if(!order)return reply({error:"not_found"},404);

  const action=String(body.action||"");

  if(action==="config"){
    if((order.status==="approved"||order.status==="refunded")&&body.syncStatusOnly!==true){
      return reply({error:"checkout_locked",status:order.status},409);
    }
    if(!Number.isInteger(order.amount_minor)||Number(order.amount_minor)<=0){
      return reply({error:"amount_required"},409);
    }

    const {data:gift}=await supabase
      .from("gifts")
      .select("public_code,status,experience_slug,giver_name,recipient_name,story_data")
      .eq("id",order.gift_id)
      .maybeSingle();

    if(!gift)return reply({error:"gift_not_found"},404);

    // The single Mercado Pago order may contain either optional product.
    // Identify it from server-stored purchase metadata, not from the browser.
    const declaredCode=declaredAddOnCode(gift.story_data);
    const {data:bundle,error:bundleError}=declaredCode
      ?await supabase.from("gift_upsells")
        .select("amount_minor,status,provider_order_id,checkout_url,product_code,addon_gift_id")
        .eq("order_id",order.id).eq("product_code",declaredCode)
        .is("provider_order_id",null).maybeSingle()
      :{data:null,error:null};
    if(bundleError)return reply({error:"bundle_lookup_unavailable"},503);
    let addonExperienceSlug:string|null=null;
    if(declaredCode==="personalized_experience_v1"&&bundle?.addon_gift_id){
      const {data:addonGift,error:addonGiftError}=await supabase.from("gifts")
        .select("experience_slug").eq("id",bundle.addon_gift_id).maybeSingle();
      if(addonGiftError)return reply({error:"bundle_gift_lookup_unavailable"},503);
      const desired=String((gift.story_data?.checkout||{}).addonExperienceSlug||"");
      if(addonGift?.experience_slug===desired&&desired)addonExperienceSlug=desired;
    }
    const bundledExtra=Boolean(bundle&&bundle.status==="pending"&&
      !bundle.checkout_url&&isBundledExtra(gift.story_data,
      order.amount_minor,bundle.product_code,bundle.amount_minor)&&
      (declaredCode!=="personalized_experience_v1"||addonExperienceSlug));

    return reply({
      code:gift.public_code,
      giftStatus:gift.status,
      experienceSlug:gift.experience_slug,
      giverName:gift.giver_name,
      recipientName:gift.recipient_name,
      amountMinor:order.amount_minor,
      currency:order.currency||"ARS",
      bundledExtra,
      bundleCode:bundledExtra?declaredCode:null,
      bundleExperienceSlug:bundledExtra?addonExperienceSlug:null,
      bundleAmountMinor:bundledExtra?1000000:0,
      currentCheckoutUrl:order.checkout_url||null,
      providerReference:order.provider_reference||null,
    });
  }

  if(action==="sync"){
    const providerOrderId=String(body.providerOrderId||"").trim().slice(0,200);
    const status=String(body.status||"");
    const amountMinor=Number(body.amountMinor);
    const hasRefundAmount=body.refundedAmountMinor!==undefined&&body.refundedAmountMinor!==null;
    const requestedRefundMinor=hasRefundAmount?Number(body.refundedAmountMinor):Number(order.refunded_amount_minor||0);
    const checkoutUrlRaw=String(body.checkoutUrl||"").trim().slice(0,1000);
    const checkoutUrl=checkoutUrlRaw&&/^https:\/\//i.test(checkoutUrlRaw)?checkoutUrlRaw:"";
    const signature=String(body.signature||"").trim().toLowerCase();

    if(!providerOrderId||!["pending","approved","rejected","refunded","cancelled"].includes(status)){
      return reply({error:"invalid_sync"},400);
    }
    if(!Number.isInteger(amountMinor)||amountMinor<0){
      return reply({error:"invalid_amount"},400);
    }
    if(!Number.isInteger(requestedRefundMinor)||requestedRefundMinor<0||requestedRefundMinor>amountMinor){
      return reply({error:"invalid_refund_amount"},400);
    }

    const canonicalBase=`${token}|${providerOrderId}|${status}|${amountMinor}|${checkoutUrl}`;
    const canonical=hasRefundAmount?`${canonicalBase}|refund:${requestedRefundMinor}`:canonicalBase;
    const expected=await hmac(token,canonical);
    if(!/^[a-f0-9]{64}$/.test(signature)||!constantTimeEqual(expected,signature)){
      return reply({error:"invalid_signature"},401);
    }

    if(Number(order.amount_minor)!==amountMinor){
      return reply({error:"amount_mismatch"},409);
    }
    // Do not trust a client/HMAC assertion of approval or refund.
    // The provider's authenticated Orders API is the payment authority.
    if(status!=="pending"){
      const verified=await verifyProviderOrder(providerOrderId,token,status,amountMinor,
        hasRefundAmount,requestedRefundMinor);
      if(!verified.ok)return reply({error:verified.error},verified.http);
    }
    // A pending setup may attach only the provider order used for this checkout.
    if(order.provider_reference&&String(order.provider_reference)!==providerOrderId){
      return reply({error:"reference_mismatch"},409);
    }

    const current=String(order.status||"pending");
    let next=status;
    if(current==="approved"&&status==="pending")next="approved";
    if(current==="approved"&&["rejected","cancelled"].includes(status))next="approved";
    if(current==="refunded")next="refunded";

    let refundedAmountMinor=Number(order.refunded_amount_minor||0);
    if(next==="refunded")refundedAmountMinor=amountMinor;
    else if(hasRefundAmount&&next==="approved")refundedAmountMinor=requestedRefundMinor;

    const orderPatch:Record<string,unknown>={
      status:next,
      provider:"mercadopago",
      provider_reference:providerOrderId,
      refunded_amount_minor:refundedAmountMinor,
      updated_at:new Date().toISOString(),
    };
    if(checkoutUrl)orderPatch.checkout_url=checkoutUrl;
    if(next==="approved"&&!order.paid_at)orderPatch.paid_at=new Date().toISOString();
    if(next!=="approved")orderPatch.paid_at=next==="refunded"?order.paid_at:null;

    const {error:updateError}=await supabase.from("orders").update(orderPatch).eq("id",order.id);
    if(updateError)return reply({error:"sync_failed"},500);

    // Independently verified provider state is the ONLY entitlement authority.
    // Also perform a repair on approved orders when checkout webhook delivery retries.
    const {data:bundleGift,error:bundleGiftError}=await supabase.from("gifts")
      .select("story_data").eq("id",order.gift_id).maybeSingle();
    const code=declaredAddOnCode(bundleGift?.story_data);
    if(bundleGiftError)console.error("bundle_receipt_gift_lookup_failed",bundleGiftError.code);
    if(code){
      const {data:bundled,error:bundledError}=await supabase.from("gift_upsells")
        .select("id,status,amount_minor,provider_order_id,checkout_url,product_code,addon_gift_id")
        .eq("order_id",order.id).eq("product_code",code)
        .is("provider_order_id",null).maybeSingle();
      if(bundledError){
        console.error("bundle_lookup_failed",bundledError.code);
      }else if(bundled&&!bundled.checkout_url&&
        isBundledExtra(bundleGift?.story_data,order.amount_minor,bundled.product_code,bundled.amount_minor)){
        let validExperienceLink=true;
        if(code==="personalized_experience_v1"){
          validExperienceLink=false;
          if(bundled.addon_gift_id){
            const {data:child,error:childError}=await supabase.from("gifts")
              .select("experience_slug").eq("id",bundled.addon_gift_id).maybeSingle();
            const declared=String((bundleGift?.story_data?.checkout||{}).addonExperienceSlug||"");
            if(!childError&&declared&&child?.experience_slug===declared){
              validExperienceLink=true;
            }
          }
        }
        if(!validExperienceLink){
          console.error("bundle_experience_link_mismatch");
        }else{
        const grant=next==="approved"&&refundedAmountMinor===0;
        const revoke=next==="refunded"||refundedAmountMinor>0;
        if(grant&&bundled.status==="pending"){
          const {error:grantError}=await supabase.from("gift_upsells")
            .update({status:"approved",paid_at:orderPatch.paid_at||order.paid_at||new Date().toISOString(),
              updated_at:new Date().toISOString()})
            .eq("id",bundled.id).eq("status","pending");
          if(grantError)console.error("bundle_grant_failed",grantError.code);
        }else if(revoke&&["pending","approved"].includes(bundled.status)){
          const {error:revokeError}=await supabase.from("gift_upsells")
            .update({status:"refunded",paid_at:null,updated_at:new Date().toISOString()})
            .eq("id",bundled.id);
          if(revokeError)console.error("bundle_revoke_failed",revokeError.code);
        }
        // Real editable second gift, never a second charge. Idempotent on retries.
        if(code==="personalized_experience_v1"&&bundled.addon_gift_id){
          if(grant){
            const {error:childPaidError}=await supabase.from("gifts")
              .update({status:"paid"}).eq("id",bundled.addon_gift_id)
              .eq("status","awaiting_payment");
            if(childPaidError)console.error("bundle_child_activation_failed",childPaidError.code);
          }else if(revoke){
            const {error:childRevokeError}=await supabase.from("gifts")
              .update({status:"awaiting_payment"}).eq("id",bundled.addon_gift_id);
            if(childRevokeError)console.error("bundle_child_revocation_failed",childRevokeError.code);
          }
        }
        }
      }
    }

    const {data:gift}=await supabase
      .from("gifts")
      .select("status,public_code,experience_slug")
      .eq("id",order.gift_id)
      .maybeSingle();

    if(gift){
      if(next==="refunded"){
        // A refund remains refunded in the payment ledger. Explicit admin-issued
        // test licenses, if still valid, protect the buyer's published gift on webhook retries.
        const {data:license,error:licenseError}=await supabase.from("complimentary_access_grants")
          .select("expires_at").eq("order_id",order.id).eq("gift_id",order.gift_id)
          .eq("product_code","dragon-ball-pareja").is("revoked_at",null).maybeSingle();
        if(licenseError)console.error("complimentary_license_lookup_failed",licenseError.code);
        const keepGift=gift.experience_slug==="dragon-ball-pareja"&&license&&
          (!license.expires_at||Date.parse(license.expires_at)>Date.now());
        if(!keepGift)
          await supabase.from("gifts").update({status:"awaiting_payment"}).eq("id",order.gift_id);
      }else if(gift.status!=="published"){
        const giftStatus=next==="approved"?"paid":"awaiting_payment";
        await supabase.from("gifts").update({status:giftStatus}).eq("id",order.gift_id);
      }
    }

    // Automatic post-purchase mail, guarded by a durable per-order retry window.
    // The timestamp access_email_sent_at means accepted by the mail transport, not necessarily inbox delivery.
    let accessEmailQueued=Boolean(order.access_email_sent_at);
    const lastAttemptMs=Date.parse(String(order.access_email_last_attempt_at||""));
    const retryWindowMs=20*60*1000;
    const canAttempt=!Number.isFinite(lastAttemptMs)||Date.now()-lastAttemptMs>=retryWindowMs;
    if(next==="approved"&&order.buyer_email&&gift?.public_code&&!order.access_email_sent_at&&canAttempt){
      const attemptedAt=new Date().toISOString();
      const retryCutoff=new Date(Date.now()-retryWindowMs).toISOString();
      const {data:reserved,reservedError}=await (async()=>{
        const {data,error}=await supabase.from("orders")
          .update({access_email_last_attempt_at:attemptedAt,access_email_error:null})
          .eq("id",order.id)
          .is("access_email_sent_at",null)
          .or("access_email_last_attempt_at.is.null,access_email_last_attempt_at.lt."+retryCutoff)
          .select("id").maybeSingle();
        return {data,reservedError:error};
      })();
      if(reservedError){
        console.error("access_email_reservation_failed",reservedError.message);
      }else if(reserved){
        const delivery=await sendAccessEmail(String(order.buyer_email),String(gift.public_code));
        accessEmailQueued=delivery.ok;
        if(delivery.ok){
          const {error:markError}=await supabase.from("orders")
            .update({access_email_sent_at:new Date().toISOString(),access_email_error:null})
            .eq("id",order.id).eq("access_email_last_attempt_at",attemptedAt);
          if(markError)console.error("access_email_mark_failed",markError.message);
        }else{
          await supabase.from("orders")
            .update({access_email_error:delivery.status===429?"email_rate_limited":"email_delivery_unavailable"})
            .eq("id",order.id).eq("access_email_last_attempt_at",attemptedAt);
          console.error("access_email_delivery_failed",delivery.status,order.id);
        }
      }
    }

    // Resend delivery is reserved atomically, independently from the buyer mail.
    // Retry only for orders that have already attempted their first ops notice;
    // old historic purchases are not backfilled or emailed unexpectedly.
    let opsNoticeQueued=Boolean(order.ops_notice_sent_at);
    const opsLastAttemptMs=Date.parse(String(order.ops_notice_last_attempt_at||""));
    const opsCanAttempt=!Number.isFinite(opsLastAttemptMs)||Date.now()-opsLastAttemptMs>=30*60*1000;
    if(next==="approved"&&!order.ops_notice_sent_at&&opsCanAttempt){
      const attemptedAt=new Date().toISOString();
      const retryCutoff=new Date(Date.now()-30*60*1000).toISOString();
      const {data:reserved,error:reserveError}=await supabase.from("orders")
        .update({ops_notice_last_attempt_at:attemptedAt,ops_notice_error:null})
        .eq("id",order.id).eq("provider","mercadopago").eq("status","approved")
        .is("ops_notice_sent_at",null)
        .or("ops_notice_last_attempt_at.is.null,ops_notice_last_attempt_at.lt."+retryCutoff)
        .select("id").maybeSingle();
      if(reserveError)console.error("ops_notice_reservation_failed",reserveError.code||"database_error");
      else if(reserved){
        const delivered=await sendOpsNotice(
          String(order.id),String(order.buyer_email||""),String(gift?.experience_slug||"experiencia"),
          amountMinor,
        );
        opsNoticeQueued=delivered.ok;
        const patch=delivered.ok?
          {ops_notice_sent_at:new Date().toISOString(),ops_notice_error:null}:
          {ops_notice_error:delivered.error};
        const {error:stampError}=await supabase.from("orders").update(patch)
          .eq("id",order.id).eq("ops_notice_last_attempt_at",attemptedAt);
        if(stampError)console.error("ops_notice_stamp_failed",stampError.code||"database_error");
      }
    }

    return reply({ok:true,status:next,refundedAmountMinor,accessEmailQueued,opsNoticeQueued});
  }
  return reply({error:"unknown_action"},400);
});