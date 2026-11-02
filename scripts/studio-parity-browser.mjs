import {chromium} from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const slugs=["pareja","cumpleanos","mama","papa","amistad","dragon-ball-pareja","sticker-bomb-amistad","siete-dias","frasco365"];
const codes=Object.fromEntries(slugs.map((slug,i)=>[String(i+1).padStart(16,"0"),slug]));
const gifts=Object.entries(codes).map(([code,experienceSlug])=>({
 code,experienceSlug,status:"paid",templateVersion:"premium",
 giverName:"Remitente QA",recipientName:"Destinataria QA",
 purchasedAt:"2026-11-01T00:00:00Z",publishedAt:null
}));
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nxs8AAAAASUVORK5CYII=","base64");
const api="https://mock.supabase.co";
const ops=[];
const stored=new Map();
const b64=v=>Buffer.from(JSON.stringify(v)).toString("base64url");
const auth=b64({alg:"HS256",typ:"JWT"})+"."+b64({sub:"11111111-1111-4111-8111-111111111111",aud:"authenticated",role:"authenticated",exp:Math.floor(Date.now()/1000)+3600})+".fake";
const user={id:"11111111-1111-4111-8111-111111111111",email:"qa-studio@example.com",aud:"authenticated",role:"authenticated",app_metadata:{provider:"email",providers:["email"]},user_metadata:{},identities:[],created_at:"2026-11-01T00:00:00Z"};
function ok(route,data,status=200){return route.fulfill({status,contentType:"application/json",headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*"},body:JSON.stringify(data)})}
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
await fs.mkdir("visual-smoke/studio-parity",{recursive:true});
try{
 for(const viewport of [{width:390,height:844},{width:1360,height:900}]){
  const page=await browser.newPage({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600,deviceScaleFactor:1});
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  for(const slug of slugs){
   const response=await page.goto(base+"/experiencias/"+slug+"?embed=1",{waitUntil:"domcontentloaded",timeout:35000});
   assert.equal(response?.status(),200,"Missing demo "+slug);
   const html=await page.content();
   assert.ok(!html.includes("NEXT_NOT_FOUND"),"Demo returned a not-found page: "+slug);
   if(slug==="dragon-ball-pareja")assert.equal(await page.locator('iframe[src*="dragon-ball-pareja.html"]').count(),1);
   if(slug==="sticker-bomb-amistad"){
    assert.equal(await page.getByRole("main",{name:"Sticker Bomb · Expediente de nuestra amistad"}).count(),1);
    await page.getByRole("button",{name:/Abrir nuestro expediente/}).click();
    await page.getByText("Atención psicológica").waitFor();
    await page.getByRole("button",{name:"Ir al capítulo 12"}).click();
    await page.getByRole("button",{name:/Abrir la carta/}).click();
    await page.getByText("Querida persona favorita",{exact:false}).waitFor();
   }
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(overflow<=3,slug+" viewport "+viewport.width+" horizontal overflow="+overflow);
   if(slug==="sticker-bomb-amistad")await page.screenshot({path:"visual-smoke/studio-parity/sticker-"+viewport.width+".png"});
   console.log("DEMO_PASS",slug,viewport.width);
  }
  assert.deepEqual(errs,[],"Demo JavaScript errors at width "+viewport.width);
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errs=[];page.on("pageerror",e=>errs.push(e.message));
 await page.route("**/auth/v1/token?grant_type=password",r=>ok(r,{access_token:auth,token_type:"bearer",refresh_token:"fake-refresh",expires_in:3600,user}));
 await page.route("**/auth/v1/user",r=>ok(r,user));
 await page.route("**/functions/v1/gift-account",r=>{
  const data=JSON.parse(r.request().postData()||"{}");
  if(data.action==="list")return ok(r,{gifts});
  if(data.action==="open")return ok(r,{editorToken:"mock-signed-editor-access"});
  return ok(r,{ok:true});
 });
 await page.route("**/functions/v1/creator-api",r=>{
  const data=JSON.parse(r.request().postData()||"{}");ops.push(data.action);
  const code=data.code||Object.keys(codes)[0],slug=codes[code]||"pareja";
  if(data.action==="openStudio")return ok(r,{gift:{
   experience_slug:slug,giver_name:"Remitente QA",recipient_name:"Destinataria QA",
   status:"paid",story_data:{},scene_recipe:[],theme_data:{},
  },media:stored.get(code)||[]});
  if(data.action==="prepareStudioUpload") {
   assert.equal(data.mimeType,"image/jpeg","JPG generic MIME must be normalized");
   return ok(r,{path:code+"/studio-photo-qa.jpg",token:"mock-signed-token",kind:"image"});
  }
  if(data.action==="registerStudioMedia") {
   assert.ok(data.storagePath.startsWith(code+"/studio-"));
   stored.set(code,[{id:"media-"+code,kind:"image",url:api+"/storage/v1/object/sign/gift-media/"+code+"/studio-photo-qa.jpg",sort_order:0,caption:"Foto de prueba",metadata:{originalName:"qa-photo.jpg",scene:data.scene||"intro",fit:"cover"}}]);
   return ok(r,{ok:true});
  }
  return ok(r,{ok:true});
 });
 await page.route("**/functions/v1/guest-voice",r=>ok(r,{invites:[]}));
 await page.route("**/storage/v1/**",r=>{
  const req=r.request();
  ops.push("storage:"+req.method());
  if(req.method()==="GET")return r.fulfill({status:200,contentType:"image/png",body:png});
  return ok(r,{Key:"gift-media/test/studio-photo-qa.jpg"});
 });
 const response=await page.goto(base+"/mis-regalos",{waitUntil:"domcontentloaded",timeout:30000});
 assert.equal(response?.status(),200);
 await page.getByRole("heading",{name:"Qué lindo verte de nuevo."}).waitFor({timeout:20000});
 await page.locator('input[type="email"]').fill("qa-studio@example.com");
 await page.locator('input[type="password"]').fill("fake-password");
 await page.getByRole("button",{name:"Entrar a mis regalos →"}).click();
 await page.getByRole("heading",{name:"Los recuerdos tienen casa."}).waitFor({timeout:20000});
 for(const [code,slug] of Object.entries(codes)){
  const item=page.locator("article").filter({has:page.getByText("Destinataria QA",{exact:true})}).first();
  // All 9 cards share a name; locate by each slug's position in the API list.
  await page.locator("article").filter({has:page.getByRole("button",{name:"Editar mi experiencia →"})}).nth(Object.keys(codes).indexOf(code)).getByRole("button",{name:"Editar mi experiencia →"}).click();
  await page.getByRole("heading",{name:"Tu historia, a tu manera."}).waitFor({timeout:15000});
  if(slug!=="frasco365"){
   const input=page.getByLabel("Seleccionar archivos");
   await input.setInputFiles({name:"qa-photo.jpg",mimeType:"application/octet-stream",buffer:png});
   await page.getByText("Archivo incorporado a tu regalo.").waitFor({timeout:18000});
   assert.ok((stored.get(code)||[]).length===1,"Photo not registered: "+slug);
   if(slug==="sticker-bomb-amistad"){
    await page.getByRole("button",{name:"Ver cómo queda en el celular"}).click();
    await page.getByText("VISTA PREVIA CON TUS DATOS",{exact:false}).waitFor({timeout:15000});
    await page.getByRole("main",{name:"Sticker Bomb · Expediente de nuestra amistad"}).getByRole("button",{name:/Abrir nuestro expediente/}).click();
    await page.getByRole("main",{name:"Sticker Bomb · Expediente de nuestra amistad"}).getByRole("button",{name:"Ir al capítulo 8"}).click();
    await page.getByRole("img",{name:"Foto de prueba"}).first().waitFor();
   }else{
    await page.getByRole("button",{name:"Abrir vista previa →"}).click();
    if(slug==="dragon-ball-pareja"){
     await page.locator('iframe[src*="dragon-ball-pareja.html?mode=gift"]').waitFor({timeout:20000});
    }else if(slug==="siete-dias"){
     await page.locator('iframe[title*="Día"]').first().waitFor();
    }else{
     await page.locator(".legacy-premium-renderer, .experience-shell").first().waitFor({timeout:12000});
    }
   }
  }else{
   await page.getByRole("button",{name:"Abrir vista previa →"}).click();
   await page.locator(".jar365-experience").waitFor({timeout:8000}).catch(()=>{});
  }
  console.log("STUDIO_PASS",slug);
  await page.getByRole("button",{name:"← Volver a mis regalos"}).click();
  await page.getByRole("heading",{name:"Los recuerdos tienen casa."}).waitFor();
 }
 assert.ok(ops.includes("registerStudioMedia"),"No photo registered");
 assert.ok(ops.some(op=>op.startsWith("storage:") && op!=="storage:GET"),"Signed object upload path was not exercised; observed "+ops.filter(op=>op.startsWith("storage:")).join(","));
 assert.deepEqual(errs,[],"Authenticated studio JavaScript errors");
 await page.screenshot({path:"visual-smoke/studio-parity/account.png",fullPage:true});
 await page.close();
 console.log("STUDIO_PARITY_BROWSER_QA_PASS",JSON.stringify({demos:slugs.length*2,studio:slugs.length,photos:slugs.length-1}));
}finally{await browser.close()}
