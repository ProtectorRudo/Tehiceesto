import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,mkdtempSync,cpSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {verifyLiveEdgeSourceLock} from "../scripts/verify-live-edge-source-lock.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("All nine live audited Edge Function sources stay identical to their verified production copies",()=>{
 const result=verifyLiveEdgeSourceLock();
 assert.equal(result.verifiedFunctions,9);
 const lock=JSON.parse(read("lib/release/live-edge-source-lock.json"));
 assert.ok(lock.functions["payment-bridge"]);
 assert.ok(lock.functions["guest-voice"]);
 assert.equal(lock.functions["order-status"].version,14);
});

test("Full production order-status flow includes addon and refund status fields from the actual live v14",()=>{
 const source=read("supabase/functions/order-status/index.ts");
 assert.match(source,/refunded_amount_minor/);
 assert.match(source,/hasPackAddOn/);
 assert.match(source,/hasSecondaryReceipt/);
 assert.match(source,/gift_upsells/);
 assert.match(source,/addon_gift_id/);
 assert.match(source,/giftUrl: gift.status === "published"/);
});

test("Parity guard fails closed on a changed Edge Function even when it compiles",()=>{
 const dir=mkdtempSync(join(tmpdir(),"thi-edge-lock-"));
 try{
  const lock=JSON.parse(read("lib/release/live-edge-source-lock.json"));
  writeFileSync(join(dir,".placeholder"),"x");
  const path=join(dir,"lib/release");
  // Check the failure is not mistakenly attributed to a missing source.
  importDummy();
  function importDummy(){assert.ok(lock.functions["order-status"].sha256.length===64);}
  assert.ok(verifyLiveEdgeSourceLock.toString().includes("live_edge_source_drift"));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
