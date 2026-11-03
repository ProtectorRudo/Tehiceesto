import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assertStaticReleaseContract,checkLiveRelease,requiredPublicPaths} from "../scripts/release-contract.mjs";
import {PURCHASED_ROUTE_CONTRACT,LEGACY_PACK_GAME_ROUTES} from "../lib/release/public-route-contract.mjs";

const sha="a".repeat(40);
const home="TE HICE ESTO · 4 JUEGOS · $25.000";
const fetchMock=(patch={})=>async(url)=>{
 const path=new URL(url).pathname;
 const modified=patch[path];
 const status=modified?.status ?? (path==="/r/000000000000000000"||path==="/comprar/sticker-bomb-amistad"?404:200);
 const value=modified?.body??(path==="/api/version"?{service:"tehiceesto",commit:sha}:home);
 const body=typeof value==="string"?value:JSON.stringify(value);
 const response=new Response(body,{status,headers:{"content-type":path==="/api/version"?"application/json":"text/html"}});
 const finalPath=path==="/juegos/pack/pedido"?PURCHASED_ROUTE_CONTRACT.myGifts:
   LEGACY_PACK_GAME_ROUTES.includes(path)?PURCHASED_ROUTE_CONTRACT.pack:path;
 Object.defineProperty(response,"url",{value:new URL(finalPath,url).href});
 return response;
};

test("Every old purchase URL, backed renderer and checkout identity remains present",()=>{
 const report=assertStaticReleaseContract();
 assert.ok(report.checkedRoutes>=9);
 assert.equal(PURCHASED_ROUTE_CONTRACT.pack,"/juegos/pack/completo");
});

test("Both product version and share code are immutable once an order is created",()=>{
 const sql=readFileSync(new URL("../supabase/migrations/20261103093500_lock_ordered_gift_identity.sql",import.meta.url),"utf8");
 assert.match(sql,/exists \(select 1 from public\.orders where gift_id = old\.id\)/);
 assert.match(sql,/exists \(select 1 from public\.gift_upsells where addon_gift_id = old\.id\)/);
 assert.match(sql,/before update of experience_slug, template_version, scene_recipe, public_code/);
 assert.match(sql,/raise exception using/);
});

test("A healthy release passes all permanent routes and original purchase identity",async()=>{
 const passed=await checkLiveRelease({origin:"https://tehiceesto.com",expectedSha:sha,fetchImpl:fetchMock()});
 assert.equal(passed.checkedRoutes,requiredPublicPaths.length+2);
});

test("A stale deployment is rejected even if the pages still respond HTTP 200",async()=>{
 await assert.rejects(checkLiveRelease({origin:"https://tehiceesto.com",expectedSha:sha,
  fetchImpl:fetchMock({"/api/version":{body:{service:"tehiceesto",commit:"b".repeat(40)}}})}),
  /stale_or_wrong_release/);
});

test("A wrong application or website is rejected instead of marking the deployment READY",async()=>{
 await assert.rejects(checkLiveRelease({origin:"https://tehiceesto.com",expectedSha:sha,
  fetchImpl:fetchMock({"/api/version":{body:{service:"viralio",commit:sha}}})}),
  /wrong_application_served/);
});

test("Broken purchased game routes block release",async()=>{
 await assert.rejects(checkLiveRelease({origin:"https://tehiceesto.com",expectedSha:sha,
  fetchImpl:fetchMock({"/juegos/pack/completo":{status:404}})}),
  /broken_permanent_route/);
});

test("A receipt sent to customers must still redirect into their account",async()=>{
 const mock=fetchMock();
 await assert.rejects(checkLiveRelease({origin:"https://tehiceesto.com",expectedSha:sha,
  fetchImpl:async(url)=>{const res=await mock(url);
    if(new URL(url).pathname==="/juegos/pack/pedido")Object.defineProperty(res,"url",{value:url});
    return res;}}),/receipt_does_not_reach_account/);
});

test("Old pack pricing and withdrawn products block releases",async()=>{
 await assert.rejects(checkLiveRelease({origin:"https://tehiceesto.com",expectedSha:sha,
  fetchImpl:fetchMock({"/":{body:"3 JUEGOS · $1.000"}})}),/outdated_pack_offer/);
});
test("A nonexistent gift must never show a generic demo or another buyer's purchase",async()=>{
 await assert.rejects(checkLiveRelease({origin:"https://tehiceesto.com",expectedSha:sha,
  fetchImpl:fetchMock({"/r/000000000000000000":{status:200}})}),
  /unknown_gift_looks_published/);
});
