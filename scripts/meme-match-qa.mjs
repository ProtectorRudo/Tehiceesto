
import {chromium} from "playwright";
import fs from "node:fs/promises";
import http from "node:http";
import assert from "node:assert/strict";
import path from "node:path";

const html=await fs.readFile("public/juegos/meme-match/demo.html");
const server=http.createServer((req,res)=>{
 if((req.url||"").split("?")[0]!=="/juegos/meme-match/demo.html"){res.writeHead(404);res.end("Not found");return;}
 res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"});res.end(html);
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const url="http://127.0.0.1:"+server.address().port+"/juegos/meme-match/demo.html";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
await fs.mkdir("visual-meme-match",{recursive:true});
try{
 for(const width of [320,390,768]){
  const page=await browser.newPage({viewport:{width,height:width===768?900:800},deviceScaleFactor:1,isMobile:width<500,hasTouch:width<500});
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  const response=await page.goto(url,{waitUntil:"domcontentloaded"});
  assert.equal(response?.status(),200);
  assert.equal(await page.locator('[data-pairs="8"]').count(),1,"8 pairs available in demo");
  assert.equal(await page.locator('[data-pairs="48"]').count(),0,"48-pair premium game never exposed in demo");
  await page.locator("#startBtn").click();
  assert.equal(await page.locator(".mcard").count(),16,"Eight unique pairs");
  const cards=await page.evaluate(()=>state.cards.map((card,index)=>({index,pair:card.pair,id:card.meme.id})));
  assert.equal(new Set(cards.map(c=>c.pair)).size,8);
  const pairGroups=new Map();
  for(const c of cards){if(!pairGroups.has(c.pair))pairGroups.set(c.pair,[]);pairGroups.get(c.pair).push(c.index);}
  const groups=[...pairGroups.values()];assert.equal(groups.length,8);
  async function foundPair(indices){
    await page.locator(".mcard").nth(indices[0]).click();
    await page.waitForTimeout(480);
    const first=page.locator(".mcard").nth(indices[0]);
    assert.equal(await first.evaluate(el=>el.classList.contains("revealed")),true,"First card stays visible until second choice");
    await page.locator(".mcard").nth(indices[1]).click();
    await page.waitForTimeout(600);
    for(const i of indices){
      const element=page.locator(".mcard").nth(i);
      const state=await element.evaluate(el=>{
        const inner=el.querySelector(".mcard-inner"),front=el.querySelector(".card-front"),back=el.querySelector(".card-back"),img=el.querySelector(".card-front img");
        return {matched:el.classList.contains("matched"),revealed:el.classList.contains("revealed"),pressed:el.getAttribute("aria-pressed"),innerTransform:getComputedStyle(inner).transform,frontVisible:getComputedStyle(front).visibility,backVisible:getComputedStyle(back).visibility,srcOK:!!img&&img.complete&&img.naturalWidth>0};
      });
      assert.equal(state.matched,true,"Match must remain marked");
      assert.equal(state.revealed,true,"Match must remain face up");
      assert.equal(state.pressed,"true");
      assert.equal(state.innerTransform,"none","Matched face must not depend on 3D flip");
      assert.equal(state.frontVisible,"visible");
      assert.equal(state.backVisible,"hidden","Card back must be hidden for matched pair");
      assert.equal(state.srcOK,true,"Actual meme image visible");
    }
  }
  await foundPair(groups[0]);
  await foundPair(groups[1]);
  const score=await page.locator("#p0Score").innerText();
  assert.match(score,/3/, "Combo x2 grants 1+2 points");
  const before=await page.locator(".mcard.matched").count();
  assert.equal(before,4);
  await page.locator(".mcard").nth(groups[2][0]).click();
  await page.locator(".mcard").nth(groups[3][0]).click();
  await page.waitForTimeout(1650);
  assert.equal(await page.locator(".mcard.matched").count(),4,"Previously matched pairs survive missed turn");
  assert.equal(await page.locator(".mcard.revealed").count(),4,"Unmatched cards flip back, matched remain");
  for(const i of [...groups[0],...groups[1]]){
    const state=await page.locator(".mcard").nth(i).evaluate(el=>({back:getComputedStyle(el.querySelector(".card-back")).visibility,front:getComputedStyle(el.querySelector(".card-front")).visibility}));
    assert.deepEqual(state,{back:"hidden",front:"visible"},"Earlier matched pairs stay open after next player moves");
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2),false,"No horizontal overflow");
  assert.deepEqual(errors,[],"No JavaScript errors");
  await page.screenshot({path:path.join("visual-meme-match","meme-"+width+".png"),fullPage:true});
  results.push({width,pairs:8,comboScore:score.trim(),matchedStayVisible:true,missClosesOnlyIncorrect:true,errors:errors.length});
  await page.close();
 }
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
console.log("MEME_MATCH_FACE_UP_MOBILE_PASS",JSON.stringify(results));
