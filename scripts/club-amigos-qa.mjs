import {chromium} from "playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";

const root=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const out="visual-club-amigos";
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const report=[];
async function stableCapture(page,file){
 await page.locator(".club-stage").evaluate(el=>Promise.all(el.getAnimations({subtree:false}).map(a=>a.finished.catch(()=>{}))));
 await page.screenshot({path:path.join(out,file)});
}

for(const vp of [{name:"android-320",width:320,height:720},{name:"android-390",width:390,height:844},{name:"desktop-1440",width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1,isMobile:vp.width<600,hasTouch:vp.width<600});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  const r=await page.goto(root+"/experiencias/club-amigos?embed=1",{waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(r?.status(),200,"Club demo must be reachable");
  await page.locator(".club-experience").waitFor();
  assert.equal(await page.locator('[data-current-scene="club"]').count(),1);
  assert.match(await page.locator(".club-door-sign").innerText(),/CLUB DE/);
  await stableCapture(page,vp.name+"-opening.png");
  await page.getByRole("button",{name:/TOCÁ PARA ENTRAR/}).click();
  assert.equal(await page.locator(".club-door-scene.is-entering").count(),1,"Door should travel into the club");
  await page.locator(".club-chapter h2").filter({hasText:/La banda/i}).waitFor({state:"visible",timeout:5000});
  assert.match(await page.locator(".club-chapter h2").innerText(),/La banda/i);
  await page.getByRole("button",{name:"Escuchar a Luna"}).click();
  assert.match(await page.locator(".club-speech-card").innerText(),/Luna dice/i);
  for(let step=1;step<=14;step++){
    if(step===4){
      await page.locator(".club-note").first().click();
      assert.match(await page.locator(".club-note").first().innerText(),/Las ideas que empezaron/i);
    }
    if(step===5){
      await page.locator(".club-map-pin").first().click();
      assert.equal(await page.locator(".club-map-pin.active").count(),1);
    }
    if(step===6){
      await page.getByRole("button",{name:/RECIBIR MENSAJE/}).click();
      assert.equal(await page.locator(".club-chat-msg").count(),2);
    }
    if(step===10){
      await page.getByRole("button",{name:/GIRAR LA RULETA/}).click();
      assert.equal(await page.locator(".club-wheel-result").innerText()!=="El próximo recuerdo está esperando…",true);
    }
    if(step===11){
      await page.locator(".club-wish").first().click();
      assert.match(await page.locator(".club-wish").first().innerText(),/Seguir sumando/);
    }
    if(step===12){
      await page.getByRole("button",{name:/Abrir el cofre/}).click();
      assert.equal(await page.locator(".club-treasure-photos .club-polaroid").count(),4);
    }
    if(step===14){
      await page.getByRole("button",{name:/Revelar sorpresa/}).click();
      assert.equal(await page.locator(".club-gift-message").count(),1);
    }
    if([4,8,12,14].includes(step))await stableCapture(page,vp.name+"-scene-"+step+".png");
    assert.equal(await page.locator(".club-step-number").innerText(),String(step+1).padStart(2,"0")+" / 16");
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2),false,"Horizontal overflow at "+vp.name+" step "+step);
    await page.locator(".club-footer .club-primary").click();
  }
  assert.match(await page.locator(".club-finale-brand").innerText(),/AMIGOS POR SIEMPRE/);
  await stableCapture(page,vp.name+"-finale.png");
  await page.getByRole("button",{name:/Volver a vivirlo/}).click();
  assert.equal(await page.locator(".club-step-number").innerText(),"01 / 16");
  assert.deepEqual(errors,[],"No browser exceptions");
  report.push({viewport:vp.name,chapters:16,interactive:true,repeat:true,errors:errors.length});
  await page.close();
}
await browser.close();
const files=["components/ClubAmigosExperience.tsx","data/experiences.ts","supabase/functions/order-create/index.ts","supabase/functions/creator-api/index.ts"];
const text=await Promise.all(files.map(f=>fs.readFile(f,"utf8")));
assert.match(text[0],/sceneTextOverrides\?\.club\?\.\[value\]/,"Client can customize model copy");
assert.match(text[0],/photoMedia\[i\]\?\.url/,"Client photos replace placeholders");
assert.match(text[0],/audioMedia\[0\]\.url/,"Client audio replaces placeholder");
assert.match(text[1],/slug: "club-amigos"/,"Independent model exists");
assert.match(text[2],/"club-amigos": \["club"\]/,"Purchase must freeze club recipe");
assert.match(text[3],/"club-amigos": \["club"\]/,"Studio must allow club content editing");
await fs.writeFile(path.join(out,"report.json"),JSON.stringify(report,null,2));
console.log("CLUB_AMIGOS_16_SCENES_MOBILE_OK",JSON.stringify(report));
