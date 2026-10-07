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
- Админка: `/admin` (пароль по умолчанию `demo-admin`, env `ADMIN_PASSWORD`)

## Тема и звук

- Тема и mute сохраняются в `localStorage` (`portfolio-theme`, `portfolio-muted`).
- SFX — короткие тестовые WAV в `public/sounds/` (сгенерированные click-звуки для MVP; без автоплея).
- Источник: локально сгенерированные UI clicks (не сток с CDN); замените файлы на финальные ассеты без смены API.

## Design tokens

Цвета и type scale соответствуют SDD / экспорту Figma Variables (`surface/*`, `text/*`, …) — см. CSS variables в `src/app/globals.css`.

## БД

Схема: `prisma/schema.prisma`  
Сид: `prisma/seed.ts`  

```bash
npm run db:seed    # перезалить демо-данные
npm run db:reset   # миграции заново + seed
```
