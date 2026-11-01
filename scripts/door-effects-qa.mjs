import {chromium} from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const dir="visual-door-audit";
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const report=[];
try{
  for(const entry of [
    {slug:"pareja",width:320,height:720},
    {slug:"pareja",width:390,height:844},
    {slug:"pareja",width:1440,height:900},
    {slug:"amistad",width:390,height:844},
  ]){
    const page=await browser.newPage({viewport:{width:entry.width,height:entry.height},isMobile:entry.width<600,hasTouch:entry.width<600,deviceScaleFactor:1});
    const errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    const response=await page.goto(base+"/experiencias/"+entry.slug+"?embed=1",{waitUntil:"domcontentloaded",timeout:45000});
    assert.equal(response?.status(),200,"Demo "+entry.slug+" HTTP200");
    const name=entry.slug+"-"+entry.width;
    if(entry.slug==="pareja"){
      const bouquet=page.locator(".premium-intro--flowers").first();
      await bouquet.waitFor({state:"visible",timeout:15000});
      await bouquet.locator(".premium-bouquet-touch").click();
      await bouquet.locator(".premium-note--visible").waitFor({state:"visible",timeout:4000});
      await bouquet.locator(".premium-continue").click();
    }else if(entry.slug==="amistad"){
      const box=page.locator(".couple-gift-intro").first();
      await box.waitFor({state:"visible",timeout:15000});
      await box.locator(".couple-gift-unseal").click();
      await box.locator(".couple-gift-continue:not([disabled])").waitFor({state:"visible",timeout:7000});
      await box.locator(".couple-gift-continue").click();
    }

    const door=page.locator(".pair-cinematic-umbral").first();
    await door.waitFor({state:"visible",timeout:13000});
    assert.equal(await door.locator(".thi-door-atmosphere").count(),1,"Shared light component used");
    assert.equal(await door.locator(".pcu-door-closed-leaf").count(),1,"Single physical door");
    assert.equal(await door.locator(".pcu-dust i").count(),9,"Nine motes");
    assert.equal(await door.locator(".pcu-invitation [data-action=advance]").count(),0,"No advance before opening");
    await page.screenshot({path:path.join(dir,name+"-closed.png")});
    await door.locator("[data-action=open-door]").click();
    assert.match(await door.getAttribute("class")||"",/is-opening/,"Door opens by touch");
    await page.waitForTimeout(580);
    await page.screenshot({path:path.join(dir,name+"-opening.png")});
    await door.locator("[data-action=advance]").waitFor({state:"visible",timeout:6000});
    assert.match(await door.getAttribute("class")||"",/is-open/);
    await page.screenshot({path:path.join(dir,name+"-open.png")});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2),false,"No horizontal overflow on "+name);
    await door.locator("[data-action=advance]").click();
    assert.match(await door.getAttribute("class")||"",/is-entering/);
    await page.waitForTimeout(480);
    await page.screenshot({path:path.join(dir,name+"-entering.png")});
    await door.waitFor({state:"detached",timeout:8000});
    assert.deepEqual(errors,[],"No browser errors on "+name);
    report.push({slug:entry.slug,width:entry.width,result:"PASS"});
    await page.close();
  }
  // Club de Amigos fue retirado del catálogo; conservar 404 y no reabrir la demo.
  const retired=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:"reduce"});
  const retiredResponse=await retired.goto(base+"/experiencias/club-amigos?embed=1",{waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(retiredResponse?.status(),404,"Club de Amigos retirado debe responder 404");
  await retired.close();
  const tsx=await fs.readFile("components/legacy-v5/PairCinematicUmbral.tsx","utf8");
  const css=await fs.readFile("components/legacy-v5/PairCinematicUmbral.css","utf8");
  const arch=await fs.readFile("components/legacy-v5/ExperienceEngine.tsx","utf8");
  assert.match(tsx,/DoorAtmosphere/);
  assert.match(css,/pcu-camera-push/);
  assert.match(arch,/case"door":return <PairCinematicUmbral/);
  await fs.writeFile(path.join(dir,"report.json"),JSON.stringify(report,null,2));
  console.log("ALL_SHARED_DOOR_EFFECTS_OK",JSON.stringify(report));
}finally{await browser.close()}
