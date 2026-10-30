import assert from "node:assert/strict";
import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const origin=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const output="visual-bouquet-audit";
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try {
  for(const entry of [
    {slug:"pareja",w:320,h:720},
    {slug:"pareja",w:390,h:844},
    {slug:"pareja",w:1440,h:900},
    {slug:"aniversario",w:390,h:844},
    {slug:"abuelos",w:390,h:844}
  ]) {
    const page=await browser.newPage({viewport:{width:entry.w,height:entry.h},isMobile:entry.w<600,hasTouch:entry.w<600,deviceScaleFactor:1});
    const errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    const response=await page.goto(origin+"/experiencias/"+entry.slug+"?embed=1",{waitUntil:"domcontentloaded",timeout:45000});
    assert.equal(response?.status(),200,entry.slug+" HTTP");
    const intro=page.locator(".premium-intro--flowers").first();
    await intro.waitFor({state:"visible",timeout:20000});
    await page.waitForTimeout(1800);
    assert.equal(await intro.locator(".opening-flower").count(),11,"Keep 11 original flowers");
    assert.equal(await intro.locator(".premium-floating-petal").count(),10,"Ten deterministic petal particles");
    assert.equal(await intro.locator(".premium-bouquet-touch").count(),1,"Bouquet must be touch accessible");
    assert.equal(await intro.locator(".premium-note--visible").count(),0,"Note must initially remain sealed");
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,"No horizontal overflow "+entry.slug+" "+entry.w);
    await page.screenshot({path:path.join(output,entry.slug+"-"+entry.w+"-sealed.png")});
    await intro.locator(".premium-bouquet-touch").click();
    assert.match(await intro.getAttribute("class")||"",/premium-intro--unfolding/,"Touch should trigger bouquet opening");
    assert.equal(await intro.locator(".premium-floating-petal").count(),10,"Particles remain bounded");
    await page.waitForTimeout(900);
    await page.screenshot({path:path.join(output,entry.slug+"-"+entry.w+"-unfolding.png")});
    await intro.locator(".premium-note--visible").waitFor({state:"visible",timeout:4000});
    await page.screenshot({path:path.join(output,entry.slug+"-"+entry.w+"-letter.png")});
    assert.equal(await intro.locator(".premium-continue:not([disabled])").count(),1,"Dedication CTA must remain functional");
    await intro.locator(".premium-continue").click();
    await intro.waitFor({state:"detached",timeout:10000});
    assert.deepEqual(errors,[],entry.slug+" browser errors");
    await page.close();
  }
  // Non-floral alternatives must continue to open exactly as before.
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(origin+"/experiencias/cumpleanos?embed=1",{waitUntil:"domcontentloaded",timeout:45000});
  const nonFloral=page.locator(".premium-intro--celebration").first();
  if(await nonFloral.count()){
    assert.equal(await nonFloral.locator(".premium-bouquet-touch").count(),0);
    await nonFloral.locator(".premium-start").click();
    await nonFloral.locator(".premium-note--visible").waitFor({state:"visible",timeout:4000});
  }
  await page.close();
  const tsx=await fs.readFile("components/PremiumOpeningIntro.tsx","utf8");
  const css=await fs.readFile("components/PremiumOpeningIntro.css","utf8");
  assert.match(tsx,/hasBouquet\?1900:1100/,"Floral timing is isolated from non-floral models");
  assert.match(css,/prefers-reduced-motion:reduce/,"Respect motion preferences");
  assert.match(css,/bouquetPetalDrift/,"Petals must animate");
  assert.match(css,/bouquetBloom/,"Flowers must bloom");
  console.log("SHARED_BOUQUET_EFFECTS_MOBILE_OK");
} finally {
  await browser.close();
}
