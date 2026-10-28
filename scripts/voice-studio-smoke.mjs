import { chromium } from "playwright";

// No personal login or real media uploads: all account/edit/upload endpoints are mocked.
const url = "https://protectorrudo.github.io/tehiceesto/mi-cuenta/";
const browser = await chromium.launch({headless:true,args:["--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream"]});
const context = await browser.newContext({viewport:{width:390,height:844},permissions:["microphone"]});
const page = await context.newPage();
const ops = [];
const base64url = data => Buffer.from(JSON.stringify(data)).toString("base64url");
const fakeAccess = base64url({alg:"HS256",typ:"JWT"})+"."+base64url({sub:"11111111-1111-4111-8111-111111111111",aud:"authenticated",role:"authenticated",exp:Math.floor(Date.now()/1000)+3600})+".sig";
function fakeJson(route, data, status=200) {
  return route.fulfill({status,contentType:"application/json",headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"},body:JSON.stringify(data)});
}
await page.route("**/auth/v1/token?grant_type=password", route => {
  ops.push("login");
  return fakeJson(route,{access_token:fakeAccess,token_type:"bearer",refresh_token:"test",expires_in:3600,user:{id:"11111111-1111-4111-8111-111111111111",email:"demo-test@example.com",aud:"authenticated",role:"authenticated",app_metadata:{provider:"email",providers:["email"]},user_metadata:{},identities:[],created_at:new Date().toISOString()}});
});
await page.route("**/functions/v1/gift-account", route => {
  const body=JSON.parse(route.request().postData() || "{}");
  ops.push("account:"+body.action);
  if(body.action==="list")return fakeJson(route,{gifts:[{code:"a1a2a3a4a5a6a7a8a9",experienceSlug:"mama",templateVersion:"premium-v4",status:"paid",giverName:"Demo",recipientName:"Familia",purchasedAt:new Date().toISOString()}]});
  if(body.action==="open")return fakeJson(route,{editorToken:"mock-valid-editor-token"});
  return fakeJson(route,{ok:true});
});
await page.route("**/functions/v1/creator-api", route => {
  const body=JSON.parse(route.request().postData() || "{}");
  ops.push("creator:"+body.action+(body.mimeType?":"+body.mimeType:""));
  if(body.action==="openStudio")return fakeJson(route,{gift:{experience_slug:"mama",giver_name:"Demo",recipient_name:"Familia",status:"paid",story_data:{},scene_recipe:["intro","voices","finale"]},media:[]});
  if(body.action==="prepareStudioUpload")return fakeJson(route,{path:"a1a2a3a4a5a6a7a8a9/studio-mocked-"+(body.fileName||"audio.webm"),token:"fake-upload-signature",kind:"audio"});
  if(body.action==="registerStudioMedia")return fakeJson(route,{ok:true});
  return fakeJson(route,{ok:true});
});
await page.route("**/functions/v1/guest-voice",route=>{
 const body=JSON.parse(route.request().postData()||"{}");
 ops.push("guest:"+body.action);
 if(body.action==="list")return fakeJson(route,{invites:[]});
 if(body.action==="create")return fakeJson(route,{
   ok:true,id:"00000000-0000-4000-8000-000000000002",
   expiresAt:new Date(Date.now()+14*86400000).toISOString(),maxSubmissions:12,
   url:"https://protectorrudo.github.io/tehiceesto/voz/#t="+"e".repeat(64),
 });
 if(body.action==="revoke")return fakeJson(route,{ok:true});
 return fakeJson(route,{error:"unauthorized"},403);
});
await page.route("**/storage/v1/**", route => {
  ops.push("storage:"+route.request().method());
  return fakeJson(route,{Key:"gift-media/a1a2a3a4a5a6a7a8a9/studio-mocked-voice.webm",key:"gift-media/a1a2a3a4a5a6a7a8a9/studio-mocked-voice.webm"});
});
try{
  const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:35000});
  if(response?.status()!==200)throw Error("Pages HTTP "+response?.status());
  await page.locator("#email").fill("demo-test@example.com");
  await page.locator("#password").fill("test-password");
  await page.locator("#submit").click();
  await page.locator("#gifts .gift").waitFor({timeout:15000});
  await page.getByRole("button",{name:"Editar textos"}).click();
  await page.locator("#voice-start:visible").waitFor({timeout:15000});
  await page.locator("#voice-invite-create").click();
  await page.locator("#voice-invite-result:visible").waitFor({timeout:10000});
  const inviteHref=await page.locator("#voice-invite-url").inputValue();
  if(!inviteHref.startsWith("https://protectorrudo.github.io/tehiceesto/voz/#t="))throw Error("Voice invitation link incorrect");
  const whatsapp=await page.locator("#voice-invite-whatsapp").getAttribute("href");
  if(!whatsapp?.startsWith("https://wa.me/?text="))throw Error("WhatsApp sharing missing");
  if(!ops.includes("guest:create"))throw Error("Owner could not generate voice invite");
  console.log("PASS owner generates guest-only link with WhatsApp share");


  await page.locator("#voice-start").click();
  await page.locator("#voice-active:visible").waitFor({timeout:15000});
  await page.waitForTimeout(1500);
  await page.locator("#voice-stop").click();
  await page.locator("#voice-review:visible").waitFor({timeout:10000});
  const audioSrc=await page.locator("#voice-preview").getAttribute("src");
  if(!audioSrc?.startsWith("blob:"))throw Error("Audio preview did not receive a recorded blob");
  await page.locator("#voice-save").click();
  await page.locator("#voice-start:visible").waitFor({timeout:20000});
  if(!ops.some(x=>x.startsWith("creator:prepareStudioUpload:audio/")))throw Error("Voice upload not prepared");
  if(!ops.some(x=>x.startsWith("creator:registerStudioMedia")))throw Error("Voice upload not registered");
  if(!ops.some(x=>x.startsWith("storage:")))throw Error("Voice upload not sent to Storage");
  console.log("PASS record/preview/save to mocked secured gift");

  await page.locator("#media-file").setInputFiles({name:"whatsapp-nota.opus",mimeType:"application/octet-stream",buffer:Buffer.from("OggSdemo-voice-note")});
  await page.getByText("Archivo whatsapp-nota.opus guardado",{exact:false}).waitFor({timeout:15000});
  if(!ops.includes("creator:prepareStudioUpload:audio/opus"))throw Error("OPUS MIME type not inferred correctly");
  console.log("PASS WhatsApp OPUS import with generic MIME type");

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  if(overflow>2)throw Error("Horizontal overflow "+overflow);
  console.log("PASS mobile layout at 390px");
}catch(error){
  console.error("VOICE_STUDIO_AUDIT_FAILED",error.message);
  console.error("OPERATIONS",ops.map(x=>x.startsWith("login")?"login":x).join(", "));
  await page.screenshot({path:"visual-smoke/account/voice-debug.png",fullPage:true}).catch(()=>{});
  process.exitCode=1;
}finally{await browser.close()}
