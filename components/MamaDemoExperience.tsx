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
  const model={...source,demoRecipient:experience.demoRecipient,demoGiver:experience.demoGiver,opening:experience.opening,closing:experience.closing,accent:experience.accent};
  return <div className="thi-root legacy-premium-renderer"><MamaDemoEngine experience={model} customerGift={false}/></div>;
}
