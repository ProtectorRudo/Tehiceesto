import { publicExperiences as unlockedCatalog } from "@/data/experiences";

// Public launch availability may change without rewriting archived purchased models.
// Keep this list separate from the SHA-256 locked source of existing gifts.
export const publicExperiences = unlockedCatalog.filter(experience => experience.slug !== "papa");
