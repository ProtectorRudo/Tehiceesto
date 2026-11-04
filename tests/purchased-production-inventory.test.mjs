import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PURCHASED_RENDERERS,NON_GIFT_PRODUCTS,purchasedRendererFor}
 from "../lib/gifts/purchased-renderers.mjs";
import {verifyLockedRenderers} from "../scripts/verify-renderer-lock.mjs";

const archive=JSON.parse(readFileSync(new URL("../data/purchased-model-snapshots.json",import.meta.url),"utf8"));

/**
 * Privacy-safe inventory as observed by a read-only GROUP BY of TeHiceEsto's
 * production gifts table, 2026-11-04, status paid/published. This has NO
 * customer names, codes, photos, payment references or order IDs.
 *
 * New sold editions must be registered before purchases; never delete one
 * just because the public demo is withdrawn.
 */
const observedGiftPairs=[
 ["abuelos","premium-v3"],["amistad","premium-v5"],
 ["aniversario","premium-v3"],["cumpleanos","premium-v3"],
 ["dragon-ball-pareja","dragon-ball-v1"],["hijos","premium-v3"],
 ["mama","premium-v5"],["papa","premium-v3"],
 ["pareja","premium-v3"],["pareja","premium-v4"],
 ["propuesta","premium-v3"],["secreto","premium-v3"],
 ["siete-dias","premium-v2"],
];
const observedGameProducts=[
 "escape-caso-m","escape-ultima-campanada","escape-ultima-funcion"
];

test("Every observed sold gift version resolves an explicit frozen model",()=>{
 assert.equal(observedGiftPairs.length,13);
 for(const [slug,version] of observedGiftPairs){
  assert.ok(PURCHASED_RENDERERS[slug]?.[version],slug+" "+version);
  assert.equal(typeof purchasedRendererFor(slug,version),"string");
  const stored=archive.products?.[slug]?.[version];
  assert.equal(stored?.model?.slug,slug);
  assert.ok(stored.model.recipe.length>0);
 }
});

test("Every sold escape remains in historical delivery registry even after public withdrawal",()=>{
 assert.equal(observedGameProducts.length,3);
 for(const slug of observedGameProducts)
  assert.ok(NON_GIFT_PRODUCTS.includes(slug),"Missing historical product: "+slug);
});

test("The shipped visual baselines remain hash-locked independently of current public demos",()=>{
 const result=verifyLockedRenderers();
 assert.ok(result.protectedFiles>=18);
 const source=readFileSync(new URL("../lib/gifts/repository.ts",import.meta.url),"utf8");
 assert.match(source,/getPurchasedModelSnapshot\(row\.experience_slug,row\.template_version\)/);
 assert.match(source,/purchasedRendererFor\(row\.experience_slug,row\.template_version\)/);
});
