import { notFound } from "next/navigation";
import ExperienceEngine from "@/components/ExperienceEngine";
import { getExperience } from "@/data/experiences";
import {
  getPublishedGiftByCode,
  isGiftDatabaseConfigured,
} from "@/lib/gifts/repository";

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

  if (isGiftDatabaseConfigured()) {
    try {
      const storedGift = await getPublishedGiftByCode(code);

      return (
        <ExperienceEngine
          experience={storedGift.experience}
          letterText={storedGift.letterText}
          photoMedia={storedGift.photoMedia}
          audioMedia={storedGift.audioMedia}
          videoMedia={storedGift.videoMedia}
          storyContext={storedGift.storyContext}
        />
      );
    } catch (error) {
      if (
        error instanceof Error &&
        ["gift_not_found", "gift_experience_not_found"].includes(error.message)
      ) {
        notFound();
      }

      console.error("private gift render failed", error);
    }
  }

  // Development fallback while production environment variables are absent.
  const demoSlug = demoGifts[code];
  if (!demoSlug) notFound();

  const demoExperience = getExperience(demoSlug);
  if (!demoExperience) notFound();

  return <ExperienceEngine experience={demoExperience} />;
}
