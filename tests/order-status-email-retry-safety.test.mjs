import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import ts from "typescript";

const source=readFileSync(new URL("../supabase/functions/order-status/index.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{
 compilerOptions:{module:ts.ModuleKind.None,target:ts.ScriptTarget.ES2022}
}).outputText;

const code="aaaaaaaaaaaaaaaaaa";
const validPurchase={
 status:"approved",provider:"mercadopago",provider_reference:"ORD0123456789",
 checkout_url:"https://mercadopago.example.test",
 amount_minor:2500000,currency:"ARS",payment_token:"private-test-token",
 paid_at:"2026-11-04T11:00:00Z",buyer_email:"buyer@example.test",
 updated_at:"2026-11-04T11:00:00Z",refunded_amount_minor:0,
 access_email_sent_at:null,access_email_last_attempt_at:null
};

async function requestStatus(order,sendKey="public-test"){
 let callback;
 const requests=[];
 const gift={
  id:"00000000-0000-4000-8000-000000000001",
  public_code:code,status:"paid",template_version:"premium-v3",
  experience_slug:"pareja",giver_name:"Emisor",recipient_name:"Receptor",
  story_data:null,created_at:"2026-11-04T11:00:00Z",
  updated_at:"2026-11-04T11:00:00Z",published_at:null
 };
 const fakeFetch=async(input,options={})=>{
  const url=new URL(String(input));
  requests.push({url:url.toString(),method:options.method||"GET"});
  if(url.pathname==="/rest/v1/gifts")
   return new Response(JSON.stringify([gift]),{status:200});
  if(url.pathname==="/rest/v1/orders")
   return new Response(JSON.stringify([order]),{status:200});
  if(url.pathname==="/functions/v1/tehiceesto-checkout-native")
   return new Response(JSON.stringify({ok:true}),{status:200});
  throw Error("unexpected upstream "+url.pathname);
 };
 const vars={
  SUPABASE_URL:"https://fake.supabase.test",
  SUPABASE_PUBLISHABLE_KEYS:JSON.stringify({default:"public-test"}),
  SUPABASE_ANON_KEYS:JSON.stringify({default:"anon-test"}),
  SUPABASE_SECRET_KEYS:JSON.stringify({default:"secret-test"}),
 };
 runInNewContext(js,{
  Deno:{env:{get:name=>vars[name]||""},serve:fn=>{callback=fn;}},
  fetch:fakeFetch,Request,Response,URL,Date,Number,String,JSON,
  AbortSignal,console
 });
 assert.equal(typeof callback,"function");
 const response=await callback(new Request("https://fake.supabase.test/functions/v1/order-status?code="+code,{
  method:"GET",headers:{apikey:sendKey}
 }));
 return {response,body:await response.json(),requests,
  checkoutRequests:requests.filter(x=>x.url.includes("/functions/v1/tehiceesto-checkout-native"))};
}

test("Valid credited Mercado Pago order retries access-email reconciliation after cooldown",async()=>{
 const {response,body,checkoutRequests}=await requestStatus({...validPurchase});
 assert.equal(response.status,200);
 assert.equal(body.stage,"personalize");
 assert.equal(checkoutRequests.length,1);
});

test("Internal test/grant approvals NEVER request provider sync or send access email",async()=>{
 for(const provider of ["internal_grant","internal-test"]){
  const x=await requestStatus({...validPurchase,provider,access_email_sent_at:null});
  assert.equal(x.response.status,200);
  assert.equal(x.checkoutRequests.length,0,provider);
 }
});

test("Historical incomplete and refunded Mercado Pago rows are not auto-retried",async()=>{
 const cases=[
  {amount_minor:null},
  {amount_minor:0},
  {paid_at:null},
  {provider_reference:null},
  {provider_reference:"historical-ref"},
  {buyer_email:""},
  {buyer_email:"invalid"},
  {status:"refunded"},
  {access_email_sent_at:"2026-11-04T11:03:00Z"},
  {access_email_last_attempt_at:new Date().toISOString()}
 ];
 for(const patch of cases){
  const {checkoutRequests}=await requestStatus({...validPurchase,...patch});
  assert.equal(checkoutRequests.length,0,"case "+JSON.stringify(patch));
 }
});

test("Pending Mercado Pago checkout still reconciles exactly as before",async()=>{
 const x=await requestStatus({...validPurchase,status:"pending",paid_at:null,
  provider_reference:null,access_email_sent_at:null});
 assert.equal(x.response.status,200);
 assert.equal(x.checkoutRequests.length,1);
 assert.match(x.checkoutRequests[0].url,/tehiceesto-checkout-native/);
});

test("Missing/incorrect public API key remains unauthorized without querying orders",async()=>{
 const x=await requestStatus({...validPurchase},"unauthorized");
 assert.equal(x.response.status,401);
 assert.equal(x.requests.length,0);
});
