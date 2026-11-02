import {chromium} from "playwright";
const targets=[
 "https://tehiceesto.com/",
 "https://tehiceesto.com/mis-regalos",
 "https://tehiceesto.com/crear",
 "https://tehiceesto.com/experiencias/pareja",
 "https://tehiceesto.com/api/version",
 "https://www.tehiceesto.com/mis-regalos",
 "https://tehiceesto.vercel.app/mis-regalos",
 "https://tehiceesto-git-main-protector-rudo-s-projects.vercel.app/mis-regalos"
];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 page.on("pageerror",e=>console.log("JS_ERROR",e.message.slice(0,250)));
 page.on("console",msg=>{if(msg.type()==="error")console.log("CONSOLE_ERROR",msg.text().slice(0,200));});
 for(const url of targets){
  try{
   const res=await page.goto(url,{waitUntil:"domcontentloaded",timeout:90000});
   await page.waitForTimeout(1250);
   const title=await page.title(),body=(await page.locator("body").innerText()).replace(/\s+/g," ").trim();
   const authElements=await page.locator('input[type="email"],input[type="password"],button:has-text("Ingresar"),button:has-text("Enviar enlace")').count();
   const nextData=await page.locator("script#__NEXT_DATA__").count();
   console.log("URL_RESULT",JSON.stringify({request:url,status:res?.status(),finalUrl:page.url(),title,body:body.slice(0,350),authElements,nextData}));
   if(url.includes("tehiceesto.com")){
    if(page.url().startsWith("https://vercel.com/login"))throw new Error("Canonical domain still redirects to Vercel SSO: "+url);
    if(url.endsWith("/mis-regalos")&&url.includes("https://tehiceesto.com/")&&!body.includes("Bienvenido de nuevo"))throw new Error("Login portal not accessible from canonical domain");
   }
  }catch(e){console.log("URL_ERROR",JSON.stringify({url,error:String(e).slice(0,500)}));}
 }
}finally{await browser.close();}
