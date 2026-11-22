-- Review and run once in your Supabase project's SQL Editor. No secrets needed.
-- Append-only snapshots: authenticated owners may SELECT and INSERT only.
begin;
create table public.utility_trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);
create unique index utility_trips_owner_name on public.utility_trips(owner_id, lower(name));
create table public.utility_bills (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trip_id uuid not null,
  snapshot jsonb not null check (
    jsonb_typeof(snapshot) = 'object' and
    snapshot @> '{"snapshotVersion": 2}'::jsonb and
    snapshot ?& array['inputs', 'result', 'splitMode'] and
    jsonb_typeof(snapshot->'inputs') = 'object' and
    jsonb_typeof(snapshot->'result') = 'object' and
    snapshot->>'splitMode' is not null and snapshot->>'splitMode' in ('equal', 'by_person')
  ),
  created_at timestamptz not null default now(),
  foreign key (trip_id, owner_id) references public.utility_trips(id, owner_id) on delete cascade
);
create index utility_bills_owner_trip on public.utility_bills(owner_id, trip_id, created_at);
alter table public.utility_trips enable row level security;
alter table public.utility_bills enable row level security;
revoke all on public.utility_trips, public.utility_bills from public, anon, authenticated;
grant select, insert on public.utility_trips, public.utility_bills to authenticated;
create policy trips_read_owner on public.utility_trips for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy trips_insert_owner on public.utility_trips for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy bills_read_owner on public.utility_bills for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy bills_insert_owner on public.utility_bills for insert to authenticated
  with check ((select auth.uid()) = owner_id and exists (
    select 1 from public.utility_trips t where t.id = trip_id and t.owner_id = (select auth.uid())
  ));
-- No UPDATE or DELETE grants/policies: immutable results, no sharing in this version.
commit;
