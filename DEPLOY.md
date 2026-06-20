# Деплой МОЗОЛЕУМ

Сайт и API живут в одном Node-процессе (сервер раздаёт и собранный фронт, и
`/api/*`). Нужен обычный сервер (не GitHub Pages). Ниже — три пути; самый
простой для Timeweb — **Вариант A (Docker)**.

Перед стартом: получи ключ в Anthropic Console → `sk-ant-...` и держи его только
на сервере (в `.env` или в переменной окружения). В гит он не попадает.

---

## Вариант A — Docker на Ubuntu (рекомендуется для Timeweb)

Конфиг сервера: Ubuntu 24.04, 1–2 CPU, 2–4 ГБ RAM, публичный IP. Регион — Москва.

```bash
ssh root@<IP-сервера>
apt update && apt install -y docker.io git

git clone https://github.com/NikitaDalian/Mozoleum.git
cd Mozoleum

# ключ кладём в .env (он в .gitignore)
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

./deploy.sh        # соберёт образ и поднимет контейнер на :80
```

Проверка: открой `http://<IP-сервера>/` (сайт) и `http://<IP-сервера>/api/health`.

**Обновление после `git push`:**

```bash
cd ~/Mozoleum && ./deploy.sh      # делает git pull + rebuild + restart
```

> Если `docker build` упирается в память на 2 ГБ — добавь swap:
> `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`.

---

## Вариант B — Автодеплой по push (GitHub Actions → SSH)

После настройки каждый `git push` в `main` сам выкатит сервер.

1. Один раз подготовь сервер как в Варианте A (клон в `~/Mozoleum`, Docker, `.env`).
2. Создай SSH-ключ для деплоя и добавь публичный на сервер:
   ```bash
   ssh-keygen -t ed25519 -f deploy_key -N ""
   ssh-copy-id -i deploy_key.pub root@<IP>     # или вручную в ~/.ssh/authorized_keys
   ```
3. В GitHub-репозитории → **Settings → Secrets and variables → Actions**:
   - **Variables** → `DEPLOY_ENABLED` = `true`
   - **Secrets**:
     | Secret | Значение |
     | --- | --- |
     | `SSH_HOST` | IP сервера |
     | `SSH_USER` | `root` (или твой пользователь) |
     | `SSH_KEY` | **приватный** ключ `deploy_key` целиком |
     | `SSH_PORT` | `22` (опционально) |
     | `ANTHROPIC_API_KEY` | `sk-ant-...` |

Готово — workflow `.github/workflows/deploy.yml` подключится по SSH и запустит
`./deploy.sh`. Пока `DEPLOY_ENABLED` не `true`, деплой не запускается (только CI-сборка).

---

## Вариант C — Render (PaaS, без своего сервера)

Есть `render.yaml`: в Render → **New → Blueprint** → выбрать репозиторий. Секрет
`ANTHROPIC_API_KEY` задать в дашборде. План `starter` — без засыпания.

---

## Домен и HTTPS (опционально)

Контейнер слушает `:80`. Чтобы повесить домен с TLS — поставь Caddy (само
получает Let's Encrypt):

```bash
apt install -y caddy
# /etc/caddy/Caddyfile:
#   mozoleum.example.com {
#       reverse_proxy localhost:80
#   }
systemctl reload caddy
```

(или nginx + certbot — на вкус). Не забудь указать домен в `CORS_ORIGIN`, если
будешь дёргать API из браузера со стороннего источника.

---

## Эндпоинты для бота

После деплоя бот ходит на:

- `GET  /api/callus.png?origin=&seed=&style=&signature=&width=&download=` → PNG
- `GET  /api/callus.json?origin=&seed=&style=` → метаданные (имя, редкость, ссылки)
- `POST /api/motto { folk }` → свежий девиз (если задан `ANTHROPIC_API_KEY`)
- `GET  /api/health`

Картинки детерминированы по `(origin, seed, style)` — тот же seed = та же мозоль,
что на сайте. Можно кэшировать.
