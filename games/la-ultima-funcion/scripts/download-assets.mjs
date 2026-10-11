import {mkdir,writeFile} from "node:fs/promises";
import {basename,dirname,join,normalize} from "node:path";

const assets=[
  {id:"ArmChair_01",key:"armchair",folder:"armchair",source:"https://polyhaven.com/a/ArmChair_01"},
  {id:"Chandelier_01",key:"chandelier",folder:"chandelier",source:"https://polyhaven.com/a/Chandelier_01"},
  {id:"vintage_grandfather_clock_01",key:"grandfatherClock",folder:"grandfather_clock",source:"https://polyhaven.com/a/vintage_grandfather_clock_01"},
  {id:"side_table_tall_01",key:"sideTable",folder:"side_table",source:"https://polyhaven.com/a/side_table_tall_01"},
  {id:"mantel_clock_01",key:"mantelClock",folder:"mantel_clock",source:"https://polyhaven.com/a/mantel_clock_01"},
  {id:"marble_bust_01",key:"marbleBust",folder:"marble_bust",source:"https://polyhaven.com/a/marble_bust_01"}
];
const root="public/models";
const manifest={source:"Poly Haven CC0",credit:"https://polyhaven.com/license",assets:{}};
await mkdir(root,{recursive:true});
const retrieve=async(url)=>{
  const response=await fetch(url,{headers:{"User-Agent":"LaUltimaFuncion/0.2 (Poly Haven CC0 models)"},
    signal:AbortSignal.timeout(55000)});
  if(!response.ok)throw new Error("HTTP "+response.status+" "+url);
  return response;
};
for(const a of assets){
  try{
    const files=await (await retrieve("https://api.polyhaven.com/files/"+a.id)).json();
    const record=files.gltf?.["1k"]?.gltf||files.gltf?.["2k"]?.gltf;
    if(!record?.url)throw new Error("Sin archivo glTF disponible en 1k/2k");
    const base=join(root,a.folder);await mkdir(base,{recursive:true});
    const list=[[basename(new URL(record.url).pathname),record.url],...Object.entries(record.include||{}).map(([relative,v])=>[relative,v.url])];
    for(const [rel,url] of list){
      const clean=normalize(rel).replace(/^(\.\.(\/|\\|$))+/g,"");
      const absolute=join(base,clean);
      if(!absolute.startsWith(base))throw new Error("Ruta insegura en paquete de modelos");
      await mkdir(dirname(absolute),{recursive:true});
      const bytes=Buffer.from(await(await retrieve(url)).arrayBuffer());
      await writeFile(absolute,bytes);
      console.log("Modelo CC0",a.id,clean,(bytes.byteLength/1048576).toFixed(2)+"MB");
    }
    manifest.assets[a.key]="/models/"+a.folder+"/"+list[0][0];
  }catch(err){console.warn("El modelo CC0 "+a.id+" no pudo descargarse. Continúa el escenario de respaldo.",String(err));}
}
await writeFile(join(root,"manifest.json"),JSON.stringify(manifest,null,2));
console.log("Modelos de producción disponibles:",Object.keys(manifest.assets));
