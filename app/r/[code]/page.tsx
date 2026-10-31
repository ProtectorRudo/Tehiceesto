import { notFound, redirect } from "next/navigation";
import ExperienceEngine from "@/components/ExperienceEngine";
import SevenDaysExperience from "@/components/SevenDaysExperience";
import Jar365Experience from "@/components/Jar365Experience";
import ExtraLetterLink from "@/components/ExtraLetterLink";
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

      if (storedGift.experience.slug==="sticker-bomb-amistad") redirect("/experiencias/sticker-bomb-amistad?gift="+encodeURIComponent(code));
      if (storedGift.experience.slug==="frasco365") return <><Jar365Experience experience={storedGift.experience} giftCode={code} /><ExtraLetterLink code={code}/></>;
      if (storedGift.experience.slug==="siete-dias") return <><SevenDaysExperience experience={storedGift.experience} singleDay={1} sceneTextOverrides={storedGift.sceneTextOverrides} photoMedia={storedGift.photoMedia} audioMedia={storedGift.audioMedia} /><ExtraLetterLink code={code}/></>;

      return (
        <>
        <ExperienceEngine
          customerGift
          experience={storedGift.experience}
          letterText={storedGift.letterText}
          photoMedia={storedGift.photoMedia}
          audioMedia={storedGift.audioMedia}
          soundtrackMedia={storedGift.soundtrackMedia}
          videoMedia={storedGift.videoMedia}
          storyContext={storedGift.storyContext}
          sceneTextOverrides={storedGift.sceneTextOverrides}
        />
        <ExtraLetterLink code={code}/>
        </>
      );
    } catch (error) {
      if (
        error instanceof Error &&
        ["gift_not_found", "gift_experience_not_found"].includes(error.message)
      ) {
        notFound();
      }

      console.error("private gift render failed", error);
      throw error instanceof Error
        ? error
        : new Error("gift_backend_error");
    }
  }

  // Development fallback while production environment variables are absent.
  const demoSlug = demoGifts[code];
  if (!demoSlug) notFound();

  const demoExperience = getExperience(demoSlug);
  if (!demoExperience) notFound();

  return <ExperienceEngine experience={demoExperience} />;
}
