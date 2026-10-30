import {createClient} from "npm:@supabase/supabase-js@2";
const TEHICEESTO_NATIVE_ADDON_PROVIDER=Deno.env.get("TEHICEESTO_NATIVE_MP_ENABLED")==="true" ? "https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/tehiceesto-upsell-native" : "https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-upsell";
const URL=Deno.env.get("SUPABASE_URL")!;
function k(name:string){try{const parsed=JSON.parse(Deno.env.get(name)||"{}");return typeof parsed.default==="string"?parsed.default:"";}catch{return "";}}
const SECRET=k("SUPABASE_SECRET_KEYS");
const PUBLIC=k("SUPABASE_PUBLISHABLE_KEYS")||k("SUPABASE_ANON_KEYS");
const PROVIDER=TEHICEESTO_NATIVE_ADDON_PROVIDER;
const enabled=()=>Deno.env.get("TEHICEESTO_UPSELL_CHARGE_ENABLED")==="true";
const origins=["https://tehiceesto.com","https://www.tehiceesto.com"];
function reply(body:unknown,status=200,origin="https://tehiceesto.com"){
 return new Response(JSON.stringify(body),{status,headers:{
 "content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff",
 "access-control-allow-origin":origins.includes(origin)?origin:"https://tehiceesto.com",
 "access-control-allow-methods":"POST,OPTIONS","access-control-allow-headers":"content-type,apikey"
 }});
}
function db(){return createClient(URL,SECRET,{auth:{autoRefreshToken:false,persistSession:false}});}
const validCode=(v:unknown)=>typeof v==="string"&&/^[a-f0-9]{18}$/.test(v);
const validMessage=(v:unknown)=>typeof v==="string"&&v.trim().length>=1&&v.trim().length<=4000;
async function provider(body:Record<string,unknown>){
 const res=await fetch(PROVIDER,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(11500)});
 if(!res.ok)throw Error("provider_unavailable");
 return await res.json() as Record<string,unknown>;
}
Deno.serve(async request=>{
 const origin=request.headers.get("origin")||"";
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:reply({},200,origin).headers});
 if(request.method!=="POST")return reply({error:"method_not_allowed"},405,origin);
 const supplied=request.headers.get("apikey")||"";
 if(!PUBLIC||!SECRET||supplied!==PUBLIC)return reply({error:"unauthorized"},401,origin);
 let body:Record<string,unknown>;
 try{body=await request.json();}catch{return reply({error:"invalid_json"},400,origin);}
 const action=String(body.action||"");const code=String(body.code||"").toLowerCase().trim();
 if(!["status","accept","decline","save-letter","read-letter","editor-read"].includes(action)||!validCode(code))return reply({error:"invalid_request"},400,origin);
 const supabase=db();
 const {data:gift,error:giftError}=await supabase.from("gifts").select("id,public_code,status,experience_slug")
   .eq("public_code",code).maybeSingle();
 if(giftError||!gift)return reply({error:"not_found"},404,origin);
 const {data:order,error:orderError}=await supabase.from("orders")
  .select("id,status,paid_at,payment_token,refunded_amount_minor,amount_minor")
  .eq("gift_id",gift.id).maybeSingle();
 if(orderError)return reply({error:"order_unavailable"},503,origin);
 const paid=order?.status==="approved" && !!order.paid_at
  && Number(order.refunded_amount_minor||0)<Number(order.amount_minor||0);
 const {data:upsell,error:upsellError}=await supabase.from("gift_upsells").select("*")
  .eq("gift_id",gift.id).eq("product_code","secret_letter_v1").maybeSingle();
 if(upsellError)return reply({error:"offer_unavailable"},503,origin);
 let state=upsell;

 async function sync(){
   if(!paid||!state?.provider_order_id||!order?.payment_token)return;
   if(!["pending","approved","refunded"].includes(state.status))return;
   try{
    const result=await provider({action:"status",token:order.payment_token,
       addonId:state.id,providerOrderId:state.provider_order_id});
    const status=String(result.status||"");
    if(!["pending","approved","rejected","refunded","cancelled"].includes(status))return;
    if((state.status==="approved"&&status!=="refunded")||(state.status==="refunded"))return;
    const patch:Record<string,unknown>={status,updated_at:new Date().toISOString()};
    if(status==="approved"&&!state.paid_at)patch.paid_at=new Date().toISOString();
    if(status==="refunded")patch.paid_at=null;
    const {data}=await supabase.from("gift_upsells").update(patch).eq("id",state.id).select("*").maybeSingle();
    if(data)state=data;
   }catch{/* Safe fail closed: never infer a successful charge from return URL. */}
 }
 if(action==="status"){
  await sync();
  return reply({
   mainPaid:paid,mainStatus:String(order?.status||"pending"),
   product:"secret_letter_v1",title:"Una carta sorpresa extra",
   amountMinor:1000000,currency:"ARS",
   canOffer:paid&&enabled()&&(!state||["offered","declined","rejected","cancelled"].includes(state.status)),
   paymentMode:"mercadopago_confirm",oneClick:false,
   status:String(state?.status||"offered"),
   checkoutUrl:paid&&state?.status==="pending"?state.checkout_url:null,
   letterReady:paid&&state?.status==="approved",
  },200,origin);
 }
 if(!paid)return reply({error:"original_payment_not_confirmed"},409,origin);
 if(action==="decline"){
  if(state&&["approved","pending","refunded"].includes(state.status))return reply({error:"offer_already_processed"},409,origin);
  if(!state){const {error}=await supabase.from("gift_upsells").insert({gift_id:gift.id,order_id:order.id,status:"declined"});if(error)return reply({error:"write_failed"},503,origin);}
  else await supabase.from("gift_upsells").update({status:"declined",updated_at:new Date().toISOString()}).eq("id",state.id);
  return reply({ok:true,status:"declined"},200,origin);
 }
 if(action==="read-letter"){
  if(gift.status!=="published"||state?.status!=="approved")return reply({error:"not_found"},404,origin);
  return reply({text:state.letter_text},200,origin);
 }
 if(action==="save-letter"||action==="editor-read"){
  if(state?.status!=="approved"||(action==="save-letter"&&!validMessage(body.text)))return reply({error:"not_available"},409,origin);
  const editorToken=String(body.editorToken||"").trim().toLowerCase();
  if(!/^[a-f0-9]{64}$/.test(editorToken))return reply({error:"unauthorized"},403,origin);
  try{
    const validate=await fetch(URL+"/functions/v1/creator-api",{
      method:"POST",headers:{"apikey":PUBLIC,"content-type":"application/json"},
      body:JSON.stringify({action:"openStudio",code,editorToken}),signal:AbortSignal.timeout(12000)
    });
    const data=await validate.json().catch(()=>({}));
    if(!validate.ok||data?.gift?.experience_slug!==gift.experience_slug)return reply({error:"unauthorized"},403,origin);
  }catch{return reply({error:"authorization_unavailable"},503,origin);}
  if(action==="editor-read")return reply({text:state.letter_text},200,origin);
  const {error}=await supabase.from("gift_upsells").update({letter_text:String(body.text).trim(),updated_at:new Date().toISOString()}).eq("id",state.id);
  return error?reply({error:"save_failed"},503,origin):reply({ok:true},200,origin);
 }
 if(action==="accept"){
  if(!enabled())return reply({error:"payment_unavailable"},503,origin);
  if(state?.status==="approved"||state?.status==="refunded")return reply({error:"offer_already_processed"},409,origin);
  if(state?.status==="pending"&&/^https:\/\//.test(String(state.checkout_url||"")))
    return reply({checkoutUrl:state.checkout_url,checkoutReady:true,oneClick:false},200,origin);
  if(!state){
   const {data,error}=await supabase.from("gift_upsells")
     .upsert({gift_id:gift.id,order_id:order.id,product_code:"secret_letter_v1",status:"offered"},
      {onConflict:"gift_id,product_code",ignoreDuplicates:true}).select("*").maybeSingle();
   if(error)return reply({error:"offer_unavailable"},503,origin);
   state=data;
   if(!state){const found=await supabase.from("gift_upsells").select("*").eq("gift_id",gift.id).maybeSingle();state=found.data;}
  }
  if(!state||state.status==="approved"||state.status==="refunded")return reply({error:"offer_already_processed"},409,origin);
  try{
   const checkout=await provider({action:"create",token:order.payment_token,addonId:state.id});
   const url=String(checkout.checkoutUrl||"");
   const providerOrderId=String(checkout.providerOrderId||"");
   if(!/^https:\/\//.test(url)||!providerOrderId)return reply({error:"provider_unavailable"},503,origin);
   const {error}=await supabase.from("gift_upsells")
    .update({status:"pending",checkout_url:url,provider_order_id:providerOrderId,updated_at:new Date().toISOString()}).eq("id",state.id);
   if(error)return reply({error:"offer_write_failed"},503,origin);
   return reply({checkoutReady:true,checkoutUrl:url,oneClick:false},200,origin);
  }catch{return reply({error:"payment_unavailable"},503,origin);}
 }
 return reply({error:"invalid_action"},400,origin);
});
