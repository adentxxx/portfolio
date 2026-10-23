# Portfolio Roadmap (demo)

Репозиторий: [github.com/adentxxx/portfolio](https://github.com/adentxxx/portfolio)

Портфолио продуктового дизайнера в метафоре **roadmap**: компании слева, проекты справа, scroll-reveal, lifecycle **bloub**, light/dark через Mapped tokens, звук по жесту + mute.

Контент компаний/проектов — **случайные placeholder’ы** (не реальная биография). Править через `/admin` или `npm run db:seed`.

## Стек

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- shadcn-style primitives (`Button` на Radix Slot)
- Prisma + SQLite (локальная БД)
- Шрифты: **Vollkorn** (display) + **Ubuntu Sans** (UI)

## Запуск локально

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Откройте [http://127.0.0.1:43123](http://127.0.0.1:43123).

- Главная: `/`
- Кейс: `/projects/[slug]` (например `/projects/aurora-dashboard`)
- Админка: `/admin` (логин и пароль из `ADMIN_LOGIN` и `ADMIN_PASSWORD`, по умолчанию `admin` / `demo-admin`)

## Тема и звук

- Тема и mute сохраняются в `localStorage` (`portfolio-theme`, `portfolio-muted`).
- SFX владельца в `public/sounds/`: `drop_004` — смена темы, `switch_005` — mute, `select_008` — точка таймлайна дошла до карточки, `click` — кнопки, карточки и пустое место. Без автоплея при загрузке.

## Design tokens

Цвета и type scale соответствуют SDD / экспорту Figma Variables (`surface/*`, `text/*`, …) — см. CSS variables в `src/app/globals.css`.

## БД

Схема: `prisma/schema.prisma`  
Сид: `prisma/seed.ts`  

```bash
npm run db:seed    # перезалить демо-данные
npm run db:reset   # миграции заново + seed
```
