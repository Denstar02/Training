# Свой сервер для «Тренировок»

Здесь всё, чтобы приложение работало на своём VPS с адресом **denstar-train.ru**, без Supabase: вход и данные хранятся в Postgres на этом сервере в Москве.

| Файл | Что это |
|---|---|
| `setup.sh` | установка на чистую Ubuntu 24.04 (или 22.04): Postgres, сервер приложения, Caddy с HTTPS, сайт, файрвол, ежедневные копии базы |
| `migrate.sh` | перенос пользователей (с прежними паролями) и всех данных из Supabase |
| `server.js` | сервер приложения (вход `/auth/v1`, данные `/rest/v1`), собран в один файл; исходник — `src/server.js` |
| `sql/` | роли, таблицы и правила доступа |
| `Caddyfile.tpl` | настройки веб-сервера |

## Установка
```
ssh root@IP-сервера
curl -fsSL https://denstar02.github.io/Training/server/setup.sh | bash -s -- denstar-train.ru denstar02@gmail.com
bash /opt/training/migrate.sh        # перенос из Supabase
```

## Потом пригодится
- `training-update` — сразу забрать свежий сайт с GitHub (сам он проверяет каждые 10 минут);
- `training-admin почта` — сделать человека админом (значки и модерация);
- `training-backup` — копия базы сейчас (каждый день в 3:30 делается сама, лежат в `/var/backups/training`, 14 дней);
- `journalctl -u training-api -n 50` — логи сервера, `journalctl -u caddy -n 50` — логи HTTPS;
- почта для «Забыл пароль»: раскомментируй строки `SMTP_*` в `/etc/training/env` и выполни `systemctl restart training-api`;
- повторный запуск `setup.sh` безопасен: пароли и данные остаются.
