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
drop policy if exists "Gallery admins can delete gallery media" on storage.objects;
create policy "Gallery admins can delete gallery media"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'memories'
        and public.is_gallery_admin()
    );

-- After creating your Supabase Auth user, add its email to this list:
-- insert into public.gallery_admins (email) values ('you@example.com')
-- on conflict (email) do nothing;
