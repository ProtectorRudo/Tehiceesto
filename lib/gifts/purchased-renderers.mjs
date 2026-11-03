/**
 * Purchased visual models are explicit (slug, templateVersion) pairs.
 *
 * This list includes EVERY historical combination already present in the
 * production gifts table on 2026-11-03, plus current sale versions. Do not
 * delete one just because its model was withdrawn from the catalogue.
 *
 * An unknown version MUST NOT silently render the current generic model.
 * Renderer families are compatibility bindings; preserving exact *visual*
 * snapshots also requires the locked renderer files / versioned archives.
 */
export const PURCHASED_RENDERERS=Object.freeze({
  "pareja":{"premium-v3":"premium-legacy","premium-v4":"premium-legacy","premium-v5":"premium-legacy"},
  "cumpleanos":{"premium-v3":"premium-legacy"},
  "hijos":{"premium-v3":"premium-legacy"},
  "abuelos":{"premium-v3":"premium-legacy"},
  "aniversario":{"premium-v3":"premium-legacy"},
  "propuesta":{"premium-v3":"premium-legacy"},
  "mama":{"premium-v5":"premium-legacy"},
  "papa":{"premium-v3":"premium-legacy"},
  "amistad":{"premium-v5":"premium-legacy"},
  "secreto":{"premium-v3":"secret"},
  "club-amigos":{"premium-v2":"club","club-v1":"club"},
  "sticker-bomb-amistad":{"premium-v2":"sticker-bomb","sticker-bomb-v2":"sticker-bomb"},
  "frasco365":{"premium-v2":"jar365","jar365-v1":"jar365"},
  "siete-dias":{"premium-v2":"seven-days","seven-days-v1":"seven-days"},
  "dragon-ball-pareja":{"dragon-ball-v1":"dragon-ball"},
});

/** Non-gift products are NEVER routed through the generic gift renderer. */
export const NON_GIFT_PRODUCTS=Object.freeze([
 "pack-juegos","trazo-complice",
 "escape-caso-m","escape-ultima-funcion","escape-ultima-campanada",
]);

export function purchasedRendererFor(slug,version){
  if(typeof slug!=="string"||typeof version!=="string"||
     slug.length===0||version.length===0)throw Error("gift_renderer_version_missing");
  const family=PURCHASED_RENDERERS[slug]?.[version];
  if(typeof family!=="string"){
    throw Error("gift_renderer_version_unavailable");
  }
  return family;
}
