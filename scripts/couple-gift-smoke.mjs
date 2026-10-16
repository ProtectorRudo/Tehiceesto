import fs from "node:fs/promises";
import { chromium } from "playwright";
const url = "http://127.0.0.1:3000";
const assert = (test, message) => { if (!test) throw Error(message); };
await fs.mkdir("visual-smoke/couple-gift", { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [mode,width,height] of [["mobile",390,844],["desktop",1440,960]]) {
    const context = await browser.newContext({ viewport: { width,height },hasTouch:mode==="mobile",isMobile:mode==="mobile",locale:"es-AR" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    const response = await page.goto(url+"/experiencias/pareja",{waitUntil:"domcontentloaded"});
    assert(response?.status()===200, "Pareja route failed");
    await page.locator(".couple-gift-intro.gift-phase-closed").waitFor();
    assert(await page.locator(".couple-gift-reveal[aria-hidden='true']").count()===1, "Dedication exposed before unwrapping");
    assert(await page.locator(".couple-gift-continue").isDisabled(), "CTA enabled before gift opening");
    assert((await page.locator(".couple-gift-unseal").innerText()).includes("Abrí"), "Gift prompt missing");
    await page.screenshot({path:"visual-smoke/couple-gift/"+mode+"-closed.png"});
    await page.locator(".couple-gift-unseal").click();
    await page.locator(".gift-phase-untying").waitFor();
    assert(await page.locator(".couple-gift-continue").isDisabled(), "CTA unlocked too early");
    await page.locator(".gift-phase-opening").waitFor({timeout:4000});
    await page.locator(".gift-phase-revealed").waitFor({timeout:6000});
    await page.waitForTimeout(700);
    assert(await page.locator(".couple-gift-reveal[aria-hidden='false']").count()===1, "Dedication not revealed");
    const name = await page.locator(".couple-gift-reveal h1").innerText();
    assert(name==="Emma", "Recipient personalization lost");
    assert(!(await page.locator(".couple-gift-continue").isDisabled()), "Continue CTA remained disabled");
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth-window.innerWidth);
    assert(horizontalOverflow<=1, "Horizontal overflow="+horizontalOverflow);
    await page.screenshot({path:"visual-smoke/couple-gift/"+mode+"-revealed.png"});
    await page.locator(".couple-gift-continue").click();
    await page.waitForFunction(() => document.querySelector(".experience-shell")?.getAttribute("data-current-scene")==="door",{timeout:7000});
    assert(await page.locator(".door-wrap").count()===1, "Original scene after gift changed");
    assert(errors.length===0, "Page errors: "+errors.join(" | "));
    results.push({mode,width,height,passed:true,opened:true,recipient:name,otherScenesPreserved:true,horizontalOverflow});
    await context.close();
  }
} finally {
  await browser.close();
}
await fs.writeFile("visual-smoke/couple-gift/report.json",JSON.stringify(results,null,2));
console.log("COUPLE_GIFT_TEST_RESULTS",JSON.stringify(results));
