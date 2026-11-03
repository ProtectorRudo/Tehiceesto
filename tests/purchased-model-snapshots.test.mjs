import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PURCHASED_RENDERERS} from "../lib/gifts/purchased-renderers.mjs";
import {verifyLockedRenderers} from "../scripts/verify-renderer-lock.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const data=JSON.parse(read("data/purchased-model-snapshots.json"));

test("Every historical purchased (product,version) pair has a frozen content baseline",()=>{
  assert.equal(data.schema,1);
  let n=0;
  for(const [slug,versions] of Object.entries(PURCHASED_RENDERERS)){
    for(const version of Object.keys(versions)){
      const snapshot=data.products?.[slug]?.[version];
      assert.ok(snapshot,"missing archived model "+slug+" "+version);
      assert.equal(snapshot.model.slug,slug);
      assert.ok(snapshot.model.title?.length>3);
      assert.ok(snapshot.model.opening?.length>10);
      assert.ok(snapshot.model.closing?.length>10);
      assert.ok(Array.isArray(snapshot.model.recipe)&&snapshot.model.recipe.length>0);
      assert.ok(["catalog-baseline-20261103","archived-legacy-v5"].includes(snapshot.source));
      n++;
    }
  }
  assert.equal(n,21);
});

test("Catalog changes cannot silently change the baseline used to render a paid gift",()=>{
 const source=read("lib/gifts/repository.ts");
 const loader=read("lib/gifts/purchased-model-snapshots.ts");
 assert.ok(source.includes("getPurchasedModelSnapshot(row.experience_slug,row.template_version)"));
 assert.ok(!source.includes("const base = getExperience("));
 assert.match(loader,/products/);
 assert.match(loader,/gift_model_snapshot_unavailable/);
 assert.match(loader,/return \{\.\.\.model,tags:\[\.\.\.model.tags\],recipe:\[\.\.\.model.recipe\]\}/);
});

test("Historical premium model defaults and personal scene recipes are separated",()=>{
 const source=read("lib/gifts/repository.ts");
 assert.match(source,/Array\.isArray\(row\.scene_recipe\) && row\.scene_recipe\.length \? row\.scene_recipe : base\.recipe/);
 assert.match(source,/row\.opening_text \|\| base\.opening/);
 assert.match(source,/row\.closing_text \|\| base\.closing/);
 assert.equal(data.products.pareja["premium-v3"].source,"archived-legacy-v5");
 assert.equal(data.products.pareja["premium-v5"].source,"catalog-baseline-20261103");
});

test("Immutable snapshot itself is included in the renderer SHA-256 lock",()=>{
 const lock=JSON.parse(read("lib/gifts/purchased-renderer-lock.json"));
 assert.equal(lock.files["data/purchased-model-snapshots.json"].length,64);
 const verified=verifyLockedRenderers();
 assert.ok(verified.protectedFiles>=17);
});

test("Archived sources are baseline reconstructions, not a claim of exact historic fidelity",()=>{
 assert.match(data.warning,/not been independently validated/);
});
