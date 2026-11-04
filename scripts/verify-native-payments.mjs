import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root="supabase/functions/";
const read=path=>readFileSync(root+path+"/index.ts","utf8");
const native=read("tehiceesto-checkout-native");
const webhook=read("tehiceesto-mp-webhook");
const order=read("order-create");
const status=read("order-status");
const upsell=read("upsell-api");
const legacy="https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout-v2";
const primary="https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/tehiceesto-checkout-native";

assert.ok(native.includes("TEHICEESTO_MP_ACCESS_TOKEN"),"Native checkout must use TeHiceEsto secure environment secret");
assert.ok(!native.includes("bwsgxpttnrctklrcjmjs"),"Native checkout must never rely on Viralio");
assert.ok(native.includes("payment-bridge"),"Native checkout should preserve existing signed payment bridge");
assert.ok(native.includes("checkout-pro-config-v2")&&native.includes("checkout-pro-config-v3-addon"),"Both plain and bundled payment idempotency namespaces must remain stable");
assert.ok(native.includes("idempotencyKey(token,bundledExtra)"),"Payment creation must be idempotent across addon choices");
assert.ok(native.includes("bridgeStatus(rawStatus,rawDetail)"),"Provider statuses must reconcile");
assert.ok(webhook.includes("TEHICEESTO_MP_WEBHOOK_SECRET"),"Webhook secret must be server only");
assert.ok(webhook.includes("x-signature")&&webhook.includes("x-request-id"),"Webhook must verify Mercado Pago signature");
assert.ok(webhook.includes("amount_mismatch")&&webhook.includes("reference_mismatch"),"Webhook must compare provider amount and reference");
for(const [name,src] of [["order-create",order],["order-status",status]]){
 assert.ok(src.includes(primary),name+" must use TeHiceEsto native checkout");
 assert.ok(!src.includes(legacy),name+" must never route back to the paused Viralio checkout");
}
assert.ok(upsell.includes("TEHICEESTO_NATIVE_MP_ENABLED"),"Upsell migration should not bypass its separate release gate");
for(const [name,src] of Object.entries({native,webhook,order,status,upsell})){
 assert.ok(!/APP_USR-[\w-]{32,}/.test(src),name+" contains an access token pattern");
 assert.ok(!/TEST-[0-9a-z-]{32,}/i.test(src),name+" contains credential-looking text");
}
console.log("Native Mercado Pago cutover and payment safety checks passed.");
