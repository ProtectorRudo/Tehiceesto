// Evaluación editorial conservadora. Jamás sustituye revisión humana en riesgos.
export const KINDS=["conectar","comprender","sembrar"];
const costly=/\b(comprar|compren|compra|alquilar|reservar|pagar|paguen|contratar|adquirir|suscribirse)\b/i;
const coercive=/\b(oblig[aá]|castig[aá]|amenaz[aá]|premi[aá] si|vigila|espi[aá]|sin permiso|sin consentimiento|forz[aá]|presion[aá])\w*/i;
const unsafe=/\b(ingerir detergente|fuego abierto|enchufe sin supervisi[oó]n|objetos cortantes sin supervisi[oó]n|automedic[aá]|medicaci[oó]n sin indicaci[oó]n)\b/i;
const platitude=/^(pasen tiempo juntos|conecten más|hablen de sus emociones|diviértanse juntos|sean una familia feliz)[.! ]*$/i;
export function assessMission(m,{recentTitles=[]}={}){
 const issues=[];
 if(!m||!KINDS.includes(m.kind))issues.push("tipo");
 const title=String(m?.title||"").trim(),how=String(m?.how||"").trim(),why=String(m?.why||"").trim();
 const all=[title,how,why].join(" ");
 if(title.length<8||title.length>85)issues.push("titulo");
 if(how.length<48||how.length>500||why.length<20||why.length>260)issues.push("instrucciones");
 if(costly.test(all))issues.push("compra");
 if(coercive.test(all))issues.push("coaccion");
 if(unsafe.test(all))issues.push("riesgo");
 if(platitude.test(how)||platitude.test(title))issues.push("vaguedad");
 if(recentTitles.some(t=>t.toLocaleLowerCase("es")===title.toLocaleLowerCase("es")))issues.push("repetida");
 if(!Number.isInteger(m?.minutes)||m.minutes<2||m.minutes>45)issues.push("duracion");
 return {pass:issues.length===0,issues};
}
export function validateBatch(children,missions,weekly,recentTitles=[]){
 if(!Array.isArray(children)||!Array.isArray(missions)||!weekly)return false;
 if(missions.length!==children.length*3)return false;
 const ids=new Set(children.map(c=>c.id)),keys=new Set(),titles=[...recentTitles];
 for(const m of missions){
  if(!ids.has(m.child_id)||!KINDS.includes(m.kind))return false;
  const key=m.child_id+":"+m.kind;
  if(keys.has(key)||!assessMission(m,{recentTitles:titles}).pass)return false;
  keys.add(key);titles.push(m.title);
 }
 return typeof weekly.title==="string"&&weekly.title.trim().length>=8&&
 typeof weekly.how==="string"&&weekly.how.length>=48&&
 typeof weekly.why==="string"&&weekly.why.length>=20&&
 Number.isInteger(weekly.minutes)&&weekly.minutes<=45&&
 !costly.test(weekly.how+" "+weekly.title)&&!coercive.test(weekly.how+" "+weekly.title);
}
export function isoDay(d=new Date(),timeZone="America/Argentina/Buenos_Aires"){
 return new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
}
export function monday(day){
 const d=new Date(day+"T12:00:00Z");
 if(Number.isNaN(d.valueOf()))throw new Error("fecha");
 const wd=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-wd);return d.toISOString().slice(0,10);
}
