import type {Experience} from "@/data/experiences";
import archive from "@/data/purchased-model-snapshots.json";

type Snapshot={source:string;model:Experience};
type Snapshots={schema:number;products:Record<string,Record<string,Snapshot>>};

/**
 * Historical purchases receive a frozen baseline, not today's mutable sales demo.
 * Personalization is applied afterward from the gift's persisted data.
 *
 * The oldest model versions were reconstructed from surviving archived sources:
 * this prevents future silent drift but does NOT falsely claim byte-perfect
 * reconstruction of animation code from every historical release.
 */
export function getPurchasedModelSnapshot(slug:string,templateVersion:string):Experience{
  const records=(archive as unknown as Snapshots).products;
  const saved=records[slug]?.[templateVersion];
  if(!saved||saved.model.slug!==slug)
    throw new Error("gift_model_snapshot_unavailable");
  const model=saved.model;
  return {...model,tags:[...model.tags],recipe:[...model.recipe]};
}
