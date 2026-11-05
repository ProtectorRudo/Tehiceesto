import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {referralLandingUrl,REFERRAL_PUBLIC_ORIGIN} from "../lib/affiliates/referral-landing.mjs";

test("Production referral behind legacy Vercel rewrite keeps the public commerce domain",()=>{
 assert.equal(REFERRAL_PUBLIC_ORIGIN,"https://tehiceesto.com");
 assert.equal(referralLandingUrl("/comprar/pareja","https://tehiceesto.vercel.app/ref/ailin","production").href,
  "https://tehiceesto.com/comprar/pareja");
 assert.equal(referralLandingUrl("/comprar/pareja","https://tehiceesto-123-protector-rudo-s-projects.vercel.app/ref/ailin","production").href,
  "https://tehiceesto.com/comprar/pareja");
});

test("Preview and local affiliate checks remain same-origin",()=>{
 assert.equal(referralLandingUrl("/","http://127.0.0.1:3000/ref/invalid","").href,
  "http://127.0.0.1:3000/");
 assert.equal(referralLandingUrl("/comprar/pareja","https://tehiceesto-preview.vercel.app/ref/ailin","preview").href,
  "https://tehiceesto-preview.vercel.app/comprar/pareja");
});

test("Encoded product queries survive without permitting external redirect targets",()=>{
 assert.equal(referralLandingUrl("/comprar/pareja?src=piloto","https://internal.vercel.app/ref/ailin","production").href,
  "https://tehiceesto.com/comprar/pareja?src=piloto");
 assert.equal(referralLandingUrl("//malicious.example","https://internal.vercel.app/ref/ailin","production").href,
  "https://tehiceesto.com/");
 assert.equal(referralLandingUrl("/\\malicious.example","https://internal.vercel.app/ref/ailin","production").href,
  "https://tehiceesto.com/");
});

test("Actual referral route uses environment-aware redirect without dropping tracking",()=>{
 const source=readFileSync(new URL("../app/ref/[code]/route.ts",import.meta.url),"utf8");
 assert.match(source,/referralLandingUrl\(to,req\.url,process\.env\.VERCEL_ENV\)/);
 assert.match(source,/response\.cookies\.set\(ATTRIBUTION_COOKIE,rawToken,opts\)/);
 assert.match(source,/action:"track"/);
});
