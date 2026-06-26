create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default 'AfterLife user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.couple_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.space_members (
  space_id uuid not null references public.couple_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'partner' check (role in ('owner', 'partner')),
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

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

create or replace function public.create_couple_space(space_name text, invite_code_input text)
returns public.couple_spaces
language plpgsql
security definer
set search_path = public
as $$
declare
  new_space public.couple_spaces;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.couple_spaces (name, invite_code, created_by)
  values (
    coalesce(nullif(trim(space_name), ''), 'Mo & Aysel'),
    upper(trim(invite_code_input)),
    auth.uid()
  )
  returning * into new_space;

  insert into public.space_members (space_id, user_id, role)
  values (new_space.id, auth.uid(), 'owner')
  on conflict do nothing;

  insert into public.space_preferences (space_id)
  values (new_space.id)
  on conflict do nothing;

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
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into target_space
  from public.couple_spaces
  where invite_code = upper(trim(invite_code_input));

  if target_space.id is null then
    raise exception 'Invite code not found';
  end if;

  insert into public.space_members (space_id, user_id, role)
  values (target_space.id, auth.uid(), 'partner')
  on conflict do nothing;

  return target_space;
end;
$$;

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

drop policy if exists "profiles are owned by user" on public.profiles;
create policy "profiles are owned by user"
on public.profiles
for all
using (id = auth.uid())
with check (id = auth.uid());

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

grant execute on function public.create_couple_space(text, text) to authenticated;
grant execute on function public.join_couple_space(text) to authenticated;

alter table public.memories replica identity full;
alter table public.list_items replica identity full;
alter table public.reading_items replica identity full;
alter table public.reading_notes replica identity full;
alter table public.space_preferences replica identity full;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['memories', 'list_items', 'reading_items', 'reading_notes', 'space_preferences']
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;
