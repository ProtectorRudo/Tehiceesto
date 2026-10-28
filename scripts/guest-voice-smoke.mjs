import { chromium } from "playwright";
import fs from "node:fs/promises";

const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"";
const project="https://efvvadfxuyieswdqnsjg.supabase.co";
const url=(process.env.TEST_BASE_URL||"http://127.0.0.1:3000")+"/voz";
const inviteToken="c".repeat(64);
let failures=0;
async function test(name,fn){try{await fn();console.log("PASS "+name)}catch(e){failures++;console.error("FAIL "+name+" "+e.message)}}
await fs.mkdir("visual-smoke/account",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream"]});
await test("Unauthenticated users cannot create/list/revoke invites",async()=>{
  if(!key)throw Error("missing publishable key");
  for(const action of ["create","list","revoke"]){
    const response=await fetch(project+"/functions/v1/guest-voice",{method:"POST",headers:{"apikey":key,"content-type":"application/json"},
      body:JSON.stringify({action,code:"1234567890abcdef12",inviteToken})});
    const value=await response.json();
    if(response.status!==403||value.error!=="owner_unauthorized")throw Error(action+" allowed "+response.status);
  }
  const response=await fetch(project+"/functions/v1/guest-voice",{method:"POST",headers:{"apikey":key,"content-type":"application/json"},
    body:JSON.stringify({action:"status",inviteToken})});
  if(response.status!==404)throw Error("fake guest token accepted");
  console.log("GUEST_VOICE_ISOLATION_OK");
});
await test("Invited person sees voice-only recorder, can listen then send with no login",async()=>{
  const ctx=await browser.newContext({viewport:{width:390,height:844},permissions:["microphone"]});
  const page=await ctx.newPage();
  const actions=[];
  const json=(route,payload,status=200)=>route.fulfill({status,contentType:"application/json",headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"},body:JSON.stringify(payload)});
  await page.route("**/functions/v1/guest-voice",route=>{
    const body=JSON.parse(route.request().postData()||"{}");actions.push(body.action);
    if(body.inviteToken!==inviteToken)return json(route,{error:"invite_unavailable"},404);
    if(body.action==="status")return json(route,{ok:true,remaining:12,expiresAt:new Date(Date.now()+86400000).toISOString()});
    if(body.action==="prepare")return json(route,{uploadId:"00000000-0000-4000-8000-000000000001",path:"1234567890abcdef12/guest-voice-test.mp4",token:"signed-upload-test"});
    if(body.action==="finish")return json(route,{ok:true,saved:true});
    return json(route,{error:"action_not_allowed"},400);
  });
  await page.route("**/storage/v1/**",route=>json(route,{Key:"gift-media/voice-test"}));
  const response=await page.goto(url+"#t="+inviteToken,{waitUntil:"domcontentloaded",timeout:35000});
  if(response?.status()!==200)throw Error("HTTP "+response?.status());
  await page.getByRole("button",{name:"Empezar a grabar"}).waitFor({timeout:18000});
  if(page.url().includes("t="+inviteToken))throw Error("guest token still visible in URL");
  const forbidden=await page.getByText(/editar regalo|publicar regalo|mis regalos|cambiar textos|fotos/i).count();
  if(forbidden)throw Error("Editing/account controls exposed to guest");
  await page.getByRole("button",{name:"Empezar a grabar"}).click();
  await page.getByRole("button",{name:"Detener grabación"}).waitFor({timeout:10000});
  await page.waitForTimeout(1300);
  await page.getByRole("button",{name:"Detener grabación"}).click();
  await page.getByRole("button",{name:"Enviar mi voz"}).waitFor({timeout:12000});
  if(!(await page.locator('audio[aria-label="Escuchar mi voz"]').getAttribute("src"))?.startsWith("blob:"))throw Error("voice preview missing");
  await page.locator("#guest-speaker").fill("Tía de prueba");
  await page.getByRole("button",{name:"Enviar mi voz"}).click();
  await page.getByRole("heading",{name:"Tu voz ya es parte de esta historia."}).waitFor({timeout:16000});
  if(actions.join(",")!=="status,prepare,finish")throw Error("guest actions "+actions);
  const horizontal=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  if(horizontal>2)throw Error("mobile horizontal overflow");
  await page.screenshot({path:"visual-smoke/account/guest-voice-success-mobile.png",fullPage:true});
  await ctx.close();
});
await test("Expired invite is blocked before microphone access",async()=>{
  const page=await browser.newPage();
  await page.route("**/functions/v1/guest-voice",route=>route.fulfill({status:404,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:JSON.stringify({error:"invite_unavailable"})}));
  await page.goto(url+"#t="+inviteToken,{waitUntil:"domcontentloaded",timeout:35000});
  await page.getByRole("heading",{name:"Esta invitación ya no está disponible."}).waitFor({timeout:18000});
  if(await page.getByRole("button",{name:"Empezar a grabar"}).count())throw Error("revoked invite can record");
  await page.close();
});
await browser.close();
if(failures)process.exit(1);
console.log("GUEST_VOICE_AUDIT_PASSED");
