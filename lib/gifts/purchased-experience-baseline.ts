import type {Experience,SceneType} from "@/data/experiences";
import {getExperience as getFrozenPurchasedExperience} from "@/data/purchased-experiences-20261103";
import {getExperience as getLegacyArchiveExperience} from "@/components/legacy-v5/data";
import {purchasedRendererFor} from "@/lib/gifts/purchased-renderers.mjs";

/**
 * Explicitly bind the purchased version to preserved model metadata.
 * Never use the mutable public catalogue when displaying a customer's gift.
 *
 * Version "premium-v3"/"premium-v4" uses the separate archived legacy
 * baseline where a historical archived model survives. "premium-v5" and
 * specialty editions use the frozen 2026-11-03 purchased baseline.
 *
 * These are surviving source baselines, NOT proof that every original
 * historical animation is byte-identical. Versions whose renderers have
 * different behavior must continue to be archived separately.
 */
export function purchasedExperienceBaseline(slug:string,templateVersion:string):Experience{
  const family=purchasedRendererFor(slug,templateVersion);
  const frozen=getFrozenPurchasedExperience(slug);
  if(!frozen||frozen.slug!==slug)
    throw new Error("purchased_baseline_unavailable");

  if(family==="premium-legacy"&&/^premium-v[34]$/.test(templateVersion)){
    const archived=getLegacyArchiveExperience(slug);
    if(!archived)throw new Error("legacy_purchased_baseline_unavailable");
    return {
      ...frozen,
      eyebrow:archived.eyebrow,
      title:archived.title,
      short:archived.short,
      icon:archived.icon,
      accent:archived.accent,
      demoRecipient:archived.demoRecipient,
      demoGiver:archived.demoGiver,
      opening:archived.opening,
      closing:archived.closing,
      tags:[...archived.tags],
      recipe:[...archived.recipe] as unknown as SceneType[],
    };
  }

  return {...frozen,tags:[...frozen.tags],recipe:[...frozen.recipe]};
}
