import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const create=readFileSync("supabase/functions/order-create/index.ts","utf8");
const status=readFileSync("supabase/functions/order-status/index.ts","utf8");
const cron=readFileSync("supabase/migrations/20261030100000_tehiceesto_native_mp_cutover.sql","utf8");
const old="bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout-v2";
const own="efvvadfxuyieswdqnsjg.supabase.co/functions/v1/tehiceesto-checkout-native";
for(const [name,source] of [["order-create",create],["order-status",status]]){
 assert(source.includes(own),name+" does not use native TeHiceEsto provider");
 assert(!source.includes(old),name+" still contacts paused Viralio project");
}
assert(cron.includes(old)&&cron.includes(own),"Migration must be reversible and guard previous gateway");
assert(cron.includes("pg_get_functiondef")&&cron.includes("replace(before_ddl"),"Migration must preserve existing schedule and function logic");
console.log("Native payment gateway cutover checks passed");
