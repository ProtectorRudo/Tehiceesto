-- The purchase's specialized template must be correct at INSERT time, too.
-- The old trigger accepted ANY "premium-vN" for Dragon Ball and other
-- specialized products, which could silently substitute a generic model.
-- Existing gifts are not modified by this migration.
create or replace function public.thi_selfserve_use_live_template()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  requested_version text;
  expected_version text;
begin
  if coalesce(new.story_data->'creator'->>'mode','') <> 'selfserve' then
    return new;
  end if;

  requested_version:=coalesce(new.story_data->'creator'->>'templateVersion','');
  expected_version:=case new.experience_slug
    when 'dragon-ball-pareja' then 'dragon-ball-v1'
    when 'pack-juegos' then 'pack-v1'
    when 'trazo-complice' then 'trazo-v1'
    when 'sticker-bomb-amistad' then 'sticker-bomb-v2'
    when 'club-amigos' then 'club-v1'
    when 'frasco365' then 'jar365-v1'
    when 'siete-dias' then 'seven-days-v1'
    else null
  end;
  if new.experience_slug like 'escape-%' then
    expected_version:='escape-v1';
  end if;

  if expected_version is not null then
    -- Fail closed: neither a missing version nor a generic version is
    -- sufficient to turn a specialized purchase into the generic engine.
    if requested_version is distinct from expected_version
       or new.template_version is distinct from expected_version then
      raise exception using
        errcode='23514',
        message='specialized_template_mismatch',
        hint='The product slug, template_version and creator.templateVersion must match the immutable specialized model.';
    end if;
  elsif requested_version ~ '^premium-v[0-9]+$' then
    new.template_version:=requested_version;
  elsif new.template_version !~ '^premium-v[0-9]+$' then
    -- Leave existing generic formats alone; unknown specialized families
    -- must not be downgraded to a generic page.
    raise exception using errcode='23514',message='unknown_template_version';
  end if;
  return new;
end;
$$;

comment on function public.thi_selfserve_use_live_template() is
  'Validates specialized self-service gift model identity on insert; never silently substitutes premium-v2 for purchased Dragon Ball, games, Frasco 365 or Siete Dias.';
