// Mercado Pago webhook for TeHiceEsto (native Supabase project).
// Dormant until TEHICEESTO_MP_ACCESS_TOKEN and TEHICEESTO_MP_WEBHOOK_SECRET are
// provided securely and its URL is configured in the Mercado Pago developer panel.
// A redirect querystring is NEVER proof of a successful payment.
const BRIDGE="https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/payment-bridge";
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{
  status,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"}
});
const hex=(bytes:ArrayBuffer)=>[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
async function hmac(secret:string,message:string){
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 return hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message)));
}
function equal(a:string,b:string){if(a.length!==b.length)return false;let mismatch=0;for(let i=0;i<a.length;i++)mismatch|=a.charCodeAt(i)^b.charCodeAt(i);return mismatch===0;}
async function validSignature(req:Request,secret:string,dataId:string){
 const header=req.headers.get("x-signature")||"";
 const requestId=req.headers.get("x-request-id")||"";
 const timestamp=header.match(/(?:^|,)\s*ts=([0-9]+)/i)?.[1]||"";
 const signature=header.match(/(?:^|,)\s*v1=([0-9a-f]{64})/i)?.[1]||"";
 if(!timestamp||!signature||!requestId)return false;
 const time=Number(timestamp);if(!Number.isFinite(time))return false;
 const timeMs=timestamp.length===10?time*1000:time;
 if(Math.abs(Date.now()-timeMs)>15*60*1000)return false;
 const manifest=`id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
 return equal(signature,await hmac(secret,manifest));
}
async function bridge(body:Record<string,unknown>){
 const result=await fetch(BRIDGE,{method:"POST",headers:{"content-type":"application/json"},
 body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
 const payload=await result.json().catch(()=>({}));
 if(!result.ok)throw Error("payment_bridge_failed");
 return payload as Record<string,unknown>;
}
function status(raw:string,detail:string){
 if(raw==="refunded"||detail==="refunded")return "refunded";
 if(raw==="processed"&&(detail==="accredited"||detail==="partially_refunded"))return "approved";
 if(raw==="failed")return "rejected";
 if(["canceled","cancelled","expired"].includes(raw))return "cancelled";
 return "pending";
}
function refundedMinor(order:Record<string,unknown>,amount:number,raw:string,detail:string){
 if(raw==="refunded"||detail==="refunded")return amount;
 const transactions=(order.transactions||{}) as Record<string,unknown>;
 const refunds=Array.isArray(transactions.refunds)?transactions.refunds:[];
 let total=0;
 for(const data of refunds){
  if(!data||typeof data!=="object")continue;
  const item=data as Record<string,unknown>;
  if(!["processed","refunded"].includes(String(item.status||"").toLowerCase()))continue;
  const value=Number(item.amount);if(Number.isFinite(value)&&value>=0)total+=Math.round(value*100);
 }
 return Math.min(amount,Math.max(0,total));
}
Deno.serve(async request=>{
 if(request.method!=="POST")return json({error:"method_not_allowed"},405);
 const accessToken=(Deno.env.get("TEHICEESTO_MP_ACCESS_TOKEN")||"").trim();
 const webhookSecret=(Deno.env.get("TEHICEESTO_MP_WEBHOOK_SECRET")||"").trim();
 if(!accessToken||!webhookSecret)return json({error:"mercadopago_not_configured"},503);
 let body:Record<string,unknown>;
 try{body=await request.json();}catch{return json({error:"invalid_json"},400);}
 const parsed=new URL(request.url);
 const inner=body.data&&typeof body.data==="object"?body.data as Record<string,unknown>:{};
 const dataId=String(parsed.searchParams.get("data.id")||inner.id||"").trim();
 const type=String(parsed.searchParams.get("type")||body.type||"").trim().toLowerCase();
 if(type!=="order"||!/^[A-Za-z0-9_-]{6,160}$/.test(dataId))return json({ok:true,ignored:true});
 if(!await validSignature(request,webhookSecret,dataId))return json({error:"invalid_signature"},401);
 // The Developers notification simulator defaults to a numeric Data ID (e.g. 123456),
 // which is not a Checkout Pro Orders resource ID. Accept only AUTHENTICATED
 // simulation delivery, and never query it as a charge or modify a gift/order.
 // Real Orders identifiers start with ORD and continue to be checked against MP.
 if(/^\\d{1,18}$/.test(dataId))return json({ok:true,ignored:true,reason:"simulator_notification"},200);
 try{
  const result=await fetch("https://api.mercadopago.com/v1/orders/"+encodeURIComponent(dataId),
   {headers:{"authorization":"Bearer "+accessToken,"accept":"application/json"},signal:AbortSignal.timeout(10000)});
  if(!result.ok)return json({error:"provider_unavailable"},502);
  const order=await result.json() as Record<string,unknown>;
  const external=String(order.external_reference||"");
  if(!/^thi_[a-f0-9]{48}$/.test(external))return json({ok:true,ignored:true});
  const token=external.slice(4);
  const config=await bridge({action:"config",token,syncStatusOnly:true});
  const amountMinor=Number(config.amountMinor);
  if(!Number.isInteger(amountMinor)||amountMinor<=0||Math.round(Number(order.total_amount||0)*100)!==amountMinor)
   return json({error:"amount_mismatch"},409);
  const providerOrderId=String(order.id||dataId);
  if(config.providerReference&&config.providerReference!==providerOrderId)return json({error:"reference_mismatch"},409);
  const raw=String(order.status||"").toLowerCase(),detail=String(order.status_detail||"").toLowerCase();
  const next=status(raw,detail);
  const refundedAmountMinor=refundedMinor(order,amountMinor,raw,detail);
  const canonical=`${token}|${providerOrderId}|${next}|${amountMinor}||refund:${refundedAmountMinor}`;
  const signature=await hmac(token,canonical);
  await bridge({action:"sync",token,providerOrderId,status:next,amountMinor,refundedAmountMinor,checkoutUrl:"",signature});
  return json({ok:true,status:next});
 }catch{return json({error:"reconcile_failed"},503);}
});
