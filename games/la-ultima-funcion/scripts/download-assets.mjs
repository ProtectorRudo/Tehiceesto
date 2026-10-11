import {mkdir,writeFile,stat,unlink} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {basename,dirname,join,normalize} from "node:path";

const assets=[
  {id:"ArmChair_01",key:"armchair",folder:"armchair",source:"https://polyhaven.com/a/ArmChair_01"},
  {id:"Chandelier_01",key:"chandelier",folder:"chandelier",source:"https://polyhaven.com/a/Chandelier_01"},
  {id:"vintage_grandfather_clock_01",key:"grandfatherClock",folder:"grandfather_clock",source:"https://polyhaven.com/a/vintage_grandfather_clock_01"},
  {id:"side_table_tall_01",key:"sideTable",folder:"side_table",source:"https://polyhaven.com/a/side_table_tall_01"},
  {id:"mantel_clock_01",key:"mantelClock",folder:"mantel_clock",source:"https://polyhaven.com/a/mantel_clock_01"},
  {id:"marble_bust_01",key:"marbleBust",folder:"marble_bust",source:"https://polyhaven.com/a/marble_bust_01"},
  {id:"filmstrip_projector_8mm",key:"projector",folder:"projector",source:"https://polyhaven.com/a/filmstrip_projector_8mm"},
  {id:"ClassicConsole_01",key:"victorianConsole",folder:"victorian_console",source:"https://polyhaven.com/a/ClassicConsole_01"},
  {id:"ClassicNightstand_01",key:"ornateSideTable",folder:"ornate_side_table",source:"https://polyhaven.com/a/ClassicNightstand_01"}
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
// Physically-based red velvet: color, OpenGL normal and packed AO/Rough/Metal.
// 1K resolution limits texture memory; maps are shared by all seats and the curtain.
try{
  const files=await (await retrieve("https://api.polyhaven.com/files/velour_velvet")).json();
  const directory="public/materials/velvet";await mkdir(directory,{recursive:true});
  const choose=(name)=>{
    const entry=files[name];
    return entry?.["1k"]?.jpg||entry?.["1k"]?.png||entry?.["2k"]?.jpg||entry?.["2k"]?.png;
  };
  const mats={};
  for(const [key,role] of [["diff","color"],["nor_gl","normal"],["arm","arm"]]){
    const file=choose(key);if(!file?.url)throw new Error("Mapa PBR no disponible: "+key);
    const ext=new URL(file.url).pathname.endsWith(".png")?"png":"jpg";
    const bytes=Buffer.from(await(await retrieve(file.url)).arrayBuffer());
    const filename=role+"."+ext;
    await writeFile(join(directory,filename),bytes);
    mats[role]="/materials/velvet/"+filename;
    console.log("Terciopelo PBR CC0",key,(bytes.byteLength/1048576).toFixed(2)+" MB");
  }
  manifest.materials={velvet:mats};
}catch(error){console.warn("Texturas PBR CC0 no disponibles; queda el tejido de respaldo.",String(error));}

// A genuine skinned and animated adult, licensed CC0, downloaded at build time.
// Model by Innerscene, built from MakeHuman/MPFB CC0. It contains 7 named clips.
// Source: https://www.innerscene.com/tools/library/3d-parts/locomotion-collection-jordan-3d-person-animated-911f1584
try{
  const characterUrl="https://www.innerscene.com/api/library/locomotion-collection-jordan-3d-person-animated-911f1584/download";
  const res=await retrieve(characterUrl);
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.byteLength<100000||bytes.toString("ascii",0,4)!=="glTF")throw new Error("Archivo GLB inválido");
  await mkdir(join(root,"usher"),{recursive:true});
  const original=join(root,"usher","usher.glb");
  const optimized=join(root,"usher","usher-mobile.glb");
  await writeFile(original,bytes);
  manifest.assets.usher="/models/usher/usher.glb";
  try{
    execFileSync("./node_modules/.bin/gltf-transform",[
      "optimize",original,optimized,
      "--compress","meshopt",
      "--texture-compress","webp",
      "--texture-size","1024",
      "--flatten","false","--join","false"
    ],{stdio:"pipe",timeout:120000,maxBuffer:8*1024*1024});
    const compact=await stat(optimized);
    if(compact.size<bytes.byteLength&&compact.size>100000){
      manifest.assets.usher="/models/usher/usher-mobile.glb";
      await unlink(original);
      console.log("Acomodador optimizado para móvil:",(compact.size/1048576).toFixed(2)+" MB, tamaño original:",(bytes.byteLength/1048576).toFixed(2)+" MB");
    }else console.warn("La versión compactada no redujo el tamaño. Se utiliza el original.");
  }catch(err){console.warn("Compresión opcional fallida. Se conserva el GLB riggeado original.",String(err));}
  console.log("Acomodador humano CC0 disponible:",manifest.assets.usher);
}catch(err){
  console.warn("No se pudo preparar al Acomodador riggeado, se conserva la figura alternativa.",String(err));
}
// Licensed CC0 suspense music, stored locally (no hotlinking at runtime).
// congusbongus, Lost in a bad place; OpenGameArt, 2022, CC0.
// https://opengameart.org/content/lost-in-a-bad-place-horror-ambience-loop
try{
  const audioUrl="https://opengameart.org/sites/default/files/lost_2.ogg";
  const response=await retrieve(audioUrl);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<120000||bytes.toString("ascii",0,4)!=="OggS")throw new Error("Audio Ogg inválido");
  const dir="public/audio";await mkdir(dir,{recursive:true});
  await writeFile(join(dir,"lost.ogg"),bytes);
  await writeFile(join(dir,"credits.json"),JSON.stringify({
    title:"Lost in a bad place (horror ambience loop)",
    artist:"congusbongus",
    source:"https://opengameart.org/content/lost-in-a-bad-place-horror-ambience-loop",
    license:"CC0 1.0 (Public Domain)",
    file:"lost.ogg"
  },null,2));
  console.log("Ambiente sonoro CC0 descargado:",(bytes.length/1048576).toFixed(2)+" MB");
}catch(err){console.warn("Música CC0 no disponible, se conserva la atmósfera sintetizada.",String(err));}

// Short recorded CC0 sound effects replace procedural footsteps/door impacts
// when playback is supported. The synthesized effects stay as offline fallback.
const soundAssets=[
  {key:"footstep",url:"https://opengameart.org/sites/default/files/01-footstep_0.ogg",
    source:"https://opengameart.org/content/footsteps-0",artist:"GboxMikeFozzy"},
  {key:"door",url:"https://opengameart.org/sites/default/files/door_1.ogg",
    source:"https://opengameart.org/content/rpg-sound-effect-pack",artist:"Delta12 Studio"}
];
const soundCredits={};
for(const asset of soundAssets){
  try{
    const bytes=Buffer.from(await(await retrieve(asset.url)).arrayBuffer());
    if(bytes.byteLength<4500||bytes.toString("ascii",0,4)!=="OggS")throw new Error("Respuesta sin cabecera OggS");
    await mkdir("public/audio",{recursive:true});
    await writeFile("public/audio/"+asset.key+".ogg",bytes);
    soundCredits[asset.key]={artist:asset.artist,source:asset.source,license:"CC0 1.0"};
    console.log("Efecto de sonido grabado CC0",asset.key,bytes.byteLength);
  }catch(error){console.warn("Efecto opcional CC0 ausente",asset.key,String(error));}
}
await writeFile("public/audio/sfx-credits.json",JSON.stringify(soundCredits,null,2));

await writeFile(join(root,"manifest.json"),JSON.stringify(manifest,null,2));
console.log("Modelos de producción disponibles:",Object.keys(manifest.assets));
