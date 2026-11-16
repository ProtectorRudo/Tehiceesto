import test from "node:test";
import assert from "node:assert/strict";
import {assessMission,validateBatch,isoDay,monday} from "../lib/quality.mjs";
import {editorialMissions,editorialWeekly} from "../lib/fallback.mjs";
const children=[{id:"uno",age_years:1},{id:"dos",age_years:9},{id:"tres",age_years:15}];
test("exactamente 3 misiones por hijo: conectar comprender sembrar",()=>{
 const m=editorialMissions(children);assert.equal(m.length,9);
 for(const c of children)assert.deepEqual(m.filter(x=>x.child_id===c.id).map(x=>x.kind),["conectar","comprender","sembrar"]);
});
test("misiones editoriales seguras y sin compras",()=>{
 const batch=editorialMissions(children);
 for(const m of batch)assert.deepEqual(assessMission(m).issues,[],JSON.stringify(m));
 assert.equal(validateBatch(children,batch,editorialWeekly()),true);
 assert.equal(assessMission({...batch[0],how:"Obligá a tu hijo a comprar un juego para jugar en casa."}).pass,false);
});
test("calendario por zona del cuidador y semana comienza lunes",()=>{
 assert.equal(isoDay(new Date("2026-11-17T01:00:00Z")),"2026-11-16");
 assert.equal(monday("2026-11-22"),"2026-11-16");
});
test("lote incompleto rechazado",()=>{
 const a=editorialMissions(children.slice(0,1));
 assert.equal(validateBatch(children.slice(0,1),a,editorialWeekly()),true);
 assert.equal(validateBatch(children.slice(0,1),a.slice(0,2),editorialWeekly()),false);
});
