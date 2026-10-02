import { notFound } from "next/navigation";
import ExperienceEngine from "@/components/ExperienceEngine";
import { getExperience } from "@/data/experiences";

const demoGifts: Record<string, string> = {
  demo: "pareja",
  cumple: "cumpleanos",
  propuesta: "propuesta",
};

export default async function GiftPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const slug = demoGifts[code];

  if (!slug) notFound();

  const experience = getExperience(slug);
  if (!experience) notFound();

  return <ExperienceEngine experience={experience} />;
}
