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
