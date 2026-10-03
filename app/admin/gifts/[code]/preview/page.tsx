import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminGiftByCode } from "@/lib/gifts/repository";
import { getExperience } from "@/data/experiences";
import ExperienceEngine from "@/components/ExperienceEngine";
import AdminCopyEditor from "@/components/admin/AdminCopyEditor";
import { normalizeSceneTextOverrides } from "@/data/scene-text";

export default async function AdminGiftPreviewPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin");

  const { code } = await params;
  const result = await getAdminGiftByCode(code);
  if (!result) notFound();

  const { gift, media } = result;
  const base = getExperience(gift.experience_slug);
  if (!base) notFound();

  const experience = {
    ...base,
    demoGiver: gift.giver_name,
    demoRecipient: gift.recipient_name,
    opening: gift.opening_text || base.opening,
    closing: gift.closing_text || base.closing,
    recipe:
      Array.isArray(gift.scene_recipe) && gift.scene_recipe.length > 0
        ? gift.scene_recipe
        : base.recipe,
    accent: gift.theme_data?.accent || base.accent,
  };

  const photoMedia = media
    .filter((item) => item.kind === "image" && item.signed_url)
    .map((item) => ({
      url: item.signed_url as string,
      caption: item.caption || undefined,
      fit: item.metadata?.fit || "cover",
      position: item.metadata?.position || "center",
    }));

  const audioMedia = media
    .filter((item) => item.kind === "audio" && item.signed_url)
    .map((item) => ({
      url: item.signed_url as string,
      caption: item.caption || undefined,
    }));

  const videoMedia = media
    .filter((item) => item.kind === "video" && item.signed_url)
    .map((item) => ({
      url: item.signed_url as string,
      caption: item.caption || undefined,
    }));

  return (
    <>
      <div className="admin-preview-toolbar">
        <a href={`/admin/gifts/${gift.public_code}`}>← Volver al editor</a>
        <span>PREVIEW PRIVADO · {gift.recipient_name}</span>
      </div>

      <ExperienceEngine
        experience={experience}
        letterText={gift.letter_text || undefined}
        photoMedia={photoMedia}
        audioMedia={audioMedia}
        videoMedia={videoMedia}
        storyContext={{
          keyDate: gift.story_data?.keyDate || undefined,
          anecdote: gift.story_data?.anecdote || undefined,
        }}
        sceneTextOverrides={normalizeSceneTextOverrides(
          gift.story_data?.sceneContent,
        )}
      />

      <AdminCopyEditor
        code={gift.public_code}
        initialOverrides={normalizeSceneTextOverrides(
          gift.story_data?.sceneContent,
        )}
      />
    </>
  );
}
