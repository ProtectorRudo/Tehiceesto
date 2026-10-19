import fs from "node:fs/promises";
import { chromium } from "playwright";

const assert = (test, message) => { if (!test) throw new Error(message); };
const base = process.env.BIRTHDAY_SMOKE_BASE_URL || "http://127.0.0.1:3000";
await fs.mkdir("visual-smoke/birthday", { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [mode, width, height] of [["mobile", 390, 844], ["desktop", 1366, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: mode === "mobile", hasTouch: mode === "mobile", locale: "es-AR", reducedMotion: "no-preference" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto(base + "/experiencias/cumpleanos", { waitUntil: "domcontentloaded" });
    assert(response?.status() === 200, "Cumpleaños route not available");
    await page.locator(".birthday-gift-intro.gift-phase-closed").waitFor();
    await page.screenshot({ path: "visual-smoke/birthday/" + mode + "-01-gift.png" });
    await page.locator(".couple-gift-unseal").click();
    await page.locator(".gift-phase-revealed").waitFor({ timeout: 7000 });
    assert(await page.locator(".couple-gift-reveal h1").innerText() === "Sofi", "Birthday name lost");
    await page.locator(".couple-gift-continue").click();
    await page.locator(".birthday-candles--lit").waitFor();
    await page.screenshot({ path: "visual-smoke/birthday/" + mode + "-02-cake.png" });
    await page.getByRole("button", { name: /Soplar las velitas/ }).click();
    await page.locator(".birthday-candles--out").waitFor({ timeout: 5000 });
    await page.locator(".birthday-candles .birthday-button").click();
    await page.locator(".birthday-balloons-grid").waitFor();
    await page.screenshot({ path: "visual-smoke/birthday/" + mode + "-03-balloons.png" });
    for (let i = 0; i < 3; i++) await page.locator(".birthday-balloon-item:not(.is-popped)").first().click();
    assert(await page.locator(".birthday-balloon-item.is-popped").count() === 3, "Balloon pop not persisted");
    await page.locator(".birthday-balloons .birthday-button").click();
    await page.locator(".scene-memories .primary-action").click();
    await page.locator(".voice-grid").waitFor();
    const playable = page.locator(".voice-grid button");
    if (await playable.count()) await playable.first().click();
    else {
      const audio = page.locator(".voice-grid audio");
      if (await audio.count()) await audio.first().evaluate(e => { e.dispatchEvent(new Event("play")); });
    }
    await page.locator(".scene-voices .primary-action").click();
    await page.locator(".birthday-promise-stack").waitFor();
    await page.screenshot({ path: "visual-smoke/birthday/" + mode + "-04-promises.png" });
    for (let i = 0; i < 3; i++) await page.locator(".birthday-promise-ticket").nth(i).click();
    assert(await page.locator(".birthday-promise-ticket.is-unfolded").count() === 3, "Three promises not opened");
    await page.locator(".birthday-promise .birthday-button").click();
    await page.locator(".scene-letter-birthday .envelope").waitFor();
    await page.screenshot({ path: "visual-smoke/birthday/" + mode + "-05-envelope.png" });
    await page.locator(".scene-letter-birthday .envelope").click();
    await page.locator(".scene-letter-birthday .envelope.open").waitFor();
    await page.locator(".scene-letter-birthday .primary-action").click();
    await page.locator(".birthday-hugs").waitFor();
    await page.screenshot({ path: "visual-smoke/birthday/" + mode + "-06-hugs.png" });
    await page.getByRole("button", { name: /Recibir mis abrazos/ }).click();
    await page.locator(".birthday-hugs.is-complete").waitFor({ timeout: 18000 });
    assert((await page.locator(".birthday-hugs-progress .delivered").count()) === 6, "Missing birthday hugs");
    await page.screenshot({ path: "visual-smoke/birthday/" + mode + "-07-hugs-delivered.png" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 2, "Birthday horizontal overflow: " + overflow);
    assert(errors.length === 0, "Birthday JavaScript errors: " + errors.join(" | "));
    results.push({ mode, passed: true, scenes: 8, balloons: 3, promises: 3, hugs: 6, horizontalOverflow: overflow });
    await context.close();
  }
} finally {
  await browser.close();
}
await fs.writeFile("visual-smoke/birthday/report.json", JSON.stringify(results, null, 2));
console.log("BIRTHDAY_SMOKE_RESULTS", JSON.stringify(results));
