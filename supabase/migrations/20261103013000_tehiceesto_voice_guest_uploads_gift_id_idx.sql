-- Cover the voice_guest_uploads -> gifts foreign key for incoming guest voices.
-- Non-destructive, safe to apply repeatedly, and independent from browser edits.
create index if not exists voice_guest_uploads_gift_id_idx
  on public.voice_guest_uploads (gift_id);
