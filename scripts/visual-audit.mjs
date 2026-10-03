import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.AUDIT_BASE_URL || "https://tehiceesto.com";
const outDir = path.resolve(process.env.AUDIT_OUTPUT_DIR || "visual-audit");
await fs.mkdir(outDir, { recursive: true });

const demos = [
  "pareja",
  "cumpleanos",
  "hijos",
  "abuelos",
  "aniversario",
  "propuesta",
  "mama",
  "papa",
  "amistad",
];

const configs = [
  { name: "desktop", viewport: { width: 1440, height: 1000 }, dpr: 1 },
  { name: "mobile", viewport: { width: 390, height: 844 }, dpr: 1 },
];

const auditDemos = process.env.AUDIT_DEMOS !== "false";

const report = {
  generatedAt: new Date().toISOString(),
  base,
  auditDemos,
  pages: [],
};

const browser = await chromium.launch({ headless: true });

async function inspectPage(page, route, mode, fullPage = true) {
  const errors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const url = base + route;
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
  await page.waitForTimeout(1600);

  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const overflow = root.scrollWidth - window.innerWidth;
    const offenders = [...document.querySelectorAll("body *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          cls: typeof element.className === "string" ? element.className.slice(0, 100) : "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.width > 0 && (item.left < -3 || item.right > window.innerWidth + 3))
      .slice(0, 18);

    return {
      width: window.innerWidth,
      scrollWidth: root.scrollWidth,
      overflow,
      height: window.innerHeight,
      bodyHeight: document.body.scrollHeight,
      offenders,
      title: document.title,
    };
  });

  const slug = route === "/" ? "home" : route.replace(/^\//, "").replaceAll("/", "-");
  const screenshot = path.join(outDir, `${slug}-${mode}.png`);
  await page.screenshot({ path: screenshot, fullPage });

  const headers = response ? await response.allHeaders() : {};

  report.pages.push({
    route,
    mode,
    status: response?.status() ?? null,
    screenshot: path.basename(screenshot),
    metrics,
    responseHeaders: {
      server: headers.server || null,
      vercelId: headers["x-vercel-id"] || null,
      cache: headers["x-vercel-cache"] || null,
    },
    errors,
    consoleErrors,
  });

  return { errors, consoleErrors, metrics };
}

async function traverseDemo(page, slug, mode) {
  const route = `/experiencias/${slug}`;
  const response = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 35000 });
  await page.waitForTimeout(1200);

  const visited = [];
  const stuck = [];
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  for (let sceneIndex = 0; sceneIndex < 15; sceneIndex += 1) {
    const scene = await page.locator(".experience-shell").getAttribute("data-current-scene");
    if (!scene || visited.includes(scene)) break;
    visited.push(scene);

    const screenshot = path.join(
      outDir,
      `demo-${slug}-${mode}-${String(sceneIndex + 1).padStart(2, "0")}-${scene}.png`,
    );
    await page.screenshot({ path: screenshot, fullPage: false });

    if (["finale", "proposal"].includes(scene)) break;

    let advanced = false;
    for (let attempt = 0; attempt < 18 && !advanced; attempt += 1) {
      const before = await page.locator(".experience-shell").getAttribute("data-current-scene");

      const primary = page.locator(".scene button.primary-action:not([disabled])").last();
      if (await primary.count()) {
        try {
          if (await primary.isVisible()) {
            await primary.click({ timeout: 2500 });
            await page.waitForTimeout(280);
          }
        } catch {}
      } else {
        const hold = page.locator(".scene .threshold-hold, .scene .hold-button").first();
        if (await hold.count()) {
          try {
            const box = await hold.boundingBox();
            if (box) {
              await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
              await page.mouse.down();
              await page.waitForTimeout(1750);
              await page.mouse.up();
              await page.waitForTimeout(250);
            }
          } catch {}
        } else {
          const buttons = page.locator(".scene button:not([disabled])");
          const count = Math.min(await buttons.count(), 12);
          let clicked = false;
          for (let i = 0; i < count; i += 1) {
            const button = buttons.nth(i);
            try {
              if (await button.isVisible()) {
                await button.click({ timeout: 1800 });
                await page.waitForTimeout(120);
                clicked = true;
              }
            } catch {}
            const current = await page.locator(".experience-shell").getAttribute("data-current-scene");
            if (current !== before) break;
          }

          if (!clicked) {
            const scratch = page.locator(".scratch-card, .scratch-surface, canvas").first();
            if (await scratch.count()) {
              const box = await scratch.boundingBox();
              if (box) {
                for (let y = 0.2; y <= 0.8; y += 0.2) {
                  await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * y);
                  await page.mouse.down();
                  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * y, { steps: 12 });
                  await page.mouse.up();
                }
                await page.waitForTimeout(250);
              }
            }
          }
        }
      }

      const after = await page.locator(".experience-shell").getAttribute("data-current-scene");
      advanced = Boolean(after && after !== before);
    }

    if (!advanced) {
      stuck.push(scene);
      break;
    }
  }

  const metrics = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
  }));

  report.pages.push({
    route,
    mode,
    status: response?.status() ?? null,
    traversedScenes: visited,
    stuck,
    metrics,
    errors: pageErrors,
    consoleErrors,
  });
}

for (const config of configs) {
  const context = await browser.newContext({
    viewport: config.viewport,
    deviceScaleFactor: config.dpr,
    locale: "es-AR",
    reducedMotion: "no-preference",
  });

  const page = await context.newPage();

  for (const route of ["/", "/crear"]) {
    try {
      await inspectPage(page, route, config.name, true);
    } catch (error) {
      report.pages.push({
        route,
        mode: config.name,
        fatal: String(error),
      });
    }
  }

  if (auditDemos) {
    for (const slug of demos) {
      try {
        await traverseDemo(page, slug, config.name);
      } catch (error) {
        report.pages.push({
          route: `/experiencias/${slug}`,
          mode: config.name,
          fatal: String(error),
        });
      }
    }
  }

  await context.close();
}

await browser.close();
await fs.writeFile(
  path.join(outDir, "report.json"),
  JSON.stringify(report, null, 2),
);

const summary = report.pages.map((entry) => ({
  route: entry.route,
  mode: entry.mode,
  status: entry.status,
  overflow: entry.metrics?.overflow ?? null,
  errors: entry.errors?.length ?? 0,
  consoleErrors: entry.consoleErrors?.length ?? 0,
  stuck: entry.stuck || [],
  scenes: entry.traversedScenes || [],
}));

console.log(JSON.stringify(summary, null, 2));
