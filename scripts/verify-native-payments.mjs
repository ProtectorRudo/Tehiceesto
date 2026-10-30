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
assert.ok(native.includes("checkout-pro-config-v2:"),"Idempotency must remain compatible with old checkout");
assert.ok(native.includes("idempotencyKey(token)"),"Payment creation must be idempotent");
assert.ok(native.includes("bridgeStatus(rawStatus,rawDetail)"),"Provider statuses must reconcile");
assert.ok(webhook.includes("TEHICEESTO_MP_WEBHOOK_SECRET"),"Webhook secret must be server only");
assert.ok(webhook.includes("x-signature")&&webhook.includes("x-request-id"),"Webhook must verify Mercado Pago signature");
assert.ok(webhook.includes("amount_mismatch")&&webhook.includes("reference_mismatch"),"Webhook must compare provider amount and reference");
for(const [name,src] of [["order-create",order],["order-status",status]]){
 assert.ok(src.includes('TEHICEESTO_NATIVE_MP_ENABLED')&&src.includes('==="true"'),name+" must keep default-off feature flag");
 assert.ok(src.includes(legacy)&&src.includes(primary),name+" must preserve legacy fallback");
 assert.ok(src.includes("TEHICEESTO_PAYMENT_GATEWAY"),name+" must route through a single switch");
}
assert.ok(upsell.includes("TEHICEESTO_NATIVE_MP_ENABLED"),"Upsell migration should not bypass its separate release gate");
for(const [name,src] of Object.entries({native,webhook,order,status,upsell})){
 assert.ok(!/APP_USR-[\w-]{32,}/.test(src),name+" contains an access token pattern");
 assert.ok(!/TEST-[0-9a-z-]{32,}/i.test(src),name+" contains credential-looking text");
}
console.log("Native Mercado Pago migration safety checks passed. Live routing unchanged.");
