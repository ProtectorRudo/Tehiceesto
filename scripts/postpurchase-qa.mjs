import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const dir="visual-upsell";
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const validCode="ab129ed5c08a392be1";
const cases=[];
for(const size of [{label:"mobile-320",width:320,height:700},{label:"mobile-390",width:390,height:844},{label:"desktop",width:1440,height:900}]){
 const page=await browser.newPage({viewport:{width:size.width,height:size.height},isMobile:size.width<600,hasTouch:size.width<600});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 let offerCalls=[];
 await page.route("**/functions/v1/order-status?*",async route=>route.fulfill({status:200,headers:{"content-type":"application/json","access-control-allow-origin":"*"},
  body:JSON.stringify({stage:"personalize",order:{status:"approved",checkoutUrl:null}})}));
 await page.route("**/functions/v1/upsell-api",async route=>{
  const data=JSON.parse(route.request().postData()||"{}");offerCalls.push(data.action);
  await route.fulfill({status:200,headers:{"content-type":"application/json","access-control-allow-origin":"*"},
   body:JSON.stringify({mainPaid:true,title:"Una carta sorpresa extra",amountMinor:1000000,status:"offered",canOffer:true,oneClick:false,letterReady:false})});
 });
 await page.goto(base+"/pedido/"+validCode,{waitUntil:"domcontentloaded"});
 await page.getByText("¡Ya es tuya!").waitFor({timeout:7000});
 const button=page.getByRole("button",{name:/Sí, agregar mi carta extra/});
 if(await button.count()!==0)throw Error("legacy paid upsell must be hidden during trial "+size.label);
 if(await page.getByText(/Mercado Pago te pedirá confirmar/).count())throw Error("legacy upsell still visible");
 await page.screenshot({path:path.join(dir,size.label+"-trial.png"),fullPage:true});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2))throw Error("horizontal overflow "+size.label);
 if(offerCalls.includes("accept")||offerCalls.includes("decline"))throw Error("unexpected paid upsell request");
 if(errors.length)throw Error("browser errors "+errors.join(";"));
 cases.push({viewport:size.label,offerHidden:true,overflow:false});
 await page.close();
}
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await page.route("**/functions/v1/order-status?*",async route=>route.fulfill({status:200,headers:{"content-type":"application/json","access-control-allow-origin":"*"},
 body:JSON.stringify({stage:"payment",order:{status:"pending",checkoutUrl:null}})}));
await page.goto(base+"/pedido/"+validCode,{waitUntil:"domcontentloaded"});
await page.getByText(/Estamos verificando el pago/).waitFor();
if(await page.getByRole("button",{name:/agregar mi carta extra/}).count())throw Error("offer shown before original payment approval");
cases.push({case:"unpaid",offerHidden:true});
await page.close();
const gated=await browser.newPage();
await gated.goto(base+"/sorpresa/"+validCode);
if((await gated.locator("main").count())!==1)throw Error("gated letter page route missing");
await gated.close();
await browser.close();
await fs.writeFile(path.join(dir,"report.json"),JSON.stringify(cases,null,2));
console.log("UPSELL UI AUDIT PASS "+JSON.stringify(cases));
