-- Тренировки: таблицы и правила доступа (те же запросы, что в блоке «Подключение базы»). Можно запускать повторно.
\set ON_ERROR_STOP on

create table if not exists public.progress (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.progress enable row level security;
drop policy if exists "read own" on public.progress;
create policy "read own" on public.progress
  for select using (auth.uid() = user_id);
drop policy if exists "insert own" on public.progress;
create policy "insert own" on public.progress
  for insert with check (auth.uid() = user_id);
drop policy if exists "update own" on public.progress;
create policy "update own" on public.progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  code text unique not null,
  nick text, photo text, stats jsonb,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles
  for select to authenticated using (true);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.friends (
  user_id uuid not null references auth.users on delete cascade,
  friend_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);
alter table public.friends enable row level security;
drop policy if exists "friends read" on public.friends;
create policy "friends read" on public.friends
  for select to authenticated using (auth.uid() = user_id or auth.uid() = friend_id);
drop policy if exists "friends add" on public.friends;
create policy "friends add" on public.friends
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "friends drop" on public.friends;
create policy "friends drop" on public.friends
  for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.badge_admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.badge_admins enable row level security;
drop policy if exists "badge admins read" on public.badge_admins;
create policy "badge admins read" on public.badge_admins
  for select to authenticated using (true);

create table if not exists public.awards (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  title text not null check (char_length(title) between 1 and 40),
  note text check (char_length(note) <= 140),
  color text check (char_length(color) <= 16),
  given_by uuid not null default auth.uid() references auth.users,
  created_at timestamptz not null default now()
);
alter table public.awards enable row level security;
grant select on public.badge_admins to authenticated;
grant select, insert, delete on public.awards to authenticated;
drop policy if exists "awards read" on public.awards;
drop policy if exists "awards give" on public.awards;
drop policy if exists "awards take" on public.awards;
drop policy if exists "awards read" on public.awards;
create policy "awards read" on public.awards
  for select to authenticated using (true);
drop policy if exists "awards give" on public.awards;
create policy "awards give" on public.awards
  for insert to authenticated with check (
    given_by = auth.uid()
    and exists (select 1 from public.badge_admins a where a.user_id = auth.uid()));
drop policy if exists "awards take" on public.awards;
create policy "awards take" on public.awards
  for delete to authenticated using (
    exists (select 1 from public.badge_admins a where a.user_id = auth.uid()));

create or replace function public.find_friend(q text)
returns table (user_id uuid, code text, nick text, photo text, stats jsonb)
language sql stable security definer set search_path = public as $$
  select p.user_id, p.code, p.nick, p.photo, p.stats
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where auth.uid() is not null
    and lower(u.email) = lower(trim(q))
  limit 1;
$$;
revoke all on function public.find_friend(text) from public, anon;
grant execute on function public.find_friend(text) to authenticated;

-- Открытый доступ: профиль видят только взаимные друзья, заявки в друзья,
-- поиск по коду, почте и нику, удаление аккаунта, скрытие ника и фото админом.
-- Запрос можно выполнять повторно.

-- 1. Профиль видят только сам владелец и взаимные друзья
drop policy if exists "profiles read" on public.profiles;
drop policy if exists "profiles read friends" on public.profiles;
create policy "profiles read friends" on public.profiles
  for select to authenticated using (
    user_id = auth.uid()
    or (exists (select 1 from public.friends f where f.user_id = auth.uid() and f.friend_id = profiles.user_id)
        and exists (select 1 from public.friends f where f.user_id = profiles.user_id and f.friend_id = auth.uid())));

-- 2. Заявку можно отклонить, дружбу — убрать с обеих сторон; себя в друзья не добавить
drop policy if exists "friends drop" on public.friends;
create policy "friends drop" on public.friends
  for delete to authenticated using (auth.uid() = user_id or auth.uid() = friend_id);
drop policy if exists "friends add" on public.friends;
create policy "friends add" on public.friends
  for insert to authenticated with check (auth.uid() = user_id and friend_id <> auth.uid());

-- 3. Значки видят владелец, тот, кто выдал, и взаимные друзья
do $$ begin
  if to_regclass('public.awards') is not null then
    execute 'drop policy if exists "awards read" on public.awards';
    execute $p$create policy "awards read" on public.awards
      for select to authenticated using (
        user_id = auth.uid() or given_by = auth.uid()
        or (exists (select 1 from public.friends f where f.user_id = auth.uid() and f.friend_id = awards.user_id)
            and exists (select 1 from public.friends f where f.user_id = awards.user_id and f.friend_id = auth.uid())))$p$;
  end if;
end $$;

-- 4. Поиск и заявки: наружу только ник, фото, уровень и код
create or replace function public.find_people(q text)
returns table (user_id uuid, code text, nick text, photo text, lv int)
language sql stable security definer set search_path = public as $$
  select p.user_id, p.code, p.nick, p.photo,
         case when p.stats->'lv'->>'n' ~ '^[0-9]{1,4}$' then (p.stats->'lv'->>'n')::int else 0 end
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where auth.uid() is not null and p.user_id <> auth.uid()
    and char_length(trim(q)) between 2 and 80
    and (p.code = upper(trim(q))
         or lower(u.email) = lower(trim(q))
         or lower(trim(p.nick)) = lower(trim(q)))
  order by p.updated_at desc
  limit 6;
$$;

create or replace function public.my_people()
returns table (user_id uuid, code text, nick text, photo text, lv int)
language sql stable security definer set search_path = public as $$
  select p.user_id, p.code, p.nick, p.photo,
         case when p.stats->'lv'->>'n' ~ '^[0-9]{1,4}$' then (p.stats->'lv'->>'n')::int else 0 end
  from public.profiles p
  where auth.uid() is not null and p.user_id <> auth.uid()
    and exists (select 1 from public.friends f
                where (f.user_id = auth.uid() and f.friend_id = p.user_id)
                   or (f.user_id = p.user_id and f.friend_id = auth.uid()));
$$;

-- 5. Удалить свой аккаунт со всеми данными
create or replace function public.delete_me()
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  if to_regclass('public.awards') is not null then
    execute 'delete from public.awards where given_by = $1' using me;
  end if;
  delete from auth.users where id = me;
end;
$$;

-- 6. Модерация: админ скрывает ник или фото; тот же ник или то же фото снова не появятся
create table if not exists public.badge_admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.badge_admins enable row level security;
create table if not exists public.profile_bans (
  user_id uuid primary key references auth.users on delete cascade,
  nick text,
  photo_md5 text,
  by_admin uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
alter table public.profile_bans enable row level security;
grant select on public.profile_bans to authenticated;
drop policy if exists "bans read" on public.profile_bans;
create policy "bans read" on public.profile_bans
  for select to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.badge_admins a where a.user_id = auth.uid()));

create or replace function public.profiles_apply_bans() returns trigger
language plpgsql security definer set search_path = public as $$
declare b public.profile_bans%rowtype;
begin
  select * into b from public.profile_bans where user_id = new.user_id;
  if found then
    if b.nick is not null and lower(trim(coalesce(new.nick, ''))) = lower(trim(b.nick)) then new.nick := null; end if;
    if b.photo_md5 is not null and new.photo is not null and md5(new.photo) = b.photo_md5 then new.photo := null; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_apply_bans on public.profiles;
create trigger profiles_apply_bans before insert or update on public.profiles
  for each row execute function public.profiles_apply_bans();

create or replace function public.admin_hide(target uuid, what text)
returns void language plpgsql security definer set search_path = public as $$
declare p public.profiles%rowtype;
begin
  if not exists (select 1 from public.badge_admins a where a.user_id = auth.uid()) then
    raise exception 'only admin';
  end if;
  select * into p from public.profiles where user_id = target;
  if not found then raise exception 'no profile'; end if;
  insert into public.profile_bans (user_id, by_admin) values (target, auth.uid())
    on conflict (user_id) do update set by_admin = excluded.by_admin, created_at = now();
  if what = 'nick' then
    update public.profile_bans set nick = p.nick where user_id = target;
    update public.profiles set nick = null where user_id = target;
  elsif what = 'photo' then
    update public.profile_bans set photo_md5 = md5(p.photo) where user_id = target;
    update public.profiles set photo = null where user_id = target;
  else
    raise exception 'what: nick or photo';
  end if;
end;
$$;

-- 8. Админ: список всех пользователей — почта, ник, когда зарегистрировался, когда входил и отмечался
create or replace function public.admin_users()
returns table (user_id uuid, email text, nick text, photo text, code text, lv int,
               created_at timestamptz, last_sign_in_at timestamptz, active_at bigint, friends int, hidden boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not exists (select 1 from public.badge_admins a where a.user_id = auth.uid()) then
    raise exception 'only admin';
  end if;
  return query
  select u.id, u.email::text, p.nick, case when length(p.photo) <= 200000 then p.photo end, p.code,
         case when p.stats->'lv'->>'n' ~ '^[0-9]{1,4}$' then (p.stats->'lv'->>'n')::int else 0 end,
         u.created_at, u.last_sign_in_at,
         case when p.stats->>'ts' ~ '^[0-9]{10,15}$' then (p.stats->>'ts')::bigint end,
         (select count(*)::int from public.friends f
            where f.user_id = u.id and exists (select 1 from public.friends g where g.user_id = f.friend_id and g.friend_id = u.id)),
         exists (select 1 from public.profile_bans b where b.user_id = u.id)
  from auth.users u left join public.profiles p on p.user_id = u.id
  order by u.created_at desc;
end;
$$;

-- 7. Функции вызывают только вошедшие пользователи
revoke all on function public.find_people(text) from public, anon;
revoke all on function public.my_people() from public, anon;
revoke all on function public.delete_me() from public, anon;
revoke all on function public.admin_hide(uuid, text) from public, anon;
revoke all on function public.admin_users() from public, anon;
grant execute on function public.find_people(text) to authenticated;
grant execute on function public.my_people() to authenticated;
grant execute on function public.delete_me() to authenticated;
grant execute on function public.admin_hide(uuid, text) to authenticated;
grant execute on function public.admin_users() to authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;
