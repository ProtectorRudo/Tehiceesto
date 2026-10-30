import {chromium} from "playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";

const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
for(const viewport of [{label:"android-360",width:360,height:740},{label:"mobile-390",width:390,height:844},{label:"desktop-1440",width:1440,height:900}]){
 const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},isMobile:viewport.width<600,hasTouch:viewport.width<600});
 const errors=[];page.on("pageerror",error=>errors.push(error.message));
 const response=await page.goto(base+"/afiliados",{waitUntil:"domcontentloaded"});
 assert.equal(response.status(),200,"Influencer login must be public");
 await page.getByRole("heading",{name:/Tu impacto/i}).waitFor();
 assert.equal(await page.getByLabel("Email").count(),1);
 assert.equal(await page.getByLabel("Contraseña").count(),1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2),false,"No overflow on "+viewport.label);
 assert.equal(errors.length,0,"Browser exceptions "+errors.join(";"));
 results.push({viewport:viewport.label,affiliateLogin:true,responsive:true});
 await page.close();
}
const page=await browser.newPage();
const invalid=await page.goto(base+"/ref/no-existe-prueba-999",{waitUntil:"domcontentloaded"});
assert.equal(invalid.status(),200,"Invalid referral should redirect safely to home");
assert.equal(new URL(page.url()).pathname,"/","Unknown referral safely returns home, independent of localhost hostname");
assert.equal((await page.context().cookies()).filter(c=>c.name==="thi_ref").length,0,"Unknown referrals must not set attribution");
const bad=await page.request.post(base+"/api/checkout",{data:{experienceSlug:"pareja"}});
assert.equal(bad.status(),400,"Reject invalid checkout data without creating an order");
const origin=await page.request.post(base+"/api/checkout",{headers:{origin:"https://malicious.example"},data:{}});
assert.equal(origin.status(),403,"Cross-origin checkout proxy must reject forged requests");
const get=await page.request.get(base+"/api/checkout");
assert.equal(get.status(),405,"Checkout proxy should not accept GET");
const files=[
 "components/QuickCheckout.tsx",
 "app/ref/[code]/route.ts",
 "app/api/checkout/route.ts",
 "app/afiliados/page.tsx",
 "app/afiliados/actions.ts",
 "lib/affiliates/backend.ts",
];
const text=await Promise.all(files.map(f=>fs.readFile(f,"utf8")));
assert.match(text[0],/fetch\("\/api\/checkout"/,"Checkout must call first-party API");
assert.match(text[1],/action:"track"/,"Referral must record a visit");
assert.match(text[2],/req\.cookies\.get\(ATTRIBUTION_COOKIE\)/,"Server should obtain attribution from HttpOnly cookie");
assert.match(text[2],/affiliateToken:token/,"The server should attach the attribution token");
assert.match(text[3],/getAffiliateDashboard/,"Influencer dashboard must use working Supabase affiliate public API");
assert.match(text[4],/path:"\/afiliados",maxAge:0/,"Logout should delete same-path session cookie");
assert.match(text[5],/affiliate-public/,"New panel uses active Supabase functions");
assert.equal(text[0].includes("affiliateToken:"),false,"Browser must never set an arbitrary affiliate token");
const [affiliatePublic,orderCreate]=await Promise.all([
 fs.readFile("supabase/functions/affiliate-public/index.ts","utf8"),
 fs.readFile("supabase/functions/order-create/index.ts","utf8"),
]);
assert.match(affiliatePublic,/if\(action==="track"\)/,"Referral tracker must remain versioned in GitHub");
assert.match(affiliatePublic,/link\.status!=="active"/,"Disabled referral links must not be tracked");
assert.match(affiliatePublic,/30\*24\*60\*60\*1000/,"Referral lifetime must remain 30 days");
assert.match(affiliatePublic,/token_hash:tokenHash/,"Referral tokens must be stored as hashes");
assert.match(orderCreate,/\.gt\("expires_at",now\)/,"Expired attribution must not create commission credit");
assert.match(orderCreate,/commission_bps_snapshot:/,"Attribution must retain the sale-time commission percentage");

results.push({case:"invalid referral",safe:true},{case:"checkout CSRF & invalid payload",safe:true},{case:"attribution contract",passed:true});
await browser.close();
await fs.mkdir("affiliate-qa",{recursive:true});
await fs.writeFile("affiliate-qa/results.json",JSON.stringify(results,null,2));
console.log("AFFILIATE / CHECKOUT AUDIT PASS "+JSON.stringify(results));
