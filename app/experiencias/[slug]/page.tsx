import type { Metadata } from "next";
import "./embed.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExperienceEngine from "@/components/ExperienceEngine";
import MamaDemoExperience from "@/components/MamaDemoExperience";
import Jar365DemoExperience from "@/components/Jar365DemoExperience";
import { getExperience, hiddenExperienceSlugs } from "@/data/experiences";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug==="club-amigos" || slug==="sticker-bomb-amistad") notFound();
  if(slug==="papa") notFound();
  const experience = getExperience(slug);
  if (!experience) return {};
  return {
    title: experience.title + " — Te Hice Esto",
    description: experience.short,
    ...((hiddenExperienceSlugs.has(slug)||slug==="papa")?{robots:{index:false,follow:false,nocache:true}}:{}),
    openGraph: { title: experience.title + " — Te Hice Esto", description: experience.short, siteName: "Te Hice Esto", type: "website" },
  };
}
export default async function ExperiencePage({
  params, searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { slug } = await params;
  const { embed } = await searchParams;
  const experience = getExperience(slug);
  if (!experience || slug==="club-amigos" || slug==="sticker-bomb-amistad") notFound();
  if(slug==="papa") notFound();
  const isEmbedded=embed==="1";
  const isUnlaunched=(hiddenExperienceSlugs.has(slug)||slug==="papa");
  if(slug==="dragon-ball-pareja")return (
    <div style={{position:"fixed",inset:0,background:"#10245b"}}>
      {!isEmbedded&&<div className="demo-ribbon" style={{position:"absolute",top:0,left:0,right:0,zIndex:10}}><span>DEMO · {experience.title}</span>{!isUnlaunched&&<Link href="/comprar/dragon-ball-pareja">Comprar esta experiencia →</Link>}</div>}
      <iframe src="/dragon-ball-pareja-demo-mobile.html" title="Dragon Ball · Nuestra Saga — Demo" style={{display:"block",width:"100%",height:"100%",border:0}} allow="autoplay"/>
    </div>
  );
  const DemoRenderer=slug==="frasco365"?Jar365DemoExperience:ExperienceEngine;
  const SceneRenderer=slug==="mama"?MamaDemoExperience:DemoRenderer;
  return (
    <div className={[isEmbedded?"boutique-embedded-route":"",slug==="mama"?"thi-mama-demo":""].filter(Boolean).join(" ")}>
      {!isEmbedded&&<div className="demo-ribbon"><span>{isUnlaunched?"VISTA PREVIA · ":"DEMO · "}{experience.title}</span>{!isUnlaunched&&<Link href={"/comprar/"+encodeURIComponent(slug)}>Comprar esta experiencia →</Link>}</div>}
      <SceneRenderer experience={experience} />
    </div>
  );
}

