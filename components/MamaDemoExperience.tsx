"use client";
import {useMemo} from "react";
import type {Experience} from "@/data/experiences";
import MamaDemoEngine from "./legacy-v5/MamaDemoEngine";
import {getExperience as getArchivedExperience} from "./legacy-v5/data";
import "./legacy-v5/legacy-styles.css";

/** Demo-only renderer. Purchased gifts continue to use their SHA-256 locked engine. */
export default function MamaDemoExperience({experience}:{experience:Experience}){
  const source=useMemo(()=>getArchivedExperience("mama"),[]);
  if(!source)return null;
  // 4G/mobile: use the same photographs in a smaller source resolution only in the demo.
  const demoPhotos=source.demo.photos?.map(photo=>({...photo,url:photo.url.replace(/([?&])w=1400\b/,"$1w=900").replace(/([?&])q=76\b/,"$1q=72")}));
  const model={...source,demo:{...source.demo,photos:demoPhotos},demoRecipient:experience.demoRecipient,demoGiver:experience.demoGiver,opening:experience.opening,closing:experience.closing,accent:experience.accent};
  return <div className="thi-root legacy-premium-renderer"><MamaDemoEngine experience={model} customerGift={false}/></div>;
}
