-- Тренировки: роли и схема входа. Выполняется от postgres, пароли передаются переменными psql:
--   psql -v auth_pw=... -v rest_pw=... -f 00_init.sql
-- Можно запускать повторно.
\set ON_ERROR_STOP on
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then create role authenticator login noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'trn_auth') then create role trn_auth login; end if;
end $$;
alter role authenticator with login noinherit password :'rest_pw';
alter role trn_auth with login password :'auth_pw';
grant anon, authenticated to authenticator;

create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb not null default '{"provider":"email","providers":["email"]}',
  raw_user_meta_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_sign_in_at timestamptz
);
create unique index if not exists users_email_lower on auth.users (lower(email));
create table if not exists auth.refresh_tokens (
  token text primary key,
  user_id uuid not null references auth.users on delete cascade,
  parent text,
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists refresh_tokens_parent on auth.refresh_tokens (parent);
create index if not exists refresh_tokens_user on auth.refresh_tokens (user_id);
create table if not exists auth.recovery (
  token_hash text primary key,
  user_id uuid not null references auth.users on delete cascade,
  redirect_to text,
  used boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- auth.uid() как в Supabase: номер вошедшего пользователя из настроек запроса
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                         (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')), '')::uuid
$$;
create or replace function auth.role() returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claim.role', true), '')
$$;
create or replace function auth.email() returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claim.email', true), '')
$$;

-- права: сервер входа работает только со схемой auth, сервер таблиц — только через роли anon/authenticated
grant usage on schema auth to trn_auth, anon, authenticated;
grant select, insert, update, delete on auth.users, auth.refresh_tokens, auth.recovery to trn_auth;
revoke all on auth.users, auth.refresh_tokens, auth.recovery from anon, authenticated;
grant execute on function auth.uid(), auth.role(), auth.email() to anon, authenticated;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
