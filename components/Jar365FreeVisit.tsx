"use client";
import {useEffect,useState} from "react";
import type {Experience} from "@/data/experiences";
import Jar365DemoExperience from "@/components/Jar365DemoExperience";
export default function Jar365FreeVisit({experience}:{experience:Experience}){
 const [visit,setVisit]=useState(0);
 useEffect(()=>{
  const onPageShow=(event:PageTransitionEvent)=>{if(event.persisted)setVisit(v=>v+1)};
  window.addEventListener("pageshow",onPageShow);
  return()=>window.removeEventListener("pageshow",onPageShow);
 },[]);
 return <Jar365DemoExperience key={visit} experience={experience} freeDemo/>;
}
