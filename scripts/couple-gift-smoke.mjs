import fs from "node:fs/promises";
import { chromium } from "playwright";

// The production Pareja model uses PremiumOpeningIntro (floral card).
// Protect the active visual source of truth; do not test the superseded gift-box UI.
const base = "http://127.0.0.1:3000";
const assert = (test, message) => { if (!test) throw Error(message); };
await fs.mkdir("visual-smoke/couple-gift", { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [mode,width,height] of [["mobile",390,844],["desktop",1440,960]]) {
    const context = await browser.newContext({ viewport: { width,height },hasTouch:mode==="mobile",isMobile:mode==="mobile",locale:"es-AR",reducedMotion:"no-preference" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    const response = await page.goto(base+"/experiencias/pareja",{waitUntil:"domcontentloaded"});
    assert(response?.status()===200, "Pareja model route failed");

    await page.locator(".premium-intro--flowers.premium-intro--sealed").waitFor();
    assert(await page.locator(".premium-note[aria-hidden='true']").count()===1, "Dedication exposed before opening");
    assert(await page.locator(".premium-continue").isDisabled(), "Continue CTA unlocked before opening");
    assert((await page.locator(".premium-start").innerText()).includes("Abrí"), "Current floral gift prompt missing");
    await page.screenshot({path:"visual-smoke/couple-gift/"+mode+"-sealed.png"});

    await page.locator(".premium-start").click();
    await page.locator(".premium-intro--unfolding").waitFor({timeout:2500});
    assert(await page.locator(".premium-continue").isDisabled(), "CTA unlocked before reveal");
    await page.locator(".premium-intro--revealed").waitFor({timeout:4500});
    await page.locator(".premium-note[aria-hidden='false']").waitFor();
    const name = (await page.locator(".premium-note h2").innerText()).trim();
    assert(name==="Emma", "Recipient personalization changed");
    assert(!(await page.locator(".premium-continue").isDisabled()), "Continue CTA remained disabled");
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth-window.innerWidth);
    assert(horizontalOverflow<=1, "Horizontal overflow="+horizontalOverflow);
    await page.screenshot({path:"visual-smoke/couple-gift/"+mode+"-revealed.png"});

    await page.locator(".premium-continue").click();
    await page.locator("main[data-scene='door']").waitFor({timeout:7500});
    assert(await page.locator(".thi-door-wrap").count()===1, "Original door scene after gift changed");
    assert(errors.length===0, "Browser errors: "+errors.join(" | "));
    results.push({mode,width,height,passed:true,opened:true,recipient:name,originalDoorPreserved:true,horizontalOverflow});
    await context.close();
  }
} finally {
  await browser.close();
}
await fs.writeFile("visual-smoke/couple-gift/report.json",JSON.stringify(results,null,2));
console.log("PAREJA_CURRENT_MODEL_SMOKE_PASS",JSON.stringify(results));
