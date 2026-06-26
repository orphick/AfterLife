create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default 'AfterLife user',
  avatar_path text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists timezone text;

create table if not exists public.couple_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  invite_code_rotated_at timestamptz not null default now(),
  invite_expires_at timestamptz,
  invite_disabled boolean not null default false,
  max_members integer not null default 2,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.couple_spaces add column if not exists invite_code_rotated_at timestamptz not null default now();
alter table public.couple_spaces add column if not exists invite_expires_at timestamptz;
alter table public.couple_spaces add column if not exists invite_disabled boolean not null default false;
alter table public.couple_spaces add column if not exists max_members integer not null default 2;

create table if not exists public.space_members (
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'partner' check (role in ('owner', 'partner')),
  nickname text,
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

alter table public.space_members add column if not exists nickname text;

create table if not exists public.space_preferences (
  space_id uuid primary key references public.couple_spaces(id) on delete cascade,
  active_activity text not null default 'read',
  mood text not null default 'Need comfort',
  glimpse_kind text not null default 'Photo',
  boundary text not null default 'Flirty',
  spicy_mo boolean not null default true,
  spicy_aysel boolean not null default true,
  reading_progress integer not null default 42 check (reading_progress between 0 and 100),
  reader_night boolean not null default false,
  glimpse_caption text not null default 'This made me think of you.',
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  kind text not null default 'memory',
  title text not null,
  body text not null default '',
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_lists (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  title text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  list_id uuid references public.shared_lists(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  position integer not null default 0,
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reading_items (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  file_type text not null default 'PDF' check (file_type in ('PDF', 'EPUB')),
  title text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  meta text not null default 'Shared reading item',
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reading_progress (
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  reading_item_id uuid not null references public.reading_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (reading_item_id, user_id)
);

create table if not exists public.reading_notes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  reading_item_id uuid references public.reading_items(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  page text not null default 'p.21',
  body text not null,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  memory_id uuid references public.memories(id) on delete cascade,
  reading_item_id uuid references public.reading_items(id) on delete cascade,
  bucket_id text not null default 'afterlife-media',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  asset_kind text not null default 'attachment' check (asset_kind in ('attachment', 'glimpse', 'memory', 'book', 'voice', 'avatar')),
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_id, storage_path)
);

create table if not exists public.space_events (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'couple_spaces_invite_code_format'
  ) then
    alter table public.couple_spaces
      add constraint couple_spaces_invite_code_format
      check (invite_code ~ '^[A-Z0-9]{6,16}$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'couple_spaces_max_members_range'
  ) then
    alter table public.couple_spaces
      add constraint couple_spaces_max_members_range
      check (max_members between 2 and 8);
  end if;
end;
$$;

create index if not exists idx_space_members_user on public.space_members(user_id);
create index if not exists idx_space_members_space on public.space_members(space_id);
create index if not exists idx_memories_space_created on public.memories(space_id, created_at desc);
create index if not exists idx_memories_created_by on public.memories(created_by);
create index if not exists idx_shared_lists_space on public.shared_lists(space_id);
create index if not exists idx_list_items_space_position on public.list_items(space_id, position);
create index if not exists idx_reading_items_space_created on public.reading_items(space_id, created_at desc);
create index if not exists idx_reading_progress_space_user on public.reading_progress(space_id, user_id);
create index if not exists idx_reading_notes_space_created on public.reading_notes(space_id, created_at desc);
create index if not exists idx_media_assets_space_created on public.media_assets(space_id, created_at desc);
create index if not exists idx_media_assets_memory on public.media_assets(memory_id) where memory_id is not null;
create index if not exists idx_media_assets_reading_item on public.media_assets(reading_item_id) where reading_item_id is not null;
create index if not exists idx_space_events_space_created on public.space_events(space_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_couple_spaces_updated_at on public.couple_spaces;
create trigger touch_couple_spaces_updated_at before update on public.couple_spaces
for each row execute function public.touch_updated_at();

drop trigger if exists touch_space_preferences_updated_at on public.space_preferences;
create trigger touch_space_preferences_updated_at before update on public.space_preferences
for each row execute function public.touch_updated_at();

drop trigger if exists touch_memories_updated_at on public.memories;
create trigger touch_memories_updated_at before update on public.memories
for each row execute function public.touch_updated_at();

drop trigger if exists touch_shared_lists_updated_at on public.shared_lists;
create trigger touch_shared_lists_updated_at before update on public.shared_lists
for each row execute function public.touch_updated_at();

drop trigger if exists touch_list_items_updated_at on public.list_items;
create trigger touch_list_items_updated_at before update on public.list_items
for each row execute function public.touch_updated_at();

drop trigger if exists touch_reading_items_updated_at on public.reading_items;
create trigger touch_reading_items_updated_at before update on public.reading_items
for each row execute function public.touch_updated_at();

drop trigger if exists touch_reading_progress_updated_at on public.reading_progress;
create trigger touch_reading_progress_updated_at before update on public.reading_progress
for each row execute function public.touch_updated_at();

drop trigger if exists touch_reading_notes_updated_at on public.reading_notes;
create trigger touch_reading_notes_updated_at before update on public.reading_notes
for each row execute function public.touch_updated_at();

drop trigger if exists touch_media_assets_updated_at on public.media_assets;
create trigger touch_media_assets_updated_at before update on public.media_assets
for each row execute function public.touch_updated_at();

create or replace function public.normalize_invite_code(raw_code text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(upper(coalesce(raw_code, '')), '[^A-Z0-9]', '', 'g'), '');
$$;

create or replace function public.generate_invite_code(length_input integer default 8)
returns text
language plpgsql
volatile
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  amount integer := greatest(6, least(coalesce(length_input, 8), 16));
  index integer;
begin
  for index in 1..amount loop
    code := code || substr(alphabet, floor(random() * length(alphabet) + 1)::integer, 1);
  end loop;

  return code;
end;
$$;

create or replace function public.is_space_member(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_members
    where space_id = target_space_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_space_owner(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_members
    where space_id = target_space_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.storage_object_space_id(object_name text)
returns uuid
language sql
immutable
as $$
  select case
    when split_part(coalesce(object_name, ''), '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(object_name, '/', 1)::uuid
    else null
  end;
$$;

create or replace function public.bootstrap_profile(display_name_input text default null)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text := coalesce(auth.jwt() ->> 'email', '');
  clean_name text := nullif(trim(coalesce(display_name_input, '')), '');
  next_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if clean_name is null then
    clean_name := nullif(split_part(user_email, '@', 1), '');
  end if;

  insert into public.profiles (id, email, display_name)
  values (auth.uid(), user_email, coalesce(clean_name, 'AfterLife user'))
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(nullif(trim(display_name_input), ''), public.profiles.display_name),
        updated_at = now()
  returning * into next_profile;

  return next_profile;
end;
$$;

create or replace function public.get_my_spaces()
returns table (
  id uuid,
  name text,
  invite_code text,
  role text,
  member_count bigint,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    spaces.id,
    spaces.name,
    spaces.invite_code,
    members.role,
    counts.member_count,
    spaces.created_at
  from public.space_members members
  join public.couple_spaces spaces on spaces.id = members.space_id
  left join lateral (
    select count(*)::bigint as member_count
    from public.space_members counted
    where counted.space_id = spaces.id
  ) counts on true
  where members.user_id = auth.uid()
  order by members.joined_at asc;
end;
$$;

create or replace function public.create_couple_space(space_name text, invite_code_input text default null)
returns public.couple_spaces
language plpgsql
security definer
set search_path = public
as $$
declare
  new_space public.couple_spaces;
  requested_code text := public.normalize_invite_code(invite_code_input);
  next_code text := requested_code;
  attempt integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if next_code is not null and (length(next_code) < 6 or length(next_code) > 16) then
    raise exception 'Invite code must be 6 to 16 letters or numbers';
  end if;

  loop
    attempt := attempt + 1;
    if next_code is null then
      next_code := public.generate_invite_code(8);
    end if;

    begin
      insert into public.couple_spaces (name, invite_code, created_by)
      values (
        coalesce(nullif(trim(space_name), ''), 'Mo & Aysel'),
        next_code,
        auth.uid()
      )
      returning * into new_space;

      exit;
    exception
      when unique_violation then
        if requested_code is not null then
          raise exception 'Invite code already exists';
        end if;
        if attempt >= 8 then
          raise exception 'Could not create a unique invite code';
        end if;
        next_code := null;
    end;
  end loop;

  insert into public.space_members (space_id, user_id, role)
  values (new_space.id, auth.uid(), 'owner')
  on conflict do nothing;

  insert into public.space_preferences (space_id)
  values (new_space.id)
  on conflict do nothing;

  insert into public.space_events (space_id, actor_id, event_kind, payload)
  values (new_space.id, auth.uid(), 'space.created', jsonb_build_object('name', new_space.name));

  return new_space;
end;
$$;

create or replace function public.join_couple_space(invite_code_input text)
returns public.couple_spaces
language plpgsql
security definer
set search_path = public
as $$
declare
  target_space public.couple_spaces;
  member_total integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into target_space
  from public.couple_spaces
  where invite_code = public.normalize_invite_code(invite_code_input)
    and invite_disabled = false
    and (invite_expires_at is null or invite_expires_at > now());

  if target_space.id is null then
    raise exception 'Invite code not found';
  end if;

  if exists (
    select 1 from public.space_members
    where space_id = target_space.id
      and user_id = auth.uid()
  ) then
    return target_space;
  end if;

  select count(*) into member_total
  from public.space_members
  where space_id = target_space.id;

  if member_total >= target_space.max_members then
    raise exception 'This couple space already has two people';
  end if;

  insert into public.space_members (space_id, user_id, role)
  values (target_space.id, auth.uid(), 'partner')
  on conflict do nothing;

  insert into public.space_events (space_id, actor_id, event_kind, payload)
  values (target_space.id, auth.uid(), 'member.joined', jsonb_build_object('role', 'partner'));

  return target_space;
end;
$$;

create or replace function public.rotate_space_invite(target_space_id uuid)
returns public.couple_spaces
language plpgsql
security definer
set search_path = public
as $$
declare
  next_space public.couple_spaces;
  next_code text;
  attempt integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_space_owner(target_space_id) then
    raise exception 'Only the space owner can rotate the invite code';
  end if;

  loop
    attempt := attempt + 1;
    next_code := public.generate_invite_code(8);

    begin
      update public.couple_spaces
      set invite_code = next_code,
          invite_code_rotated_at = now(),
          invite_disabled = false,
          invite_expires_at = null
      where id = target_space_id
      returning * into next_space;

      exit;
    exception
      when unique_violation then
        if attempt >= 8 then
          raise exception 'Could not create a unique invite code';
        end if;
    end;
  end loop;

  insert into public.space_events (space_id, actor_id, event_kind, payload)
  values (target_space_id, auth.uid(), 'space.invite_rotated', jsonb_build_object('invite_code', next_space.invite_code));

  return next_space;
end;
$$;

create or replace function public.record_space_event(target_space_id uuid, event_kind text, event_payload jsonb default '{}'::jsonb)
returns public.space_events
language plpgsql
security definer
set search_path = public
as $$
declare
  new_event public.space_events;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_space_member(target_space_id) then
    raise exception 'Not a member of this space';
  end if;

  insert into public.space_events (space_id, actor_id, event_kind, payload)
  values (target_space_id, auth.uid(), coalesce(nullif(trim(event_kind), ''), 'space.event'), coalesce(event_payload, '{}'::jsonb))
  returning * into new_event;

  return new_event;
end;
$$;

create or replace function public.delete_couple_space(target_space_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_space_owner(target_space_id) then
    raise exception 'Only the space owner can delete the couple space';
  end if;

  delete from public.couple_spaces
  where id = target_space_id;
end;
$$;

create or replace function public.validate_list_item_space()
returns trigger
language plpgsql
as $$
begin
  if new.list_id is not null and not exists (
    select 1 from public.shared_lists
    where id = new.list_id
      and space_id = new.space_id
  ) then
    raise exception 'List item space does not match its list';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_list_item_space on public.list_items;
create trigger validate_list_item_space before insert or update on public.list_items
for each row execute function public.validate_list_item_space();

create or replace function public.validate_reading_progress_space()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.reading_items
    where id = new.reading_item_id
      and space_id = new.space_id
  ) then
    raise exception 'Reading progress space does not match reading item';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_reading_progress_space on public.reading_progress;
create trigger validate_reading_progress_space before insert or update on public.reading_progress
for each row execute function public.validate_reading_progress_space();

create or replace function public.validate_reading_note_space()
returns trigger
language plpgsql
as $$
begin
  if new.reading_item_id is not null and not exists (
    select 1 from public.reading_items
    where id = new.reading_item_id
      and space_id = new.space_id
  ) then
    raise exception 'Reading note space does not match reading item';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_reading_note_space on public.reading_notes;
create trigger validate_reading_note_space before insert or update on public.reading_notes
for each row execute function public.validate_reading_note_space();

create or replace function public.validate_media_asset_links()
returns trigger
language plpgsql
as $$
begin
  if public.storage_object_space_id(new.storage_path) is distinct from new.space_id then
    raise exception 'Media storage path must start with the space id';
  end if;

  if new.memory_id is not null and not exists (
    select 1 from public.memories
    where id = new.memory_id
      and space_id = new.space_id
  ) then
    raise exception 'Media asset space does not match memory';
  end if;

  if new.reading_item_id is not null and not exists (
    select 1 from public.reading_items
    where id = new.reading_item_id
      and space_id = new.space_id
  ) then
    raise exception 'Media asset space does not match reading item';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_media_asset_links on public.media_assets;
create trigger validate_media_asset_links before insert or update on public.media_assets
for each row execute function public.validate_media_asset_links();

create or replace function public.set_created_by_column()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    new.created_by = auth.uid();
  elsif TG_OP = 'UPDATE' then
    new.created_by = old.created_by;
  end if;

  return new;
end;
$$;

drop trigger if exists set_memories_created_by on public.memories;
create trigger set_memories_created_by before insert or update on public.memories
for each row execute function public.set_created_by_column();

drop trigger if exists set_shared_lists_created_by on public.shared_lists;
create trigger set_shared_lists_created_by before insert or update on public.shared_lists
for each row execute function public.set_created_by_column();

drop trigger if exists set_list_items_created_by on public.list_items;
create trigger set_list_items_created_by before insert or update on public.list_items
for each row execute function public.set_created_by_column();

drop trigger if exists set_reading_items_created_by on public.reading_items;
create trigger set_reading_items_created_by before insert or update on public.reading_items
for each row execute function public.set_created_by_column();

drop trigger if exists set_reading_notes_created_by on public.reading_notes;
create trigger set_reading_notes_created_by before insert or update on public.reading_notes
for each row execute function public.set_created_by_column();

create or replace function public.set_reading_progress_user()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    new.user_id = auth.uid();
  elsif TG_OP = 'UPDATE' then
    new.user_id = old.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists set_reading_progress_user on public.reading_progress;
create trigger set_reading_progress_user before insert or update on public.reading_progress
for each row execute function public.set_reading_progress_user();

create or replace function public.set_media_uploaded_by()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    new.uploaded_by = auth.uid();
  elsif TG_OP = 'UPDATE' then
    new.uploaded_by = old.uploaded_by;
  end if;

  return new;
end;
$$;

drop trigger if exists set_media_uploaded_by on public.media_assets;
create trigger set_media_uploaded_by before insert or update on public.media_assets
for each row execute function public.set_media_uploaded_by();

create or replace function public.set_space_event_actor()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    new.actor_id = auth.uid();
  elsif TG_OP = 'UPDATE' then
    new.actor_id = old.actor_id;
  end if;

  return new;
end;
$$;

drop trigger if exists set_space_event_actor on public.space_events;
create trigger set_space_event_actor before insert or update on public.space_events
for each row execute function public.set_space_event_actor();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'afterlife-media',
  'afterlife-media',
  false,
  52428800,
  array[
    'application/pdf',
    'application/epub+zip',
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/mpeg',
    'audio/mp4',
    'audio/webm',
    'video/mp4',
    'text/plain'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles enable row level security;
alter table public.couple_spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.space_preferences enable row level security;
alter table public.memories enable row level security;
alter table public.shared_lists enable row level security;
alter table public.list_items enable row level security;
alter table public.reading_items enable row level security;
alter table public.reading_progress enable row level security;
alter table public.reading_notes enable row level security;
alter table public.media_assets enable row level security;
alter table public.space_events enable row level security;

drop policy if exists "profiles are owned by user" on public.profiles;
drop policy if exists "users manage own profile" on public.profiles;
create policy "users manage own profile"
on public.profiles
for all
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "members can view partner profiles" on public.profiles;
create policy "members can view partner profiles"
on public.profiles
for select
using (
  id = auth.uid()
  or exists (
    select 1
    from public.space_members mine
    join public.space_members theirs on theirs.space_id = mine.space_id
    where mine.user_id = auth.uid()
      and theirs.user_id = public.profiles.id
  )
);

drop policy if exists "members can view spaces" on public.couple_spaces;
create policy "members can view spaces"
on public.couple_spaces
for select
using (public.is_space_member(id));

drop policy if exists "owners can update spaces" on public.couple_spaces;
create policy "owners can update spaces"
on public.couple_spaces
for update
using (public.is_space_owner(id))
with check (public.is_space_owner(id));

drop policy if exists "members can view memberships" on public.space_members;
create policy "members can view memberships"
on public.space_members
for select
using (user_id = auth.uid() or public.is_space_member(space_id));

drop policy if exists "members can view preferences" on public.space_preferences;
create policy "members can view preferences"
on public.space_preferences
for select
using (public.is_space_member(space_id));

drop policy if exists "members can update preferences" on public.space_preferences;
create policy "members can update preferences"
on public.space_preferences
for all
using (public.is_space_member(space_id))
with check (public.is_space_member(space_id));

drop policy if exists "members can manage memories" on public.memories;
create policy "members can manage memories"
on public.memories
for all
using (public.is_space_member(space_id))
with check (public.is_space_member(space_id));

drop policy if exists "members can manage shared lists" on public.shared_lists;
create policy "members can manage shared lists"
on public.shared_lists
for all
using (public.is_space_member(space_id))
with check (public.is_space_member(space_id));

drop policy if exists "members can manage list items" on public.list_items;
create policy "members can manage list items"
on public.list_items
for all
using (public.is_space_member(space_id))
with check (public.is_space_member(space_id));

drop policy if exists "members can manage reading items" on public.reading_items;
create policy "members can manage reading items"
on public.reading_items
for all
using (public.is_space_member(space_id))
with check (public.is_space_member(space_id));

drop policy if exists "members can manage reading progress" on public.reading_progress;
create policy "members can manage reading progress"
on public.reading_progress
for all
using (public.is_space_member(space_id))
with check (public.is_space_member(space_id));

drop policy if exists "members can manage reading notes" on public.reading_notes;
create policy "members can manage reading notes"
on public.reading_notes
for all
using (public.is_space_member(space_id))
with check (public.is_space_member(space_id));

drop policy if exists "members can manage media assets" on public.media_assets;
create policy "members can manage media assets"
on public.media_assets
for all
using (public.is_space_member(space_id))
with check (public.is_space_member(space_id));

drop policy if exists "members can view space events" on public.space_events;
create policy "members can view space events"
on public.space_events
for select
using (public.is_space_member(space_id));

drop policy if exists "members can create space events" on public.space_events;
create policy "members can create space events"
on public.space_events
for insert
with check (public.is_space_member(space_id) and actor_id = auth.uid());

drop policy if exists "afterlife media read" on storage.objects;
create policy "afterlife media read"
on storage.objects
for select
using (
  bucket_id = 'afterlife-media'
  and public.is_space_member(public.storage_object_space_id(name))
);

drop policy if exists "afterlife media insert" on storage.objects;
create policy "afterlife media insert"
on storage.objects
for insert
with check (
  bucket_id = 'afterlife-media'
  and public.is_space_member(public.storage_object_space_id(name))
);

drop policy if exists "afterlife media update" on storage.objects;
create policy "afterlife media update"
on storage.objects
for update
using (
  bucket_id = 'afterlife-media'
  and public.is_space_member(public.storage_object_space_id(name))
)
with check (
  bucket_id = 'afterlife-media'
  and public.is_space_member(public.storage_object_space_id(name))
);

drop policy if exists "afterlife media delete" on storage.objects;
create policy "afterlife media delete"
on storage.objects
for delete
using (
  bucket_id = 'afterlife-media'
  and public.is_space_member(public.storage_object_space_id(name))
);

grant execute on function public.bootstrap_profile(text) to authenticated;
grant execute on function public.get_my_spaces() to authenticated;
grant execute on function public.create_couple_space(text, text) to authenticated;
grant execute on function public.join_couple_space(text) to authenticated;
grant execute on function public.rotate_space_invite(uuid) to authenticated;
grant execute on function public.record_space_event(uuid, text, jsonb) to authenticated;
grant execute on function public.delete_couple_space(uuid) to authenticated;

alter table public.memories replica identity full;
alter table public.list_items replica identity full;
alter table public.reading_items replica identity full;
alter table public.reading_notes replica identity full;
alter table public.space_preferences replica identity full;
alter table public.media_assets replica identity full;
alter table public.space_events replica identity full;

do $$
declare
  publication_table text;
begin
  foreach publication_table in array array[
    'memories',
    'list_items',
    'reading_items',
    'reading_notes',
    'space_preferences',
    'media_assets',
    'space_events'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = publication_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', publication_table);
    end if;
  end loop;
end;
$$;
