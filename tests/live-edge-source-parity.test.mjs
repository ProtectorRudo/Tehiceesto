import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,appendFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {verifyLiveEdgeSourceLock} from "../scripts/verify-live-edge-source-lock.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("All ten audited Edge Function sources stay identical to their verified production copies",()=>{
 const result=verifyLiveEdgeSourceLock();
 assert.equal(result.verifiedFunctions,10);
 const lock=JSON.parse(read("lib/release/live-edge-source-lock.json"));
 assert.ok(lock.functions["payment-bridge"]);
 assert.ok(lock.functions["guest-voice"]);
 assert.equal(lock.functions["order-status"].version,16);
});

test("Full production order-status flow includes addon and refund status fields from the actual live v16",()=>{
 const source=read("supabase/functions/order-status/index.ts");
 assert.match(source,/refunded_amount_minor/);
 assert.match(source,/hasPackAddOn/);
 assert.match(source,/hasSecondaryReceipt/);
 assert.match(source,/gift_upsells/);
 assert.match(source,/addon_gift_id/);
 assert.match(source,/giftUrl: gift.status === "published"/);
});

test("Parity guard blocks a silent one-byte change even if other nine functions match",()=>{
 const dir=mkdtempSync(join(tmpdir(),"thi-edge-lock-"));
 try{
  const lock=JSON.parse(read("lib/release/live-edge-source-lock.json"));
  const lockDirectory=join(dir,"lib/release");
  mkdirSync(lockDirectory,{recursive:true});
  writeFileSync(join(lockDirectory,"live-edge-source-lock.json"),JSON.stringify(lock));
  for(const slug of Object.keys(lock.functions)){
   const folder=join(dir,"supabase/functions",slug);
   mkdirSync(folder,{recursive:true});
   writeFileSync(join(folder,"index.ts"),read("supabase/functions/"+slug+"/index.ts"));
  }
  assert.equal(verifyLiveEdgeSourceLock(dir).verifiedFunctions,10);
  appendFileSync(join(dir,"supabase/functions/order-status/index.ts"),"\\n// accidental drift\\n");
  assert.throws(()=>verifyLiveEdgeSourceLock(dir),/live_edge_source_drift:order-status/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
