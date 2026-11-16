// Editor de Cómplices: dos opciones por misión, selección local y sin segunda llamada a IA.
// No recibe información del otro fuera de códigos y temas compartibles autorizados.
import {evaluateMission} from "./mission-quality.mjs";
import {isIdeaCompatible} from "./ai-profile.mjs";
import {mergeGeneratedIdeas} from "./central-content.mjs";
import {auditMissionSubstance,QUALITY_STANDARD_VERSION} from "./mission-substance.mjs";

export const EDITORIAL_ENGINE_VERSION="meaningful-editorial-20261116-v3-"+QUALITY_STANDARD_VERSION;
export const EDITORIAL_MECHANICS=Object.freeze([
 "alivio","sorpresa","experiencia","humor","recuerdo","palabras","atencion"
]);
const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const generic=/\b(tres pistas|tres adivinanzas|ronda de adivinanzas|compartan anecdotas|un juego de preguntas|una lista de recuerdos|hagan una lista|miren una foto|cuenten una anecdota|una nota bonita|escribi una nota|pasen tiempo de calidad|compartan un rato|conversen diez minutos)\b/;
const emotion=/\b(admir|agradec|valora|reconoc|alivia|ayud|orgull|cuid|descans|tranquil|sorpres|acompan|elegid|record|sonris|signific)\w*/;
const followThrough=/\b(cuando llegue|al volver|antes de|despues de|en su lugar|sin pedir|deja|dejale|prepara|organiz|elegi|guarda|concret|comparti|mostra|entrega|ofrece|reparti)\w*/;
const forbiddenAssumptions=/\b(se que tu pareja|tu pareja te confeso|tu pareja necesita que|tu pareja piensa que|secretamente quiere|tu pareja esta triste|tu pareja se siente)\b/;
function tokens(s){return new Set(normalize(s).split(" ").filter(w=>w.length>4))}
function similarity(a,b){const aa=tokens(a),bb=tokens(b);if(!aa.size||!bb.size)return 0;const common=[...aa].filter(w=>bb.has(w)).length;return common/Math.min(aa.size,bb.size)}
export function buildEditorialSchema(slots=[]){
 const idea={type:"object",additionalProperties:false,required:["title","body","mechanic"],
  properties:{title:{type:"string"},body:{type:"string"},mechanic:{type:"string",enum:EDITORIAL_MECHANICS}}};
 return {type:"object",additionalProperties:false,required:slots,
  properties:Object.fromEntries(slots.map(slot=>[slot,{type:"object",additionalProperties:false,required:["a","b"],
   properties:{a:idea,b:idea}}]))};
}
export function evaluateEditorialCandidate(candidate,{slot,partnerProfile={},recentTitles=[],previousMechanics=[],selectedTexts=[]}={}){
 if(!candidate||typeof candidate.title!=="string"||typeof candidate.body!=="string"||!EDITORIAL_MECHANICS.includes(candidate.mechanic))
  return {pass:false,score:0,issues:["schema"]};
 const title=candidate.title.trim(),body=candidate.body.trim(),normalized=normalize(title+" "+body);
 const quality=evaluateMission({title,body,slot,partnerProfile,recentTitles});
 const issues=[...quality.issues,...auditMissionSubstance({slot,title,body}).issues];
 if(!isIdeaCompatible(title+" "+body,partnerProfile))issues.push("consent_boundary");
 if(forbiddenAssumptions.test(normalized))issues.push("invented_emotional_fact");
 if(selectedTexts.some(s=>similarity(s,title+" "+body)>.66))issues.push("near_duplicate");
 const meaningful=emotion.test(normalized)&&followThrough.test(normalized);
 const original=!generic.test(normalized);
 if(!meaningful)issues.push("no_emotional_intention");
 if(!original)issues.push("generic_idea");
 // No confundir un gesto bien escrito con una misión verdaderamente memorable.
 const score=quality.score
  +(meaningful?3:-1)
  +(original?3:-5)
  +(quality.personalized?3:0)
  +(previousMechanics.includes(candidate.mechanic)?-3:2)
  +(body.length>=90?1:0);
 return {pass:issues.length===0,score,issues,mechanic:candidate.mechanic,original,meaningful,title,body};
}
export function selectEditorialMissions({guided=[],proposals={},partnerProfile={},recentTitles=[],protectedSlots=[]}={}){
 if(!Array.isArray(guided)||!proposals||typeof proposals!=="object"||Array.isArray(proposals))return guided;
 const selected={},seenTitles=[...recentTitles],mechanics=[],texts=[];
 for(const item of guided){
  if(!/^mission_[123]$/.test(item.slot)&&item.slot!=="weekly_1")continue;
  if(protectedSlots.includes(item.slot))continue;
  const proposalsForSlot=proposals[item.slot];
  if(!proposalsForSlot||typeof proposalsForSlot!=="object")continue;
  const scored=["a","b"].map(k=>{
   const candidate=proposalsForSlot[k];
   const review=evaluateEditorialCandidate(candidate,{slot:item.slot,partnerProfile,recentTitles:seenTitles,
    previousMechanics:mechanics,selectedTexts:texts});
   return {candidate,review};
  }).filter(x=>x.review.pass).sort((a,b)=>b.review.score-a.review.score);
  const best=scored[0];
  if(!best)continue;
  selected[item.slot]={title:best.review.title,body:best.review.body};
  seenTitles.push(best.review.title);mechanics.push(best.review.mechanic);
  texts.push(best.review.title+" "+best.review.body);
 }
 return mergeGeneratedIdeas(guided,selected,text=>isIdeaCompatible(text,partnerProfile),{
  partnerProfile,recentTitles,protectedSlots
 });
}
