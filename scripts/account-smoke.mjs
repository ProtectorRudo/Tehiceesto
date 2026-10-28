import { chromium } from "playwright";
import fs from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const external = "https://protectorrudo.github.io/tehiceesto/mi-cuenta/";
const project = "https://efvvadfxuyieswdqnsjg.supabase.co";
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const images = "visual-smoke/account";
await fs.mkdir(images,{recursive:true});
const browser=await chromium.launch({headless:true});
let failures=0;
async function run(label,callback){
  try{await callback();console.log("PASS "+label);}
  catch(error){failures++;console.error("FAIL "+label+": "+error.message);}
}
for(const viewport of [{width:390,height:844,name:"mobile"},{width:1360,height:920,name:"desktop"}]){
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1});
  await run("Next portal login "+viewport.name,async()=>{
    await page.goto(base+"/mis-regalos",{waitUntil:"domcontentloaded",timeout:35000});
    await page.getByRole("heading",{name:"Qué lindo verte de nuevo."}).waitFor({timeout:25000});
    if(await page.locator('input[type="password"]').count()!==1)throw new Error("password field missing");
    await page.getByRole("button",{name:"Crear cuenta"}).click();
    await page.getByRole("heading",{name:"Creá tu cuenta"}).waitFor();
    if(await page.locator('input[type="password"]').count()!==2)throw new Error("password confirmation missing");
    await page.getByRole("button",{name:"Olvidé mi contraseña"}).count().then(count=>{if(count!==0)throw Error("Recovery controls should not appear while signing up")});
    await page.getByRole("button",{name:"Entrar",exact:true}).click();
    await page.getByRole("button",{name:"Olvidé mi contraseña"}).click();
    await page.getByRole("heading",{name:"Recuperá tu contraseña"}).waitFor();
    if(await page.locator('input[type="password"]').count()!==0)throw new Error("recovery should not ask for password");
    await page.getByRole("button",{name:"Prefiero usar mi contraseña"}).click();
    await page.getByRole("button",{name:"Entrar sin contraseña"}).click();
    await page.getByRole("heading",{name:"Entrá desde tu correo"}).waitFor();
    const width=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    if(width>2)throw new Error("horizontal overflow "+width+"px");
    await page.screenshot({path:images+"/next-"+viewport.name+".png",fullPage:true});
  });
  await page.close();
}
await run("GitHub Pages independent portal rendering and JavaScript interaction",async()=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const response=await page.goto(external,{waitUntil:"domcontentloaded",timeout:35000});
  if(response?.status()!==200)throw new Error("HTTP "+response?.status());
  const contentType = response.headers()["content-type"] || "";
  const bodySample = (await page.content()).slice(0,650);
  console.log("EDGE_CONTENT_TYPE="+contentType+" EDGE_URL="+page.url()+" DOM_SAMPLE="+bodySample.replace(/\s+/g," ").slice(0,420));
  await page.screenshot({path:images+"/pages-debug.png",fullPage:true});
  await page.locator("#auth-form").waitFor({timeout:15000});
  await page.getByRole("button",{name:"Crear cuenta"}).click();
  await page.getByRole("heading",{name:"Creá tu cuenta"}).waitFor({timeout:15000});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  if(overflow>2)throw new Error("Pages mobile horizontal overflow "+overflow+"px");
  const guestAccess=await page.evaluate(async ({project,key})=>{
    const response=await fetch(project+"/functions/v1/gift-account",{
      method:"POST",headers:{"apikey":key,"content-type":"application/json"},
      body:JSON.stringify({action:"list"}),
    });
    return {status:response.status,payload:await response.json()};
  },{project,key:publicKey});
  if(guestAccess.status!==401||guestAccess.payload.error!=="account_unauthorized")
    throw new Error("Browser CORS/guest authorization failure "+guestAccess.status);
  console.log("PAGES_CORS_AND_GUEST_DENIAL_PASS");
  if(!(await page.locator("#media-file").count()))throw new Error("media editor missing");
  await page.screenshot({path:images+"/pages-mobile.png",fullPage:true});
  await page.close();
});

await run("Legacy link type mismatch retries recovery and displays resend form",async()=>{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const types=[];
 await page.route("**/auth/v1/verify",async route=>{
   const body=JSON.parse(route.request().postData()||"{}");
   types.push(String(body.type||""));
   await route.fulfill({status:403,contentType:"application/json",body:JSON.stringify({code:"otp_expired",msg:"One-time token not found"})});
 });
 await page.goto(external+"#token_hash="+"f".repeat(64)+"&type=magiclink",{waitUntil:"domcontentloaded",timeout:35000});
 await page.getByText("No pudimos validar ese enlace.",{exact:false}).waitFor({timeout:18000});
 if(types.join(",")!=="magiclink,recovery")throw Error("Expected verification fallback, observed "+types.join(","));
 if(!await page.getByRole("heading",{name:"Entrá desde tu correo"}).isVisible())throw Error("Resend mode was not activated");
 if(await page.locator("input[type=password]:visible").count())throw Error("Password prompt incorrectly visible");
 if(page.url().includes("token_hash"))throw Error("Sensitive fragment not removed");
 await page.close();
});
await run("New recovery link uses correct token type",async()=>{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const types=[];
 await page.route("**/auth/v1/verify",async route=>{
   const body=JSON.parse(route.request().postData()||"{}");
   types.push(String(body.type||""));
   await route.fulfill({status:403,contentType:"application/json",body:JSON.stringify({code:"otp_expired",msg:"One-time token not found"})});
 });
 await page.goto(external+"#token_hash="+"a".repeat(64)+"&type=recovery",{waitUntil:"domcontentloaded",timeout:35000});
 await page.getByText("No pudimos validar ese enlace.",{exact:false}).waitFor({timeout:18000});
 if(types.join(",")!=="recovery")throw Error("Expected only recovery verification, observed "+types.join(","));
 await page.close();
});

await run("Account list requires signed-in user",async()=>{
  if(!publicKey)throw Error("missing public test key");
  const response=await fetch(project+"/functions/v1/gift-account",{method:"POST",headers:{"apikey":publicKey,"content-type":"application/json"},body:JSON.stringify({action:"list"})});
  const payload=await response.json();
  if(response.status!==401||payload.error!=="account_unauthorized")throw Error("unauthorized list returned "+response.status);
});
await browser.close();
if(failures)process.exit(1);
console.log("ACCOUNT_AUDIT_PASSED");
