// Backend provider adapter for the additional optional Carta Secreta purchase.
// Deploy only to Supabase project bwsgxpttnrctklrcjmjs after the project is active.
// The existing primary checkout is NOT a card-on-file authorization. Therefore
// this adapter ONLY creates a second explicitly confirmed Checkout Pro payment.
const BRIDGE="https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/payment-bridge";
const BASE=Deno.env.get("SUPABASE_URL")!;
function envDefault(name:string){try{const j=JSON.parse(Deno.env.get(name)||"{}");return typeof j.default==="string"?j.default:"";}catch{return "";}}
function reply(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});}
async function verifyOriginal(token:string){
 const r=await fetch(BRIDGE,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"config",token,syncStatusOnly:true}),signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error("original_payment_unavailable");
 const j=await r.json();
 if(!/^[a-f0-9]{18}$/.test(String(j.code||""))||!["paid","published"].includes(j.giftStatus))throw Error("original_payment_unconfirmed");
 return String(j.code);
}
async function access(){
 const serviceKey=envDefault("SUPABASE_SECRET_KEYS");
 if(!serviceKey)throw Error("credentials_missing");
 const r=await fetch(BASE+"/rest/v1/rpc/get_tehiceesto_mp_config",{
  method:"POST",headers:{"apikey":serviceKey,"authorization":"Bearer "+serviceKey,"content-type":"application/json"},
  body:"{}",signal:AbortSignal.timeout(8000)
 });
 if(!r.ok)throw Error("provider_unavailable");
 const value=await r.json();const item=Array.isArray(value)?value[0]:value;
 const key=String(item?.access_token||"");
 if(!key)throw Error("provider_unavailable");
 return key;
}
async function idem(paymentToken:string,addonId:string){
 const hash=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode("thi-upsell-v1:"+paymentToken+":"+addonId)));
 const hex=Array.from(hash).map(x=>x.toString(16).padStart(2,"0")).join("");
 return hex.slice(0,8)+"-"+hex.slice(8,12)+"-4"+hex.slice(13,16)+"-8"+hex.slice(17,20)+"-"+hex.slice(20,32);
}
function status(order:Record<string,unknown>){
 const a=String(order.status||""),d=String(order.status_detail||"");
 if(a==="refunded"||d==="refunded")return "refunded";
 if(a==="processed"&&(d==="accredited"||d==="partially_refunded"))return "approved";
 if(a==="failed")return "rejected";
 if(["cancelled","canceled","expired"].includes(a))return "cancelled";
 return "pending";
}
Deno.serve(async request=>{
 if(request.method!=="POST")return reply({error:"method_not_allowed"},405);
 let body:Record<string,unknown>;
 try{body=await request.json()}catch{return reply({error:"invalid_json"},400)}
 const action=String(body.action||""),token=String(body.token||""),addonId=String(body.addonId||"");
 if(!["create","status"].includes(action)||!/^[a-f0-9]{48}$/.test(token)||
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(addonId))
   return reply({error:"invalid_request"},400);
 try{
  const code=await verifyOriginal(token);
  const apiToken=await access();
  if(action==="create"){
   const result=await fetch("https://api.mercadopago.com/v1/orders",{
    method:"POST",headers:{"authorization":"Bearer "+apiToken,"content-type":"application/json","accept":"application/json","x-idempotency-key":await idem(token,addonId)},
    body:JSON.stringify({
      type:"online",processing_mode:"manual",total_amount:"10000.00",
      external_reference:"thi_addon_"+addonId,
      description:"Te Hice Esto · Carta sorpresa extra",
      items:[{external_code:"secret_letter_v1",title:"Carta sorpresa extra",quantity:1,unit_price:"10000.00"}],
      config:{online:{
       success_url:"https://tehiceesto.com/pedido/"+code+"?extra=exitoso",
       pending_url:"https://tehiceesto.com/pedido/"+code+"?extra=pendiente",
       failure_url:"https://tehiceesto.com/pedido/"+code+"?extra=fallido",
       auto_return:"approved"
      },payment_method:{max_installments:3}}
    }),signal:AbortSignal.timeout(11000)
   });
   const data=await result.json().catch(()=>({}));
   if(!result.ok||typeof data.id!=="string"||typeof data.checkout_url!=="string")
    return reply({error:"checkout_create_failed"},502);
   return reply({providerOrderId:data.id,checkoutUrl:data.checkout_url,oneClick:false},200);
  }
  const orderId=String(body.providerOrderId||"");
  if(!/^[A-Za-z0-9_-]{6,200}$/.test(orderId))return reply({error:"invalid_provider_reference"},400);
  const result=await fetch("https://api.mercadopago.com/v1/orders/"+encodeURIComponent(orderId),{
   headers:{"authorization":"Bearer "+apiToken,"accept":"application/json"},signal:AbortSignal.timeout(9000)
  });
  if(!result.ok)return reply({error:"order_lookup_failed"},502);
  const data=await result.json() as Record<string,unknown>;
  if(data.external_reference!=="thi_addon_"+addonId||Math.round(Number(data.total_amount||0)*100)!==1000000)
   return reply({error:"order_mismatch"},409);
  return reply({status:status(data),providerOrderId:orderId,amountMinor:1000000},200);
 }catch{return reply({error:"provider_unavailable"},503);}
});
