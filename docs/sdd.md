# SDD: Portfolio (Roadmap)

Практическое правило для агентов разработки. Источник поведения и ограничений. Визуал — Figma.

**Figma:** [Portfolio-NEW](https://www.figma.com/design/nd7zB49xe9VqSffkITxzge/Portfolio-NEW?node-id=78-2860)  
**File key:** `nd7zB49xe9VqSffkITxzge` · **Design canvas:** `78:2860`  
**Экспорт токенов (источник для §4):** [`docs/tokens/`](./tokens/) — Mapped (Light/Dark), Primitives, Semantic, Type scale.

---

## 1. Цель и scope

### 1.1 Что это

Портфолио продуктового дизайнера в метафоре **roadmap / дорожной карты**:

- центральная вертикальная линия (timeline);
- **слева** — компании / опыт работы;
- **справа** — проекты / кейсы;
- блоки появляются при скролле;
- светлая и тёмная темы через design tokens (Mapped Light/Dark);
- звук на нажатиях блоков и кнопок (на этапе MVP — тестовые стоковые);
- **БД** для наполнения проектов / компаний / эмоций bloub владельцем.

### 1.2 Что это не

- Не мультистраничный маркетинг-сайт с отдельными лендингами.
- Не платформа с публичной регистрацией пользователей или аналитикой-продуктом.
- Не «заглушка Welcome» — контент из БД / сидов владельца.
- Не полноценный headless CMS «на все случаи» — достаточно админ-поверхности или CRUD для сущностей portfolio (см. §8–§9).

### 1.3 MVP-границы

| В scope | Вне scope (пока) |
|---|---|
| Home + экран кейса (Project Full Page) | Публичная регистрация / multi-tenant |
| Scroll-reveal roadmap + lifecycle bloub | Автоплей фоновой музыки |
| Light/dark через Mapped tokens | Свои финальные SFX (пока сток) |
| Sound on press + mute | — |
| **БД + способ заполнять проекты/компании** | Сложный workflow/модерация |
| Адаптив desktop → mobile | Отдельное нативное приложение |

---

## 2. Источники истины

| Вопрос | Источник | Приоритет |
|---|---|---|
| Внешний вид, spacing, компоненты, variants | **Figma** Portfolio-NEW (+ dark-макеты) | 1 (визуал) |
| Цвета / type scale | **Экспорт Variables** → [`docs/tokens/`](./tokens/) и таблицы §4 | 1 (токены) |
| Поведение (bloub, scroll, звук, БД), a11y, правила агента | **этот SDD** | 1 (поведение) |
| Тексты, имена компаний/проектов, даты, эмоции bloub | **владелец через БД** (§8) | 1 (контент) |

### 2.1 Разрешение конфликтов

1. **Визуал vs SDD:** пиксели/компоненты — Figma; поведение (bloub lifecycle, звук, reduced-motion, БД) — SDD.
2. **Токены:** Mapped Light/Dark + Type scale в `docs/tokens/` побеждают устаревшие hex из старых черновиков; при расхождении с Figma Variables — переэкспорт и обновление SDD.
3. **Контент в Figma vs БД:** макет может содержать демо. Прод-контент — из БД; агент **не** копирует демо-имена без подтверждения.
4. **SDD vs код:** править код под SDD+Figma+tokens.
5. **Неясность:** остановить работу, зафиксировать в §11, не выдумывать биографию.

---

## 3. Информационная архитектура

### 3.1 Экраны / маршруты (из Figma Design)

| Figma frame | Назначение | Предлагаемый route |
|---|---|---|
| `Home` / `Home Full Page` | Главная: intro + roadmap + contact | `/` |
| `Start Scrolling` / `Continue Scrolling` | Состояния scroll-reveal (не отдельные URL) | — |
| `Project Full Page` | Детальная страница кейса | `/projects/[slug]` |
| Dark-макеты (добавлены владельцем) | Референс тёмной темы | — (mode, не URL) |
| `UI Kit` | Компоненты/type scale (не страница продукта) | — |
| Админ / редактор контента | Заполнение БД (проекты, компании, bloub) | `/admin` или внешний studio — **решение стека §11** |

> Нужно уточнить: финальные slug’и проектов и нужна ли отдельная страница «обо мне» сверх intro-блока.

### 3.2 Метафора Roadmap

Структура блока `RoadMap` (Figma):

1. **Header RoadMap** — «опыт работы» (слева), центр: `bloub` + «начинай скроллить» + стрелка вниз, справа — место под «кейсы».
2. **Content** — чередующиеся ряды (~240px): company слева / project справа + timeline.
3. **Footer RoadMap** — завершение линии.
4. Декор: `decor/connector`, `Point Container` / `decor/timeline-dot`, `bloub`.

**Правило раскладки:**

- **Слева** → компании (опыт работы).
- **Справа** → проекты (кейсы).
- Карточки изначально `Cards` State=`Default`, при reveal → `Active (Work)` / `Active (Project)`.

### 3.3 Блоки Home (сверху вниз)

1. `card/introduction` — аватар, приветствие, bio, `BTNs`.
2. `RoadMap` — timeline + карточки + bloub.
3. `card/telegram` / `card/contact` — CTA + кнопки.
4. `Button Bar` — тема / mute.

### 3.4 Блоки Project Full Page

1. `Header` — мини-аватар + `BTNs`.
2. `Title` — название + краткое описание.
3. Чередование `Image` + `Text Block`.
4. `Button Bar` + компактный `card/telegram`.

---

## 4. Визуальный язык и темы

### 4.0 Архитектура токенов (из экспорта Figma)

Четыре коллекции:

| Коллекция | Файл | Роль |
|---|---|---|
| **Primitives** | `docs/tokens/primitives/Base.tokens.json` | Сырая палитра `gray/100–900`, `orange/100–900`, `blue/100–900` |
| **Semantic** | `docs/tokens/semantic/Base.tokens.json` | Алиасы `light/*` и `dark/*` → Primitives |
| **Mapped** | `docs/tokens/mapped/Light.tokens.json`, `Dark.tokens.json` | Режимные токены UI: `surface/*`, `text/*`, `icon/*`, `border/*`, `accent/*` |
| **Type scale** | `docs/tokens/type/mode-1.tokens.json` | `size/*` и `line-height/*` (Apple HIG–ориентир) |

**Правила применения:**

1. **MUST:** в компонентах использовать только **Mapped**-имена (`surface/page`, `text/primary`, …), не сырые `gray/800`.
2. **MUST:** тема = переключение режима Mapped Light ↔ Dark (CSS `:root` / `[data-theme="dark"]` или аналог).
3. **MUST NOT:** хардкодить hex в компонентах; primitives — только для генерации/документации токенов.
4. Semantic — промежуточный слой алиасов; runtime опирается на Mapped.

### 4.1 Темы

- **MUST:** light и dark через Mapped variables.
- Переключение — UI в `Button Bar`; `prefers-color-scheme` — **SHOULD**.
- Dark-макеты в Figma — визуальная сверка; числовые значения — из Mapped Dark.

### 4.2 Mapped: цвета Light / Dark

CSS: `--surface-page` или `--surface/page` — единый стиль в проекте; ниже — канонические имена Figma.

| Token | Light | Dark | Назначение |
|---|---|---|---|
| `surface/page` | `#F7F7F4` | `#26251E` | Фон страницы |
| `surface/card` | `#F2F1ED` | `#323232` | Фон карточки |
| `surface/control` | `#E6E5E0` | `#323232` | Фон кнопки Fill |
| `surface/points` | `#D9D9D9` | `#323232` | Точки timeline / points |
| `surface/inverse` | `#323232` | `#F7F7F4` | Инверсия (теги) |
| `text/primary` | `#323232` | `#F7F7F4` | Основной текст |
| `text/secondary` | `#757575` | `#D9D9D9` | Вторичный |
| `text/muted` | `#B3B3B3` | `#757575` | Даты / приглушённый |
| `text/on-inverse` | `#F7F7F4` | `#26251E` | Текст на inverse |
| `icon/primary` | `#323232` | `#F2F1ED` | Иконки |
| `icon/secondary` | `#757575` | `#D9D9D9` | Иконки secondary |
| `icon/muted` | `#D9D9D9` | `#757575` | Иконки muted |
| `border/subtle` | `#EAEAEA` | `#757575` | Обводка карточки |
| `border/default` | `#D9D9D9` | `#757575` | Обводка icon-кнопки |
| `accent/primary` | `#F08A24` | `#F7AA55` | Акцент |
| `accent/primary-hover` | `#D87216` | `#FFC98F` | Акцент hover |
| `accent/information` | `#1968E5` | `#79AAFA` | Инфо-акцент |

### 4.3 Primitives (палитра)

Использовать только при сборке токенов / документации, не в UI напрямую.

**gray:** 100 `#F7F7F4` · 200 `#F2F1ED` · 300 `#EAEAEA` · 400 `#E6E5E0` · 500 `#D9D9D9` · 600 `#B3B3B3` · 700 `#757575` · 800 `#323232` · 900 `#26251E`

**orange:** 100 `#FFF4E8` · 200 `#FFE4C7` · 300 `#FFC98F` · 400 `#F7AA55` · 500 `#F08A24` · 600 `#D87216` · 700 `#B85A0D` · 800 `#8E4208` · 900 `#633005`

**blue:** 100 `#EDF4FF` · 200 `#D9E8FF` · 300 `#B9D4FF` · 400 `#79AAFA` · 500 `#1968E5` · 600 `#1558C2` · 700 `#10479F` · 800 `#0B357A` · 900 `#082653`

**Semantic alias (кратко):** Light page→gray/100, card→200, control→400, points→500, inverse→800; Dark page→gray/900, card/control/points→800, inverse→100. Accent light: primary→orange/500, hover→600, information→blue/500. Accent dark: primary→orange/400, hover→300, information→blue/400.

### 4.4 Type scale (text styles / variables)

Источник: `docs/tokens/type/mode-1.tokens.json` + UI Kit «Type scale».  
Семейства из компонентов Figma: **Vollkorn** (заголовки/display), **Ubuntu Sans** (UI/body).

| Token | size (px) | line-height (px) | ratio | Типичное применение |
|---|---|---|---|---|
| `largeTitle` | 34 | 40 | 1.15 | Крупный display (если есть) |
| `title1` | 28 | 32 | 1.2 | Заголовок кейса / hero |
| `title2` | 22 | 28 | 1.3 | Секции |
| `title3` | 20 | 24 | 1.35 | Название компании/проекта на карточке (Vollkorn) |
| `body` | 17 | 24 | 1.42 | Role, основной текст |
| `subheadline` | 15 | 20 | 1.47 | Description на карточке, button label Default |
| `footnote` | 13 | 16 | 1.53 | Вспомогательный |
| `caption1` | 12 | 16 | 1.57 | Даты, теги |
| `caption2` | 11 | 16 | 1.6 | Мелкие подписи |

**Правила text styles:**

1. **MUST:** размер и line-height только из `size/*` и `line-height/*` с одинаковым именем токена.
2. **MUST:** letter-spacing по умолчанию `0` (как в design context).
3. **MUST NOT:** подменять Vollkorn / Ubuntu Sans на Inter / Roboto / system без согласия.
4. **SHOULD:** завести CSS-классы или utility 1:1 с токенами (`text-title3`, `text-body`, …).

### 4.5 Motion (уровень правил)

- Reveal карточек: opacity + лёгкий translate; без bounce-спама.
- Hover/Pressed кнопок — variants Figma.
- **Bloub lifecycle** — обязательно по §5.1 (не декоративный «вечный» blob).
- Morph bloub↔dot (реализовано): 600ms `cubic-bezier(0.22, 1, 0.36, 1)`; bloub 44px сжимается в точку **8px** и переезжает к первому Point Container; подсказка «начинай скроллить» + стрелка гаснут за 300ms. Travel-точка 8px едет на конце оранжевой линии прогресса. Обратим: у верха страницы bloub возвращается в header.

---

## 5. Взаимодействие и анимация

### 5.1 Scroll reveal + lifecycle `bloub`

Состояния маркера на timeline:

| Фаза | Когда | Визуал маркера |
|---|---|---|
| **A. Idle (вход)** | Пользователь только зашёл, скролла ещё не было | `bloub` **анимированный** в Header RoadMap (вместе с «начинай скроллить») |
| **B. Travel** | Пользователь начал скроллить, ещё не у активной карточки | `bloub` **сжимается в точку 8px** и «ездит» по `decor/connector` на конце линии прогресса к следующей точке |
| **C. Arrive** | Viewport / progress дошёл до работы или проекта | `decor/timeline-dot` **снова превращается** в `bloub` у этой точки; карточка → Active |
| **D. Leave → next** | Уход с точки к следующей | Снова morph в `timeline-dot` до следующего Arrive |

Дополнительно:

1. Карточки: load → `Default` (skeleton); на Arrive соответствующего ряда → `Active (Work)` / `Active (Project)`.
2. У **каждой** карточки (company/project) может быть **свой bloub со своей эмоцией**, настраиваемый **через БД** (`bloubEmotion` / asset id) — см. §8.
3. Если у карточки эмоция не задана — fallback-дефолт из дизайн-системы / сида.
4. Hint «начинай скроллить» скрывается или ослабевает после первого scroll (**SHOULD**).
5. Figma frames `Home` → `Start Scrolling` → `Continue Scrolling` → `Home Full Page` — референс прогрессии, не отдельные URL.
6. Цвет `decor/timeline-dot` следует **текущей** позиции скролла: пройденные точки — accent, при обратном скролле снова `surface/points`. Reveal карточек при этом не откатывается.
7. **Размер `decor/timeline-dot` зависит от типа карточки** (контейнер 24×24 неизменен): у **компании / работы — 20px**, у **проекта — 10px**. Точки header/footer roadmap — 20px.
8. `decor/connector` — пунктир 1px: **dash 8px / gap 8px**, цвет `border/default`. Travel-точка (8px, accent) имеет мягкую accent-подсветку (box-shadow из `accent/primary` через color-mix).

**MUST:** реализовать morph A→B→C→D; не оставлять вечный animated bloub после начала скролла.  
**MUST:** при `prefers-reduced-motion` — без непрерывной анимации idle-bloub; morph можно заменить кроссфейдом/мгновенной сменой.

### 5.2 Навигация

- Клик по **Active (Project)** → `/projects/[slug]`.
- Клик по компании: <!-- TODO:user --> раскрытие / внешняя ссылка / ничего.
- `BTNs` — внешние URL.
- `Button Bar`: theme + mute.

### 5.3 Reduced motion

- **MUST:** при `prefers-reduced-motion: reduce` — без translate/параллакса idle-loop; reveal opacity-only или мгновенный; mute доступен.

### 5.4 Фокус и клавиатура

- Кнопки и кликабельные карточки — focus-visible.
- Порядок таба: intro → roadmap cards → contact → Button Bar.

---

## 6. Звук

### 6.1 Когда играет

- **MUST:** звук только по **жесту пользователя** (press/click блока или кнопки).
- **MUST NOT:** автоплей при load, scroll, hover-only.
- Триггеры MVP: Button press, Card press, theme toggle, mute toggle.  
  Reveal / morph bloub — **без** звука по умолчанию.

### 6.2 Mute / toggle

- **MUST:** явный mute в `Button Bar`.
- Mute **SHOULD** в `localStorage`.
- Default mute: <!-- TODO:user --> (рекомендация MVP: звук **включён**, пока пользователь не выключит).

### 6.3 Ассеты (решение владельца)

- **На сейчас:** подключаем **тестовые стоковые** звуки (короткие UI clicks/taps с ясной лицензией royalty-free / CC0).
- Агент **MAY** положить сток в `public/sounds/` (или аналог) с указанием источника в README/коммите.
- Позже сток заменяется финальными ассетами владельца без смены API триггеров.
- Разные файлы для Button / Card / Theme — **SHOULD**, если сток позволяет; иначе один click на все press.

---

## 7. Компоненты и variants

### 7.1 Карта Figma → код

| Figma | Variants | Имя в коде |
|---|---|---|
| `Button` | State: Default / Hover / Pressed; Mode: Fill / Only Icon | `Button` |
| `Cards` | Default / Active (Work) / Active (Project) | `RoadmapCard` |
| `bloub` | emotion из БД; states: idle / travel-as-dot / arrived | `Bloub` + `TimelineMarker` |
| `decor/timeline-dot` | travel/rest; size: work 20px / project 10px | `TimelineDot` (часть маркера) |
| `BTNs` | группа Fill | `ButtonGroup` |
| `Button Bar` | 2× Only Icon | `FloatingControls` |
| `card/introduction` | — | `IntroCard` |
| `card/telegram` + `card/contact` | — | `ContactCard` |
| `RoadMap` / Header|Footer | — | `Roadmap*` |
| `Text Block` | — | `CaseTextBlock` |

### 7.2 Cards — поля

**Default:** skeleton.  
**Active (Work):** logo, date, title, role, description, **bloubEmotion**.  
**Active (Project):** logo, date, title, tags, description, **bloubEmotion**, link → project page.

### 7.3 Button

- Fill: label ± iconLeft; `surface/control`; radius ~20px.
- Only Icon: 56×56; `border/default`; иконка 24px `icon/primary`, на hover — `accent/primary`.
- Label: Ubuntu Sans / `subheadline` (Default/Pressed), `body` на Hover (по макету).

### 7.4 Naming

- PascalCase по роли; токены = Figma path; данные из БД §8.

---

## 8. Контент и данные

### 8.1 Владение и БД

- Весь персональный контент заполняет **владелец**.
- **MUST:** есть **БД**, через которую владелец наполняет как минимум **проекты** (и связанные сущности: компании, секции кейса, эмоции bloub, медиа).
- UI заполнения: админка `/admin`, Studio (Prisma/Sanity/и т.п.) или SQL UI — выбрать со стеком (§9 / §11). Главное: владелец может CRUD без правки кода.
- Figma-демо (PEYRO, sberbank-слот и т.п.) — не прод, пока не подтверждены и не записаны в БД.

### 8.2 Структура: Company

```ts
type Company = {
  id: string;
  name: string;
  role: string;
  dateLabel: string;
  description: string;
  logoSrc: string;
  url?: string;
  order: number;
  bloubEmotion: string; // id эмоции / asset key для bloub этой карточки
  published: boolean;
};
```

### 8.3 Структура: Project

```ts
type Project = {
  id: string;
  slug: string;
  title: string;
  dateLabel: string;
  description: string;
  tags: string[];
  logoSrc: string;
  order: number;
  bloubEmotion: string;
  summary: string;
  heroImage: string;
  sections: Array<{
    heading: string;
    body: string;
    imageSrc?: string;
    sortOrder: number;
  }>;
  published: boolean;
};
```

### 8.4 Bloub emotions (справочник в БД)

```ts
type BloubEmotion = {
  id: string;          // ключ, напр. "wave" | "focus"
  label: string;       // для админки
  assetSrc: string;    // svg/lottie/webp
  idleAnimation?: string; // ключ анимации idle
};
```

### 8.5 Site meta

```ts
type SiteContent = {
  intro: {
    headline: string;
    bio: string;
    avatarSrc: string;
    links: Array<{ label: string; href: string; icon?: string }>;
  };
  contact: {
    headline: string;
    subline: string;
    links: Array<{ label: string; href: string }>;
  };
};
```

Intro/contact могут жить в БД (таблица `settings`) или в сидах — **SHOULD** тоже в БД для единообразия.

### 8.6 Что заполнить владельцем (через БД)

- [ ] Intro / contact / ссылки  
- [ ] Компании + лого + `bloubEmotion`  
- [ ] Проекты + slug + секции + изображения + `bloubEmotion`  
- [ ] Справочник эмоций bloub  
- [ ] Favicon / OG  

---

## 9. Технические ограничения

### 9.1 Стек

**Фреймворк не зафиксирован** владельцем.

> Нужно уточнить: Next.js / иное? Какая БД (Postgres / SQLite / hosted)? ORM? Хостинг?

**MUST:** стек включает **персистентную БД** и путь наполнения контента владельцем.  
До выбора конкретного продукта агент **MUST NOT** лочить стек «навсегда», но **MUST** заложить слой данных под схемы §8 (не только статический JSON как единственный источник правды).

### 9.2 Обязательные требования

- **a11y:** семантика, контраст Light/Dark, focus, reduced-motion, aria на icon-кнопках.
- **performance:** lazy images; звук без автоplay; LCP — intro.
- **responsive:** desktop 1440 — Figma; mobile — roadmap читаем. Точный mobile: <!-- TODO:user / Figma -->.
- **i18n:** сейчас RU (+ EN в CTA макета). Язык: <!-- TODO:user -->.

### 9.3 Секреты и данные

- **MUST:** credentials БД только в env; сиды для local/dev.
- Auth админки — минимально необходимая (защита `/admin`), не публичный login для посетителей сайта.
- **MUST NOT** требовать аккаунт у посетителя портфолио.

---

## 10. Правила для агента (MUST / MUST NOT)

### MUST

1. Следовать Figma + `docs/tokens/` + этому SDD.
2. Roadmap: компании слева, проекты справа, reveal по скроллу.
3. Реализовать lifecycle bloub: idle animated → timeline-dot при скролле → bloub на точке карточки; эмоции из БД.
4. Темы только через Mapped Light/Dark variables.
5. Type scale только из `size/*` + `line-height/*`.
6. Звук — по gesture; mute; на MVP — стоковые тестовые SFX.
7. Предусмотреть БД и CRUD для проектов (и связанных сущностей).
8. `prefers-reduced-motion`.
9. Variants `Cards` / `Button` как контракт.
10. Не выдумывать био/названия; UI-копия без lorem.

### MUST NOT

1. Выдумывать имена компаний, проекты, био, даты.
2. Автопроигрывать звук при load/scroll.
3. Хардкодить цвета / font-size в обход токенов.
4. Заменять Vollkorn / Ubuntu Sans без согласия.
5. Игнорировать morph bloub↔dot.
6. Делать контент только захардкоженным JSON без пути записи в БД (сиды OK для bootstrap).
7. Копировать демо Figma в прод без подтверждения.
8. Лочить фреймворк до решения §11 — но не отменять требование БД.

### SHOULD

1. Theme + mute в `localStorage`.
2. Prefetch кейса при hover на project-card.
3. Разные сток-звуки для Button / Card, если доступны.
4. Документировать источник сток-SFX.

---

## 11. Открытые решения

| # | Решение | Зачем | Где |
|---|---|---|---|
| 1 | Выбор стека + конкретной БД + админки | Реализация §8–§9 | §9.1 |
| 2 | Утвердить контент intro/companies/projects в БД | Прод-данные | §8 |
| 3 | Набор эмоций bloub (ассеты + ключи) | Маркер timeline | §5.1, §8.4 |
| 4 | ~~Easing/ms morph bloub↔dot~~ — закрыто, см. §4.5 | Полировка | §4.5 |
| 5 | Клик по company-карточке | UX | §5.2 |
| 6 | Назначение кнопок Button Bar (подтвердить theme/mute) | UI | §5.2 |
| 7 | Default mute on/off | Звук | §6.2 |
| 8 | Финальная замена сток-SFX | Прод-аудио | §6.3 |
| 9 | Mobile-макет roadmap | Responsive | §9.2 |
| 10 | Язык(и) сайта | i18n | §9.2 |
| 11 | URL соцкнопок | Intro/Contact | §8.5 |
| 12 | Подтвердить/отклонить демо из Figma | Контент | §8.1 |

**Закрыто этим обновлением:** dark Mapped tokens; полная type scale; БД в scope; bloub lifecycle; сток-звуки разрешены для MVP.

**Происхождение токенов:** загруженные владельцем `Mapped` / `Primitives` / `Semantic` / `Type scale` → скопированы в `docs/tokens/`.

---

## 12. Глоссарий

| Термин | Значение |
|---|---|
| **Roadmap** | Timeline с карточками по сторонам |
| **Company / Work** | Опыт; слева; `Active (Work)` |
| **Project / Case** | Кейс; справа; `Active (Project)` + URL |
| **bloub** | Анимированный маркер/эмодзи-blob на timeline |
| **decor/timeline-dot** | Компактная точка на линии во время «путешествия» bloub |
| **Bloub lifecycle** | Idle animated → dot при скролле → bloub на карточке |
| **Mapped tokens** | Режимные UI-токены Light/Dark |
| **Primitives** | Сырая палитра gray/orange/blue |
| **Reveal** | Default → Active при Arrive |
| **Button Bar** | Плавающие контролы theme / mute |
| **SDD** | Этот документ |
| **Mute** | Отключение SFX |

---

*Обновлено: БД, lifecycle bloub, полный разбор Variables/Type scale, стоковые звуки для MVP.*
