-- Contato opcional para avisos. Aceita qualquer texto e não serve para entrar.

alter table public.notification_preferences
  add column if not exists notification_contact text not null default '';

alter table public.notification_preferences
  drop constraint if exists notification_contact_len;

alter table public.notification_preferences
  add constraint notification_contact_len check (char_length(notification_contact) <= 320);
