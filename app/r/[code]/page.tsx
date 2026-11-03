import { notFound } from "next/navigation";
import ExperienceEngine from "@/components/ExperienceEngine";
import SevenDaysExperience from "@/components/SevenDaysExperience";
import Jar365Experience from "@/components/Jar365Experience";
import ExtraLetterLink from "@/components/ExtraLetterLink";
import GiftVoiceCollection from "@/components/GiftVoiceCollection";
import DragonBallGift from "@/components/DragonBallGift";
import StickerBombExperience from "@/components/StickerBombExperience";
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

      if(storedGift.rendererFamily==="dragon-ball")return <><DragonBallGift
        code={code} receiverName={storedGift.experience.demoRecipient}
        senderName={storedGift.experience.demoGiver}
        config={storedGift.dragonBall?.config||{}}
        photoUrls={storedGift.dragonBall?.photoUrls||[]}
        voiceUrl={storedGift.dragonBall?.voiceUrl||null}
      /><GiftVoiceCollection audios={storedGift.audioMedia}/></>;
      if (storedGift.rendererFamily==="sticker-bomb") return <><StickerBombExperience
        recipient={storedGift.experience.demoRecipient}
        sender={storedGift.experience.demoGiver}
        copy={storedGift.stickerBomb}
        photos={storedGift.photoMedia}
        audios={storedGift.audioMedia}
      /><GiftVoiceCollection audios={storedGift.audioMedia}/><ExtraLetterLink code={code}/></>;
      if (storedGift.rendererFamily==="jar365") return <><Jar365Experience experience={storedGift.experience} giftCode={code} /><GiftVoiceCollection audios={storedGift.audioMedia}/><ExtraLetterLink code={code}/></>;
      if (storedGift.rendererFamily==="seven-days") return <><SevenDaysExperience experience={storedGift.experience} singleDay={1} sceneTextOverrides={storedGift.sceneTextOverrides} photoMedia={storedGift.photoMedia} audioMedia={storedGift.audioMedia} /><GiftVoiceCollection audios={storedGift.audioMedia}/><ExtraLetterLink code={code}/></>;

      if(!["premium-legacy","secret","club"].includes(storedGift.rendererFamily)){
        throw new Error("gift_renderer_version_unavailable");
      }
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
        <GiftVoiceCollection audios={storedGift.audioMedia}/>
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

  // A missing production backend must NEVER show a public demo in place of
  // someone's paid gift. Keep these aliases strictly local to development.
  if(process.env.NODE_ENV==="production")throw new Error("gift_backend_not_configured");
  const demoSlug = demoGifts[code];
  if (!demoSlug) notFound();

  const demoExperience = getExperience(demoSlug);
  if (!demoExperience) notFound();

  return <ExperienceEngine experience={demoExperience} />;
}
