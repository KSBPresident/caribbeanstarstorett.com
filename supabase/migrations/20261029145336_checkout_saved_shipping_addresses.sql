create table public.checkout_saved_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 60),
  recipient text not null check (char_length(trim(recipient)) between 2 and 100),
  phone text not null check (char_length(trim(phone)) between 1 and 30),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  address_line1 text not null check (char_length(trim(address_line1)) between 1 and 160),
  address_line2 text check (address_line2 is null or char_length(address_line2) <= 160),
  city text not null check (char_length(trim(city)) between 1 and 100),
  parish_or_county text not null check (char_length(trim(parish_or_county)) between 1 and 100),
  landmarks text check (landmarks is null or char_length(landmarks) <= 240),
  postal_code text check (postal_code is null or char_length(postal_code) <= 24),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index checkout_saved_addresses_user_idx
  on public.checkout_saved_addresses (user_id, is_default desc, updated_at desc);

create unique index checkout_saved_addresses_one_default_per_user
  on public.checkout_saved_addresses (user_id)
  where is_default;

alter table public.checkout_saved_addresses enable row level security;
grant select, insert, update, delete on public.checkout_saved_addresses to authenticated;

create policy checkout_saved_addresses_select_own
  on public.checkout_saved_addresses for select to authenticated
  using (user_id = (select auth.uid()));

create policy checkout_saved_addresses_insert_own
  on public.checkout_saved_addresses for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy checkout_saved_addresses_update_own
  on public.checkout_saved_addresses for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy checkout_saved_addresses_delete_own
  on public.checkout_saved_addresses for delete to authenticated
  using (user_id = (select auth.uid()));
