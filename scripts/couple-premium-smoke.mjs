import fs from "node:fs/promises";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const report = [];
await fs.mkdir("visual-smoke/pareja-premium", { recursive: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

try {
  for (const [name, width, height] of [["desktop", 1280, 900], ["mobile", 390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: name === "mobile" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("http://127.0.0.1:3000/experiencias/pareja", { waitUntil: "domcontentloaded" });
    const at = async scene => await page.waitForFunction((s) => document.querySelector(".experience-shell")?.getAttribute("data-current-scene") === s, scene, { timeout: 10000 });

    await at("intro");
    await page.locator(".scene-intro .primary-action").click();
    await at("door");
    await page.waitForTimeout(950);
    await page.screenshot({ path: "visual-smoke/pareja-premium/" + name + "-door.png" });
    await page.locator(".couple-real-door-button").click();
    await page.waitForTimeout(300);
    assert(await page.locator(".couple-door-scene.door-opened").count() > 0, "Door did not animate before changing scene");
    await at("memories");
    await page.waitForTimeout(950);
    await page.screenshot({ path: "visual-smoke/pareja-premium/" + name + "-memories.png" });

    assert(await page.locator(".couple-print").count() === 1, "Album photograph missing");
    await page.locator(".couple-photo-arrow.next").click();
    assert((await page.locator(".couple-print-foot small").innerText()).includes("02"), "Album navigation failed");
    await page.locator(".couple-continue").click();
    await at("stars");
    await page.waitForTimeout(950);
    await page.screenshot({ path: "visual-smoke/pareja-premium/" + name + "-stars.png" });

    assert(await page.locator(".couple-continue").isDisabled(), "Stars should require discovery");
    for (let i = 0; i < 3; i++) await page.locator(".couple-real-star").nth(i).click();
    assert(await page.locator(".couple-real-star.lit").count() === 3, "Stars did not light up");
    await page.locator(".couple-continue").click();
    await at("scratch");
    await page.waitForTimeout(950);
    await page.screenshot({ path: "visual-smoke/pareja-premium/" + name + "-scratch.png" });

    const foil = page.locator(".couple-scratch-canvas");
    await foil.click({ position: { x: 20, y: 25 } });
    assert(await page.locator(".couple-continue").isDisabled(), "Scratch could be bypassed by click");
    const box = await foil.boundingBox();
    assert(box && box.width > 120, "Scratch canvas has no dimensions");
    const x0 = box.x + 8;
    const x1 = box.x + box.width - 8;
    await page.mouse.move(x0, box.y + 14);
    await page.mouse.down();
    for (let y = 14, n = 0; y < box.height - 12; y += 19, n++) {
      const to = n % 2 === 0 ? x1 : x0;
      await page.mouse.move(to, box.y + y, { steps: 4 });
    }
    await page.mouse.up();
    assert(!(await page.locator(".couple-continue").isDisabled()), "Scratch did not unlock after real erasure");
    await page.locator(".couple-continue").click();
    await at("letter");
    await page.waitForTimeout(950);
    await page.screenshot({ path: "visual-smoke/pareja-premium/" + name + "-letter.png" });
    assert(await page.locator(".couple-letter-sheet").getAttribute("aria-hidden") === "true", "Letter exposed before opening");
    await page.locator(".couple-wax-seal").click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: "visual-smoke/pareja-premium/" + name + "-letter-open.png" });
    assert(await page.locator(".couple-letter-sheet").getAttribute("aria-hidden") === "false", "Letter did not open");
    await page.locator(".couple-continue").click();
    await at("finale");

    assert(errors.length === 0, "Runtime errors: " + errors.join(" | "));
    report.push({ name, width, height, result: "passed", routes: 7, realScratch: true, interactions: ["door", "album", "stars", "scratch", "letter"] });
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ premiumCouple: report }, null, 2));
