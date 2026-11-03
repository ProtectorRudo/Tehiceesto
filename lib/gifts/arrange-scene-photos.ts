/**
 * A non-destructive scene/slot projection over the customer's original media.
 * No image bytes, model layout or order in storage are changed. A slot override
 * points to a verified media ID and is applied consistently in studio and gift.
 */
export type SlotPhoto = {
  id:string;
  metadata?: {scene?:string}|null;
};
export type ArrangedPhoto<T extends SlotPhoto>={item:T;scene:string;slot?:number};
export function arrangeScenePhotos<T extends SlotPhoto>(
  photos:T[],rawSlots:unknown,recipe:readonly string[]
):ArrangedPhoto<T>[]{
  const natural=recipe.includes("memories")?"memories":recipe.includes("gallery")?"gallery":recipe.includes("day7")?"day7":recipe[0]||"intro";
  const original=photos.map(item=>({item,scene:item.metadata?.scene||natural}));
  if(!rawSlots||typeof rawSlots!=="object"||Array.isArray(rawSlots))return original;
  const slots=rawSlots as Record<string,unknown>;
  const byId=new Map(photos.map(item=>[item.id,item]));
  const slotMaps=new Map<string,Map<number,T>>();
  for(const [key,value] of Object.entries(slots)){
    const hit=/^([a-z0-9-]{1,40}):(0|[1-9]|1[0-9])$/.exec(key);
    if(!hit||!recipe.includes(hit[1])||!value||typeof value!=="object")continue;
    const id=(value as Record<string,unknown>).mediaId;
    if(typeof id!=="string"||!byId.has(id))continue;
    if(!slotMaps.has(hit[1]))slotMaps.set(hit[1],new Map());
    slotMaps.get(hit[1])!.set(Number(hit[2]),byId.get(id)!);
  }
  if(!slotMaps.size)return original;
  const result:ArrangedPhoto<T>[]=[];
  const handled=new Set<string>();
  for(const scene of recipe){
    if(handled.has(scene))continue;
    handled.add(scene);
    const group=original.filter(x=>x.scene===scene).map(x=>x.item);
    const positions=slotMaps.get(scene);
    if(!positions){result.push(...group.map(item=>({item,scene})));continue;}
    const ordered=[...group];
    for(const [index,item] of [...positions].sort((a,b)=>a[0]-b[0])){
      // Choosing an already-used image moves it to the selected slot instead
      // of accidentally duplicating it in two cards of the same scene.
      const previous=ordered.findIndex(x=>x?.id===item.id);
      if(previous>=0&&previous!==index)ordered[previous]=ordered[index];
      ordered[index]=item;
    }
    for(const [index,item] of ordered.entries()){
      if(!item)continue;
      const explicit=positions.get(index)?.id===item.id;
      result.push(explicit?{item,scene,slot:index}:{item,scene});
    }
  }
  result.push(...original.filter(x=>!handled.has(x.scene)));
  return result;
}
