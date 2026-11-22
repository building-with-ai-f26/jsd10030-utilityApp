-- Read-only setup evidence. Run after applying the migration, not as an RLS user test.
select relname as table_name, relrowsecurity as rls_enabled
from pg_class where oid in ('public.utility_trips'::regclass, 'public.utility_bills'::regclass);
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' and tablename in ('utility_trips', 'utility_bills')
order by tablename, policyname;
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name in ('utility_trips', 'utility_bills')
and grantee in ('anon', 'authenticated') order by table_name, grantee, privilege_type;
-- Expected: both RLS=true; owner SELECT/INSERT policies; authenticated SELECT/INSERT
-- only; no anon grants and no authenticated UPDATE/DELETE. The dashboard's postgres
-- role bypasses RLS: the two-account browser test is still required.
