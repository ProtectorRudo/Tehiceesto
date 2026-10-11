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


test("pasos y portazo grabados CC0 disponibles para audio espacial",async({request})=>{
  const response=await request.get("/audio/sfx-credits.json");
  expect(response.ok()).toBe(true);
  const credits=await response.json();
  for(const key of ["footstep","door"]){
    expect(credits[key]?.license).toContain("CC0");
    expect(credits[key]?.source).toContain("opengameart.org");
    const sound=await request.get("/audio/"+key+".ogg");
    expect(sound.ok()).toBe(true);
    const bytes=await sound.body();
    expect(bytes.length).toBeGreaterThan(4500);
    expect(bytes.subarray(0,4).toString("ascii")).toBe("OggS");
  }
});
