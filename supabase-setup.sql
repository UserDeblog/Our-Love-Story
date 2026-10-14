-- Run once in Supabase Dashboard → SQL Editor.
-- Anyone with the public site link can read and upload gallery media.
-- Only emails in public.gallery_admins can permanently delete uploaded media.

create table if not exists public.gallery_admins (
    email text primary key
);
alter table public.gallery_admins enable row level security;
revoke all on public.gallery_admins from anon, authenticated;

create or replace function public.is_gallery_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.gallery_admins
        where pg_catalog.lower(email) = pg_catalog.lower(auth.jwt() ->> 'email')
    );
$$;
revoke all on function public.is_gallery_admin() from public, anon;
grant execute on function public.is_gallery_admin() to authenticated;

create table if not exists public.memories (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    subtitle text not null,
    category text not null check (category in ('us', 'dates', 'special-days', 'videos')),
    media_type text not null check (media_type in ('image', 'video')),
    file_path text not null unique,
    created_at timestamptz not null default now(),
    uploaded_by uuid references auth.users(id) on delete set null
);

alter table public.memories enable row level security;
revoke all on public.memories from anon, authenticated;
grant select on public.memories to anon, authenticated;
grant insert on public.memories to anon, authenticated;
grant delete on public.memories to authenticated;

drop policy if exists "Gallery is readable by everyone" on public.memories;
create policy "Gallery is readable by everyone"
    on public.memories for select to anon, authenticated
    using (true);

drop policy if exists "Signed-in users can add memories" on public.memories;
drop policy if exists "Public visitors can add memories" on public.memories;
create policy "Public visitors can add memories"
    on public.memories for insert to anon, authenticated
    with check (true);

drop policy if exists "Gallery admins can delete memories" on public.memories;
create policy "Gallery admins can delete memories"
    on public.memories for delete to authenticated
    using (public.is_gallery_admin());

-- Daily News entries are stored here. Anyone can publish, while only admins
-- can edit or delete entries, matching the site's public upload workflow.
create table if not exists public.daily_news (
    id uuid primary key default gen_random_uuid(),
    title text not null check (pg_catalog.length(pg_catalog.btrim(title)) > 0),
    description text not null check (pg_catalog.length(pg_catalog.btrim(description)) > 0),
    published_on date not null default current_date,
    created_at timestamptz not null default now()
);
alter table public.daily_news enable row level security;
revoke all on public.daily_news from anon, authenticated;
grant select, insert on public.daily_news to anon, authenticated;
grant update, delete on public.daily_news to authenticated;

drop policy if exists "Public visitors can read daily news" on public.daily_news;
create policy "Public visitors can read daily news"
    on public.daily_news for select to anon, authenticated
    using (true);

drop policy if exists "Public visitors can publish daily news" on public.daily_news;
create policy "Public visitors can publish daily news"
    on public.daily_news for insert to anon, authenticated
    with check (true);

drop policy if exists "Gallery admins can edit daily news" on public.daily_news;
create policy "Gallery admins can edit daily news"
    on public.daily_news for update to authenticated
    using (public.is_gallery_admin())
    with check (public.is_gallery_admin());

drop policy if exists "Gallery admins can delete daily news" on public.daily_news;
create policy "Gallery admins can delete daily news"
    on public.daily_news for delete to authenticated
    using (public.is_gallery_admin());

-- Couple plans: shared letters, travel map pins and checklist.
-- These entries are shared with anyone who has access to the site link.
create table if not exists public.love_letters (
    id uuid primary key default gen_random_uuid(),
    title text not null check (pg_catalog.length(pg_catalog.btrim(title)) > 0),
    message text not null check (pg_catalog.length(pg_catalog.btrim(message)) > 0),
    open_on date,
    author text not null default 'Nós dois',
    editable boolean not null default true,
    deletable boolean not null default true,
    created_at timestamptz not null default now()
);
alter table public.love_letters add column if not exists editable boolean not null default true;
alter table public.love_letters add column if not exists deletable boolean not null default true;
alter table public.love_letters alter column open_on drop not null;
create table if not exists public.love_places (
    id uuid primary key default gen_random_uuid(),
    name text not null check (pg_catalog.length(pg_catalog.btrim(name)) > 0),
    kind text not null check (kind in ('visited', 'dream')),
    note text not null default '',
    visited_on date,
    latitude double precision not null check (latitude between -90 and 90),
    longitude double precision not null check (longitude between -180 and 180),
    photo_url text,
    photo_path text,
    created_at timestamptz not null default now()
);
alter table public.love_places add column if not exists photo_url text;
alter table public.love_places add column if not exists photo_path text;
create table if not exists public.love_checklist (
    id uuid primary key default gen_random_uuid(),
    text text not null check (pg_catalog.length(pg_catalog.btrim(text)) > 0),
    done boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.love_timeline (
    id text primary key,
    event_date date not null,
    title text not null check (pg_catalog.length(pg_catalog.btrim(title)) > 0),
    comment text not null default '',
    image_url text,
    position integer not null default 0,
    is_future boolean not null default false,
    created_at timestamptz not null default now()
);

-- Shared activity ideas used by the date roulette.
create table if not exists public.love_date_ideas (
    id smallint primary key default 1 check (id = 1),
    ideas jsonb not null default '[]'::jsonb check (jsonb_typeof(ideas) = 'array'),
    updated_at timestamptz not null default now()
);

alter table public.love_letters enable row level security;
alter table public.love_places enable row level security;
alter table public.love_checklist enable row level security;
alter table public.love_timeline enable row level security;
alter table public.love_date_ideas enable row level security;
revoke all on public.love_letters, public.love_places, public.love_checklist, public.love_timeline, public.love_date_ideas from anon, authenticated;
grant select, insert, update, delete on public.love_letters, public.love_places, public.love_checklist, public.love_timeline, public.love_date_ideas to anon, authenticated;

drop policy if exists "Public visitors can manage couple letters" on public.love_letters;
drop policy if exists "Public visitors can read couple letters" on public.love_letters;
create policy "Public visitors can read couple letters" on public.love_letters
    for select to anon, authenticated using (true);
drop policy if exists "Public visitors can create couple letters" on public.love_letters;
create policy "Public visitors can create couple letters" on public.love_letters
    for insert to anon, authenticated with check (true);
drop policy if exists "Admins can edit permitted couple letters" on public.love_letters;
create policy "Admins can edit permitted couple letters" on public.love_letters
    for update to authenticated using (public.is_gallery_admin() and editable)
    with check (public.is_gallery_admin());
drop policy if exists "Admins can delete permitted couple letters" on public.love_letters;
create policy "Admins can delete permitted couple letters" on public.love_letters
    for delete to authenticated using (public.is_gallery_admin() and deletable);
drop policy if exists "Public visitors can manage couple places" on public.love_places;
create policy "Public visitors can manage couple places" on public.love_places
    for all to anon, authenticated using (true) with check (true);
drop policy if exists "Public visitors can manage couple checklist" on public.love_checklist;
create policy "Public visitors can manage couple checklist" on public.love_checklist
    for all to anon, authenticated using (true) with check (true);
drop policy if exists "Public visitors can read couple timeline" on public.love_timeline;
create policy "Public visitors can read couple timeline" on public.love_timeline
    for select to anon, authenticated using (true);
drop policy if exists "Public visitors can manage couple timeline" on public.love_timeline;
create policy "Public visitors can manage couple timeline" on public.love_timeline
    for all to anon, authenticated using (true) with check (true);
drop policy if exists "Public visitors can manage date roulette ideas" on public.love_date_ideas;
create policy "Public visitors can manage date roulette ideas" on public.love_date_ideas
    for all to anon, authenticated using (true) with check (true);

-- Capsule metadata is public; the actual writing lives in a separate table.
-- Its RLS policy releases the text only to an allowlisted admin after open_on.
create table if not exists public.love_capsules (
    id uuid primary key default gen_random_uuid(),
    title text not null check (pg_catalog.length(pg_catalog.btrim(title)) > 0),
    open_on date not null,
    author text not null default 'Nós dois',
    created_at timestamptz not null default now()
);
create table if not exists public.love_capsule_contents (
    capsule_id uuid primary key references public.love_capsules(id) on delete cascade,
    message text not null check (pg_catalog.length(pg_catalog.btrim(message)) > 0)
);
alter table public.love_capsules enable row level security;
alter table public.love_capsule_contents enable row level security;
revoke all on public.love_capsules, public.love_capsule_contents from anon, authenticated;
grant select on public.love_capsules to anon, authenticated;
grant insert, update, delete on public.love_capsules to authenticated;
grant select, insert, delete on public.love_capsule_contents to authenticated;

drop policy if exists "Public visitors can read capsule dates" on public.love_capsules;
create policy "Public visitors can read capsule dates" on public.love_capsules
    for select to anon, authenticated using (true);
drop policy if exists "Admins can create capsules" on public.love_capsules;
create policy "Admins can create capsules" on public.love_capsules
    for insert to authenticated with check (public.is_gallery_admin());
drop policy if exists "Admins can update capsules" on public.love_capsules;
create policy "Admins can update capsules" on public.love_capsules
    for update to authenticated using (public.is_gallery_admin()) with check (public.is_gallery_admin());
drop policy if exists "Admins can delete capsules" on public.love_capsules;
create policy "Admins can delete capsules" on public.love_capsules
    for delete to authenticated using (public.is_gallery_admin());
drop policy if exists "Admins can add capsule contents" on public.love_capsule_contents;
create policy "Admins can add capsule contents" on public.love_capsule_contents
    for insert to authenticated with check (public.is_gallery_admin());
drop policy if exists "Admins can read due capsule contents" on public.love_capsule_contents;
create policy "Admins can read due capsule contents" on public.love_capsule_contents
    for select to authenticated using (
        public.is_gallery_admin()
        and exists (
            select 1 from public.love_capsules
            where love_capsules.id = love_capsule_contents.capsule_id
              and love_capsules.open_on <= current_date
        )
    );
drop policy if exists "Admins can delete capsule contents" on public.love_capsule_contents;
create policy "Admins can delete capsule contents" on public.love_capsule_contents
    for delete to authenticated using (public.is_gallery_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memories', 'memories', true, 104857600, array['image/*', 'video/*'])
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Signed-in users can upload gallery media" on storage.objects;
drop policy if exists "Public visitors can upload gallery media" on storage.objects;
create policy "Public visitors can upload gallery media"
    on storage.objects for insert to anon, authenticated
    with check (
        bucket_id = 'memories'
    );

drop policy if exists "Uploaders can see their own gallery media" on storage.objects;
drop policy if exists "Uploaders can remove their own gallery media" on storage.objects;
drop policy if exists "Gallery admins can view gallery media for deletion" on storage.objects;
drop policy if exists "Gallery admins can delete gallery media" on storage.objects;
create policy "Gallery admins can view gallery media for deletion"
    on storage.objects for select to authenticated
    using (
        bucket_id = 'memories'
        and public.is_gallery_admin()
    );

create policy "Gallery admins can delete gallery media"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'memories'
        and public.is_gallery_admin()
    );

-- After creating your Supabase Auth user, add its email to this list:
-- insert into public.gallery_admins (email) values ('you@example.com')
-- on conflict (email) do nothing;
