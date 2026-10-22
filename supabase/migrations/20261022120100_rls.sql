-- NexStudy
-- Migração 2 de 2: RLS, perfil automático, storage de avatar e exclusão da conta.
-- Rode depois de 20261022120000_schema.sql.
-- Não usa chave de administração no aplicativo. A exclusão da própria conta
-- passa pela função delete_own_account, executada com a sessão do estudante.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'Estudante'),
    coalesce(new.email, '')
  );

  insert into public.user_preferences (user_id) values (new.id);
  insert into public.notification_preferences (user_id) values (new.id);
  return new;
end;
$$;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Não autenticado'
      using errcode = 'P0001';
  end if;

  if exists (select 1 from pg_namespace where nspname = 'storage') then
    delete from storage.objects
    where bucket_id = 'avatars'
      and (storage.foldername(name))[1] = uid::text;
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.delete_own_account() from public, anon;
revoke all on function public.assert_subject_owner() from public, anon;
revoke all on function public.prevent_schedule_overlap() from public, anon;
revoke all on function public.lock_profile_identity() from public, anon;
revoke all on function public.set_updated_at() from public, anon;

grant execute on function public.delete_own_account() to authenticated;
grant execute on function public.assert_subject_owner() to authenticated;
grant execute on function public.prevent_schedule_overlap() to authenticated;
grant execute on function public.lock_profile_identity() to authenticated;
grant execute on function public.set_updated_at() to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant execute on function public.handle_new_user() to supabase_auth_admin;
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'auth')
     and exists (select 1 from pg_class where relname = 'users' and relnamespace = 'auth'::regnamespace) then
    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end;
$$;

grant usage on schema public to authenticated;

revoke all on table public.profiles from public, anon;
revoke all on table public.user_preferences from public, anon;
revoke all on table public.notification_preferences from public, anon;
revoke all on table public.subjects from public, anon;
revoke all on table public.tasks from public, anon;
revoke all on table public.assessments from public, anon;
revoke all on table public.class_schedules from public, anon;
revoke all on table public.study_sessions from public, anon;
revoke all on table public.notifications from public, anon;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;
grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.assessments to authenticated;
grant select, insert, update, delete on public.class_schedules to authenticated;
grant select, insert, update, delete on public.study_sessions to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.subjects enable row level security;
alter table public.tasks enable row level security;
alter table public.assessments enable row level security;
alter table public.class_schedules enable row level security;
alter table public.study_sessions enable row level security;
alter table public.notifications enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid());
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists user_preferences_select on public.user_preferences;
drop policy if exists user_preferences_insert on public.user_preferences;
drop policy if exists user_preferences_update on public.user_preferences;
drop policy if exists user_preferences_delete on public.user_preferences;
create policy user_preferences_select on public.user_preferences
  for select to authenticated using (user_id = auth.uid());
create policy user_preferences_insert on public.user_preferences
  for insert to authenticated with check (user_id = auth.uid());
create policy user_preferences_update on public.user_preferences
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy user_preferences_delete on public.user_preferences
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists notification_preferences_select on public.notification_preferences;
drop policy if exists notification_preferences_insert on public.notification_preferences;
drop policy if exists notification_preferences_update on public.notification_preferences;
drop policy if exists notification_preferences_delete on public.notification_preferences;
create policy notification_preferences_select on public.notification_preferences
  for select to authenticated using (user_id = auth.uid());
create policy notification_preferences_insert on public.notification_preferences
  for insert to authenticated with check (user_id = auth.uid());
create policy notification_preferences_update on public.notification_preferences
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy notification_preferences_delete on public.notification_preferences
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists subjects_select on public.subjects;
drop policy if exists subjects_insert on public.subjects;
drop policy if exists subjects_update on public.subjects;
drop policy if exists subjects_delete on public.subjects;
create policy subjects_select on public.subjects
  for select to authenticated using (user_id = auth.uid());
create policy subjects_insert on public.subjects
  for insert to authenticated with check (user_id = auth.uid());
create policy subjects_update on public.subjects
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy subjects_delete on public.subjects
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists tasks_select on public.tasks;
drop policy if exists tasks_insert on public.tasks;
drop policy if exists tasks_update on public.tasks;
drop policy if exists tasks_delete on public.tasks;
create policy tasks_select on public.tasks
  for select to authenticated using (user_id = auth.uid());
create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      subject_id is null
      or exists (
        select 1 from public.subjects as subject
        where subject.id = subject_id and subject.user_id = auth.uid()
      )
    )
  );
create policy tasks_update on public.tasks
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      subject_id is null
      or exists (
        select 1 from public.subjects as subject
        where subject.id = subject_id and subject.user_id = auth.uid()
      )
    )
  );
create policy tasks_delete on public.tasks
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists assessments_select on public.assessments;
drop policy if exists assessments_insert on public.assessments;
drop policy if exists assessments_update on public.assessments;
drop policy if exists assessments_delete on public.assessments;
create policy assessments_select on public.assessments
  for select to authenticated using (user_id = auth.uid());
create policy assessments_insert on public.assessments
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      subject_id is null
      or exists (
        select 1 from public.subjects as subject
        where subject.id = subject_id and subject.user_id = auth.uid()
      )
    )
  );
create policy assessments_update on public.assessments
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      subject_id is null
      or exists (
        select 1 from public.subjects as subject
        where subject.id = subject_id and subject.user_id = auth.uid()
      )
    )
  );
create policy assessments_delete on public.assessments
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists class_schedules_select on public.class_schedules;
drop policy if exists class_schedules_insert on public.class_schedules;
drop policy if exists class_schedules_update on public.class_schedules;
drop policy if exists class_schedules_delete on public.class_schedules;
create policy class_schedules_select on public.class_schedules
  for select to authenticated using (user_id = auth.uid());
create policy class_schedules_insert on public.class_schedules
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      subject_id is null
      or exists (
        select 1 from public.subjects as subject
        where subject.id = subject_id and subject.user_id = auth.uid()
      )
    )
  );
create policy class_schedules_update on public.class_schedules
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      subject_id is null
      or exists (
        select 1 from public.subjects as subject
        where subject.id = subject_id and subject.user_id = auth.uid()
      )
    )
  );
create policy class_schedules_delete on public.class_schedules
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists study_sessions_select on public.study_sessions;
drop policy if exists study_sessions_insert on public.study_sessions;
drop policy if exists study_sessions_update on public.study_sessions;
drop policy if exists study_sessions_delete on public.study_sessions;
create policy study_sessions_select on public.study_sessions
  for select to authenticated using (user_id = auth.uid());
create policy study_sessions_insert on public.study_sessions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      subject_id is null
      or exists (
        select 1 from public.subjects as subject
        where subject.id = subject_id and subject.user_id = auth.uid()
      )
    )
  );
create policy study_sessions_update on public.study_sessions
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      subject_id is null
      or exists (
        select 1 from public.subjects as subject
        where subject.id = subject_id and subject.user_id = auth.uid()
      )
    )
  );
create policy study_sessions_delete on public.study_sessions
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists notifications_select on public.notifications;
drop policy if exists notifications_insert on public.notifications;
drop policy if exists notifications_update on public.notifications;
drop policy if exists notifications_delete on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notifications_insert on public.notifications
  for insert to authenticated with check (user_id = auth.uid());
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy notifications_delete on public.notifications
  for delete to authenticated using (user_id = auth.uid());

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'avatars',
      'avatars',
      true,
      2097152,
      array['image/png', 'image/jpeg', 'image/webp']
    )
    on conflict (id) do update
      set public = excluded.public,
          file_size_limit = excluded.file_size_limit,
          allowed_mime_types = excluded.allowed_mime_types;

    drop policy if exists avatars_select on storage.objects;
    drop policy if exists avatars_insert on storage.objects;
    drop policy if exists avatars_update on storage.objects;
    drop policy if exists avatars_delete on storage.objects;

    create policy avatars_select on storage.objects
      for select
      using (bucket_id = 'avatars');

    create policy avatars_insert on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );

    create policy avatars_update on storage.objects
      for update to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );

    create policy avatars_delete on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end;
$$;
