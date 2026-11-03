import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import ts from "typescript";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const source=read("lib/seven-days-links.ts");
function isolatedSigner(secret){
 const transpiled=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
 }}).outputText;
 const module={exports:{}};
 const context={
  module,exports:module.exports,
  require:(name)=>{
   if(name==="server-only")return {};
   if(name==="node:crypto")return requireCrypto;
   throw Error("Unexpected module "+name);
  },
  process:{env:secret?{SEVEN_DAYS_LINK_SECRET:secret}:{}},
  URL,Buffer
 };
 runInNewContext(transpiled,context);
 return module.exports;
}
import {createHmac,timingSafeEqual} from "node:crypto";
const requireCrypto={createHmac,timingSafeEqual};
const code="a".repeat(18);
const origin="https://tehiceesto.com";

test("Seven private chapter links have seven unique unguessable HMAC tokens",()=>{
 const signer=isolatedSigner("one-unique-private-signing-key-used-only-for-this-test");
 const links=signer.sevenDaysLinks(code,origin);
 assert.equal(links.length,7);
 const tokens=new Set();
 for(let day=1;day<=7;day++){
  const item=links[day-1];
  assert.equal(item.day,day);
  const url=new URL(item.url);
  assert.equal(url.origin,origin);
  assert.match(url.pathname,new RegExp("^/r/"+code+"/dia/"+day+"/[a-f0-9]{64}$"));
  const token=url.pathname.split("/").at(-1);
  assert.equal(signer.validSevenDaysToken(code,day,token),true);
  assert.equal(signer.validSevenDaysToken(code,day===7?1:day+1,token),false);
  assert.equal(signer.validSevenDaysToken("b".repeat(18),day,token),false);
  tokens.add(token);
 }
 assert.equal(tokens.size,7);
 assert.equal(signer.sevenDaysLinks(code,origin)[0].url,links[0].url,"Links must remain stable after reload");
});

test("Fail closed if the signing secret is absent or the URL is tampered with",()=>{
 const unsigned=isolatedSigner(null);
 assert.equal(unsigned.sevenDaysToken(code,1),null);
 assert.throws(()=>unsigned.sevenDaysLinks(code,origin),/seven_days_links_unavailable/);
 const signer=isolatedSigner("a-different-private-test-key");
 assert.equal(signer.validSevenDaysToken(code,0,"0".repeat(64)),false);
 assert.equal(signer.validSevenDaysToken(code,8,"0".repeat(64)),false);
 assert.equal(signer.validSevenDaysToken(code,1,"0".repeat(64)),false);
 assert.equal(signer.validSevenDaysToken(code,1,"not-a-token"),false);
 assert.equal(signer.validSevenDaysToken("not-a-code",1,"0".repeat(64)),false);
});

test("Only Seven Days uses its dedicated share panel and never shows generic media inputs",()=>{
 const studio=read("components/StudioEnhancements.tsx");
 const portal=read("app/mis-regalos/AccountPortal.tsx");
 const panel=read("components/SevenDaysSharePanel.tsx");
 const api=read("app/api/seven-days-links/route.ts");
 assert.ok(studio.includes('gift.experience_slug!=="frasco365" && gift.experience_slug!=="siete-dias"'));
 assert.ok(studio.includes('gift.experience_slug!=="siete-dias" && <ExtraLetterEditor'));
 assert.ok(studio.includes('gift.experience_slug==="siete-dias" && <SevenDaysSharePanel'));
 assert.ok(portal.includes('studioData.experience_slug!=="siete-dias"'));
 assert.ok(panel.includes('validLinks(result?.links,code)'));
 assert.ok(panel.includes('!published&&'));
 assert.ok(api.includes('action:"openStudio"')&&api.includes('sevenDaysLinks(code,origin)'));
});

function mockSevenDaysRoute({secret="test-signing-secret",backendStatus=200,experienceSlug="siete-dias"}={}){
 const routeSource=read("app/api/seven-days-links/route.ts");
 const script=ts.transpileModule(routeSource,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
 }}).outputText;
 const signer=isolatedSigner(secret);
 const mod={exports:{}};
 const calls=[];
 const context={
  module:mod,exports:mod.exports,
  require:(name)=>{
   if(name==="next/server")return {NextResponse:{json:(value,options={})=>
    new Response(JSON.stringify(value),{status:options.status||200,
     headers:{"content-type":"application/json",...(options.headers||{})}})}};
   if(name==="@/lib/seven-days-links")return signer;
   throw Error("Unexpected module "+name);
  },
  process:{env:{NEXT_PUBLIC_SUPABASE_URL:"https://mock.supabase.co",
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"test-public",
   ...(secret?{SEVEN_DAYS_LINK_SECRET:secret}:{})}},
  fetch:async(url,options)=>{
   calls.push({url,body:JSON.parse(options.body)});
   return new Response(JSON.stringify({gift:{experience_slug:experienceSlug,status:"published"}}),
    {status:backendStatus,headers:{"content-type":"application/json"}});
  },
  Request,Response,URL,Buffer,console
 };
 runInNewContext(script,context);
 return {POST:mod.exports.POST,calls};
}
function postRequest(codeValue=code,token="b".repeat(64)){
 return new Request(origin+"/api/seven-days-links",{method:"POST",
  headers:{"content-type":"application/json"},
  body:JSON.stringify({code:codeValue,editorToken:token})});
}

test("The actual Seven Days API signs seven links only after creator-api authenticates the edit token",async()=>{
 const route=mockSevenDaysRoute();
 const response=await route.POST(postRequest());
 assert.equal(response.status,200);
 const result=await response.json();
 assert.equal(result.published,true);
 assert.equal(result.links.length,7);
 assert.equal(route.calls.length,1);
 assert.equal(route.calls[0].body.action,"openStudio");
 assert.equal(route.calls[0].body.code,code);
 assert.equal(route.calls[0].body.editorToken,"b".repeat(64));
 assert.equal(result.links[0].url,isolatedSigner("test-signing-secret").sevenDaysLinks(code,origin)[0].url);
});

test("The Seven Days API rejects bad input, unauthorized owners and other products",async()=>{
 const route=mockSevenDaysRoute();
 const bad=await route.POST(postRequest("not-a-code"));
 assert.equal(bad.status,400);
 assert.equal(route.calls.length,0);
 const unauthorized=mockSevenDaysRoute({backendStatus:403});
 assert.equal((await unauthorized.POST(postRequest())).status,403);
 const other=mockSevenDaysRoute({experienceSlug:"pareja"});
 assert.equal((await other.POST(postRequest())).status,403);
});

test("Without a server signing key the API returns 503 and never fabricates share links",async()=>{
 const route=mockSevenDaysRoute({secret:null});
 const response=await route.POST(postRequest());
 assert.equal(response.status,503);
 assert.equal((await response.json()).error,"unavailable");
});
