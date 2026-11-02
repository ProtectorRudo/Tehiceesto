-- Preserve product-specific version snapshots created by the trusted order-create service.
-- Older trigger silently downgraded all non-premium versions to premium-v2.
create or replace function public.thi_selfserve_use_live_template()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  requested_version text;
begin
  if coalesce(new.story_data->'creator'->>'mode','') = 'selfserve' then
    requested_version := coalesce(new.story_data->'creator'->>'templateVersion','');
    if requested_version ~ '^premium-v[0-9]+$'
      or (new.experience_slug = 'dragon-ball-pareja' and requested_version = 'dragon-ball-v1')
      or (new.experience_slug = 'pack-juegos' and requested_version = 'pack-v1')
      or (new.experience_slug = 'trazo-complice' and requested_version = 'trazo-v1')
      or (new.experience_slug = 'sticker-bomb-amistad' and requested_version = 'sticker-bomb-v2')
      or (new.experience_slug = 'club-amigos' and requested_version = 'club-v1')
      or (new.experience_slug = 'frasco365' and requested_version = 'jar365-v1')
      or (new.experience_slug = 'siete-dias' and requested_version = 'seven-days-v1')
      or (new.experience_slug like 'escape-%' and requested_version = 'escape-v1')
    then
      new.template_version := requested_version;
    else
      -- Preserve established legacy behavior for older self-service payloads.
      new.template_version := 'premium-v2';
    end if;
  end if;
  return new;
end;
$function$;

-- Restore the frozen Dragon Ball identifier on pre-existing purchases.
-- Never change payment state, media, content, tokens, or access.
update public.gifts
set template_version = 'dragon-ball-v1'
where experience_slug = 'dragon-ball-pareja'
  and template_version = 'premium-v2'
  and story_data #>> '{creator,mode}' = 'selfserve'
  and story_data #>> '{creator,templateVersion}' = 'dragon-ball-v1';
