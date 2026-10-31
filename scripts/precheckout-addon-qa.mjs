import {chromium} from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
await fs.mkdir("visual-fast-checkout",{recursive:true});
try{
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:850},isMobile:width<700,hasTouch:width<700});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base+"/comprar/pareja",{waitUntil:"domcontentloaded"});
  const option=page.locator(".quick-checkout-addon-choice");
  assert.equal(await option.count(),1,"offer should be shown unobtrusively");
  assert.equal(await option.getAttribute("aria-pressed"),"false","default is opt-out");
  assert.match(await page.locator(".quick-checkout-discount").innerText(),/60% OFF/);
  assert.match(await page.locator(".quick-checkout-addon-price").innerText(),/25\.000/);
  assert.match(await page.locator(".quick-checkout-addon-price").innerText(),/10\.000/);

  assert.match(await page.locator(".quick-checkout-total").innerText(),/25\.000/);
  await option.click();assert.equal(await option.getAttribute("aria-pressed"),"true");
  assert.match(await page.locator(".quick-checkout-total").innerText(),/35\.000/);
  await page.screenshot({path:"visual-fast-checkout/precheckout-addon-"+width+".png",fullPage:true});
  await option.click();assert.equal(await option.getAttribute("aria-pressed"),"false");
  assert.match(await page.locator(".quick-checkout-total").innerText(),/25\.000/);
  await option.click();
  let sent=null,calls=0;
  await page.route("**/api/checkout",async route=>{
   calls++;sent=JSON.parse(route.request().postData()||"{}");
   await route.fulfill({status:200,contentType:"application/json",
     body:JSON.stringify({code:"0123456789abcdefab",priceMinor:3500000,currency:"ARS",checkoutReady:true,checkoutUrl:"https://www.mercadopago.com.ar/checkout/v1/addon-test"})});
  });
  await page.route("**/checkout/v1/addon-test",route=>route.fulfill({status:200,contentType:"text/html",body:"<html><body>NO CHARGE TEST</body></html>"}));
  await page.locator("#checkout-email").fill("ci@example.com");
  await page.locator("#checkout-phone").fill("2215551234");
  await page.getByRole("button",{name:/Continuar a Mercado Pago/}).click();
  await page.waitForURL("**/checkout/v1/addon-test",{timeout:10000});
  assert.equal(calls,1,"one checkout request not two");
  assert.equal(sent.addGamesPack,true,"server choice");
  assert.equal(sent.experienceSlug,"pareja");
  assert.deepEqual(errors,[],"no JS error");
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:850},isMobile:true,hasTouch:true});
 for(const slug of ["pack-juegos","trazo-complice"]){
  await page.goto(base+"/comprar/"+slug,{waitUntil:"domcontentloaded"});
  const section=page.locator(".quick-checkout-addon--experience");
  assert.equal(await section.count(),1,slug+" should offer one editable experience");
  const add=section.locator(".quick-checkout-addon-choice");
  assert.equal(await add.getAttribute("aria-pressed"),"false","unselected by default");
  assert.match(await section.innerText(),/60% OFF/);
  assert.match(await section.innerText(),/10\.000/);
  assert.equal(await page.locator("#checkout-experience-choice option").count(),9);
  await page.locator("#checkout-experience-choice").selectOption("sticker-bomb-amistad");
  await add.click();
  assert.match(await page.locator(".quick-checkout-total").innerText(),/35\.000/);
  assert.equal(await add.getAttribute("aria-pressed"),"true");
  await add.click();
  assert.match(await page.locator(".quick-checkout-total").innerText(),/25\.000/);
  await add.click();
  let payload=null,calls=0;
  await page.route("**/api/checkout",async route=>{
    calls++;payload=JSON.parse(route.request().postData()||"{}");
    await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
      code:"0123456789abcdefab",priceMinor:3500000,currency:"ARS",checkoutReady:false
    })});
  });
  await page.locator("#checkout-email").fill("ci@example.com");
  await page.locator("#checkout-phone").fill("2215551234");
  await page.getByRole("button",{name:/Continuar a Mercado Pago/}).click();
  await page.locator(".quick-checkout-status").waitFor({state:"visible",timeout:12000});
  assert.equal(calls,1,"one combined order only");
  assert.equal(payload.addonExperienceSlug,"sticker-bomb-amistad","selected experience must reach server");
  assert.equal(payload.addGamesPack,false);
 }
 await page.goto(base+"/comprar/sticker-bomb-amistad",{waitUntil:"domcontentloaded"});
 assert.equal(await page.locator(".quick-checkout-addon").count(),1,"friendship gift should offer discounted pack");
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,"no horizontal overflow");
 await page.close();
 console.log("PRECHECKOUT_BUNDLE_QA_PASS: pack 60% OFF, single order, price changes, reciprocal experience selector, mobile responsive");
}finally{await browser.close()}
