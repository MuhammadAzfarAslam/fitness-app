-- One private, versioned aggregate per user keeps the solo-developer API small.
-- Structured JSON contains profile/goals, programs/active session, exercise/set logs,
-- nutrition, measurements, recovery, photos, and preferences. Exercise catalog is versioned in source.
create table public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object' and (data->>'version')::int = 1),
  updated_at timestamptz not null default now()
);
alter table public.user_data enable row level security;
create policy "Read own data" on public.user_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own data" on public.user_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own data" on public.user_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own data" on public.user_data for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.user_data from anon;
grant select, insert, update, delete on public.user_data to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 5242880, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do update set public = false;
create policy "View own photos" on storage.objects for select to authenticated using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Upload own photos" on storage.objects for insert to authenticated with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Delete own photos" on storage.objects for delete to authenticated using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- User-owned requests cannot select another user's id, even through this definer function.
create or replace function public.delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from storage.objects where bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text) then
    raise exception 'Delete your stored photos before deleting your account';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- Per-account AI quota, incremented atomically. Clients can consume their own quota,
-- but cannot read/reset quota rows or consume another account's allowance.
create table public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  count integer not null default 0,
  primary key (user_id, usage_date)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
create or replace function public.consume_ai_quota() returns boolean language plpgsql security definer set search_path = '' as $$
declare used integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.ai_usage(user_id, usage_date, count) values(auth.uid(), current_date, 1)
  on conflict (user_id, usage_date) do update set count = public.ai_usage.count + 1
  returning count into used;
  return used <= 30;
end;
$$;
revoke all on function public.consume_ai_quota() from public;
grant execute on function public.consume_ai_quota() to authenticated;
