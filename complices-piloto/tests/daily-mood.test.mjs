import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DAILY_MOODS,CARE_NEEDS,careSuggestion,validMood,validCareNeed} from "../lib/today-care.mjs";
const page=readFileSync(new URL("../app/page.jsx",import.meta.url),"utf8");
const component=readFileSync(new URL("../components/DailyMoodCard.jsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/paired-redesign.css",import.meta.url),"utf8");
const sql=readFileSync(new URL("../sql/20261116_mi_momento_de_hoy.sql",import.meta.url),"utf8");

test("ocho emociones y cinco necesidades válidas",()=>{
 assert.equal(DAILY_MOODS.length,8);
 assert.equal(CARE_NEEDS.length,5);
 for(const m of DAILY_MOODS)assert.equal(validMood(m.key),true);
 for(const n of CARE_NEEDS){assert.equal(validCareNeed(n.key),true);assert.ok(careSuggestion(n.key))}
 assert.equal(validMood("desconocida"),false);
 assert.equal(validCareNeed("inventado"),false);
 assert.equal(careSuggestion("inventado"),null);
});
test("emociones personales nunca aparecen en la tabla de pistas",()=>{
 assert.match(sql,/create table public\.cp_today_moods/);
 assert.match(sql,/create table public\.cp_partner_care_hints/);
 const hints=sql.split("create table public.cp_partner_care_hints (")[1].split(");")[0];
 assert.doesNotMatch(hints,/\bmood\b/);
 assert.match(sql,/alter table public\.cp_today_moods enable row level security/);
 assert.match(sql,/alter table public\.cp_partner_care_hints enable row level security/);
 assert.match(sql,/grant select on public\.cp_partner_care_hints to authenticated/);
 assert.doesNotMatch(sql,/grant (insert|update|delete) on public\.cp_partner_care_hints to authenticated/);
 assert.match(sql,/new\.share_care_hint and new\.care_need is not null/);
 assert.match(sql,/user_id <> \(select auth\.uid\(\)\)/);
});
test("consentimiento explícito y revocable en la tarjeta sin nueva pestaña",()=>{
 assert.match(component,/Compartir una pista de cuidado/);
 assert.match(component,/checked=\{Boolean\(need&&share\)\}/);
 assert.match(component,/setShare\(false\)/);
 assert.match(component,/Mi emoción nunca se comparte/);
 assert.match(component,/onClear/);
 assert.match(page,/DailyMoodCard/);
 assert.match(page,/cp_today_moods/);
 assert.match(page,/cp_partner_care_hints/);
 assert.match(css,/\.daily-moment/);
});
test("no hay puntos, diagnósticos ni promesas de terapia por responder",()=>{
 assert.doesNotMatch(component,/puntos|diagnóstic|terapia|racha/i);
 assert.match(page,/share_care_hint/);
});
