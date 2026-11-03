import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {arrangeScenePhotos} from "../lib/gifts/arrange-scene-photos.ts";
import {sevenDaysPhotoUrls,sevenDaysAudioUrl} from "../lib/gifts/seven-days-media.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("day-seven image replacement preserves its explicit position in the final gift",()=>{
 const photos=[
  {id:"a",url:"/a.jpg",metadata:{scene:"day1"}},
  {id:"b",url:"/b.jpg",metadata:{scene:"day1"}},
  {id:"c",url:"/c.jpg",metadata:{scene:"day7"}},
  {id:"d",url:"/d.jpg",metadata:{scene:"day7"}},
 ];
 const arranged=arrangeScenePhotos(photos,{"day7:2":{mediaId:"b"}},["day1","day2","day3","day4","day5","day6","day7"])
   .map(({item,scene,slot})=>({url:item.url,scene,slot}));
 const final=sevenDaysPhotoUrls(arranged);
 assert.deepEqual(final,["/a.jpg","/c.jpg","/b.jpg","/d.jpg"]);
 assert.equal(final.filter(x=>x==="/b.jpg").length,1);
 assert.deepEqual(photos.map(p=>p.metadata.scene),["day1","day1","day7","day7"]);
});
test("sparse overrides never steal an existing image used elsewhere",()=>{
 const source=[{id:"one",url:"/one.jpg",metadata:{scene:"day1"}}];
 const arranged=arrangeScenePhotos(source,{"day7:3":{mediaId:"one"}},["day1","day7"]);
 assert.equal(arranged.length,2);
 assert.equal(arranged[1].slot,3);
 assert.equal(sevenDaysPhotoUrls(arranged.map(x=>({url:x.item.url,scene:x.scene,slot:x.slot}))).length,1);
});
test("the final voice prioritizes the recorded voice assigned to day seven",()=>{
 assert.equal(sevenDaysAudioUrl([{url:"/intro.mp3",scene:"day1"},{url:"/final.ogg",scene:"day7"}]),"/final.ogg");
 assert.equal(sevenDaysAudioUrl([{url:"/intro.mp3",scene:"day1"}]),"/intro.mp3");
 assert.equal(sevenDaysAudioUrl([]),"");
});
test("image taps in scenes are handled before matching the globally shared media file",()=>{
 const source=read("components/StudioEnhancements.tsx");
 const start=source.indexOf("function choosePreviewPhoto("),end=source.indexOf("async function assignScenePhoto(",start);
 const method=source.slice(start,end);
 assert.ok(method.indexOf('setPhotoPicker({kind:"slot",scene,slot})')>=0);
 assert.ok(method.indexOf('setPhotoPicker({kind:"media",mediaId:existing.id})')>=0);
 assert.ok(method.indexOf('setPhotoPicker({kind:"slot",scene,slot})')<method.indexOf('setPhotoPicker({kind:"media",mediaId:existing.id})'));
});
