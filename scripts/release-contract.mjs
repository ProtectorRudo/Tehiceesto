/**
 * Two independent, fail-closed release gates.
 *
 * static: validates permanent purchase URLs and product mapping in source;
 * live: verifies the EXACT published commit, pages and product offer.
 *
 * Does not read any personal data, buy products or require customer secrets.
 */
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {PURCHASED_ROUTE_CONTRACT,LEGACY_PACK_GAME_ROUTES} from "../lib/release/public-route-contract.mjs";
import {verifyLockedRenderers} from "./verify-renderer-lock.mjs";
import {PURCHASED_RENDERERS} from "../lib/gifts/purchased-renderers.mjs";

export const requiredPublicPaths=Object.freeze([
 "/", "/mis-regalos", "/juegos/pack", "/juegos/pack/completo",
 "/juegos/trazo-complice/completo", "/juegos/pack/pedido",
 ...LEGACY_PACK_GAME_ROUTES, "/voz", "/experiencias/dragon-ball-pareja",
 "/comprar/pack-juegos", "/comprar/frasco365",
]);

export function assertStaticReleaseContract(root=process.cwd()){
 verifyLockedRenderers(root);
 const read=(p)=>readFileSync(resolve(root,p),"utf8");
 const required={
  "/mis-regalos":"app/mis-regalos/page.tsx",
  "/r/[code]":"app/r/[code]/page.tsx",
  "/juegos/pack/completo":"app/juegos/pack/completo/page.tsx",
  "/juegos/trazo-complice/completo":"app/juegos/trazo-complice/completo/page.tsx",
  "/juegos/pack/pedido":"app/juegos/pack/pedido/page.tsx",
  "/juegos/entre-dos/completo":"app/juegos/entre-dos/completo/page.tsx",
  "/juegos/complices/completo":"app/juegos/complices/completo/page.tsx",
  "/juegos/meme-match/completo":"app/juegos/meme-match/completo/page.tsx",
  "/voz":"app/voz/page.tsx",
 };
 for(const [route,file] of Object.entries(required)){
  if(!existsSync(resolve(root,file)))throw Error("purchased_route_removed:"+route);
 }
 const receipt=read(required["/juegos/pack/pedido"]);
 if(!receipt.includes("permanentRedirect(PURCHASED_ROUTE_CONTRACT.myGifts)"))
  throw Error("pack_receipt_not_permanent");
 for(const path of LEGACY_PACK_GAME_ROUTES){
  const page=read(required[path]);
  if(!page.includes("permanentRedirect(PURCHASED_ROUTE_CONTRACT.pack)"))
   throw Error("legacy_game_redirect_missing:"+path);
 }
 const pack=read("app/juegos/pack/completo/PackCompleto.tsx");
 const drawing=read("app/juegos/trazo-complice/completo/TrazoCompleto.tsx");
 if(!pack.includes('functions/v1/pack-juegos-content')||
    !drawing.includes('functions/v1/trazo-complice-words'))
   throw Error("purchased_games_missing_entitlement_checks");
 const giftRead=read("supabase/functions/gift-read/index.ts");
 const giftRepository=read("lib/gifts/repository.ts");
 const giftPage=read("app/r/[code]/page.tsx");
 if(!(giftRead.includes("experience_slug,template_version,giver_name")||giftRead.includes("template_version,experience_slug,giver_name"))||
    !giftRepository.includes("purchasedRendererFor(row.experience_slug,row.template_version)")||
    !giftPage.includes("storedGift.rendererFamily"))
   throw Error("purchased_renderer_version_bypass");
 if(Object.keys(PURCHASED_RENDERERS).length<15)
   throw Error("purchased_renderer_registry_incomplete");
 const orderCreate=read("supabase/functions/order-create/index.ts");
 if(!orderCreate.includes('slug==="dragon-ball-pareja"?"dragon-ball-v1"')||
    !orderCreate.includes('template_version:versionForNewGift(experienceSlug)')||
    !orderCreate.includes('scene_recipe:recipes[experienceSlug]'))
   throw Error("purchased_experience_version_not_pinned");
 const migration=read("supabase/migrations/20261103093500_lock_ordered_gift_identity.sql");
 for(const attribute of ["experience_slug","template_version","scene_recipe","public_code"]){
  if(!migration.includes("new."+attribute+" is distinct from old."+attribute))
    throw Error("gift_identity_not_frozen:"+attribute);
 }
 const validator=read("supabase/migrations/20261103095000_validate_specialized_template_on_insert.sql");
 const specialized={
  "dragon-ball-pareja":"dragon-ball-v1",
  "pack-juegos":"pack-v1",
  "trazo-complice":"trazo-v1",
  "sticker-bomb-amistad":"sticker-bomb-v2",
  "club-amigos":"club-v1",
  "frasco365":"jar365-v1",
  "siete-dias":"seven-days-v1",
 };
 for(const [slug,version] of Object.entries(specialized)){
  if(!validator.includes("when '"+slug+"' then '"+version+"'"))
   throw Error("specialized_purchase_not_pinned:"+slug);
 }
 if(!validator.includes("message='specialized_template_mismatch'"))
   throw Error("specialized_template_mismatch_not_rejected");
 if(PURCHASED_ROUTE_CONTRACT.pack!=="/juegos/pack/completo" ||
    PURCHASED_ROUTE_CONTRACT.giftPrefix!=="/r/" ||
    PURCHASED_ROUTE_CONTRACT.myGifts!=="/mis-regalos")
   throw Error("permanent_public_urls_changed");
 return {checkedRoutes:Object.keys(required).length,products:"immutable",models:"pinned"};
}

function assertion(ok,code){if(!ok)throw Error(code)}

export async function checkLiveRelease({origin,expectedSha,fetchImpl=fetch}){
 assertion(/^https:\/\/[a-z0-9.-]+(?::443)?\/?$/i.test(origin||""),"invalid_release_origin");
 assertion(/^[a-f0-9]{40}$/i.test(expectedSha||""),"invalid_expected_sha");
 const root=origin.replace(/\/$/,"");
 const get=async(path)=>{
  const ctrl=new AbortController();
  const timeout=setTimeout(()=>ctrl.abort(),15000);
  try{return await fetchImpl(root+path,{redirect:"follow",cache:"no-store",signal:ctrl.signal,
    headers:{"Cache-Control":"no-cache","User-Agent":"TeHiceEsto-Release-Guard/1.0"}});}
  finally{clearTimeout(timeout);}
 };
 const version=await get("/api/version");
 assertion(version.status===200,"version_endpoint_http_"+version.status);
 const metadata=await version.json();
 assertion(metadata?.service==="tehiceesto","wrong_application_served");
 assertion(metadata?.commit===expectedSha, "stale_or_wrong_release:"+String(metadata?.commit));
 for(const path of requiredPublicPaths){
  const result=await get(path);
  assertion(result.status===200, "broken_permanent_route:"+path+":http_"+result.status);
  assertion(result.headers.get("content-type")?.includes("text/html"),
    "not_html_route:"+path);
  if(path==="/"){
   const html=await result.text();
   assertion(html.includes("4 JUEGOS")&&html.includes("$25.000"),"outdated_pack_offer");
   assertion(!html.includes("3 JUEGOS")&&!html.includes("$1.000"),"outdated_trial_price");
   assertion(!html.includes("Sticker Bomb"),"withdrawn_model_on_home");
  }else if(path==="/juegos/pack/pedido"){
   assertion(new URL(result.url).pathname==="/mis-regalos",
     "receipt_does_not_reach_account");
  }else if(LEGACY_PACK_GAME_ROUTES.includes(path)){
   assertion(new URL(result.url).pathname==="/juegos/pack/completo",
     "legacy_game_not_canonical:"+path);
  }
 }
 // Protect customer privacy: unknown gifts must never be treated as demos.
 const invalidGift=await get("/r/000000000000000000");
 assertion(invalidGift.status===404,"unknown_gift_looks_published");
 const withdrawn=await get("/comprar/sticker-bomb-amistad");
 assertion(withdrawn.status===404,"withdrawn_model_is_buyable");
 return {origin:root,expectedSha,checkedRoutes:requiredPublicPaths.length+2};
}

if(process.argv[1]&&new URL(import.meta.url).pathname===resolve(process.argv[1])){
 const [mode,origin,sha]=process.argv.slice(2);
 try{
  const result=mode==="--static"?assertStaticReleaseContract()
    :mode==="--live"?await checkLiveRelease({origin,expectedSha:sha})
    :(()=>{throw Error("mode_must_be_--static_or_--live")})();
  console.log(JSON.stringify({status:"PASS",...result}));
 }catch(error){console.error("RELEASE_BLOCKED",error.message);process.exitCode=1;}
}
