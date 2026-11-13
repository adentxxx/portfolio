# Portfolio Roadmap (demo)

Репозиторий: [github.com/adentxxx/portfolio](https://github.com/adentxxx/portfolio)

Портфолио продуктового дизайнера: компании слева, проекты справа. Карточки появляются по скроллу, у точек таймлайна есть bloub, тема светлая и тёмная, звук включается по жесту.

Тексты сайта лежат в базе и правятся в `/admin`. `npm run db:seed` заливает демо с выдуманными компаниями.

## Стек

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- shadcn-style primitives (`Button` на Radix Slot)
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
- Админка: `/admin` (логин и пароль из `ADMIN_LOGIN` и `ADMIN_PASSWORD`, по умолчанию `admin` / `demo-admin`)

## Тема и звук

- Тема сохраняется в `localStorage` (`portfolio-theme`). Кнопки mute нет, звук включён всегда.
- SFX владельца в `public/sounds/`: `drop_004` — смена темы, `click` — кнопки, карточки и пустое место. Точка таймлайна без звука. Без автоплея при загрузке.

## Design tokens

Цвета и type scale соответствуют SDD / экспорту Figma Variables (`surface/*`, `text/*`, …) — см. CSS variables в `src/app/globals.css`.

## БД

Схема: `prisma/schema.prisma`  
Сид: `prisma/seed.ts`  

```bash
npm run db:seed    # перезалить демо-данные
npm run db:reset   # миграции заново + seed
```
