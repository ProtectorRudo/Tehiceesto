import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const bridge=read("supabase/functions/tehiceesto-seven-days-day01-safe-html/index.ts");
const original=read("public/siete-dias/dia-01.html");

test("Temporary bridge pins only the approved day 1 HTML, byte-for-byte",()=>{
 const hash=createHash("sha256").update(original).digest("hex");
 assert.equal(hash,"76ede7f8995a652aa6d35511b5c8fb03178be2f59dbbd56603c8d1eb37e4b1ec");
 assert.ok(bridge.includes(hash));
 assert.match(bridge,/\/904b2ce4cb459a117caf6a30116c7a82341bf54a\/public\/siete-dias\/dia-01\.html/);
 assert.match(original,/Mimo · day 01/);
});
test("HTML bridge is GET/HEAD only, checks source integrity, and returns HTML not a sandboxed source-code page",()=>{
 assert.match(bridge,/req\.method!=="GET"&&req\.method!=="HEAD"/);
 assert.match(bridge,/crypto\.subtle\.digest\("SHA-256",content\)/);
 assert.match(bridge,/digest!==EXPECTED_SHA256/);
 assert.match(bridge,/"content-type":"text\/html; charset=utf-8"/);
 assert.match(bridge,/cache-control/);
 assert.match(bridge,/req\.method==="HEAD"\?null:content\.slice\(\)/);
 assert.doesNotMatch(bridge,/content-security-policy.*default-src.*none/);
 assert.doesNotMatch(bridge,/Deno\.env\.get|SUPABASE_SECRET|service_role|Authorization/);
});
