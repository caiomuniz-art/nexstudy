-- NexStudy
-- Migração 1 de 2: tabelas, integridade e gatilhos de dados.
-- Execute no SQL Editor do Supabase (ou via CLI) antes da migração de RLS.
-- Horários de aula são "time" no relógio local da escola.
-- Datas de entrega, provas e sessões são timestamptz (instante absoluto).
-- A interface exibe tudo no fuso America/Sao_Paulo.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  school text,
  grade text,
  class_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_len check (char_length(full_name) <= 120),
  constraint profiles_email_len check (char_length(email) <= 320),
  constraint profiles_school_len check (school is null or char_length(school) <= 160),
  constraint profiles_grade_len check (grade is null or char_length(grade) <= 80),
  constraint profiles_class_len check (class_name is null or char_length(class_name) <= 80)
);

create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  tasks_view text not null default 'lista' check (tasks_view in ('lista', 'cartoes')),
  density text not null default 'confortavel' check (density in ('confortavel', 'compacta')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  deadlines_enabled boolean not null default true,
  overdue_enabled boolean not null default true,
  exams_enabled boolean not null default true,
  assignments_enabled boolean not null default true,
  sessions_enabled boolean not null default true,
  email_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  teacher text,
  color text not null default '#1d6fe8',
  description text,
  learning_goals text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_name_len check (char_length(btrim(name)) between 1 and 80),
  constraint subjects_teacher_len check (teacher is null or char_length(teacher) <= 120),
  constraint subjects_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint subjects_description_len check (description is null or char_length(description) <= 4000),
  constraint subjects_goals_len check (learning_goals is null or char_length(learning_goals) <= 4000)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz,
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta')),
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluida')),
  estimated_minutes integer,
  category text not null default 'tarefa' check (category in ('tarefa', 'leitura', 'exercicio', 'trabalho', 'revisao', 'outro')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_len check (char_length(btrim(title)) between 1 and 160),
  constraint tasks_description_len check (description is null or char_length(description) <= 4000),
  constraint tasks_notes_len check (notes is null or char_length(notes) <= 4000),
  constraint tasks_estimated_range check (
    estimated_minutes is null or (estimated_minutes >= 0 and estimated_minutes <= 1440)
  )
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null,
  type text not null check (type in ('prova', 'trabalho', 'apresentacao', 'recuperacao')),
  description text,
  exam_date timestamptz,
  study_content text,
  preparation_status text not null default 'nao_iniciada' check (
    preparation_status in ('nao_iniciada', 'em_andamento', 'revisando', 'preparado')
  ),
  importance text not null default 'media' check (importance in ('baixa', 'media', 'alta')),
  personal_notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessments_title_len check (char_length(btrim(title)) between 1 and 160),
  constraint assessments_description_len check (description is null or char_length(description) <= 4000),
  constraint assessments_content_len check (study_content is null or char_length(study_content) <= 4000),
  constraint assessments_notes_len check (personal_notes is null or char_length(personal_notes) <= 4000)
);

create table public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  room text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_schedules_time_order check (end_time > start_time),
  constraint class_schedules_room_len check (room is null or char_length(room) <= 40)
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null,
  scheduled_at timestamptz,
  duration_minutes integer not null,
  notes text,
  status text not null default 'agendada' check (status in ('agendada', 'em_andamento', 'concluida', 'cancelada')),
  actual_duration_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_sessions_title_len check (char_length(btrim(title)) between 1 and 160),
  constraint study_sessions_duration_range check (duration_minutes > 0 and duration_minutes <= 1440),
  constraint study_sessions_actual_range check (
    actual_duration_minutes is null
    or (actual_duration_minutes >= 0 and actual_duration_minutes <= 1440)
  ),
  constraint study_sessions_notes_len check (notes is null or char_length(notes) <= 4000)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (
    type in ('prazo_proximo', 'tarefa_atrasada', 'prova_futura', 'trabalho_pendente', 'sessao_agendada')
  ),
  dedupe_key text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_title_len check (char_length(title) between 1 and 160),
  constraint notifications_message_len check (char_length(message) between 1 and 500),
  constraint notifications_dedupe_len check (char_length(dedupe_key) between 1 and 120),
  constraint notifications_href_len check (href is null or char_length(href) <= 240),
  constraint notifications_user_dedupe unique (user_id, dedupe_key)
);

create index subjects_user_idx on public.subjects (user_id, name);
create index tasks_user_due_idx on public.tasks (user_id, due_at);
create index tasks_user_status_idx on public.tasks (user_id, status);
create index tasks_subject_idx on public.tasks (subject_id);
create index assessments_user_date_idx on public.assessments (user_id, exam_date);
create index assessments_subject_idx on public.assessments (subject_id);
create index class_schedules_user_day_idx on public.class_schedules (user_id, day_of_week, start_time);
create index study_sessions_user_sched_idx on public.study_sessions (user_id, scheduled_at);
create index notifications_user_read_idx on public.notifications (user_id, read_at);

create or replace function public.assert_subject_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.subject_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.subjects as subject
    where subject.id = new.subject_id
      and subject.user_id = new.user_id
  ) then
    raise exception 'A matéria selecionada não pertence à sua conta.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_schedule_overlap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.class_schedules as existing
    where existing.user_id = new.user_id
      and existing.day_of_week = new.day_of_week
      and existing.id is distinct from new.id
      and existing.start_time < new.end_time
      and new.start_time < existing.end_time
  ) then
    raise exception 'Este horário se sobrepõe a outra aula no mesmo dia.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create or replace function public.lock_profile_identity()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  auth_email text;
begin
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'Não é permitido alterar o identificador do perfil.'
      using errcode = 'P0001';
  end if;

  select users.email into auth_email
  from auth.users as users
  where users.id = new.id;

  new.email = coalesce(auth_email, case when tg_op = 'UPDATE' then old.email else '' end);
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger profiles_lock_identity
  before insert or update on public.profiles
  for each row execute function public.lock_profile_identity();

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

create trigger subjects_set_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger tasks_assert_subject
  before insert or update on public.tasks
  for each row execute function public.assert_subject_owner();

create trigger assessments_set_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();

create trigger assessments_assert_subject
  before insert or update on public.assessments
  for each row execute function public.assert_subject_owner();

create trigger class_schedules_set_updated_at
  before update on public.class_schedules
  for each row execute function public.set_updated_at();

create trigger class_schedules_assert_subject
  before insert or update on public.class_schedules
  for each row execute function public.assert_subject_owner();

create trigger class_schedules_prevent_overlap
  before insert or update on public.class_schedules
  for each row execute function public.prevent_schedule_overlap();

create trigger study_sessions_set_updated_at
  before update on public.study_sessions
  for each row execute function public.set_updated_at();

create trigger study_sessions_assert_subject
  before insert or update on public.study_sessions
  for each row execute function public.assert_subject_owner();
