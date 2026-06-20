# МОЗОЛЕУМ

Стёбный генератор почётных мозолей в эстетике чёрно-золотого аукционного дома.
Каждая «мозоль» детерминированно строится из seed («одна геометрия — много
стилей»), получает пафосное музейное имя, редкость-гачу, зрелищную рамку,
сертификат-печать и музейную табличку. Полностью на русском.

Реализация — full-stack приложение:

- **`packages/engine`** — детерминированный SVG-движок (TypeScript, без зависимостей).
  Один seed = одна и та же мозоль. Работает и в браузере, и в Node.
- **`apps/web`** — сайт на **React + Vite + TypeScript** (порт исходного дизайна
  из Claude Design, пиксель-в-пиксель: интро с занавесом, генератор, аукционный
  зал, магазин, шеринг, триумф-оверлеи, живые рамки по редкости).
- **`apps/server`** — **Express** API:
  - отдаёт **детерминированную PNG-картинку** мозоли по seed — для твоего бота;
  - проксирует генерацию девизов через LLM (**ключ остаётся на сервере**);
  - в проде раздаёт и собранный сайт (один деплой = сайт + API).

> Исходный дизайн-бандл из Claude Design сохранён в `project/` и `chats/` для
> справки. Боевая реализация — в `packages/` и `apps/`.

---

## Быстрый старт

```bash
npm install
npm run fonts -w @mozoleum/server   # один раз: качает шрифты для PNG-рендера
npm run dev                         # сайт на :5173, API на :8787 (vite проксирует /api)
```

Открой http://localhost:5173.

Прод-сборка (сайт + API из одного процесса):

```bash
npm run build      # собирает engine → server → web
npm start          # поднимает сервер, он же раздаёт apps/web/dist
# открой http://localhost:8787
```

### Переменные окружения

Скопируй `.env.example` → `.env` (он в `.gitignore`, ключ туда — **не в гит**):

| Переменная           | Назначение                                                        |
| -------------------- | ----------------------------------------------------------------- |
| `PORT`               | порт API (по умолчанию `8787`)                                    |
| `CORS_ORIGIN`        | разрешённые источники (`*` или список через запятую)              |
| `ANTHROPIC_API_KEY`  | ключ LLM для свежих девизов. Пусто → встроенный банк девизов      |
| `MOTTO_MODEL`        | модель для девизов (по умолчанию `claude-haiku-4-5-20251001`)     |
| `VITE_API_BASE`      | база API для фронта, если он раздаётся отдельно от API (иначе пусто) |

---

## API для бота

Картинки детерминированы по `(origin, seed, style)` — тот же seed даёт ту же
мозоль, что и на сайте. Можно кэшировать намертво.

### `GET /api/callus.png`

| Параметр    | Пример       | По умолчанию          |
| ----------- | ------------ | --------------------- |
| `origin`    | `18`         | случайный (1–40)      |
| `seed`      | `12345`      | случайный             |
| `style`     | `heraldry`   | `heraldry` (`botanical`, `topo`) |
| `signature` | `от И. П.`   | —                     |
| `width`     | `1080`       | `1080` (256–2160)     |
| `download`  | `1`          | — (ставит `Content-Disposition`) |

Возвращает `image/png` (1080×1350 при дефолтной ширине). Заголовки ответа
`X-Callus-Origin/Seed/Style` сообщают, что выпало (полезно при случайном seed).

```bash
curl "https://ТВОЙ-ХОСТ/api/callus.png?origin=18&seed=12345&style=heraldry" -o mozol.png
# случайная:
curl "https://ТВОЙ-ХОСТ/api/callus.png" -o random.png
```

### `GET /api/callus.json`

Метаданные мозоли (имя, латынь, редкость, сертификат, девиз, `imageUrl`,
`shareUrl`). Удобно, чтобы бот подписал картинку текстом.

```bash
curl "https://ТВОЙ-ХОСТ/api/callus.json?origin=18&seed=12345&style=heraldry"
```

### `POST /api/motto`

`{ "folk": "Перст Гончара" }` → `{ "motto": "…", "enabled": true }`.
Без `ANTHROPIC_API_KEY` вернёт `{ "motto": null, "enabled": false }`.

### `GET /api/health`

`{ ok, mottoApi, ts }`.

### CLI (без HTTP)

Если боту удобнее запускать движок локально (без сервера и без ключа):

```bash
npm run build -w @mozoleum/engine -w @mozoleum/server
node apps/server/dist/cli.js --origin 18 --seed 12345 --style heraldry --out callus.png
node apps/server/dist/cli.js --json     # метаданные вместо картинки
node apps/server/dist/cli.js            # полностью случайная
```

---

## Деплой

GitHub Pages не подходит: нужен серверный процесс (PNG-рендер + LLM-прокси, и
ключ нельзя светить в браузере). Хости как обычный Node-сервис — он раздаёт и
сайт, и API.

- **Render** — есть `render.yaml`: New → Blueprint → выбрать репозиторий.
  Поставь секрет `ANTHROPIC_API_KEY` в дашборде. (план `starter` — без засыпания.)
- **Railway / Fly.io / Cloud Run / VPS** — есть `Dockerfile`:
  `docker build -t mozoleum . && docker run -p 8787:8787 -e ANTHROPIC_API_KEY=… mozoleum`.

Если фронт хочется на GitHub Pages, а API отдельно — собери web с
`VITE_API_BASE=https://твой-api-хост` и задеплой `apps/web/dist` на Pages, а
сервер — на любой Node-хост. Но проще держать всё в одном сервисе.

---

## Скрипты

| Команда                              | Что делает                                  |
| ------------------------------------ | ------------------------------------------- |
| `npm run dev`                        | engine (сборка) + server + web в dev-режиме |
| `npm run build`                      | сборка engine → server → web                |
| `npm start`                          | прод-сервер (раздаёт сайт + API)            |
| `npm run fonts -w @mozoleum/server`  | скачать шрифты для серверного PNG-рендера   |
| `node apps/server/dist/cli.js …`     | CLI-генерация PNG/метаданных                |
