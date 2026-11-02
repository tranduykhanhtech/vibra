create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  bio text not null default '',
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
end;
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

insert into public.profiles (id, display_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

create or replace function public.prevent_client_role_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Profile role can only be changed by an administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_client_role_changes on public.profiles;
create trigger prevent_client_role_changes
  before update of role on public.profiles
  for each row execute procedure public.prevent_client_role_changes();

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  artist text not null default '',
  album text not null default 'Nhạc đã tải lên',
  duration integer not null default 0,
  cover_path text not null default '',
  audio_path text not null,
  media_type text not null default 'audio' check (media_type in ('audio', 'video')),
  plays text not null default 'Mới',
  created_at timestamptz not null default now()
);

alter table public.tracks add column if not exists media_type text not null default 'audio';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tracks_media_type_check'
      and conrelid = 'public.tracks'::regclass
  ) then
    alter table public.tracks
      add constraint tracks_media_type_check check (media_type in ('audio', 'video'));
  end if;
end;
$$;

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  cover_url text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.user_likes (
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.albums enable row level security;
alter table public.user_likes enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users create own profile" on public.profiles;
create policy "Users create own profile" on public.profiles
  for insert with check (auth.uid() = id and role = 'user');

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users manage own tracks" on public.tracks;
drop policy if exists "Authenticated users read tracks" on public.tracks;
create policy "Authenticated users read tracks" on public.tracks
  for select using (auth.uid() is not null);

drop policy if exists "Admins insert tracks" on public.tracks;
drop policy if exists "Users insert own tracks" on public.tracks;
create policy "Users insert own tracks" on public.tracks
  for insert with check (
    auth.uid() = user_id
  );

drop policy if exists "Admins update tracks" on public.tracks;
drop policy if exists "Users update own tracks" on public.tracks;
create policy "Users update own tracks" on public.tracks
  for update using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins delete tracks" on public.tracks;
drop policy if exists "Users delete own tracks" on public.tracks;
create policy "Users delete own tracks" on public.tracks
  for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Users manage own albums" on public.albums;
create policy "Users manage own albums" on public.albums
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own likes" on public.user_likes;
create policy "Users manage own likes" on public.user_likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('music', 'music', false, 524288000, array['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/wave', 'audio/vnd.wave', 'audio/x-wav', 'audio/x-pn-wav', 'audio/ogg', 'audio/flac', 'video/mp4', 'video/x-m4v', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 524288000,
  allowed_mime_types = excluded.allowed_mime_types;

update storage.objects
set metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{mimetype}', '"audio/wav"'::jsonb, true)
where bucket_id = 'music'
  and (lower(name) like '%.wav' or lower(name) like '%.wave')
  and coalesce(metadata ->> 'mimetype', '') <> 'audio/wav';

drop policy if exists "Public can read music files" on storage.objects;
drop policy if exists "Users read own music files" on storage.objects;
drop policy if exists "Authenticated users read music files" on storage.objects;
create policy "Authenticated users read music files" on storage.objects
  for select using (bucket_id = 'music' and auth.uid() is not null);

drop policy if exists "Users upload own music files" on storage.objects;
drop policy if exists "Admins upload music files" on storage.objects;
create policy "Users upload own music files" on storage.objects
  for insert with check (
    bucket_id = 'music'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own music files" on storage.objects;
drop policy if exists "Admins update music files" on storage.objects;
create policy "Users update own music files" on storage.objects
  for update using (
    bucket_id = 'music'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  ) with check (
    bucket_id = 'music'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

drop policy if exists "Users delete own music files" on storage.objects;
drop policy if exists "Admins delete music files" on storage.objects;
create policy "Users delete own music files" on storage.objects
  for delete using (
    bucket_id = 'music'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );