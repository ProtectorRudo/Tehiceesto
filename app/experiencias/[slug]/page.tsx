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
  return (
    <div className={isEmbedded?"boutique-embedded-route":undefined}>
      {!isEmbedded&&<div className="demo-ribbon"><span>DEMO · {experience.title}</span><Link href={slug==="frasco365"?"/comprar/frasco365":slug==="siete-dias"?"/comprar/siete-dias":"/crear"}>Crear la mía →</Link></div>}
      <ExperienceEngine experience={experience} />
    </div>
  );
}

