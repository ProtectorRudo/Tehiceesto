/**
 * A non-destructive scene/slot projection over the customer's original media.
 * No image bytes, model layout or order in storage are changed. A slot override
 * points to a verified media ID and is applied consistently in studio and gift.
 */
export type SlotPhoto = {
  id:string;
  metadata?: {scene?:string}|null;
};
export type ArrangedPhoto<T extends SlotPhoto>={item:T;scene:string};
export function arrangeScenePhotos<T extends SlotPhoto>(
  photos:T[],rawSlots:unknown,recipe:readonly string[]
):ArrangedPhoto<T>[]{
  const original=photos.map(item=>({item,scene:item.metadata?.scene||recipe[0]||"intro"}));
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
    for(const [index,item] of [...positions].sort((a,b)=>a[0]-b[0]))ordered[index]=item;
    result.push(...ordered.filter(Boolean).map(item=>({item,scene})));
  }
  result.push(...original.filter(x=>!handled.has(x.scene)));
  return result;
}
