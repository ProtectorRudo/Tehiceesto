"use client";
import {useMemo,useState} from "react";
import type {Experience as CurrentExperience} from "@/data/experiences";
import type {SceneTextOverrides} from "@/data/scene-text";
import PremiumOpeningIntro from "./PremiumOpeningIntro";
import ArchivedPremiumEngine from "./legacy-v5/ExperienceEngine";
import {getExperience as getArchivedExperience} from "./legacy-v5/data";
import "./legacy-v5/legacy-styles.css";
type Media={url:string;caption?:string;fit?:"cover"|"contain";position?:"center"|"top"|"bottom"|"left"|"right"};
type Props={experience:CurrentExperience;letterText?:string;photoUrls?:string[];photoMedia?:Media[];audioMedia?:Media[];soundtrackMedia?:Media;videoMedia?:Media[];storyContext?:{keyDate?:string;anecdote?:string};sceneTextOverrides?:SceneTextOverrides;customerGift?:boolean};
export const restoredPremiumSlugs=new Set(["pareja","cumpleanos","hijos","abuelos","aniversario","propuesta","mama","papa","amistad"]);
export default function LegacyPremiumExperience(props:Props){
  const {experience}=props;const[opened,setOpened]=useState(false);
  const source=useMemo(()=>getArchivedExperience(experience.slug),[experience.slug]);
  if(!source)return null;
  const model={...source,demoRecipient:experience.demoRecipient,demoGiver:experience.demoGiver,opening:experience.opening,closing:experience.closing,accent:experience.accent};
  // Mamá and Amistad use their original wrapped gift, without floral prologue.
  if(!opened&&!["pareja","mama","amistad"].includes(experience.slug))return <div className="experience-shell legacy-floral-prologue"><PremiumOpeningIntro experience={experience} onContinue={()=>setOpened(true)}/></div>;
  const photoMedia=(props.photoMedia?.length?props.photoMedia:props.photoUrls?.map(url=>({url})))||[];
  // Cumpleaños skips the redundant text-based intro, entering at its candles scene.
  const activeModel=experience.slug==="cumpleanos"?{...model,recipe:model.recipe.filter(scene=>scene!=="intro")}:model;
  return <div className="thi-root legacy-premium-renderer"><ArchivedPremiumEngine experience={activeModel} letterText={props.letterText} photoMedia={photoMedia} audioMedia={props.audioMedia} soundtrackMedia={props.soundtrackMedia} videoMedia={props.videoMedia} storyContext={props.storyContext} sceneTextOverrides={props.sceneTextOverrides} customerGift={props.customerGift||false}/></div>;
}
