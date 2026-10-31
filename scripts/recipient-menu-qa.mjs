import {chromium} from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const paths=["pareja","mama","papa","amigos","juegos","todos"];
const details=[];
try{
 for(const viewport of [{width:320,height:720},{width:390,height:844},{width:1280,height:900}]){
  const page=await browser.newPage({viewport,isMobile:viewport.width<700,hasTouch:viewport.width<700});
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  let response=await page.goto(base,{waitUntil:"domcontentloaded",timeout:50000});
  assert.equal(response?.status(),200);
  const trigger=page.getByRole("button",{name:"Abrir menú de categorías"});
  await trigger.waitFor({state:"visible",timeout:12000});
  await trigger.click();
  const panel=page.getByRole("dialog",{name:/¿Para quién es tu sorpresa/});
  await panel.waitFor({state:"visible"});
  assert.equal(await page.locator("body").evaluate(el=>el.style.overflow),"hidden");
  const nav=panel.getByRole("navigation",{name:"Elegir destinatario"});
  assert.equal(await nav.getByRole("link").count(),6);
  for(const slug of paths){
   assert.equal(await nav.locator('a[href="/coleccion/'+slug+'"]').count(),1,slug);
  }
  const rows=await nav.locator(".recipient-menu-category").all();
  for(const item of rows){const box=await item.boundingBox();assert.ok(box?.width>230&&box.height>=55,"Card needs comfortable touch target");}
  await page.screenshot({path:"/tmp/menu-"+viewport.width+".png",fullPage:false});
  await page.keyboard.press("Escape");
  await panel.waitFor({state:"hidden"});
  assert.notEqual(await page.locator("body").evaluate(el=>el.style.overflow),"hidden");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await panel.waitFor({state:"visible"});
  await panel.getByRole("link",{name:/Mamá/}).click();
  await page.waitForURL("**/coleccion/mama",{timeout:15000});
  await page.getByRole("heading",{name:/Hay un amor que merece/}).waitFor();
  assert.equal(await page.locator(".recipient-catalog-card").count(),1,"Mother category should not mix others");
  await page.screenshot({path:"/tmp/categoria-mama-"+viewport.width+".png",fullPage:false});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,"No horizontal page overflow");
  await page.getByRole("button",{name:"Abrir menú de categorías"}).click();
  await page.getByRole("link",{name:/Juegos.*Momentos para compartir/}).click();
  await page.waitForURL("**/coleccion/juegos",{timeout:15000});
  await page.getByText("Trazo Cómplice").first().waitFor();
  assert.equal(await page.locator(".recipient-catalog-card").count(),3,"The games category must show all three games, no escape room card");
  for(const slug of ["trazo-complice","entre-dos","complices"]){
    assert.equal(await page.locator('.recipient-catalog-card a[href="/juegos/'+slug+'"]').count(),1,"Each game needs its own demo");
  }
  assert.equal(await page.locator('.recipient-games-pack a[href="/juegos/pack"]').count(),1,"Single pack checkout must be prominent");
  assert.equal(await page.locator('.recipient-escapes-apart a[href="/escapes"]').count(),1,"Escape rooms must be separate");
  response=await page.goto(base+"/coleccion/todos",{waitUntil:"domcontentloaded"});
  assert.equal(response?.status(),200);
  assert.ok((await page.locator(".recipient-catalog-card").count())>=9,"All should have models and games");
  response=await page.goto(base+"/crear",{waitUntil:"domcontentloaded"});
  assert.equal(response?.status(),200);
  await page.getByRole("button",{name:"Abrir menú de categorías"}).waitFor({state:"visible"});
  assert.deepEqual(errors,[],"No JavaScript errors");
  details.push({width:viewport.width,categories:paths.length,mama:1,games:3});
  await page.close();
 }
 console.log("RECIPIENT_MENU_MOBILE_DESKTOP_PASS",JSON.stringify(details));
}finally{await browser.close();}
