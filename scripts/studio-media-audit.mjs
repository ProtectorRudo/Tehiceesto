import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read = path => readFileSync(new URL("../"+path, import.meta.url), "utf8");
const studio = read("components/StudioEnhancements.tsx");
const dragon = read("components/DragonBallEditor.tsx");
const preview = read("components/DragonBallPreview.tsx");
const gift = read("components/DragonBallGift.tsx");
const published = read("app/r/[code]/page.tsx");
const recipe = read("data/experiences.ts");
const sticker = read("components/StickerBombEditor.tsx");

test("Dragon Ball preview renders the purchased model, never the generic scene engine", () => {
  assert.match(studio, /gift\.experience_slug==="dragon-ball-pareja"\s*\?\s*<DragonBallPreview/);
  assert.match(preview, /dragon-ball-pareja\.html\?mode=gift&code=/);
  assert.match(preview, /tehiceesto:dragon-ball:gift/);
  assert.match(gift, /tehiceesto:dragon-ball:gift/);
  assert.match(published, /slug==="dragon-ball-pareja"\)\s*return\s*<>\s*<DragonBallGift/);
  assert.match(studio, /onDraftChange=\{setDragonDraft\}/);
  assert.match(dragon, /useEffect\(\(\)=>\{onDraftChange\?\.\(draft\)/);
  assert.match(studio, /photoMediaIds/);
  assert.match(studio, /voiceMediaId/);
});

test("All shared gift uploads use a signed upload token and only register after success", () => {
  assert.match(studio, /uploadToSignedUrl\(prepared\.path,prepared\.token,file/);
  assert.match(studio, /file\.size <= 6\*1024\*1024/);
  assert.match(studio, /try \{await uploadResumable\(\);\}\s*catch \{setProgress\(0\);await uploadSigned\(\);\}/);
  assert.ok(studio.indexOf('await uploadSigned();') < studio.indexOf('await action(access, "registerStudioMedia"'));
  assert.match(studio, /await refreshMedia\(\)/);
  assert.match(studio, /orderedMedia\.length/);
});

test("Special preview types are routed explicitly instead of silently falling into a generic model", () => {
  assert.match(studio, /<Jar365Experience/);
  assert.match(studio, /<SevenDaysExperience/);
  assert.match(studio, /<DragonBallPreview/);
  assert.match(studio, /<ExperienceEngine/);
  assert.match(sticker, /<StickerBombExperience/);
  assert.ok(!sticker.includes("<iframe"),"Sticker editor must not embed a foreign website");
  const stickerModel=read("components/StickerBombExperience.tsx");
  const engine=read("components/ExperienceEngine.tsx");
  const giftRepo=read("lib/gifts/repository.ts");
  assert.ok(stickerModel.includes("stickerBombChapters"));
  assert.ok(stickerModel.includes("normalizeStickerBomb(copy)"));
  assert.ok(engine.includes('props.experience.slug === "sticker-bomb-amistad"'));
  assert.ok(published.includes('slug==="sticker-bomb-amistad") return <><StickerBombExperience'));
  assert.ok(giftRepo.includes("stickerBomb:row.story_data?.stickerBomb"));
  assert.ok(studio.includes("browserJpegFromHeic"));
  assert.ok(studio.includes("await refreshMedia();setPreview(true)"));
  const slugs = Array.from(recipe.matchAll(/\bslug:\s*"([^"]+)"/g), match => match[1]);
  assert.ok(slugs.length >= 12, "Catalog unexpectedly shrank; audit changed experience routes");
  for (const slug of ["dragon-ball-pareja", "sticker-bomb-amistad", "frasco365", "siete-dias"]) {
    assert.ok(slugs.includes(slug), slug+" is missing from the catalog");
  }
});
