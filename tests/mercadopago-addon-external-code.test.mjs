import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {mercadoPagoAddonExternalCode} from "../supabase/functions/tehiceesto-checkout-native/item-code.mjs";

test("Legacy small order codes are stable to avoid breaking idempotent retries",()=>{
 const code="a".repeat(18);
 assert.equal(mercadoPagoAddonExternalCode(code),code+"-addon");
});
test("27 character order codes fit Mercado Pago's 30-character external_code limit",()=>{
 const code="b".repeat(27);
 const result=mercadoPagoAddonExternalCode(code);
 assert.equal(result.length,30);
 assert.equal(result,"b".repeat(24)+"-addon");
});
test("Every allowed order code length stays within limit and keeps the addon suffix",()=>{
 for(let size=18;size<=30;size++){
  const result=mercadoPagoAddonExternalCode("c".repeat(size));
  assert.ok(result.length<=30);
  assert.ok(result.endsWith("-addon"));
 }
});
test("Invalid product codes cannot be used",()=>{
 for(const code of ["", "other-product", "A".repeat(27), "1".repeat(40)])
  assert.throws(()=>mercadoPagoAddonExternalCode(code));
});
test("The live Edge function uses the guarded helper for addon items",()=>{
 const source=readFileSync(new URL("../supabase/functions/tehiceesto-checkout-native/index.ts",import.meta.url),"utf8");
 assert.ok(source.includes('import {mercadoPagoAddonExternalCode} from "./item-code.mjs"'));
 assert.ok(source.includes("external_code:mercadoPagoAddonExternalCode(code)"));
 assert.ok(!source.includes('external_code:code+"-addon"'));
});
