create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  organization_type text not null default 'business' check (organization_type in ('individual','business','nonprofit','community','platform')),
  status text not null default 'active' check (status in ('active','suspended','archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  status text not null default 'active' check (status in ('invited','active','suspended','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id,permission_id)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index organization_members_user_id_idx on public.organization_members(user_id);
create index organization_members_role_id_idx on public.organization_members(role_id);
create index role_permissions_permission_id_idx on public.role_permissions(permission_id);
create index audit_log_actor_idx on public.audit_log(actor_user_id);
create index audit_log_org_idx on public.audit_log(organization_id);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.organization_members enable row level security;
alter table public.role_permissions enable row level security;
alter table public.audit_log enable row level security;

-- Keep the Data API surface explicit and narrow. RLS policies below provide the
-- row-level checks; these grants only expose operations the application uses.
revoke all on table public.profiles, public.organizations, public.roles, public.permissions,
  public.organization_members, public.role_permissions, public.audit_log
  from public, anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert on table public.organizations to authenticated;
grant select on table public.roles, public.permissions, public.role_permissions to authenticated;
grant select, insert, update, delete on table public.organization_members to authenticated;
grant select on table public.audit_log to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "organizations_select_member" on public.organizations for select to authenticated using (
  exists (select 1 from public.organization_members m where m.organization_id = id and m.user_id = (select auth.uid()) and m.status = 'active')
);
create policy "organizations_insert_creator" on public.organizations for insert to authenticated with check ((select auth.uid()) = created_by);

create policy "members_select_self" on public.organization_members for select to authenticated using (user_id = (select auth.uid()));
create policy "members_insert_self" on public.organization_members for insert to authenticated with check (user_id = (select auth.uid()));
create policy "members_update_self" on public.organization_members for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "roles_select_authenticated" on public.roles for select to authenticated using (true);
create policy "permissions_select_authenticated" on public.permissions for select to authenticated using (true);
create policy "role_permissions_select_authenticated" on public.role_permissions for select to authenticated using (true);

create policy "audit_select_own" on public.audit_log for select to authenticated using (actor_user_id = (select auth.uid()));

insert into public.roles (name,description,is_system) values
('owner','Organization owner',true),
('admin','Organization administrator',true),
('member','Standard organization member',true)
on conflict (name) do nothing;

insert into public.permissions (key,description) values
('organization.read','Read organization data'),
('organization.manage','Manage organization settings'),
('member.manage','Manage organization membership'),
('role.manage','Manage roles and permissions'),
('audit.read','Read audit records')
on conflict (key) do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where (r.name='owner')
on conflict do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r join public.permissions p on p.key in ('organization.read','member.manage','audit.read')
where r.name='admin'
on conflict do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r join public.permissions p on p.key='organization.read'
where r.name='member'
on conflict do nothing;