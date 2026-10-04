-- EduStreak database
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Student',
  class_name text not null default '10',
  xp integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null
);
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_name text not null
);
create table if not exists public.teacher_subjects (
  teacher_id uuid references public.teachers(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  primary key(teacher_id,subject_id)
);
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_id text not null,
  duration_seconds integer not null default 0,
  notes_url text,
  chapter text not null,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  order_no integer not null default 1
);
create table if not exists public.video_progress (
  user_id uuid references public.profiles(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  watched_seconds numeric not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(user_id,video_id)
);
create table if not exists public.daily_study (
  user_id uuid references public.profiles(id) on delete cascade,
  study_date date not null,
  watched_seconds numeric not null default 0,
  qualified boolean not null default false,
  warning boolean not null default false,
  primary key(user_id,study_date)
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','Student')) on conflict(id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.record_watch_time(p_user_id uuid,p_video_id uuid,p_delta_seconds numeric) returns void language plpgsql security definer set search_path=public as $$
declare v_old numeric:=0; v_new numeric:=0; v_duration integer:=0; v_old_xp integer:=0; v_new_xp integer:=0; v_today date:=current_date; begin
  if p_user_id <> auth.uid() then raise exception 'forbidden'; end if;
  if p_delta_seconds <= 0 or p_delta_seconds > 15 then raise exception 'invalid delta'; end if;
  select watched_seconds into v_old from public.video_progress where user_id=p_user_id and video_id=p_video_id for update;
  select duration_seconds into v_duration from public.videos where id=p_video_id;
  insert into public.video_progress(user_id,video_id,watched_seconds,completed,updated_at)
  values(p_user_id,p_video_id,p_delta_seconds,false,now())
  on conflict(user_id,video_id) do update set watched_seconds=public.video_progress.watched_seconds+excluded.watched_seconds,updated_at=now();
  select watched_seconds into v_new from public.video_progress where user_id=p_user_id and video_id=p_video_id;
  if v_duration > 0 and v_new >= v_duration*0.9 then update public.video_progress set completed=true where user_id=p_user_id and video_id=p_video_id; end if;
  insert into public.daily_study(user_id,study_date,watched_seconds,qualified,warning) values(p_user_id,v_today,p_delta_seconds,p_delta_seconds>=2700,false)
  on conflict(user_id,study_date) do update set watched_seconds=public.daily_study.watched_seconds+excluded.watched_seconds,qualified=(public.daily_study.watched_seconds+excluded.watched_seconds)>=2700,warning=false;
  select xp into v_old_xp from public.profiles where id=p_user_id for update;
  v_new_xp=floor((select coalesce(sum(watched_seconds),0) from public.video_progress where user_id=p_user_id)/300);
  if v_new_xp>v_old_xp then update public.profiles set xp=v_new_xp where id=p_user_id; end if;
end; $$;

create or replace view public.leaderboard as select id,full_name,class_name,xp from public.profiles order by xp desc,full_name asc;

create or replace view public.subject_progress as
select p.id as user_id,s.id as subject_id,s.name,
coalesce(sum(vp.watched_seconds),0) as seconds,
coalesce(sum(case when vp.completed then 1 else 0 end),0)::int as completed_chapters,
(greatest(count(v.id)-count(vp.video_id),0))::int as pending_chapters
from public.profiles p cross join public.subjects s
left join public.videos v on v.subject_id=s.id
left join public.video_progress vp on vp.video_id=v.id and vp.user_id=p.id
group by p.id,s.id,s.name;

-- RLS
alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.subjects enable row level security;
alter table public.teacher_subjects enable row level security;
alter table public.videos enable row level security;
alter table public.video_progress enable row level security;
alter table public.daily_study enable row level security;

drop policy if exists profile_self on public.profiles; create policy profile_self on public.profiles for select using(auth.uid()=id);
drop policy if exists teachers_read on public.teachers; create policy teachers_read on public.teachers for select using(true);
drop policy if exists subjects_read on public.subjects; create policy subjects_read on public.subjects for select using(true);
drop policy if exists teacher_subjects_read on public.teacher_subjects; create policy teacher_subjects_read on public.teacher_subjects for select using(true);
drop policy if exists videos_read on public.videos; create policy videos_read on public.videos for select using(true);
drop policy if exists progress_self on public.video_progress; create policy progress_self on public.video_progress for select using(auth.uid()=user_id);
drop policy if exists daily_self on public.daily_study; create policy daily_self on public.daily_study for select using(auth.uid()=user_id);


-- Sample content: replace these with your actual teachers/subjects/videos.
insert into public.teachers(name) select 'Sample Teacher' where not exists(select 1 from public.teachers where name='Sample Teacher');
insert into public.subjects(name,class_name) select 'Mathematics','10' where not exists(select 1 from public.subjects where name='Mathematics' and class_name='10');

create or replace function public.get_streak_calendar(p_user_id uuid)
returns table(study_date date,watched_seconds numeric,qualified boolean,warning boolean)
language sql security definer set search_path=public as $$
select d::date,coalesce(ds.watched_seconds,0),coalesce(ds.qualified,false),
       (d::date < current_date and not coalesce(ds.qualified,false)) as warning
from generate_series(current_date-interval '13 days',current_date,interval '1 day') d
left join public.daily_study ds on ds.user_id=p_user_id and ds.study_date=d::date
order by d desc;
$$;
grant execute on function public.get_streak_calendar(uuid) to authenticated;
