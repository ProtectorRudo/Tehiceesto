import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isAllowedCheckoutOrigin} from "../lib/checkout/allowed-origins.mjs";

const native="https://tehiceesto.vercel.app";
const legacyProxy="https://viralio-five.vercel.app";

test("The commercial checkout accepts its real customer origin behind both Vercel host rewrites",()=>{
 for(const commercial of ["https://tehiceesto.com","https://www.tehiceesto.com"]){
  assert.equal(isAllowedCheckoutOrigin(commercial,native,"production"),true);
  assert.equal(isAllowedCheckoutOrigin(commercial,legacyProxy,"production"),true);
 }
 assert.equal(isAllowedCheckoutOrigin(native,native,"production"),true);
});

test("Own Vercel previews remain usable without trusting every vercel.app website",()=>{
 const preview="https://tehiceesto-2rx23iasz-protector-rudo-s-projects.vercel.app";
 assert.equal(isAllowedCheckoutOrigin(preview,preview,"production"),true);
 assert.equal(isAllowedCheckoutOrigin("https://attacker.vercel.app",native,"production"),false);
 assert.equal(isAllowedCheckoutOrigin("https://attacker.vercel.app",legacyProxy,"production"),false);
});

test("Other sites and deceptive domain lookalikes remain forbidden",()=>{
 for(const foreign of [
  "https://evil.example","https://tehiceesto.com.attacker.example",
  "http://tehiceesto.com","https://tehiceesto.com/","null","",
  "https://evil.example@tehiceesto.com","https://tehiceesto.com:444",
  "https://tehiceesto.com?foo=bar",
 ]){
  assert.equal(isAllowedCheckoutOrigin(foreign,native,"production"),false,foreign);
 }
});

test("Localhost is accepted only when same-origin in development",()=>{
 assert.equal(isAllowedCheckoutOrigin("http://localhost:3000","http://localhost:3000","development"),true);
 assert.equal(isAllowedCheckoutOrigin("http://localhost:3000",native,"production"),false);
 assert.equal(isAllowedCheckoutOrigin("http://evil.example","http://evil.example","development"),false);
});

test("No Origin header maintains legacy direct-client compatibility",()=>{
 assert.equal(isAllowedCheckoutOrigin(null,native,"production"),true);
});

test("Checkout keeps strict Fetch Metadata, consent, idempotency and trusted attribution controls",()=>{
 const route=readFileSync(new URL("../app/api/checkout/route.ts",import.meta.url),"utf8");
 assert.match(route,/isAllowedCheckoutOrigin\(origin,req\.nextUrl\.origin,process\.env\.NODE_ENV\)/);
 assert.match(route,/fetchSite!=="same-origin"&&fetchSite!=="none"/);
 assert.match(route,/consent!==true/);
 assert.match(route,/clientRequestId\.length>64/);
 assert.match(route,/ATTRIBUTION_COOKIE/);
 assert.match(route,/order-create/);
});
