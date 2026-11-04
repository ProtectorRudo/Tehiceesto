import assert from "node:assert/strict";
import {chromium} from "playwright";

const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
try{
  for(const width of [360,390,1280]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    const home=await page.goto(base+"/dragon-ball-pareja-demo-mobile.html",{waitUntil:"domcontentloaded"});
    assert.equal(home?.status(),200,"Dragon Ball public HTML response");
    // Regression: previous version persisted opened packs and collected orbs
    // in an identical localStorage key, even across new demo visits.
    await page.evaluate(()=>localStorage.setItem("db_nuestra_saga_v2",JSON.stringify({
      receiver:"EMMA",sender:"JULIÁN",date:"octubre",collected:[0,1,2],orbs:[0,1,2],
    })));
    await page.reload({waitUntil:"domcontentloaded"});
    await page.evaluate(()=>go(3));
    assert.equal(await page.locator(".pack").count(),9,"Nine sticker envelopes");
    assert.equal(await page.locator(".pack.opened").count(),0,"Legacy saved envelopes must start sealed");
    assert.equal(await page.locator("#stickerCount").innerText(),"0/9","Fresh album counter");
    assert.equal(await page.locator('button[aria-label^="Abrir sobre"]').count(),9,"All nine open affordances");
    // Actually open one envelope through the UI and peel it via its action.
    await page.locator(".pack").first().click();
    const stickerDialog=page.getByRole("dialog",{name:/Sticker de/});
    assert.equal(await stickerDialog.locator(".reveal-zone.demo-sealed").count(),1,"New stickers start inside sealed envelopes");
    await stickerDialog.locator(".foil-open").click();
    await stickerDialog.getByRole("button",{name:/DESPEGAR Y PEGAR/}).click();
    await page.locator(".pack.opened").waitFor({timeout:4500});
    assert.equal(await page.locator("#stickerCount").innerText(),"1/9");
    // The demo must not persist the collected item but should keep any edited names.
    const stored=JSON.parse(await page.evaluate(()=>localStorage.getItem("db_nuestra_saga_v2")));
    assert.equal(stored.receiver,"EMMA");
    assert.equal("collected" in stored,false,"A demo must never save sticker progress");
    assert.equal("orbs" in stored,false,"A demo must never save Dragon Balls");
    // Visit the other interactive chapters and acquire progress.
    await page.evaluate(()=>go(2));
    const memoryScrollBefore=await page.evaluate(()=>{
      const stage=document.getElementById("stage");stage.scrollTop=200;return stage.scrollTop;
    });
    await page.locator(".polaroid").first().click();
    if(memoryScrollBefore>0){
      const memoryScrollAfter=await page.evaluate(()=>document.getElementById("stage").scrollTop);
      assert.ok(memoryScrollAfter>0,"Tapping a memory must not return to the top");
    }
    assert.equal(await page.locator(".polaroid.flipped").count(),1);
    await page.evaluate(()=>go(4));
    await page.locator(".rival").first().click();
    assert.equal(await page.locator(".rival.done").count(),1);
    await page.evaluate(()=>go(1));
    await page.getByRole("button",{name:/ESCANEAR/}).click();
    await page.evaluate(()=>go(5));
    await page.locator("#chargeBtn").dispatchEvent("pointerdown",{pointerId:101});
    await page.waitForTimeout(1940);
    await page.locator("#chargeBtn").dispatchEvent("pointerup",{pointerId:101});
    assert.match(await page.locator("#powerHint").innerText(),/ENERGÍA 100%/,"Holding the button charges fully on mobile");
    await page.evaluate(()=>go(6));
    await page.locator(".orb").first().click();
    assert.equal(await page.locator(".orb.open").count(),1);
    // Revisit the final chapter and use the actual replay button.
    await page.evaluate(()=>go(8));
    await page.locator("#next").getByText("REVIVIR DESDE CERO").waitFor();
    await page.locator("#next").click();
    assert.equal(await page.locator("#page").innerText(),"01 / 09");
    assert.equal(await page.locator("#stickerCount").innerText(),"0/9");
    await page.evaluate(()=>go(3));
    assert.equal(await page.locator(".pack.opened").count(),0,"Envelopes reset after replay");
    await page.evaluate(()=>go(2));
    assert.equal(await page.locator(".polaroid.flipped").count(),0,"Memories reset after replay");
    await page.evaluate(()=>go(4));
    assert.equal(await page.locator(".rival.done").count(),0,"Rival cards reset after replay");
    await page.evaluate(()=>go(1));
    assert.match(await page.locator("#scanResult").innerText(),/PODER \?\?\?/,"Scouter reset");
    await page.evaluate(()=>go(6));
    assert.equal(await page.locator(".orb.open").count(),0,"Dragon Balls reset after replay");
    // Closing and re-opening the demo must also start with sealed packs.
    await page.reload({waitUntil:"domcontentloaded"});
    await page.evaluate(()=>go(3));
    assert.equal(await page.locator(".pack.opened").count(),0,"Envelopes reset on reload");
    assert.equal(await page.locator("#stickerCount").innerText(),"0/9");
    // Purchased gift links MUST retain their independent saved collectibles.
    const purchased=await context.newPage();
    await purchased.goto(base+"/dragon-ball-pareja.html?mode=gift&code=qa-preserve-20261102",{waitUntil:"domcontentloaded"});
    await purchased.evaluate(()=>localStorage.setItem("db_saga_gift_qa-preserve-20261102",JSON.stringify({
      receiver:"UNO",sender:"DOS",collected:[0,1],orbs:[2],
    })));
    await purchased.reload({waitUntil:"domcontentloaded"});
    await purchased.evaluate(()=>go(3));
    assert.equal(await purchased.locator(".pack.opened").count(),2,"Paid gift saved stickers preserved");
    assert.equal(await purchased.locator("#stickerCount").innerText(),"2/9");
    await purchased.evaluate(()=>go(6));
    assert.equal(await purchased.locator(".orb.open").count(),1,"Paid gift saved orbs preserved");
    await purchased.evaluate(()=>go(8));
    assert.match(await purchased.locator("#next").innerText(),/VOLVER AL INICIO/,"Paid gift semantics preserved");
    await purchased.locator("#next").click();
    await purchased.evaluate(()=>go(3));
    assert.equal(await purchased.locator(".pack.opened").count(),2,"Paid gift stays collected after going home");
    assert.deepEqual(errors,[],"Browser errors");
    await purchased.close();
    await page.close();
    await context.close();
    results.push(width);
    console.log("DRAGON_BALL_REPLAY_PASS",width);
  }
  console.log("DRAGON_BALL_DEMO_FRESH_REPLAY_PASS",JSON.stringify({viewports:results,checks:["new visit","legacy localStorage","open sticker","collect","scouter","memory","rivals","orbs","full replay","reload","paid gift unaffected"]}));
}finally{await browser.close()}
