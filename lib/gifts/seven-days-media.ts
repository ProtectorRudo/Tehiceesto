/** Select exactly the photos assigned to the final chapter of Siete Días.
 * Sparse scene-slot overrides are resolved BEFORE the existing uploaded album,
 * so replacing one image never silently changes a different card.
 */
export type SevenDaysPhoto={url:string;scene?:string;slot?:number};
export function sevenDaysPhotoUrls(photos:readonly SevenDaysPhoto[],limit=4):string[]{
  const slots=Array<string>(limit).fill("");
  const used=new Set<string>();
  for(const photo of photos){
    if(!photo.url||photo.scene!=="day7"||!Number.isInteger(photo.slot)||
       (photo.slot as number)<0||(photo.slot as number)>=limit)continue;
    const index=photo.slot as number;
    if(slots[index])used.delete(slots[index]);
    slots[index]=photo.url;used.add(photo.url);
  }
  for(const photo of photos){
    if(!photo.url||used.has(photo.url))continue;
    const index=slots.findIndex(url=>!url);
    if(index<0)break;
    slots[index]=photo.url;used.add(photo.url);
  }
  return slots.filter(Boolean);
}
export type SevenDaysAudio={url:string;scene?:string};
export function sevenDaysAudioUrl(audios:readonly SevenDaysAudio[]):string{
  return audios.find(audio=>audio.scene==="day7"&&audio.url)?.url||
    audios.find(audio=>!!audio.url)?.url||"";
}
