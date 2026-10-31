import {chromium} from "playwright";
import fs from "node:fs/promises";
import vm from "node:vm";
import assert from "node:assert/strict";

const base=process.env.QA_URL||"http://127.0.0.1:3000";
const source=await fs.readFile("public/juegos/casi-telepatia/questions.js","utf8");
const scope={window:{}};
vm.runInNewContext(source,scope);
const questions=scope.window.CASI_QUESTIONS;
const categories=scope.window.CASI_CATEGORIES;
assert.equal(questions.length,600);
assert.equal(categories.length,20);
assert.equal(new Set(questions.map(q=>q.text.toLocaleLowerCase("es-AR"))).size,600);
assert.equal(new Set(questions.map(q=>q.id)).size,600);
for(const q of questions){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.text.length>=16);}
for(const c of categories){assert.equal(questions.filter(q=>q.category===c.id).length,30);}
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:width===320?720:width===390?844:900},isMobile:width<700,hasTouch:width<700});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const response=await page.goto(base+"/juegos/casi-telepatia",{waitUntil:"domcontentloaded",timeout:50000});
  assert.equal(response?.status(),200);
  const frame=page.frameLocator('iframe[title="Casi Telepatía · juego completo para dos personas"]');
  const c=frame.locator("#screen");
  await c.locator('[data-action="setup"]').waitFor();
  await c.locator('[data-action="setup"]').evaluate(e=>e.click());
  await c.locator("#name1").fill("Sofi");
  await c.locator("#name2").fill("Fran");
  await c.locator('[data-pack="amigos"]').evaluate(e=>e.click());
  await c.locator('[data-rounds="8"]').evaluate(e=>e.click());
  assert.equal(await c.locator("#name1").inputValue(),"Sofi");
  await c.locator('[data-action="start"]').evaluate(e=>e.click());
  const result=await frame.locator("body").evaluate(()=>{
   const click=sel=>{const el=document.querySelector(sel);if(!el)throw Error("Button missing: "+sel);el.click()};
   const titles=[];
   for(let i=0;i<8;i++){
     click('[data-action="answer"]');
     titles.push(document.querySelector(".question-card h1").textContent);
     click('[data-choice="1"]');
     click('[data-action="save-answer"]');
     if(document.querySelector(".answer-button"))throw Error("Privacy breach: secret answer remained visible");
     click('[data-action="guess"]');
     click('[data-choice="'+(i%2===0?'1':'2')+'"]');
     click('[data-action="save-guess"]');
     click('[data-action="next"]');
   }
   return {titles,scores:window.__CASI_QA__.getState().scores,phase:window.__CASI_QA__.getPhase(),overflow:document.documentElement.scrollWidth>innerWidth+2};
  });
  assert.equal(result.phase,"ending");
  assert.deepEqual(result.scores,[0,4]);
  assert.equal(new Set(result.titles).size,8);
  assert.equal(result.overflow,false);
  assert.deepEqual(errors,[]);
  await page.close();
  console.log("Casi Telepatía PASS",width,result.scores);
 }
}finally{await browser.close();}
