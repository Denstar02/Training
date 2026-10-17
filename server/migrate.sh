#!/usr/bin/env bash
# Тренировки: перенос пользователей и данных из Supabase в базу этого сервера.
# Строку подключения возьми в Supabase: кнопка Connect вверху → Session pooler → URI,
# вместо [YOUR-PASSWORD] подставь пароль базы (Project Settings → Database → Reset database password).
set -euo pipefail
LOCAL="${LOCAL_PSQL:-runuser -u postgres -- psql -d training}"
SRC="${SRC:-}"
say(){ printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
die(){ printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
if [ -z "$SRC" ]; then
  echo "Вставь строку подключения к Supabase (Session pooler, вида postgresql://postgres.xxxx:ПАРОЛЬ@aws-…pooler.supabase.com:5432/postgres):"
  read -r SRC < /dev/tty
fi
case "$SRC" in postgres://*|postgresql://*) ;; *) die "Это не похоже на строку подключения";; esac
case "$SRC" in *YOUR-PASSWORD*) die "Подставь в строку настоящий пароль базы вместо [YOUR-PASSWORD]";; esac
case "$SRC" in *sslmode=*) ;; *) case "$SRC" in *\?*) SRC="$SRC&sslmode=require";; *) SRC="$SRC?sslmode=require";; esac;; esac
R(){ PGCONNECT_TIMEOUT=15 psql "$SRC" -X -Atq "$@"; }
L(){ $LOCAL -X -Atq "$@"; }

say "Подключаюсь к Supabase"
N=$(R -c "select count(*) from auth.users") || die "Не подключилось. Проверь пароль и строку (нужен именно Session pooler)."
echo "  пользователей в Supabase: $N"
HAS_DEL=$(R -c "select count(*) from information_schema.columns where table_schema='auth' and table_name='users' and column_name='deleted_at'")
HAS_AW=$(R -c "select count(*) from pg_tables where schemaname='public' and tablename='awards'")
HAS_BAN=$(R -c "select count(*) from pg_tables where schemaname='public' and tablename='profile_bans'")
NL=$(L -c "select count(*) from auth.users")
if [ "$NL" != 0 ] && [ "${FORCE:-}" != 1 ]; then
  echo "На этом сервере уже есть пользователи: $NL. Перенос заменит их данными из Supabase."
  read -r -p "Продолжить? Впиши «да»: " A < /dev/tty
  [ "$A" = "да" ] || die "Отменено"
fi

say "Переношу"
L <<'SQL'
set client_min_messages = warning;
drop schema if exists mig cascade;
create schema mig;
create table mig.users (id uuid, email text, encrypted_password text, email_confirmed_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz, updated_at timestamptz, last_sign_in_at timestamptz);
create table mig.progress (like public.progress);
create table mig.profiles (like public.profiles);
create table mig.friends (like public.friends);
create table mig.badge_admins (like public.badge_admins);
create table mig.awards (id bigint, user_id uuid, emoji text, title text, note text, color text, given_by uuid, created_at timestamptz);
create table mig.profile_bans (like public.profile_bans);
SQL
copy(){ # $1 — запрос в Supabase, $2 — таблица и колонки здесь
  R -c "\\copy ($1) to stdout with (format csv)" | L -c "\\copy $2 from stdin with (format csv)"
}
WHERE_DEL=""; [ "$HAS_DEL" = 1 ] && WHERE_DEL="and deleted_at is null"
copy "select id, lower(email), encrypted_password, email_confirmed_at, coalesce(raw_app_meta_data, '{}'::jsonb), coalesce(raw_user_meta_data, '{}'::jsonb), created_at, coalesce(updated_at, created_at, now()), last_sign_in_at from auth.users where email is not null $WHERE_DEL" \
  "mig.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, last_sign_in_at)"
copy "select user_id, data, updated_at from public.progress" "mig.progress (user_id, data, updated_at)"
copy "select user_id, code, nick, photo, stats, updated_at from public.profiles" "mig.profiles (user_id, code, nick, photo, stats, updated_at)"
copy "select user_id, friend_id, created_at from public.friends" "mig.friends (user_id, friend_id, created_at)"
copy "select user_id from public.badge_admins" "mig.badge_admins (user_id)"
[ "$HAS_AW" = 1 ] && copy "select id, user_id, emoji, title, note, color, given_by, created_at from public.awards" "mig.awards (id, user_id, emoji, title, note, color, given_by, created_at)"
[ "$HAS_BAN" = 1 ] && copy "select user_id, nick, photo_md5, by_admin, created_at from public.profile_bans" "mig.profile_bans (user_id, nick, photo_md5, by_admin, created_at)"
L <<'SQL'
\set ON_ERROR_STOP on
set client_min_messages = warning;
begin;
set local trn.quiet = '1';   -- не рассылать уведомления о «новых» пользователях и заявках при переносе
truncate auth.users cascade;
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, last_sign_in_at)
  select distinct on (lower(email)) id, email, encrypted_password, coalesce(email_confirmed_at, created_at), raw_app_meta_data, raw_user_meta_data, created_at, updated_at, last_sign_in_at
  from mig.users order by lower(email), last_sign_in_at desc nulls last;
insert into public.badge_admins (user_id) select user_id from mig.badge_admins where user_id in (select id from auth.users) on conflict do nothing;
insert into public.profile_bans (user_id, nick, photo_md5, by_admin, created_at)
  select user_id, nick, photo_md5, case when by_admin in (select id from auth.users) then by_admin end, created_at from mig.profile_bans where user_id in (select id from auth.users);
insert into public.progress (user_id, data, updated_at) select user_id, data, updated_at from mig.progress where user_id in (select id from auth.users);
insert into public.profiles (user_id, code, nick, photo, stats, updated_at) select user_id, code, nick, photo, stats, updated_at from mig.profiles where user_id in (select id from auth.users);
insert into public.friends (user_id, friend_id, created_at) select user_id, friend_id, created_at from mig.friends
  where user_id in (select id from auth.users) and friend_id in (select id from auth.users) and user_id <> friend_id;
insert into public.awards (id, user_id, emoji, title, note, color, given_by, created_at) overriding system value
  select id, user_id, emoji, title, note, color, given_by, created_at from mig.awards
  where user_id in (select id from auth.users) and given_by in (select id from auth.users);
do $$ begin perform setval(pg_get_serial_sequence('public.awards', 'id'), greatest(coalesce((select max(id) from public.awards), 0), 1)); end $$;
commit;
drop schema mig cascade;
SQL

say "Готово"
L -c "select 'пользователей: ' || (select count(*) from auth.users) || ', прогресс: ' || (select count(*) from public.progress) || ', профилей: ' || (select count(*) from public.profiles) || ', дружб: ' || (select count(*) from public.friends) || ', значков: ' || (select count(*) from public.awards) || ', админов: ' || (select count(*) from public.badge_admins)"
echo "Все входят на новом сайте с прежними почтой и паролем."
