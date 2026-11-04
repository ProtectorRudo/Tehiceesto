import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHmac,webcrypto} from "node:crypto";
import {createRequire} from "node:module";
import {runInNewContext} from "node:vm";
const require=createRequire(import.meta.url);
const ts=require("typescript");
const source=readFileSync(new URL("../supabase/functions/resend-delivery-webhook/index.ts",import.meta.url),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const bytes=Buffer.alloc(32,5);
const secret="whsec_"+bytes.toString("base64");
function instance({secretEnabled=true,storageError=null}={}){
 let endpoint=null;
 const stored=new Map();
 let rpcCalls=0;
 const client={
  rpc:async(name)=>{assert.equal(name,"tehiceesto_private_resend_webhook_secret");rpcCalls++;return{data:secretEnabled?secret:null,error:null};},
  from:name=>{assert.equal(name,"thi_resend_delivery_events");return{insert:async row=>{
   if(storageError)return{error:storageError};
   if(stored.has(row.event_id))return{error:{code:"23505"}};
   stored.set(row.event_id,row);return{error:null};
  }};}
 };
 const exports={};
 runInNewContext(compiled,{
  module:{exports},exports,
  require:name=>{assert.equal(name,"npm:@supabase/supabase-js@2");return{createClient:()=>client};},
  Deno:{env:{get:name=>name==="SUPABASE_URL"?"https://fake.supabase.test":name==="SUPABASE_SECRET_KEYS"?JSON.stringify({default:"private-test"}):""},serve:fn=>endpoint=fn},
  crypto:webcrypto,TextEncoder,Uint8Array,Headers,Request,Response,Date,Number,String,JSON,console,atob
 });
 assert.equal(typeof endpoint,"function");
 return {endpoint,stored,get rpcCalls(){return rpcCalls;}};
}
function request(event,{id="msg_test-event-0001",when=Date.now(),sign=true,method="POST",alterRaw=false}={}){
 const raw=JSON.stringify(event);
 const timestamp=String(Math.trunc(when/1000));
 const signature=createHmac("sha256",bytes).update(id+"."+timestamp+"."+raw).digest("base64");
 const headers={
  "content-type":"application/json",
  "svix-id":id,"svix-timestamp":timestamp,
  "svix-signature":"v1,"+(sign?"A".repeat(signature.length):signature),
 };
 // alterRaw ensures signature and body no longer match
 return new Request("https://fake.supabase.test/functions/v1/resend-delivery-webhook",{
  method,headers,body:method==="POST"?(alterRaw?raw+" ":raw):undefined
 });
}
const validEvent=(patch={})=>({
 type:"email.delivered",created_at:"2026-11-04T10:00:00.000Z",
 data:{email_id:"123e4567-e89b-12d3-a456-426614174000",
  from:"Te Hice Esto <hola@tehiceesto.com>",to:["buyer@example.test"],
  subject:"Private gift access",message_id:"<test@resend.example>",...patch.data},
 ...Object.fromEntries(Object.entries(patch).filter(([k])=>k!=="data"))
});
test("Rejects invalid signatures, unsigned requests and expired attempts before storing any event",async()=>{
 const x=instance();
 const bad=await x.endpoint(request(validEvent(),{sign:true}));
 assert.equal(bad.status,401);
 const noSignature=await x.endpoint(new Request("https://fake.supabase.test",{method:"POST",body:"{}"}));
 assert.equal(noSignature.status,401);
 const expired=await x.endpoint(request(validEvent(),{sign:false,when:Date.now()-360000}));
 assert.equal(expired.status,401);
 const future=await x.endpoint(request(validEvent(),{sign:false,when:Date.now()+360000}));
 assert.equal(future.status,401);
 assert.equal(x.stored.size,0);
});
test("Signed delivery events persist only non-PII data, with duplicate event idempotency",async()=>{
 const x=instance();const e=validEvent();
 const request1=request(e,{sign:false});
 const r1=await x.endpoint(request1);
 assert.equal(r1.status,200);assert.equal((await r1.json()).status,"recorded");
 assert.equal(x.stored.size,1);
 const row=[...x.stored.values()][0];
 assert.deepEqual(Object.keys(row).sort(),["email_id","event_at","event_id","event_type"]);
 assert.equal(row.event_type,"email.delivered");
 assert.ok(!JSON.stringify(row).includes("buyer@example.test"));
 assert.ok(!JSON.stringify(row).includes("Private gift access"));
 const r2=await x.endpoint(request(e,{sign:false}));
 assert.equal(r2.status,200);assert.equal((await r2.json()).status,"duplicate");
 assert.equal(x.stored.size,1);
});
test("Signed events for other brands, unsupported types and forged sender domains are ignored",async()=>{
 const x=instance();
 for(const e of [
  validEvent({data:{from:"noreply@othercompany.com"}}),
  validEvent({data:{from:"hello@tehiceesto.com.attacker.invalid"}}),
  validEvent({data:{from:"hello@tehiceesto.com@attacker.invalid"}}),
  validEvent({type:"email.opened"}),
  validEvent({data:{email_id:"bad/id"}})
 ]){
  const r=await x.endpoint(request(e,{sign:false,id:"msg_event-"+Math.random().toString(36).slice(2)}));
  assert.equal(r.status,200);assert.equal((await r.json()).status,"ignored");
 }
 assert.equal(x.stored.size,0);
});
test("Database and webhook secret failures are retryable, no event accepted without key",async()=>{
 const a=instance({secretEnabled:false});
 const r=await a.endpoint(request(validEvent(),{sign:false}));
 assert.equal(r.status,503);assert.equal(a.stored.size,0);
 const b=instance({storageError:{code:"42501"}});
 const z=await b.endpoint(request(validEvent(),{sign:false}));
 assert.equal(z.status,503);assert.equal(b.stored.size,0);
});
test("Does not accept oversized payloads or methods other than POST",async()=>{
 const x=instance();
 const get=await x.endpoint(new Request("https://fake.supabase.test"));
 assert.equal(get.status,405);
 const large=new Request("https://fake.supabase.test",{method:"POST",headers:{"content-length":"25000"},body:"hello"});
 const r=await x.endpoint(large);
 assert.equal(r.status,413);
 assert.equal(x.rpcCalls,0);
});
