export type BoughtProduct = {experienceSlug:string};
export type SalesContext =
  | {kind:"experience";slug:string}
  | {kind:"game";slug:"pack"|"trazo-complice"|"entre-dos"|"complices"|"meme-match"};

function canonicalPath(pathname:string){
  const clean=pathname.split(/[?#]/,1)[0]||"/";
  return clean.length>1?clean.replace(/\/+$/,""):clean;
}

/**
 * The floating WhatsApp button is a SALES action, never an owner tool.
 * This is only presentation logic; the actual purchase permission is
 * verified independently by Supabase for every protected operation.
 */
export function hideSalesWhatsappOnRoute(pathname:string):boolean{
  const path=canonicalPath(pathname);
  if(/^\/(?:r|mis-regalos|pedido|sorpresa|voz|admin|escape-r)(?:\/|$)/.test(path))return true;
  if(/^\/escapes\//.test(path))return true;
  if(/^\/juegos\/[^/]+\/(?:completo|jugar)(?:\/|$)/.test(path))return true;
  if(/^\/experiencias\/[^/]+\/editar(?:\/|$)/.test(path))return true;
  return false;
}

export function salesContextForRoute(pathname:string):SalesContext|null{
  const path=canonicalPath(pathname);
  const experience=/^\/experiencias\/([a-z0-9-]+)$/.exec(path);
  if(experience)return {kind:"experience",slug:experience[1]};
  const game=/^\/juegos\/(pack|trazo-complice|entre-dos|complices|meme-match)$/.exec(path);
  if(game)return {kind:"game",slug:game[1] as Extract<SalesContext,{kind:"game"}>["slug"]};
  return null;
}

export function buyerAlreadyOwnsSalesContext(gifts:readonly BoughtProduct[],context:SalesContext):boolean{
  const slugs=new Set(gifts.map(x=>x.experienceSlug));
  if(context.kind==="experience")return slugs.has(context.slug);
  if(context.slug==="pack")return slugs.has("pack-juegos");
  // The four-game pack includes all its individual games. Owners of the
  // standalone drawing game should not see another buy button for it.
  return slugs.has("pack-juegos")||(context.slug==="trazo-complice"&&slugs.has("trazo-complice"));
}
