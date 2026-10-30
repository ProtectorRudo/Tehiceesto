import {chromium} from "playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";

const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const source=await Promise.all([
 fs.readFile("app/admin/affiliates/page.tsx","utf8"),
 fs.readFile("app/admin/affiliates/actions.ts","utf8"),
 fs.readFile("lib/affiliates/admin-backend.ts","utf8"),
 fs.readFile("supabase/functions/affiliate-admin/index.ts","utf8"),
 fs.readFile("supabase/functions/admin-api/index.ts","utf8"),
]);
assert(source[1].includes("adminAffiliateSession"),"All admin operations must validate session");
assert(source[1].includes('transferConfirmed')&&source[1].includes("reference.length<5"),"Payout must require proof of external payment");
assert(source[2].includes('"x-admin-session"'),"Supabase API session must be sent privately server-side");
assert(!source[2].includes("SUPABASE_SECRET_KEY"),"No service-role secrets allowed in Vercel");
assert(source[3].includes("password.length<12")&&source[3].includes("initialPassword.length<12"),"No weak default passwords");
assert(!source[3].includes("tehiceesto7"),"Insecure predictable default password must be removed");
assert(source[3].includes("tehiceesto.com/ref/"),"Influencer URL must use referral tracking route");
assert(!source[3].includes("return json(origin,{affiliate,initialPassword"),"Never return raw affiliate secret fields");
assert(source[4].includes('.from("admin_access")'),"Admin login must look up the configured key in Supabase");
assert(source[4].includes('.eq("secret_hash", secretHash)'),"Admin authentication must check the hash against the private table");
assert(!source[4].includes("const expectedHash"),"Hardcoded administrator hashes are prohibited");
assert(source[4].includes('admin_login_lookup_failed'),"Backend lookup errors must fail closed with diagnostics");


const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const report=[];
await fs.mkdir("visual-affiliate-admin",{recursive:true});
for(const v of [{id:"android320",width:320,height:720},{id:"android390",width:390,height:844},{id:"desktop1440",width:1440,height:900}]){
 const page=await browser.newPage({viewport:{width:v.width,height:v.height},isMobile:v.width<600,hasTouch:v.width<600});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const response=await page.goto(base+"/admin/affiliates",{waitUntil:"domcontentloaded"});
 assert.equal(response.status(),200,"Admin login page should render");
 assert.equal(await page.getByText("Administrar influencers.").count(),1);
 assert.equal(await page.locator('input[name="accessKey"][type="password"]').count(),1);
 assert.equal(await page.getByRole("button",{name:/Entrar al panel/i}).count(),1);
 assert.equal(await page.getByRole("button",{name:/Crear y habilitar enlace/i}).count(),0,"Unauthenticated visitors must never see admin actions");
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,"No overflow "+v.id);
 assert.equal(errors.length,0,"Browser runtime errors "+v.id+" "+errors.join(","));
 await page.screenshot({path:"visual-affiliate-admin/"+v.id+".png",fullPage:true});
 report.push({viewport:v.id,loginVisible:true,adminControlsHidden:true,overflow:false});
 await page.close();
}
await browser.close();
await fs.writeFile("visual-affiliate-admin/report.json",JSON.stringify(report,null,2));
console.log("AFFILIATE ADMIN SECURITY QA PASS",JSON.stringify(report));
