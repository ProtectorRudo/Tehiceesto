import {test,expect} from "@playwright/test";

test("ambiente musical CC0 descargado y servido con licencia verificable",async({request})=>{
  const meta=await request.get("/audio/credits.json");
  expect(meta.ok()).toBe(true);
  const license=await meta.json();
  expect(license.license).toContain("CC0");
  expect(license.source).toContain("opengameart.org");
  const music=await request.get("/audio/lost.ogg");
  expect(music.ok()).toBe(true);
  const bytes=await music.body();
  expect(bytes.length).toBeGreaterThan(100_000);
  expect(bytes.subarray(0,4).toString("ascii")).toBe("OggS");
});
