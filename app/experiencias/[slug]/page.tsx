import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExperienceEngine from "@/components/ExperienceEngine";
import { getExperience } from "@/data/experiences";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const experience = getExperience(slug);
  if (!experience) return {};

  return {
    title: `${experience.title} — Te Hice Esto`,
    description: experience.short,
    openGraph: {
      title: `${experience.title} — Te Hice Esto`,
      description: experience.short,
      siteName: "Te Hice Esto",
      type: "website",
    },
  };
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const experience = getExperience(slug);

  if (!experience) notFound();

  return (
    <>
      <div className="demo-ribbon">
        <span>DEMO · {experience.title}</span>
        <Link href="/crear">Crear la mía →</Link>
      </div>
      <ExperienceEngine experience={experience} />
    </>
  );
}
