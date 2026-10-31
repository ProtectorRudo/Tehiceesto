import type { Metadata } from "next";
import "./embed.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExperienceEngine from "@/components/ExperienceEngine";
import { getExperience } from "@/data/experiences";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const experience = getExperience(slug);
  if (!experience) return {};
  return {
    title: experience.title + " — Te Hice Esto",
    description: experience.short,
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
  if (!experience) notFound();
  const isEmbedded=embed==="1";
  if(slug==="dragon-ball-pareja")return (
    <div style={{position:"fixed",inset:0,background:"#10245b"}}>
      {!isEmbedded&&<div className="demo-ribbon" style={{position:"absolute",top:0,left:0,right:0,zIndex:10}}><span>DEMO · {experience.title}</span><Link href="/comprar/dragon-ball-pareja">Comprar esta experiencia →</Link></div>}
      <iframe src="/dragon-ball-pareja.html" title="Dragon Ball · Nuestra Saga — Demo" style={{display:"block",width:"100%",height:"100%",border:0}} allow="autoplay"/>
    </div>
  );
  return (
    <div className={isEmbedded?"boutique-embedded-route":undefined}>
      {!isEmbedded&&<div className="demo-ribbon"><span>DEMO · {experience.title}</span><Link href={"/comprar/"+encodeURIComponent(slug)}>Comprar esta experiencia →</Link></div>}
      <ExperienceEngine experience={experience} />
    </div>
  );
}

