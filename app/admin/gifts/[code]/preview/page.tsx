import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminGiftByCode } from "@/lib/gifts/repository";
import { getExperience } from "@/data/experiences";
import ExperienceEngine from "@/components/ExperienceEngine";
import AdminCopyEditor from "@/components/admin/AdminCopyEditor";
import SevenDaysAdminPreview from "@/components/admin/SevenDaysAdminPreview";
import Jar365Experience from "@/components/Jar365Experience";
import { JAR365_SEED, type Jar365Note } from "@/data/jar365-notes";
import { createAdminSupabase } from "@/lib/supabase/admin";
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

  const soundtrackItem = media.find(
    (item) =>
      item.kind === "audio" &&
      item.signed_url &&
      item.metadata?.role === "soundtrack",
  );

  const soundtrackMedia = soundtrackItem
    ? {
        url: soundtrackItem.signed_url as string,
        caption: soundtrackItem.caption || undefined,
      }
    : undefined;

  const audioMedia = media
    .filter(
      (item) =>
        item.kind === "audio" &&
        item.signed_url &&
        item.metadata?.role !== "soundtrack",
    )
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

  if (gift.experience_slug==="frasco365") {
    const supabase = createAdminSupabase();
    const {data: overrides, error} = await supabase.from("jar365_notes")
      .select("position,category,message").eq("gift_id",gift.id).order("position");
    if (error) throw new Error("jar365_admin_preview_unavailable");
    const overridesByPosition = new Map((overrides || []).map(note => [Number(note.position), note]));
    const previewNotes:Jar365Note[] = JAR365_SEED.map(defaultNote => {
      const saved=overridesByPosition.get(defaultNote.position);
      return saved ? {
        position: defaultNote.position,
        category: saved.category as Jar365Note["category"],
        message: saved.message,
      } : defaultNote;
    });
    return <>
      <div className="admin-preview-toolbar">
        <a href={`/admin/gifts/${gift.public_code}`}>← Volver a editar los 365 papelitos</a>
        <span>VISTA PREVIA PERSONALIZADA · {gift.recipient_name}</span>
      </div>
      <Jar365Experience experience={experience} previewNotes={previewNotes} />
    </>;
  }

  if (gift.experience_slug==="siete-dias") {
    return <SevenDaysAdminPreview code={gift.public_code} experience={experience}
      initialOverrides={normalizeSceneTextOverrides(gift.story_data?.sceneContent)}
      photos={photoMedia} audio={audioMedia} />;
  }

  return (
    <>
      <div className="admin-preview-toolbar">
        <a href={`/admin/gifts/${gift.public_code}`}>← Volver al editor</a>
        <span>PREVIEW PRIVADO · {gift.recipient_name}</span>
      </div>

      <ExperienceEngine
          customerGift
        experience={experience}
        letterText={gift.letter_text || undefined}
        photoMedia={photoMedia}
        audioMedia={audioMedia}
        soundtrackMedia={soundtrackMedia}
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
