-- Release invariant: a purchase is a fixed product identity, never a
-- reference to "whatever template happens to be the newest".
-- Non-destructive: existing gifts and their media are not modified.
create or replace function public.thi_lock_ordered_gift_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
      new.experience_slug is distinct from old.experience_slug
      or new.template_version is distinct from old.template_version
      or new.scene_recipe is distinct from old.scene_recipe
      or new.public_code is distinct from old.public_code
    )
    and (
      exists (select 1 from public.orders where gift_id = old.id)
      or exists (select 1 from public.gift_upsells where addon_gift_id = old.id)
    )
  then
    raise exception using
      errcode = '23514',
      message = 'purchased_gift_identity_locked',
      hint = 'A purchased gift cannot switch products, model versions, recipes, or public links. Use a reviewed data repair migration if a historical purchase needs correction.';
  end if;
  return new;
end;
$$;

drop trigger if exists thi_lock_ordered_gift_identity on public.gifts;
create trigger thi_lock_ordered_gift_identity
before update of experience_slug, template_version, scene_recipe, public_code
on public.gifts
for each row
execute function public.thi_lock_ordered_gift_identity();

comment on function public.thi_lock_ordered_gift_identity() is
  'Protects the immutable product, visual template, scene recipe, and share URL after order creation; personal texts and media remain editable.';
