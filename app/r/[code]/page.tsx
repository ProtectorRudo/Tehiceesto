import { notFound } from "next/navigation";
import ExperienceEngine from "@/components/ExperienceEngine";
import { getExperience } from "@/data/experiences";
import { getPublishedGiftByCode } from "@/lib/gifts/repository";

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

  const storedGift = await getPublishedGiftByCode(code);
  if (storedGift) {
    return (
      <ExperienceEngine
        experience={storedGift.experience}
        letterText={storedGift.letterText}
      />
    );
  }

  // Development fallback while the dedicated production DB is not connected.
  const demoSlug = demoGifts[code];
  if (!demoSlug) notFound();

  const demoExperience = getExperience(demoSlug);
  if (!demoExperience) notFound();

  return <ExperienceEngine experience={demoExperience} />;
}
