-- ============================================================================
-- OPS CENTER — schema for Supabase (Postgres)
-- اجرا کن: در پنل Supabase > SQL Editor > New query > پیست کن > Run
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  tagline text default '',
  accent text not null default '#2DD4A7',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- آرشیو پروژه: پروژه‌ی آرشیوشده از سایدبار و نمای «همه پروژه‌ها» بیرون می‌رود
-- ولی داده‌اش کامل می‌ماند و هر وقت خواستی برمی‌گردد. عمداً حذف نیست.
alter table public.projects add column if not exists archived boolean not null default false;

alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);
drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);
drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id);
drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- modules
-- ---------------------------------------------------------------------------
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  category text not null default 'عمومی',
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'needs_review', 'blocked', 'done')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.modules enable row level security;

drop policy if exists "modules_select_own" on public.modules;
create policy "modules_select_own" on public.modules
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "modules_insert_own" on public.modules;
create policy "modules_insert_own" on public.modules
  for insert with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "modules_update_own" on public.modules;
create policy "modules_update_own" on public.modules
  for update using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "modules_delete_own" on public.modules;
create policy "modules_delete_own" on public.modules
  for delete using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_modules_updated_at on public.modules;
create trigger trg_modules_updated_at
  before update on public.modules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- checklist_items
-- ---------------------------------------------------------------------------
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.checklist_items enable row level security;

drop policy if exists "checklist_select_own" on public.checklist_items;
create policy "checklist_select_own" on public.checklist_items
  for select using (
    exists (
      select 1 from public.modules m
      join public.projects p on p.id = m.project_id
      where m.id = module_id and p.user_id = auth.uid()
    )
  );
drop policy if exists "checklist_insert_own" on public.checklist_items;
create policy "checklist_insert_own" on public.checklist_items
  for insert with check (
    exists (
      select 1 from public.modules m
      join public.projects p on p.id = m.project_id
      where m.id = module_id and p.user_id = auth.uid()
    )
  );
drop policy if exists "checklist_update_own" on public.checklist_items;
create policy "checklist_update_own" on public.checklist_items
  for update using (
    exists (
      select 1 from public.modules m
      join public.projects p on p.id = m.project_id
      where m.id = module_id and p.user_id = auth.uid()
    )
  );
drop policy if exists "checklist_delete_own" on public.checklist_items;
create policy "checklist_delete_own" on public.checklist_items
  for delete using (
    exists (
      select 1 from public.modules m
      join public.projects p on p.id = m.project_id
      where m.id = module_id and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- content_items — content calendar (website / telegram / instagram)
-- ---------------------------------------------------------------------------
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  platform text not null default 'website'
    check (platform in ('website', 'telegram', 'instagram')),
  title text not null,
  body text not null default '',
  status text not null default 'idea'
    check (status in ('idea', 'draft', 'scheduled', 'published')),
  publish_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_items enable row level security;

drop policy if exists "content_select_own" on public.content_items;
create policy "content_select_own" on public.content_items
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "content_insert_own" on public.content_items;
create policy "content_insert_own" on public.content_items
  for insert with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "content_update_own" on public.content_items;
create policy "content_update_own" on public.content_items
  for update using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "content_delete_own" on public.content_items;
create policy "content_delete_own" on public.content_items
  for delete using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

drop trigger if exists trg_content_items_updated_at on public.content_items;
create trigger trg_content_items_updated_at
  before update on public.content_items
  for each row execute function public.set_updated_at();

create index if not exists idx_content_items_project_id on public.content_items(project_id);

-- ---------------------------------------------------------------------------
-- update_items — freeform update board per project (مورد نیاز / در حال انجام / انجام‌شده)
-- ---------------------------------------------------------------------------
create table if not exists public.update_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version text not null default '',
  text text not null default '',
  status text not null default 'needed'
    check (status in ('needed', 'in_progress', 'done')),
  color text not null default '#F6A9B8',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.update_items enable row level security;

drop policy if exists "update_items_select_own" on public.update_items;
create policy "update_items_select_own" on public.update_items
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "update_items_insert_own" on public.update_items;
create policy "update_items_insert_own" on public.update_items
  for insert with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "update_items_update_own" on public.update_items;
create policy "update_items_update_own" on public.update_items
  for update using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "update_items_delete_own" on public.update_items;
create policy "update_items_delete_own" on public.update_items
  for delete using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

drop trigger if exists trg_update_items_updated_at on public.update_items;
create trigger trg_update_items_updated_at
  before update on public.update_items
  for each row execute function public.set_updated_at();

create index if not exists idx_update_items_project_id on public.update_items(project_id);

-- ---------------------------------------------------------------------------
-- ad_items — advertising campaign board per project (مورد نیاز / در حال انجام / انجام‌شده) + اولویت
-- ---------------------------------------------------------------------------
create table if not exists public.ad_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  text text not null default '',
  status text not null default 'needed'
    check (status in ('needed', 'in_progress', 'done')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  platform text not null default 'other'
    check (platform in ('instagram', 'telegram', 'reddit', 'twitter', 'reportage', 'google_ads', 'youtube', 'other')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- برای نصب موجود که ستون platform را ندارد
alter table public.ad_items add column if not exists platform text not null default 'other';
alter table public.ad_items drop constraint if exists ad_items_platform_check;
alter table public.ad_items add constraint ad_items_platform_check
  check (platform in ('instagram', 'telegram', 'reddit', 'twitter', 'reportage', 'google_ads', 'youtube', 'other'));

-- رنگ کارت، دقیقا مثل update_items — تا کارت‌های تبلیغات هم قابل تفکیک بصری باشند
alter table public.ad_items add column if not exists color text not null default '#F6A9B8';

alter table public.ad_items enable row level security;

drop policy if exists "ad_items_select_own" on public.ad_items;
create policy "ad_items_select_own" on public.ad_items
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "ad_items_insert_own" on public.ad_items;
create policy "ad_items_insert_own" on public.ad_items
  for insert with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "ad_items_update_own" on public.ad_items;
create policy "ad_items_update_own" on public.ad_items
  for update using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "ad_items_delete_own" on public.ad_items;
create policy "ad_items_delete_own" on public.ad_items
  for delete using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

drop trigger if exists trg_ad_items_updated_at on public.ad_items;
create trigger trg_ad_items_updated_at
  before update on public.ad_items
  for each row execute function public.set_updated_at();

create index if not exists idx_ad_items_project_id on public.ad_items(project_id);

-- ---------------------------------------------------------------------------
-- business_ideas — standalone idea list, not tied to any project
-- ---------------------------------------------------------------------------
create table if not exists public.business_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_ideas enable row level security;

drop policy if exists "business_ideas_select_own" on public.business_ideas;
create policy "business_ideas_select_own" on public.business_ideas
  for select using (auth.uid() = user_id);
drop policy if exists "business_ideas_insert_own" on public.business_ideas;
create policy "business_ideas_insert_own" on public.business_ideas
  for insert with check (auth.uid() = user_id);
drop policy if exists "business_ideas_update_own" on public.business_ideas;
create policy "business_ideas_update_own" on public.business_ideas
  for update using (auth.uid() = user_id);
drop policy if exists "business_ideas_delete_own" on public.business_ideas;
create policy "business_ideas_delete_own" on public.business_ideas
  for delete using (auth.uid() = user_id);

drop trigger if exists trg_business_ideas_updated_at on public.business_ideas;
create trigger trg_business_ideas_updated_at
  before update on public.business_ideas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- daily_tasks — standalone todo list, not tied to any project
-- ---------------------------------------------------------------------------
create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  -- روزی که کار برای آن برنامه‌ریزی شده. null یعنی «بی‌تاریخ» (بک‌لاگ).
  task_date date,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- برای جدولی که از قبل ساخته شده، create table بالا ستون اضافه نمی‌کند.
-- این دو خط باعث می‌شود اجرای دوباره‌ی فایل روی نصب موجود هم کار کند.
alter table public.daily_tasks
  add column if not exists task_date date,
  add column if not exists priority text not null default 'medium';

alter table public.daily_tasks drop constraint if exists daily_tasks_priority_check;
alter table public.daily_tasks add constraint daily_tasks_priority_check
  check (priority in ('low', 'medium', 'high', 'critical'));

-- کارهای تکرارشونده: ردیفی که repeat_mode='daily' دارد یک «الگو»ست، نه کار واقعی.
-- هر روز که صفحه باز شود، از روی الگو یک کار برای همان روز ساخته می‌شود
-- (template_id به الگو اشاره می‌کند) و last_spawn جلوی ساخت دوباره در همان روز را می‌گیرد.
-- template_id عمداً on delete set null است: حذف الگو نباید تاریخچه‌ی روزهای گذشته را پاک کند.
alter table public.daily_tasks
  add column if not exists repeat_mode text not null default 'none',
  add column if not exists last_spawn date,
  add column if not exists template_id uuid references public.daily_tasks(id) on delete set null;

alter table public.daily_tasks drop constraint if exists daily_tasks_repeat_mode_check;
alter table public.daily_tasks add constraint daily_tasks_repeat_mode_check
  check (repeat_mode in ('none', 'daily'));

-- محافظ نهایی مقابل دو نمونه از یک الگو در یک روز (مثلا دو تب باز هم‌زمان)
create unique index if not exists idx_daily_tasks_template_day
  on public.daily_tasks(template_id, task_date)
  where template_id is not null;

alter table public.daily_tasks enable row level security;

drop policy if exists "daily_tasks_select_own" on public.daily_tasks;
create policy "daily_tasks_select_own" on public.daily_tasks
  for select using (auth.uid() = user_id);
drop policy if exists "daily_tasks_insert_own" on public.daily_tasks;
create policy "daily_tasks_insert_own" on public.daily_tasks
  for insert with check (auth.uid() = user_id);
drop policy if exists "daily_tasks_update_own" on public.daily_tasks;
create policy "daily_tasks_update_own" on public.daily_tasks
  for update using (auth.uid() = user_id);
drop policy if exists "daily_tasks_delete_own" on public.daily_tasks;
create policy "daily_tasks_delete_own" on public.daily_tasks
  for delete using (auth.uid() = user_id);

create index if not exists idx_daily_tasks_date
  on public.daily_tasks(user_id, task_date);

drop trigger if exists trg_daily_tasks_updated_at on public.daily_tasks;
create trigger trg_daily_tasks_updated_at
  before update on public.daily_tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- project_links — لینک‌های ثابت هر پروژه (سایت، cPanel، آنالیتیکس، ریپو، ...)
-- ---------------------------------------------------------------------------
create table if not exists public.project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null default '',
  url text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.project_links enable row level security;

drop policy if exists "project_links_select_own" on public.project_links;
create policy "project_links_select_own" on public.project_links
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "project_links_insert_own" on public.project_links;
create policy "project_links_insert_own" on public.project_links
  for insert with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "project_links_update_own" on public.project_links;
create policy "project_links_update_own" on public.project_links
  for update using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "project_links_delete_own" on public.project_links;
create policy "project_links_delete_own" on public.project_links
  for delete using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

create index if not exists idx_project_links_project_id
  on public.project_links(project_id, sort_order);

-- ---------------------------------------------------------------------------
-- notes — یادداشت آزاد (لینک، محتوا، اسنیپت، یادداشت فنی)
--
-- هشدار امنیتی: محتوای این جدول به‌صورت متن ساده ذخیره می‌شود — نه رمزنگاری‌شده.
-- هرکسی که به داشبورد Supabase یا service_role key دسترسی داشته باشد آن را می‌خواند
-- و در بکاپ‌ها هم به همان شکل باقی می‌ماند. رمز عبور واقعی اینجا ننویس؛
-- از یک password manager استفاده کن و اینجا فقط ارجاع بگذار
-- (مثلا: «رمز در Bitwarden، آیتم: araxcloud cPanel»).
-- به همین دلیل عمداً ستونی به نام password وجود ندارد.
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- پروژه‌ی مرتبط (اختیاری). null یعنی یادداشت مستقل.
  -- set null است نه cascade: حذف یک پروژه نباید یادداشت‌هایش را نابود کند.
  project_id uuid references public.projects(id) on delete set null,
  title text not null default '',
  url text not null default '',
  body text not null default '',
  tags text not null default '',            -- برچسب‌ها، جدا شده با کاما
  pinned boolean not null default false,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- برای نصب موجود که ستون‌های project_id / priority را ندارد
alter table public.notes
  add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.notes add column if not exists priority text not null default 'medium';
alter table public.notes drop constraint if exists notes_priority_check;
alter table public.notes add constraint notes_priority_check
  check (priority in ('low', 'medium', 'high', 'critical'));

create index if not exists idx_notes_project on public.notes(project_id);

alter table public.notes enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes
  for select using (auth.uid() = user_id);
drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes
  for insert with check (auth.uid() = user_id);
drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes
  for update using (auth.uid() = user_id);
drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes
  for delete using (auth.uid() = user_id);

drop trigger if exists trg_notes_updated_at on public.notes;
create trigger trg_notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

create index if not exists idx_notes_user on public.notes(user_id, pinned desc, updated_at desc);

-- ---------------------------------------------------------------------------
-- competitor_items — بررسی رقبا، هر پروژه رقبای خودش را دارد
-- ---------------------------------------------------------------------------
create table if not exists public.competitor_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null default '',
  url text not null default '',
  monthly_visits text not null default '',   -- عمداً متن است: مقادیری مثل "1m"، "624k"، "10m install"
  note text not null default '',             -- نکات/مشکلات
  advantage text not null default '',        -- نقطه‌قوت رقیب
  verdict text not null default 'neutral'
    check (verdict in ('neutral', 'good', 'bad', 'watch')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.competitor_items enable row level security;

drop policy if exists "competitor_items_select_own" on public.competitor_items;
create policy "competitor_items_select_own" on public.competitor_items
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "competitor_items_insert_own" on public.competitor_items;
create policy "competitor_items_insert_own" on public.competitor_items
  for insert with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "competitor_items_update_own" on public.competitor_items;
create policy "competitor_items_update_own" on public.competitor_items
  for update using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
drop policy if exists "competitor_items_delete_own" on public.competitor_items;
create policy "competitor_items_delete_own" on public.competitor_items
  for delete using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

drop trigger if exists trg_competitor_items_updated_at on public.competitor_items;
create trigger trg_competitor_items_updated_at
  before update on public.competitor_items
  for each row execute function public.set_updated_at();

create index if not exists idx_competitor_items_project_id on public.competitor_items(project_id, sort_order);

-- ---------------------------------------------------------------------------
-- user_backups — آخرین بکاپ خودکار هر کاربر (نسخه‌ی جدید جای قبلی را می‌گیرد)
-- ---------------------------------------------------------------------------
create table if not exists public.user_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  snapshot jsonb not null,
  backed_up_at timestamptz not null default now()
);

alter table public.user_backups enable row level security;

drop policy if exists "user_backups_select_own" on public.user_backups;
create policy "user_backups_select_own" on public.user_backups
  for select using (auth.uid() = user_id);

-- این تابع با مالک دیتابیس اجرا می‌شود تا بتواند برای همه‌ی حساب‌ها snapshot
-- بسازد. کاربران مستقیماً اجازه‌ی اجرا یا تغییر جدول بکاپ را ندارند.
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
            'competitor_items', 'business_ideas', 'daily_tasks'
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

-- Supabase Cron از pg_cron استفاده می‌کند. زمان زیر 02:00 UTC، معادل
-- 06:00 صبح دبی است. اجرای دوباره‌ی schema شغل تکراری نمی‌سازد.
create extension if not exists pg_cron with schema extensions;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job from cron.job
  where jobname = 'dadash-daily-user-backup'
  limit 1;

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'dadash-daily-user-backup',
    '0 2 * * *',
    'select public.refresh_daily_user_backups();'
  );
end;
$$;

-- هنگام نصب، اولین نسخه همان لحظه ساخته می‌شود و منتظر اجرای فردا نمی‌ماند.
select public.refresh_daily_user_backups();

-- ---------------------------------------------------------------------------
-- indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_modules_project_id on public.modules(project_id);
create index if not exists idx_checklist_module_id on public.checklist_items(module_id);
