#!/usr/bin/env bash
# Тренировки: установка своего сервера на чистую Ubuntu 24.04 (или 22.04).
# Запуск:  curl -fsSL https://denstar02.github.io/Training/server/setup.sh | bash -s -- denstar-train.ru denstar02@gmail.com
# Повторный запуск безопасен: пароли и данные сохраняются, обновляются программа, сайт и настройки.
set -euo pipefail

DOMAIN="${1:-${DOMAIN:-denstar-train.ru}}"
EMAIL="${2:-${EMAIL:-denstar02@gmail.com}}"
BASE="${BASE:-https://denstar02.github.io/Training/server}"
SITE_SRC="${SITE_SRC:-https://denstar02.github.io/Training}"
NODE_VER="${NODE_VER:-v20.18.1}"
CADDY_VER="${CADDY_VER:-2.8.4}"
APP=/opt/training
ETC=/etc/training
WWW=/var/www/training

say(){ printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
ok(){ printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn(){ printf '  \033[33m!\033[0m %s\n' "$*"; }
die(){ printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
fetch(){ curl -fsSL --retry 3 --connect-timeout 15 "$1" -o "$2" || die "Не удалось скачать $1"; }

[ "$(id -u)" = 0 ] || die "Запусти от root (или через sudo)."
. /etc/os-release
case "${VERSION_ID:-}" in
  24.04|22.04) ok "Система: $PRETTY_NAME";;
  *) die "Нужна Ubuntu 24.04 или 22.04, а стоит ${PRETTY_NAME:-неизвестная}. Переустанови систему в панели хостинга и запусти снова.";;
esac
echo "$DOMAIN" | grep -Eq '^[a-z0-9.-]+\.[a-z]{2,}$' || die "Странный домен: $DOMAIN"

say "Память и подкачка"
if [ "$(swapon --show --noheadings | wc -l)" = 0 ]; then
  fallocate -l 1G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=1024 status=none
  chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -q vm.swappiness=10; echo 'vm.swappiness=10' > /etc/sysctl.d/90-training.conf
  ok "подкачка 1 ГБ включена"
else ok "подкачка уже есть"; fi

say "Пакеты"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl ca-certificates postgresql ufw cron openssl xz-utils >/dev/null
ok "Postgres $(psql --version | awk '{print $3}')"

NODE=/usr/bin/node
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)" -lt 18 ]; then
  apt-get install -y -qq nodejs >/dev/null 2>&1 || true
fi
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)" -lt 18 ]; then
  if [ ! -x "$APP/node/bin/node" ]; then
    fetch "https://nodejs.org/dist/$NODE_VER/node-$NODE_VER-linux-x64.tar.xz" /tmp/node.tar.xz
    mkdir -p "$APP/node" && tar -xJf /tmp/node.tar.xz -C "$APP/node" --strip-components=1 && rm -f /tmp/node.tar.xz
  fi
  NODE="$APP/node/bin/node"
else NODE="$(command -v node)"; fi
ok "Node $($NODE -v)"

if ! command -v caddy >/dev/null; then
  if apt-cache show caddy >/dev/null 2>&1; then apt-get install -y -qq caddy >/dev/null
  else
    fetch "https://github.com/caddyserver/caddy/releases/download/v$CADDY_VER/caddy_${CADDY_VER}_linux_amd64.tar.gz" /tmp/caddy.tgz
    tar -xzf /tmp/caddy.tgz -C /usr/bin caddy && rm -f /tmp/caddy.tgz
    id caddy >/dev/null 2>&1 || useradd --system --home /var/lib/caddy --create-home --shell /usr/sbin/nologin caddy
    mkdir -p /etc/caddy
    cat > /etc/systemd/system/caddy.service <<'UNIT'
[Unit]
Description=Caddy
After=network-online.target
Wants=network-online.target
[Service]
User=caddy
Group=caddy
ExecStart=/usr/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/bin/caddy reload --config /etc/caddy/Caddyfile --force
TimeoutStopSec=5s
LimitNOFILE=1048576
AmbientCapabilities=CAP_NET_BIND_SERVICE
[Install]
WantedBy=multi-user.target
UNIT
  fi
fi
ok "Caddy $(caddy version | awk '{print $1}')"

say "Файлы сервера"
mkdir -p "$APP/sql" "$ETC" "$WWW" /var/backups/training
for f in server.js sql/00_init.sql sql/10_app.sql Caddyfile.tpl migrate.sh; do fetch "$BASE/$f?$(date +%s)" "$APP/$f.new" && mv "$APP/$f.new" "$APP/$f"; done   # ?время — мимо кэша GitHub Pages
chmod 755 "$APP/migrate.sh"
ok "скачано в $APP"
id training >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin training

if [ ! -f "$ETC/env" ]; then
  umask 077
  cat > "$ETC/env" <<ENV
PORT=8787
HOST=127.0.0.1
SITE_URL=https://$DOMAIN
JWT_SECRET=$(openssl rand -hex 32)
AUTH_PW=$(openssl rand -hex 18)
REST_PW=$(openssl rand -hex 18)
LOG_REQUESTS=0
# Почта для восстановления пароля (заполни и перезапусти: systemctl restart training-api)
# SMTP_HOST=smtp.yandex.ru
# SMTP_PORT=465
# SMTP_USER=you@yandex.ru
# SMTP_PASS=пароль-приложения
# SMTP_FROM="Тренировки <you@yandex.ru>"
ENV
  umask 022
  ok "пароли и ключ созданы в $ETC/env"
else ok "пароли уже есть, оставляю"; fi
sed -i "s|^SITE_URL=.*|SITE_URL=https://$DOMAIN|" "$ETC/env"
AUTH_PW=$(grep '^AUTH_PW=' "$ETC/env" | cut -d= -f2-)
REST_PW=$(grep '^REST_PW=' "$ETC/env" | cut -d= -f2-)
grep -q '^DATABASE_URL_AUTH=' "$ETC/env" || cat >> "$ETC/env" <<ENV
DATABASE_URL_AUTH=postgres://trn_auth:$AUTH_PW@127.0.0.1:5432/training
DATABASE_URL_REST=postgres://authenticator:$REST_PW@127.0.0.1:5432/training
ENV
# ключи для push-уведомлений (VAPID): создаются один раз, при смене все устройства придётся подписать заново
if ! grep -q '^PUSH_PUBLIC=' "$ETC/env"; then
  node -e '
    const c = require("crypto"), k = c.generateKeyPairSync("ec", {namedCurve: "prime256v1"}).privateKey.export({format: "jwk"});
    const pub = Buffer.concat([Buffer.from([4]), Buffer.from(k.x, "base64url"), Buffer.from(k.y, "base64url")]).toString("base64url");
    console.log("PUSH_PUBLIC=" + pub + "\nPUSH_PRIVATE=" + k.d + "\nPUSH_SUBJECT=mailto:" + process.argv[1]);' "$EMAIL" >> "$ETC/env" \
    && ok "ключи для push-уведомлений созданы" || warn "не получилось создать ключи для push-уведомлений"
fi
chown root:training "$ETC/env" && chmod 640 "$ETC/env"

say "База данных"
PGV=$(ls /etc/postgresql | sort -V | tail -1)
cat > "/etc/postgresql/$PGV/main/conf.d/training.conf" <<'CONF'
# небольшой сервер: экономим память
shared_buffers = 64MB
effective_cache_size = 256MB
work_mem = 4MB
maintenance_work_mem = 32MB
max_connections = 30
listen_addresses = 'localhost'
CONF
systemctl restart postgresql
for i in $(seq 1 20); do runuser -u postgres -- psql -Atqc 'select 1' >/dev/null 2>&1 && break; sleep 1; done
# база в UTF-8 с юникодной локалью: иначе поиск по нику не узнаёт «САША» и «саша» как одно
CTYPE=$(runuser -u postgres -- psql -Atqc "select datctype from pg_database where datname='training'")
if [ -n "$CTYPE" ] && ! echo "$CTYPE" | grep -qi 'utf'; then
  if [ "$(runuser -u postgres -- psql -d training -Atqc "select count(*) from auth.users" 2>/dev/null || echo 0)" = 0 ]; then
    runuser -u postgres -- dropdb training; CTYPE=""
  else warn "база training создана с локалью $CTYPE — поиск по нику может не узнавать регистр кириллицы"; fi
fi
[ -n "$CTYPE" ] || runuser -u postgres -- createdb --template=template0 --encoding=UTF8 --locale=C.UTF-8 training
runuser -u postgres -- psql -q -d training -v auth_pw="$AUTH_PW" -v rest_pw="$REST_PW" -f "$APP/sql/00_init.sql" -f "$APP/sql/10_app.sql" 2>&1 | grep -v NOTICE || true
runuser -u postgres -- psql -Atqc "select count(*) from pg_proc where proname='find_people'" -d training | grep -q 1 || die "Схема базы не создалась — пришли вывод выше"
ok "база training готова, пользователей: $(runuser -u postgres -- psql -Atqc 'select count(*) from auth.users' -d training)"

say "Сервер приложения"
cat > /etc/systemd/system/training-api.service <<UNIT
[Unit]
Description=Тренировки API
After=network.target postgresql.service
Requires=postgresql.service
[Service]
User=training
Group=training
EnvironmentFile=$ETC/env
ExecStart=$NODE $APP/server.js
Restart=always
RestartSec=2
MemoryMax=220M
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable -q training-api
systemctl restart training-api
for i in $(seq 1 20); do curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 || { journalctl -u training-api -n 30 --no-pager; die "Сервер приложения не отвечает — пришли вывод выше"; }
ok "отвечает на 127.0.0.1:8787"

say "Сайт"
cat > /usr/local/bin/training-update <<UPD
#!/usr/bin/env bash
# Тренировки: забрать свежую версию сайта с GitHub Pages
set -euo pipefail
T=\$(mktemp -d)
trap 'rm -rf "\$T"' EXIT
for f in index.html cam.js sw.js manifest.webmanifest icon-192.png icon-512.png icon-maskable-512.png apple-touch-icon.png badge-96.png; do
  curl -fsSL --retry 2 --connect-timeout 15 "$SITE_SRC/\$f?\$(date +%s)" -o "\$T/\$f"
done
grep -q 'SELF_HOSTS' "\$T/index.html" || { echo "index.html без поддержки своего сервера — пропускаю"; exit 1; }
[ "\$(stat -c %s "\$T/cam.js")" -gt 100000 ] || { echo "cam.js подозрительно маленький — пропускаю"; exit 1; }
changed=0
for f in "\$T"/*; do b=\$(basename "\$f"); cmp -s "\$f" "$WWW/\$b" || { install -m 644 "\$f" "$WWW/\$b.new" && mv "$WWW/\$b.new" "$WWW/\$b"; changed=1; }; done
[ "\$changed" = 1 ] && echo "сайт обновлён \$(date '+%F %T')" || true
UPD
chmod 755 /usr/local/bin/training-update
/usr/local/bin/training-update || die "Не удалось взять сайт с $SITE_SRC — проверь, что там лежит новая версия index.html"
cat > /etc/systemd/system/training-update.service <<'UNIT'
[Unit]
Description=Тренировки: обновить сайт с GitHub Pages
[Service]
Type=oneshot
ExecStart=/usr/local/bin/training-update
UNIT
cat > /etc/systemd/system/training-update.timer <<'UNIT'
[Unit]
Description=Тренировки: проверять обновления сайта каждые 10 минут
[Timer]
OnBootSec=2min
OnUnitActiveSec=10min
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload && systemctl enable -q --now training-update.timer
ok "сайт в $WWW, обновляется с GitHub каждые 10 минут"

say "HTTPS и веб-сервер"
pubdns(){ # A-запись по публичному DNS; /etc/hosts не годится — там имя сервера смотрит на 127.0.1.1
  local r=""
  r=$(curl -fsS --connect-timeout 6 "https://dns.google/resolve?name=$1&type=A" 2>/dev/null | grep -oE '"data": ?"[0-9.]+"' | grep -oE '[0-9.]+' | tail -1) || true
  [ -n "$r" ] || r=$(curl -fsS --connect-timeout 6 -H 'accept: application/dns-json' "https://cloudflare-dns.com/dns-query?name=$1&type=A" 2>/dev/null | grep -oE '"data": ?"[0-9.]+"' | grep -oE '[0-9.]+' | tail -1) || true
  [ -n "$r" ] || r=$(getent ahostsv4 "$1" 2>/dev/null | awk '$1 !~ /^127\./ {print $1; exit}') || true
  printf '%s' "$r"
}
IP=$(curl -fsS --connect-timeout 8 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
WWW_ON=0
if [ -n "$IP" ] && [ "$(pubdns "www.$DOMAIN")" = "$IP" ]; then WWW_ON=1; fi
sed -e "s|__SITE__|$DOMAIN|g" -e "s|__DOMAIN__|$DOMAIN|g" -e "s|__EMAIL__|$EMAIL|g" "$APP/Caddyfile.tpl" > /etc/caddy/Caddyfile.new
[ "$WWW_ON" = 1 ] && sed -i 's/^#WWW //' /etc/caddy/Caddyfile.new
caddy validate --config /etc/caddy/Caddyfile.new --adapter caddyfile >/dev/null 2>&1 || { caddy validate --config /etc/caddy/Caddyfile.new --adapter caddyfile; die "Ошибка в настройках Caddy"; }
mv /etc/caddy/Caddyfile.new /etc/caddy/Caddyfile
systemctl daemon-reload; systemctl enable -q caddy; systemctl restart caddy
ok "Caddy запущен"

say "Файрвол"
SSH_PORT=$( { ss -tlnpH 2>/dev/null || true; } | awk '/sshd/ {n=split($4,a,":"); print a[n]; exit}')
[ -n "$SSH_PORT" ] || SSH_PORT=$( { grep -hE '^[[:space:]]*Port[[:space:]]+[0-9]+' /etc/ssh/sshd_config /etc/ssh/sshd_config.d/*.conf 2>/dev/null || true; } | awk '{print $2; exit}')
ufw allow "${SSH_PORT:-22}/tcp" >/dev/null; ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
ok "открыты только SSH (порт ${SSH_PORT:-22}), 80 и 443"

say "Резервные копии и помощники"
cat > /usr/local/bin/training-backup <<'BAK'
#!/usr/bin/env bash
# Тренировки: копия базы раз в сутки. На сервере храним 14 дней; если подключён Яндекс Диск (training-yadisk) —
# ещё и туда, 30 дней. Итог пишется в базу: админ видит его в приложении и получает уведомление о сбое.
set -uo pipefail
D=/var/backups/training; f=$D/training-$(date +%F).dump
log(){ logger -t training-backup "$*"; echo "$*"; }
ok=true; err=""; yd=off
mkdir -p "$D"
if runuser -u postgres -- pg_dump -Fc training > "$f.tmp" && mv "$f.tmp" "$f"; then chmod 600 "$f"; log "копия: $f ($(stat -c %s "$f") байт)"
else ok=false; err=pg_dump; rm -f "$f.tmp"; log "ошибка: pg_dump не сработал"; fi
find "$D" -name 'training-*.dump' -mtime +14 -delete
if [ "$ok" = true ] && [ -f /etc/training/yadisk ]; then
  . /etc/training/yadisk
  cfg=$(mktemp); trap 'rm -f "$cfg"' EXIT; chmod 600 "$cfg"
  printf 'user = "%s:%s"\n' "$YD_USER" "$YD_PASS" > "$cfg"
  base="https://webdav.yandex.ru/${YD_DIR:-training-backups}"
  curl -sS -o /dev/null --max-time 30 -K "$cfg" -X MKCOL "$base/" || true
  if curl -fsS -o /dev/null --max-time 600 --retry 2 -K "$cfg" -T "$f" "$base/$(basename "$f")"; then
    yd=ok; log "копия загружена на Яндекс Диск: ${YD_DIR:-training-backups}/$(basename "$f")"
    curl -sS -o /dev/null --max-time 30 -K "$cfg" -X DELETE "$base/training-$(date -d '-30 days' +%F).dump" || true
  else yd=fail; ok=false; err=yadisk; log "ошибка: не загрузилась на Яндекс Диск"; fi
fi
size=$(stat -c %s "$f" 2>/dev/null || echo 0)
runuser -u postgres -- psql -d training -Atq -c "select auth.ops_set('backup', jsonb_build_object('ok', $ok, 'yadisk', '$yd', 'size', $size, 'err', '$err', 'file', '$(basename "$f")'))" >/dev/null 2>&1 || true
[ "$ok" = true ]
BAK
chmod 755 /usr/local/bin/training-backup
cat > /usr/local/bin/training-yadisk <<'YDK'
#!/usr/bin/env bash
# Тренировки: подключить Яндекс Диск для копий базы.  training-yadisk — подключить,  training-yadisk off — отключить
set -euo pipefail
F=/etc/training/yadisk
if [ "${1:-}" = off ]; then rm -f "$F"; echo "Яндекс Диск отключён: копии остаются только на сервере."; exit 0; fi
cat <<'TXT'
Нужен пароль приложения (обычный пароль от Яндекса не подойдёт):
  1. Открой https://id.yandex.ru/security/app-passwords
  2. «Создать пароль приложения» → тип «Файлы» (WebDAV) → назови, например, «Тренировки»
  3. Скопируй пароль, который покажет Яндекс
TXT
read -r -p "Логин Яндекса (например, denstar02 или denstar02@yandex.ru): " U < /dev/tty
read -r -s -p "Пароль приложения (символы не видны, вставка — правой кнопкой мыши): " P < /dev/tty; echo
U=$(printf '%s' "$U" | tr -d '[:space:]'); P=$(printf '%s' "$P" | tr -d '[:space:]')
[ -n "$U" ] && [ -n "$P" ] || { echo "✗ Нужны логин и пароль"; exit 1; }
cfg=$(mktemp); trap 'rm -f "$cfg"' EXIT; chmod 600 "$cfg"
printf 'user = "%s:%s"\n' "$U" "$P" > "$cfg"
code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 -K "$cfg" -X PROPFIND -H 'Depth: 0' https://webdav.yandex.ru/ || true)
case "$code" in
  207) ;;
  401) echo "✗ Яндекс не принял логин или пароль приложения. Проверь, что тип пароля — «Файлы»."; exit 1;;
  *)   echo "✗ Яндекс Диск не ответил как надо (код $code). Попробуй ещё раз через минуту."; exit 1;;
esac
curl -sS -o /dev/null --max-time 30 -K "$cfg" -X MKCOL https://webdav.yandex.ru/training-backups/ || true
umask 077; printf 'YD_USER=%q\nYD_PASS=%q\nYD_DIR=training-backups\n' "$U" "$P" > "$F"; chmod 600 "$F"
echo "✓ Яндекс Диск подключён. Делаю копию прямо сейчас…"
if /usr/local/bin/training-backup >/dev/null; then echo "✓ Готово: копия лежит на Яндекс Диске в папке training-backups. Дальше — каждую ночь в 3:30."
else echo "✗ Копия не загрузилась. Подробности: journalctl -t training-backup -n 20"; exit 1; fi
YDK
chmod 755 /usr/local/bin/training-yadisk
echo '30 3 * * * root /usr/local/bin/training-backup' > /etc/cron.d/training-backup
cat > /usr/local/bin/training-admin <<'ADM'
#!/usr/bin/env bash
# Тренировки: сделать пользователя админом (выдаёт значки и модерирует). Пример: training-admin denstar02@gmail.com
set -euo pipefail
[ -n "${1:-}" ] || { echo "Укажи почту: training-admin почта@пример.ru"; exit 1; }
runuser -u postgres -- psql -d training -v email="$1" -Atq <<'SQL'
insert into public.badge_admins (user_id) select id from auth.users where lower(email) = lower(:'email') on conflict do nothing;
select case when exists (select 1 from public.badge_admins a join auth.users u on u.id = a.user_id where lower(u.email) = lower(:'email'))
  then 'готово: ' || :'email' || ' — админ' else 'нет пользователя ' || :'email' || ' — сначала зарегистрируйся на сайте' end;
SQL
ADM
chmod 755 /usr/local/bin/training-admin
training-admin "$EMAIL" || true
if [ -f /etc/training/yadisk ]; then ok "копия базы каждый день в 3:30 → /var/backups/training и на Яндекс Диск"
else ok "копия базы каждый день в 3:30 → /var/backups/training (на Яндекс Диск — после training-yadisk)"; fi

say "Проверка"
DNS=$(pubdns "$DOMAIN")
if [ "$DNS" = "$IP" ]; then ok "домен $DOMAIN смотрит на этот сервер ($IP)"
elif [ -z "$DNS" ]; then warn "домен $DOMAIN пока не виден в интернете. В reg.ru проверь, что домен делегирован (для .ru нужна идентификация владельца), и поставь A-записи @ и www на $IP."
else warn "домен $DOMAIN смотрит на $DNS, а сервер — $IP. Поменяй A-записи @ и www в reg.ru на $IP; сертификат Caddy получит сам, как только DNS обновится."; fi
[ "$WWW_ON" = 1 ] || echo "  www.$DOMAIN подключится, если запустить эту установку ещё раз, когда DNS обновится (данные не пострадают)"
sleep 3
if curl -fsS --connect-timeout 10 "https://$DOMAIN/health" >/dev/null 2>&1; then ok "https://$DOMAIN работает"
else warn "https://$DOMAIN пока не открывается — так бывает первые минуты, пока выдаётся сертификат. Логи: journalctl -u caddy -n 50"; fi

cat <<DONE

Готово.
  Сайт:        https://$DOMAIN
  Перенос данных из Supabase:   bash $APP/migrate.sh
  Обновить сайт сейчас:         training-update
  Сделать админом:              training-admin почта
  Копии на Яндекс Диск:         training-yadisk
  Сделать копию сейчас:         training-backup
  Логи сервера:                 journalctl -u training-api -n 50
DONE
