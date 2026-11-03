import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Every published gift family exposes the complete customer voice collection",()=>{
  const page=read("app/r/[code]/page.tsx");
  assert.equal(page.split("<GiftVoiceCollection audios={storedGift.audioMedia}").length-1,5,
    "Dragon Ball, withdrawn historical gifts, Jar, Seven Days and regular gifts must all have voice access");
  assert.ok(page.indexOf("<GiftVoiceCollection")<page.indexOf("// Development fallback"),
    "The collection is private and should not be inserted into public demos");
  assert.match(page,/if\(storedGift\.rendererFamily==="dragon-ball"\)return/);
  assert.match(page,/if \(storedGift\.rendererFamily==="jar365"\)/);
  assert.match(page,/if \(storedGift\.rendererFamily==="seven-days"\)/);
});

test("The creator preview contains the same complete collection before publishing",()=>{
  const editor=read("components/StudioEnhancements.tsx");
  assert.match(editor,/preview && model && <GiftVoiceCollection audios=\{audioMedia\} embedded\/>/);
  assert.ok(editor.includes("role!==\"soundtrack\""));
});

test("The collection plays every voice without arbitrary 1, 2 or 3 message limits",()=>{
  const source=read("components/GiftVoiceCollection.tsx");
  assert.match(source,/voices\.map\(\(voice,index\)/);
  assert.doesNotMatch(source,/voices\.slice\(/);
  assert.match(source,/controls/);
  assert.match(source,/preload="none"/);
  assert.match(source,/if\(voices\.length===0\)return null/);
  assert.match(source,/onPlay=\{event=>playOnly\(event\.currentTarget\)\}/);
});

test("Mamá and Papá preserve their demos but do not truncate a paying customer's messages",()=>{
 const engine=read("components/legacy-v5/ExperienceEngine.tsx");
 const rule="const count=customerGift?currentAudios.length:Math.min(3,Math.max(currentAudios.length,voiceEntries.length));";
 assert.equal(engine.split(rule).length-1,2);
 assert.doesNotMatch(engine,/const count=Math\.min\(3,customerGift/);
});

test("Soundtracks are excluded from the personal collection",()=>{
  const repository=read("lib/gifts/repository.ts");
  assert.match(repository,/item\.metadata\?\.role !== "soundtrack"/);
  const editor=read("components/StudioEnhancements.tsx");
  assert.match(editor,/m\.metadata\?\.role !== "soundtrack"/);
});

test("Private voice list is not an editable or buyer-authorized endpoint",()=>{
  const component=read("components/GiftVoiceCollection.tsx");
  assert.doesNotMatch(component,/createClient|service_role|SUPABASE_SECRET|fetch\(/);
  assert.match(component,/aria-modal="true"/);
  assert.match(component,/event\.key==="Escape"/);
  assert.match(component,/document\.body\.style\.overflow/);
  assert.match(component,/gift-voice-collection-title/);
});

test("Invited guest recordings are saved as voice files for the gift, not replacing the original narration",()=>{
  const service=read("supabase/functions/guest-voice/index.ts");
  assert.match(service,/source:"guest_voice",role:"voice",guestSpeaker:speaker/);
  assert.match(service,/const MAX_INVITE_UPLOADS=12/);
  assert.match(service,/const availableSlots=Math.min\(MAX_INVITE_UPLOADS,MAX_GIFT_MEDIA-usedMedia\)/);
  assert.match(service,/max_submissions:availableSlots/);
  assert.ok(service.indexOf("const usedMedia=await mediaCount")<
    service.indexOf('// At most one active link'),
    "Capacity must be checked before any active invite is revoked");
  assert.match(read("components/GuestVoiceInvites.tsx"),/El enlace permite hasta 12 mensajes, según el espacio disponible/);
});
