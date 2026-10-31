import {chromium} from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
try{
 for(const viewport of [{width:320,height:720},{width:390,height:844},{width:1440,height:900}]){
  const page=await browser.newPage({viewport,isMobile:viewport.width<700,hasTouch:viewport.width<700});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const response=await page.goto(base+"/juegos/trazo-complice",{waitUntil:"domcontentloaded",timeout:50000});
  assert.equal(response?.status(),200);
  const f=page.frameLocator('iframe[title="Trazo Cómplice — demo de dos palabras"]');
  await f.getByRole("button",{name:/Empezar a jugar/}).waitFor({state:"visible",timeout:20000});
  const first=await f.locator(".trazo-deck .trazo-art-card").count();
  assert.equal(first,4,"Four premium cards must render");
  assert.equal(await f.locator(".trazo-hero-badges").innerText().then(s=>s.includes("1.274")),true);
  await f.getByRole("button",{name:/Empezar a jugar/}).click();
  await f.locator("#trazo-name-a").fill("Sofi");
  await f.locator("#trazo-name-b").fill("Juan");
  assert.equal(await f.locator('[data-setting="rounds"]').count(),1,"Demo must offer only 2 rounds");
  await f.getByRole("button",{name:/Preparar nuestras cartas/}).click();
  for(const [index,word] of ["gato","cohete"].entries()){
   await f.getByRole("button",{name:/ver mi palabra/}).click();
   await f.getByRole("button",{name:/Revelar mi palabra/}).click();
   assert.equal((await f.locator(".trazo-secret-word").innerText()).toLowerCase(),word);
   assert.equal(await f.getByRole("button",{name:/Cambiar palabra/}).count(),0,"Demo cannot reroll");
   await f.getByRole("button",{name:/Ya la vi/}).click();
   assert.equal(await f.locator(".trazo-secret-word").count(),0,"The word must be hidden while drawing");
   await f.locator(".trazo-drawing-canvas").waitFor({state:"visible"});
   await f.getByRole("button",{name:/Lo adivinó/}).click();
   await f.getByRole("button",{name:index===0?/Siguiente ronda/:/Ver resultados finales/}).click();
  }
  await f.getByText("FIN DE LA DEMO").waitFor();
  const paidLink=f.getByRole("link",{name:/Desbloquear juego completo/});
  assert.equal(await paidLink.getAttribute("href"),"/comprar/trazo-complice");
  await f.getByRole("button",{name:/Jugar una revancha/}).click();
  await f.getByRole("button",{name:/ver mi palabra/}).click();
  await f.getByRole("button",{name:/Revelar mi palabra/}).click();
  assert.equal((await f.locator(".trazo-secret-word").innerText()).toLowerCase(),"gato","Replay must reset fixed words");
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,"No horizontal overflow");
  assert.deepEqual(errors,[]);
  const buy=await page.goto(base+"/comprar/trazo-complice",{waitUntil:"domcontentloaded"});
  assert.equal(buy?.status(),200);
  const complete=await page.goto(base+"/juegos/trazo-complice/completo",{waitUntil:"domcontentloaded"});
  assert.equal(complete?.status(),200);
  await page.getByText(/Primero, tu acceso privado|Preparando tus cartas/).first().waitFor({state:"visible",timeout:15000});
  results.push({viewport,first,sequence:["gato","cohete"],buy:200,complete:200});
  await page.close();
 }
 const app=(await fs.readFile("public/juegos/trazo-complice/demo.html","utf8")).toLowerCase();
 assert.equal(app.includes("window.trazo_word_bank"),false,"No full bank in demo HTML");
 const sample=await fs.readFile("public/juegos/trazo-complice/demo-words.js","utf8");
 assert.match(sample,/label:"gato"/);assert.match(sample,/label:"cohete"/);
 assert.doesNotMatch(sample,/1274|1.274|window.TRAZO_WORD_BANK=Object.freeze\(bank\)/);
 const full=await fs.readFile("supabase/functions/trazo-complice-words/index.ts","utf8");
 assert.match(full,/auth\.getUser\(token\)/,"Server must authenticate the buyer");
 assert.match(full,/eq\("status","approved"\)/,"Server must require approved payment");
 assert.match(full,/eq\("buyer_email",email\)/,"Server must match verified buyer email");
 console.log("TRAZO_DEMO_TWO_FIXED_WORDS_AND_PAID_GATING_PASS",JSON.stringify(results));
}finally{await browser.close();}
