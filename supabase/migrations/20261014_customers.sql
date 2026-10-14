begin;
-- Customers belong to a project; RLS follows its owner.
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  company text not null default '' check (char_length(company) <= 200),
  email text not null default '' check (char_length(email) <= 254),
  phone text not null default '' check (char_length(phone) <= 80),
  type text not null default 'person' check (type in ('person','company','intermediary','other')),
  status text not null default 'lead' check (status in ('lead','active','inactive')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.customers enable row level security;
grant select, insert, update, delete on public.customers to authenticated;
create index if not exists idx_customers_project on public.customers(project_id, created_at desc);
do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='customers_owner') then
    create policy customers_owner on public.customers for all to authenticated
      using (exists (select 1 from public.projects p where p.id=project_id and p.user_id=auth.uid()))
      with check (exists (select 1 from public.projects p where p.id=project_id and p.user_id=auth.uid()));
  end if;
  if not exists (select 1 from pg_trigger where tgrelid='public.customers'::regclass and tgname='trg_customers_updated_at') then
    create trigger trg_customers_updated_at before update on public.customers
      for each row execute function public.set_updated_at();
  end if;
end;
$policies$;

create or replace function public.refresh_daily_user_backups()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  backup_user record;
begin
  for backup_user in select id, email from auth.users loop
    insert into public.user_backups (user_id, snapshot, backed_up_at)
    values (
      backup_user.id,
      jsonb_build_object(
        'meta', jsonb_build_object(
          'app', 'dadash',
          'exported_at', now(),
          'user_email', backup_user.email,
          'tables', jsonb_build_array(
            'projects', 'modules', 'checklist_items', 'content_items',
            'update_items', 'ad_items', 'project_links', 'notes',
            'competitor_items', 'customers', 'business_ideas', 'daily_tasks'
          )
        ),
        'data', jsonb_build_object(
          'projects', coalesce((
            select jsonb_agg(to_jsonb(row_data) order by row_data.created_at)
            from public.projects row_data where row_data.user_id = backup_user.id
          ), '[]'::jsonb),
          'modules', coalesce((
            select jsonb_agg(to_jsonb(row_data) order by row_data.created_at)
            from public.modules row_data
            join public.projects project on project.id = row_data.project_id
            where project.user_id = backup_user.id
          ), '[]'::jsonb),
          'checklist_items', coalesce((
            select jsonb_agg(to_jsonb(row_data) order by row_data.created_at)
            from public.checklist_items row_data
            join public.modules module on module.id = row_data.module_id
            join public.projects project on project.id = module.project_id
            where project.user_id = backup_user.id
          ), '[]'::jsonb),
          'content_items', coalesce((
            select jsonb_agg(to_jsonb(row_data) order by row_data.created_at)
            from public.content_items row_data
            join public.projects project on project.id = row_data.project_id
            where project.user_id = backup_user.id
          ), '[]'::jsonb),
          'update_items', coalesce((
            select jsonb_agg(to_jsonb(row_data) order by row_data.created_at)
            from public.update_items row_data
            join public.projects project on project.id = row_data.project_id
            where project.user_id = backup_user.id
          ), '[]'::jsonb),
          'ad_items', coalesce((
            select jsonb_agg(to_jsonb(row_data) order by row_data.created_at)
            from public.ad_items row_data
            join public.projects project on project.id = row_data.project_id
            where project.user_id = backup_user.id
          ), '[]'::jsonb),
          'project_links', coalesce((
            select jsonb_agg(to_jsonb(row_data) order by row_data.created_at)
            from public.project_links row_data
            join public.projects project on project.id = row_data.project_id
            where project.user_id = backup_user.id
          ), '[]'::jsonb),
          'notes', coalesce((
            select jsonb_agg(to_jsonb(row_data) order by row_data.created_at)
            from public.notes row_data where row_data.user_id = backup_user.id
          ), '[]'::jsonb),
          'competitor_items', coalesce((
            select jsonb_agg(to_jsonb(row_data) order by row_data.created_at)
            from public.competitor_items row_data
            join public.projects project on project.id = row_data.project_id
            where project.user_id = backup_user.id
          ), '[]'::jsonb),
          'customers', coalesce((
            select jsonb_agg(to_jsonb(row_data) order by row_data.created_at)
            from public.customers row_data
            join public.projects project on project.id = row_data.project_id
            where project.user_id = backup_user.id
          ), '[]'::jsonb),
          'business_ideas', coalesce((
            select jsonb_agg(to_jsonb(row_data) order by row_data.created_at)
            from public.business_ideas row_data where row_data.user_id = backup_user.id
          ), '[]'::jsonb),
          'daily_tasks', coalesce((
            select jsonb_agg(to_jsonb(row_data) order by row_data.created_at)
            from public.daily_tasks row_data where row_data.user_id = backup_user.id
          ), '[]'::jsonb)
        )
      ),
      now()
    )
    on conflict (user_id) do update
      set snapshot = excluded.snapshot,
          backed_up_at = excluded.backed_up_at;
  end loop;
end;
$$;

revoke all on function public.refresh_daily_user_backups() from public;
revoke all on function public.refresh_daily_user_backups() from anon;
revoke all on function public.refresh_daily_user_backups() from authenticated;
commit;
