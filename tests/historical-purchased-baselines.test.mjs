import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import {purchasedRendererFor,PURCHASED_RENDERERS} from "../lib/gifts/purchased-renderers.mjs";

function loadTS(path,imports={}){
 const text=readFileSync(new URL("../"+path,import.meta.url),"utf8");
 const transpiled=ts.transpileModule(text,{
   compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
 }).outputText;
 const module={exports:{}};
 vm.runInNewContext(transpiled,{
   exports:module.exports,module,
   require:name=>{
     if(!(name in imports))throw Error("unexpected_test_import:"+name);
     return imports[name];
   }
 },{timeout:2500});
 return module.exports;
}
const locked=loadTS("data/purchased-experiences-20261103.ts");
const archived=loadTS("components/legacy-v5/data.ts");
const resolver=loadTS("lib/gifts/purchased-experience-baseline.ts",{
 "@/data/purchased-experiences-20261103":locked,
 "@/components/legacy-v5/data":archived,
 "@/lib/gifts/purchased-renderers.mjs":{purchasedRendererFor},
});

test("Old v3 and v4 gifts resolve from the archived source; v5 remains the frozen sales baseline",()=>{
 for(const version of ["premium-v3","premium-v4"]){
   const original=archived.getExperience("pareja");
   const result=resolver.purchasedExperienceBaseline("pareja",version);
   assert.equal(result.title,original.title);
   assert.equal(result.opening,original.opening);
   assert.equal(JSON.stringify(result.recipe),JSON.stringify(original.recipe));
 }
 const latest=resolver.purchasedExperienceBaseline("pareja","premium-v5");
 assert.equal(latest.title,locked.getExperience("pareja").title);
 assert.equal(JSON.stringify(latest.recipe),JSON.stringify(locked.getExperience("pareja").recipe));
 assert.notEqual(JSON.stringify(latest.recipe),JSON.stringify(resolver.purchasedExperienceBaseline("pareja","premium-v3").recipe));
});

test("All 21 known purchased combinations resolve; specialty versions never convert into generic gifts",()=>{
 let n=0;
 for(const [slug,versions] of Object.entries(PURCHASED_RENDERERS)){
  for(const version of Object.keys(versions)){
   const model=resolver.purchasedExperienceBaseline(slug,version);
   assert.equal(model.slug,slug);
   assert.ok(model.title?.length>0);
   assert.ok(model.recipe.length>0);
   n++;
  }
 }
 assert.equal(n,21);
 assert.equal(resolver.purchasedExperienceBaseline("dragon-ball-pareja","dragon-ball-v1").slug,"dragon-ball-pareja");
 assert.throws(()=>resolver.purchasedExperienceBaseline("dragon-ball-pareja","premium-v3"),/gift_renderer_version_unavailable/);
 assert.throws(()=>resolver.purchasedExperienceBaseline("pareja","premium-v88"),/gift_renderer_version_unavailable/);
});

test("A returned purchased baseline cannot mutate the frozen source for the next buyer",()=>{
 const first=resolver.purchasedExperienceBaseline("pareja","premium-v3");
 const originalLength=first.recipe.length;
 first.tags.push("added");
 first.recipe.splice(0,1);
 const second=resolver.purchasedExperienceBaseline("pareja","premium-v3");
 assert.equal(second.recipe.length,originalLength);
 assert.ok(!second.tags.includes("added"));
 assert.equal(second.recipe[0],archived.getExperience("pareja").recipe[0]);
});

test("Gift repository selects frozen per-version baseline, not a public catalogue model",()=>{
 const source=readFileSync(new URL("../lib/gifts/repository.ts",import.meta.url),"utf8");
 assert.match(source,/purchasedExperienceBaseline\(row\.experience_slug,row\.template_version\)/);
 assert.doesNotMatch(source,/getExperience\(row\.experience_slug\)/);
});
