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
    .select("id,gift_id,status,provider_reference,checkout_url,amount_minor,refunded_amount_minor,currency,payment_token,paid_at,buyer_email,access_email_sent_at,access_email_last_attempt_at,access_email_error")
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
      .select("public_code,status,experience_slug,giver_name,recipient_name")
      .eq("id",order.gift_id)
      .maybeSingle();

    if(!gift)return reply({error:"gift_not_found"},404);

    return reply({
      code:gift.public_code,
      giftStatus:gift.status,
      experienceSlug:gift.experience_slug,
      giverName:gift.giver_name,
      recipientName:gift.recipient_name,
      amountMinor:order.amount_minor,
      currency:order.currency||"ARS",
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

    const {data:gift}=await supabase
      .from("gifts")
      .select("status,public_code")
      .eq("id",order.gift_id)
      .maybeSingle();

    if(gift){
      if(next==="refunded"){
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

    return reply({ok:true,status:next,refundedAmountMinor,accessEmailQueued});
  }
  return reply({error:"unknown_action"},400);
});