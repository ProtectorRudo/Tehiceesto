export type SceneTextOverrides = Record<string, Record<string, string>>;

export function normalizeSceneTextOverrides(value: unknown): SceneTextOverrides {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const result: SceneTextOverrides = {};
  for (const [scene, entries] of Object.entries(value as Record<string, unknown>)) {
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) continue;

    const cleanEntries: Record<string, string> = {};
    for (const [source, replacement] of Object.entries(entries as Record<string, unknown>)) {
      if (typeof replacement !== "string" || typeof source !== "string") continue;
      if (!source.trim()) continue;
      cleanEntries[source] = replacement;
    }

    if (Object.keys(cleanEntries).length > 0) result[scene] = cleanEntries;
  }

  return result;
}
