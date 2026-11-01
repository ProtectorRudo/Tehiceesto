import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const dir=process.env.AUDIT_OUTPUT_DIR||"visual-fast-checkout";
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const records=[];
for(const size of [{name:"mobile-320",width:320,height:720},{name:"mobile-390",width:390,height:844},{name:"desktop",width:1440,height:900}]){
 const page=await browser.newPage({viewport:{width:size.width,height:size.height},isMobile:size.width<600,hasTouch:size.width<600});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(base+"/comprar/pareja",{waitUntil:"domcontentloaded"});
 await page.locator(".quick-checkout-form").waitFor();
 const form=page.locator(".quick-checkout-form");
 const fields=await form.locator('input:not([tabindex="-1"])').count();
 if(fields!==2)throw Error(size.name+": expected email and phone only, found "+fields);
 if(await form.getByRole("textbox",{name:/nombre/i}).count())throw Error(size.name+": checkout still asks for name");
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2))throw Error(size.name+": horizontal overflow");
 const buy=form.getByRole("button",{name:/Continuar a Mercado Pago/});
 if(await buy.isEnabled())throw Error(size.name+": submit enabled with empty contact");
 await form.locator("#checkout-email").fill("mauroedmorales");
 await form.locator("#checkout-phone").fill("2215869910");
 if(await buy.isEnabled())throw Error(size.name+": invalid email must not enable payments");
 await form.getByText(/Completá tu correo con @ y dominio/).waitFor({state:"visible"});
 await form.getByText(/Para continuar, completá correctamente tu email/).waitFor({state:"visible"});
 await form.locator("#checkout-email").fill("mauro@example.com");
 if(await form.locator(".quick-checkout-field-hint").count())throw Error(size.name+": warning persists after valid email");
 if(!await buy.isEnabled())throw Error(size.name+": completed email and phone should immediately enable checkout");
 await page.screenshot({path:path.join(dir,size.name+"-two-fields.png"),fullPage:true});

 let captured=null;
 await page.route("**/api/checkout",async route=>{
   captured=JSON.parse(route.request().postData()||"{}");
   await route.fulfill({status:200,contentType:"application/json",headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"apikey,content-type"},
     body:JSON.stringify({code:"test123",priceMinor:100000,currency:"ARS",checkoutReady:true,checkoutUrl:"https://www.mercadopago.com.ar/checkout/v1/redirect-test"})});
 });
 await page.route("https://www.mercadopago.com.ar/checkout/v1/redirect-test",async route=>await route.fulfill({status:200,contentType:"text/html",body:"<html><body>PAYMENT TEST - NO CHARGE</body></html>"}));
 await form.getByLabel("Tu email").fill("prueba@example.com");
 await form.getByLabel("Tu WhatsApp").fill("2215551234");
 if(!await buy.isEnabled())throw Error(size.name+": valid contact unexpectedly blocked");
 await buy.click();
 await page.waitForURL("**/checkout/v1/redirect-test",{timeout:10000});
 if(!captured||captured.customerName!==undefined||captured.affiliateToken!==undefined||captured.email!=="prueba@example.com"||captured.whatsapp!=="5492215551234"||captured.consent!==true)
  throw Error(size.name+": incorrect request "+JSON.stringify(captured));
 if(errors.length)throw Error(size.name+": JS errors "+errors.join(","));
 records.push({viewport:size.name,fields,validation:true,redirect:true,contactOnly:true});
 await page.close();
}
for(const route of ["/comprar/siete-dias","/comprar/frasco365","/crear"]){
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.goto(base+route,{waitUntil:"domcontentloaded"});
 if(route==="/comprar/frasco365"){
  if(await page.getByText(/todavía no habilitamos pagos/i).count()<1)throw Error("Frasco 365 checkout gate missing");
 }else if(route==="/comprar/siete-dias"){
  if(await page.locator(".quick-checkout-form input:not([tabindex='-1'])").count()!==2)throw Error("Seven days still has extra fields");
 }else {
  const pareja=page.locator(".create-gallery-card").filter({hasText:"Nuestra historia"});
  await pareja.getByRole("button",{name:/Comprar esta experiencia/i}).click();
  await page.waitForURL("**/comprar/pareja",{timeout:5000});
 }
 records.push({route,status:"OK"});
 await page.close();
}
await browser.close();
await fs.writeFile(path.join(dir,"report.json"),JSON.stringify(records,null,2));
console.log("TWO FIELD CHECKOUT QA PASSED "+JSON.stringify(records));
