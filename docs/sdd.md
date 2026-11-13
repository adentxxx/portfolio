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
- звук: клик и смена темы. Точка таймлайна без звука;
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
| Light/dark через Mapped tokens | — |
| Звук: click, тема | Кнопка mute (убрана в Iteration 2) |
| Меню языка: «Русский» выбран, «English» отключён | Перевод сайта на английский |
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
| Публичная сборка сайта | [adentxxx/adentxxx.github.io](https://github.com/adentxxx/adentxxx.github.io) | 1 (деплой) |

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

**Правило раскладки (desktop):**

- **Слева** → компании (опыт работы).
- **Справа** → проекты (кейсы).
- Карточки изначально `Cards` State=`Default`, при reveal → `Active (Work)` / `Active (Project)`.
- **Сверху вниз** — по дате, более новые выше. Место работы — по концу периода; «по настоящее время» — текущий месяц, и оно выше проекта с тем же месяцем. Проект — по дате создания. Год без месяца — начало этого года. Одинаковая дата — по `order`. В админке место работы можно перетащить: `manualRank` держит его на новом месте, пока период снова не изменят.

**Mobile и tablet** (`< 1160px`, макеты `161:559` и `TABLET Home Full Page` `170:1068`):

- Подписей «опыт работы» и «кейсы» нет. Стрелка под «начинай скроллить» только на desktop.
- Карточки компаний и проектов в одну колонку, все по **левому** краю, ширина до **440**. Блок «линия + карточки» по центру экрана. `decor/connector` — вертикальный пунктир слева от карточек.
- Широкий экран (`≥ 1160`): roadmap по центру, колонка до **1160**. Карточка не шире **440**: работа прижата к центру слева, кейс — справа.
- Стартовый bloub и конечная точка остаются по центру. Верхний и нижний connector изогнуты в двух местах, каждый поворот — дуга радиусом **56**. Пунктир dash 8 / gap 8.

**Скролл на mobile и tablet** (`< 1160px`):

1. **До первого скролла.** Верхний connector и вертикальная полоса `decor/connector` рядом с карточками — только пунктир. Accent заливается **по скроллу**: голова заливки совпадает с travel-точкой (trigger 48%), а не с низом viewport. `decor/timeline-dot` остаётся `surface/points`, пока центр точки не пересёк этот trigger. Стартовый bloub остаётся в Header в фазе Idle («начинай скроллить»).
2. **Жест скролла.** Стартовый bloub сжимается и перетекает в `decor/timeline-dot` в **начале** верхнего connector (под bloub, до первого изгиба) — не сразу к точке карточки.
3. **Дальше как на desktop.** Travel-точка едет по connector. Когда она доходит до `decor/timeline-dot` карточки (центр точки пересёк trigger 48% viewport), на этом месте появляется bloub с эмоцией карточки; карточка → Active. Нижний connector доливается так же и доезжает до конечной точки.

### 3.3 Блоки Home (сверху вниз)

1. `card/introduction` — аватар, приветствие, bio, `BTNs`.
2. `RoadMap` — timeline + карточки + bloub.
3. `card/telegram` / `card/contact` — CTA + кнопки.
4. `Button Bar` — язык / тема (§7.5).

### 3.4 Блоки Project Full Page

Колонка контента **1160** (на холсте 1440 — поля по 140). Между блоками **40px**.

1. `Header` — аватар **80**, radius 32, inset-тень; ссылка на `/`. Справа `BTNs` Fill, gap 12 (ссылки intro из БД).
2. `Title` по центру. От `768`: название `largeTitle`, описание `body` / `text/secondary` — те же ступени, что заголовок и подзаголовок главной. Ниже `768` (макет `MOB Project Full Page` `209:1156`): название `title1`, описание `subheadline`, как на главной в телефонной ширине. Теги как на карточке: от `768` `caption1`, padding 8×4; ниже `768` `caption2` medium, padding 6×2, radius 8.
3. `Image` на всю колонку, пропорция 1160×500, radius **24**, фон `surface/control`. Видео — тот же слот колонки: ширина 100%, radius **24**, фон `surface/control`, своя пропорция кадра (без обрезки). По умолчанию нативные controls, без автоплея и без предзагрузки всего файла (`preload="metadata"`). В админке у ролика: автовоспроизведение, без звука, зациклить, обложка и скрытие панели управления. Обложка — картинка до старта; пока она задана и ролик сам не играет, файл видео не качается (`preload="none"`). Без панели нет времени, полосы и настроек: запуск и пауза по нажатию на кадр. Автовоспроизведение только без звука — звук при загрузке страницы не стартует (§10). При `prefers-reduced-motion` автовоспроизведение не включается. Файл: mp4, webm или mov, до 80 МБ. В `heroImage` попадает только первая фотография.
4. `Text Container` — колонка **800** по центру. Перед заголовком **40**. `Text Block`: заголовок `title2` (Vollkorn 22/28), подзаголовок `title3` (Vollkorn 18/20), текст `subheadline` / `text/secondary`, gap 12, между подзаголовком и текстом **4**, перед подзаголовком **24**. Ниже `768`: те же ступени, gap внутри блока **4**, перед подзаголовком **24**. Картинка секции идёт после её текста.
5. Навигация по кейсам — liquid glass (Iteration 2, макеты `412:15969` и `412:15833`): три круглые стеклянные кнопки **64×64**, gap **12** — «предыдущий кейс», «на главную», «следующий кейс»; иконки `left`, `home`, `right` из `public/icons/`. Стекло и нажатие — как у `Button Bar` (§7.5). Если соседнего кейса нет, кнопка отключена, иконка приглушена. **От `768`:** кнопки зафиксированы по центру внизу, отступ от края **40**; `Button Bar` — тот же, что на главной. **Ниже `768`:** одна строка у нижнего края, `px 12`, `pb 12`: слева три кнопки навигации, справа кнопка настроек. Пустая зона панели не перехватывает нажатия.

**Проект под NDA** (макет `44:4669`, флаг `Project.nda` в админке). Карточка на roadmap не меняется. Страница кейса:

- шапка, название и текст под заголовком — как у обычного кейса; теги не показываются;
- одна фотография — `heroImage`;
- колонка **800**: заголовок `title3` из `ndaTitle` (пустой не показывается), ниже `ndaText` (`subheadline` / `text/secondary`), gap **12**; затем кнопки из блока «Обратная связь», Fill, делят ширину колонки, gap **12**, отступ сверху **32**. Наведение увеличивает их примерно на те же пиксели, что узкие кнопки шапки, а не на 9%;
- остальные секции на странице не показываются и остаются в БД;
- навигация между кейсами и `Button Bar` — как у обычной страницы;
- страницы нет в sitemap, в метаданных `noindex` (`follow` остаётся). В `robots.txt` её не закрывать: иначе краулер не увидит `noindex`.

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
- **MUST:** пока пользователь сам не выбрал тему в `Button Bar`, страница совпадает с системой (`prefers-color-scheme`), в том числе если тема устройства меняется. Ручной выбор сохраняется и имеет приоритет.
- Переключение — свитчер темы в `Button Bar` (§7.5): луна — тёмная, солнце — светлая, ползунок стоит на включённой.
- Клик по выключенной половине свитчера раскрывает новую тему кругом от её центра на весь экран (View Transition, ~700ms). При `prefers-reduced-motion` — мгновенно, без круга.
- **MUST:** нажатие во время круга срабатывает сразу: текущий круг обрывается, следующий стартует с новой половины. Нажатия не теряются и не ждут конца анимации; итог — тема последней нажатой половины.
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
| `surface/overlay` | `#F7F7F41F` | `#26251E73` | Фон Only Icon (light alpha 1F ~12%, dark alpha 73 ~45%, blur 12) |
| `surface/overlay dark` | `#26251E33` | `#26251E73` | Оверлей модалки места работы (gray/900: light 20%, dark 45%), background blur 20 |
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
| `title2` | 22 | 28 | 1.3 | Секции; название карточки от `768` |
| `title3` | 18 | 20 | 1.11 | Название карточки ниже `768`; роль на карточке места работы от `768` (Vollkorn) |
| `title4` | 15 | 20 | 1.33 | Роль на карточке места работы ниже `768` (Vollkorn) |
| `body` | 17 | 24 | 1.42 | Основной текст |
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

- Reveal карточек: содержимое по очереди выезжает снизу с opacity + blur, рамка неподвижна (§5.1, п. 1); без scale и bounce.
- **Появление при загрузке страницы** (`src/lib/enter.ts`, стили `enter-*` в `globals.css`). Элементы первого экрана входят по очереди с шагом **80ms**, каждый за **700ms**, `cubic-bezier(0.22, 1, 0.36, 1)`:
  - `rise` — мелкие элементы (аватар, заголовок, текст, кнопки, теги): вверх на **16px**, `opacity 0 → 1`, `blur 6px → 0`;
  - `lift` — крупные блоки (фото и видео кейса): вверх на **20px** и `opacity`, без blur;
  - `pop` — стекло (`Button Bar`, навигация кейса): вырастает из нуля (`scale 0 → 1`, 620ms, с лёгким перелётом), без `opacity` и `filter`. **MUST NOT:** анимировать `opacity` или `filter` на стекле или его родителе — на время анимации `backdrop-filter` отключается, и стекло потом появляется рывком. По той же причине меню настроек на телефоне открывается и закрывается только через `scale`.
  - `fade` — только `opacity`. Так входит весь `RoadMap`: его линии и точки измеряются при монтировании, сдвиг исказил бы геометрию.
  - Главная: аватар → заголовок → описание → кнопки → `RoadMap` → `Button Bar`. Кейс: шапка → название → описание → теги → первые два блока → навигация и `Button Bar`. 404: цифры с лицом → кнопка.
  - **MUST:** анимация на чистом CSS, стартует с первой отрисовкой и не ждёт скриптов. Анимируются только `opacity`, `transform` и `filter`; blur — только на мелких элементах. После окончания на элементе не остаётся ни одного из трёх свойств. Блоки ниже первого экрана при загрузке не анимируются.
  - При `prefers-reduced-motion` всё показано сразу.
- Hover/Pressed кнопок — variants Figma.
- **Bloub lifecycle** — обязательно по §5.1 (не декоративный «вечный» blob).
- Morph bloub↔dot (реализовано): 220ms `cubic-bezier(0.22, 1, 0.36, 1)`; bloub 44px сжимается в точку **4px** и переезжает к первому Point Container; подсказка «начинай скроллить» + стрелка гаснут за 300ms. Travel-точка **4px** (без обводки, только свечение) едет на конце оранжевой линии прогресса. Обратим: у верха страницы bloub возвращается в header. Arrive и уход: bloub появляется из `decor/timeline-dot` и исчезает обратно за **200ms** `ease-in-out` (scale от диаметра точки — 20px у работы и footer, 10px у проекта — до 44px, opacity кроссфейдом с точкой) и **держится** на ней до следующей точки (§5.1).
- **Производительность скролла (MUST):** линия прогресса и travel-точка двигаются только через `transform` (`scaleY` / `translateY`), записываемый в DOM напрямую из rAF-цикла с догоняющим сглаживанием (τ ≈ 70ms), — без React-state на кадр и без transition на `height`/`top`. Невидимые bloub'ы (header после morph) ставят свой rAF-цикл на паузу.

---

## 5. Взаимодействие и анимация

### 5.1 Scroll reveal + lifecycle `bloub`

Состояния маркера на timeline:

| Фаза | Когда | Визуал маркера |
|---|---|---|
| **A. Idle (вход)** | Пользователь только зашёл, скролла ещё не было | `bloub` **анимированный** в Header RoadMap (вместе с «начинай скроллить»). Цикл: attentive 5s → shy 5s → scared 5s → sleep 2.5s. Первые три — лица на `idle` (`attentif` / `timide` / `effraye`); sleep — состояние `sleep`, маленькая прыгающая точка без глаз |
| **B. Travel** | Пользователь начал скроллить (morph 220ms) | header-`bloub` **сжимается в точку 4px**. Desktop: переезжает к первому Point Container. Mobile/tablet: перетекает в `decor/timeline-dot` в **начале** верхнего connector (§3.2). Дальше travel-точка 4px «ездит» по `decor/connector` |
| **C. Arrive** | Desktop: morph завершён → bloub на первой точке. Mobile: travel-точка доехала до точки карточки. Далее — каждая точка, центр которой пересёк trigger-линию (48% viewport) | `decor/timeline-dot` **превращается** в `bloub` с эмоцией этой карточки; карточка → Active. **Bloub остаётся на точке**, пока пользователь не дойдёт до следующей (не исчезает при продолжении скролла) |
| **D. Next point** | Следующая точка пересекла trigger-линию | Bloub переезжает на новую точку (новая эмоция), предыдущая точка снова `timeline-dot` (accent). При обратном скролле — назад к предыдущей точке |
| **E. Finish** | Низ страницы / footer-точка roadmap у блока контактов | Footer-`decor/timeline-dot` тоже становится `bloub` с анимацией `wide` (круг, широко открытые глаза); линия прогресса доходит до неё. Если trigger 48% не достаёт до footer к концу страницы, хвост connector (на mobile — нижняя дуга) заливается плавно на оставшемся скролле от последней карточки, без скачка точки и bloub |

Дополнительно:

1. Карточки: load → `Default` (skeleton); на Arrive соответствующего ряда → `Active (Work)` / `Active (Project)` без движения рамки: карточка не сдвигается и не масштабируется. Skeleton-плашки гаснут за **320ms** (`card-plates-out`), а содержимое выезжает снизу по очереди: логотип, дата, название, роль или теги (каждый тег отдельно), описание. Каждый элемент поднимается на **14px**, проявляется (`opacity 0 → 1`) и выходит из размытия (`blur 6px → 0`) за **560ms**, `cubic-bezier(0.22, 1, 0.36, 1)` (`card-rise-in`); шаг очереди — **70ms**, между тегами — около **40ms**. **MUST:** анимируются только `opacity`, `transform` и `filter` на самих элементах содержимого, не на рамке; без изменения размеров и без blur больше 8px. После анимации `filter` и `transform` на элементах не остаются, лишние слои не держатся. При `prefers-reduced-motion` содержимое появляется сразу.
2. У **каждой** карточки свой bloub. И компания, и проект хранят форму, выражение и анимацию отдельно (`bloubShape`, `bloubExpression`, `bloubState`) и настраиваются в админке — см. §8. `bloubEmotion` остаётся устаревшим FK справочника: таймлайн его не читает.
3. Если у карточки эмоция не задана — fallback-дефолт из дизайн-системы / сида.
4. Hint «начинай скроллить» скрывается или ослабевает после первого scroll (**SHOULD**).
5. Figma frames `Home` → `Start Scrolling` → `Continue Scrolling` → `Home Full Page` — референс прогрессии, не отдельные URL.
6. Цвет `decor/timeline-dot` следует **текущей** позиции скролла: точка `surface/points`, пока её центр не пересёк trigger 48%; пройденные — accent, при обратном скролле снова `surface/points`. Reveal карточек при этом не откатывается. На mobile/tablet вертикальный `decor/connector` заливается тем же ходом скролла, что и travel-точка (до trigger 48%), и не залит заранее только потому, что карточка уже в viewport. Bloub на точке — только после Arrive по этому trigger.
7. **Размер `decor/timeline-dot` зависит от типа карточки** (контейнер 24×24 неизменен): у **компании / работы — 20px**, у **проекта — 10px**. Точки header/footer roadmap — 20px.
8. `decor/connector` — пунктир 1px: **dash 8px / gap 8px**, цвет `border/default`. Travel-точка — **4px**, accent, **без обводки**, только мягкое свечение (box-shadow blur из `accent/primary` через color-mix, без spread-кольца).
9. **Headline intro-карточки — «печатная машинка»**: фразы берутся из `SiteSettings.introHeadline` (одна фраза на строку; редактируется в `/admin`), сменяются **каждые 7 секунд** (стирание → набор), каретка `accent/primary`. SSR отдаёт первую фразу целиком; при `prefers-reduced-motion` — мгновенная смена без посимвольного набора. Полная фраза дублируется для screen reader (`sr-only`).

**MUST:** реализовать morph A→B→C→D→E; не оставлять вечный animated bloub после начала скролла.  
**MUST:** при `prefers-reduced-motion` — без непрерывной анимации idle-bloub; morph можно заменить кроссфейдом/мгновенной сменой.

### 5.2 Навигация

- Клик по **Active (Project)** → `/projects/[slug]`.
- Клик по **Active (Work)** открывает модалку места работы (Figma `236:935` desktop, `237:1175` mobile). Шапка: логотип, дата, название. Первый текстовый блок — роль и описание карточки, дальше `Company.blocks` (заголовок `title3`, подзаголовок `body`, абзац `subheadline` / `text/secondary`). Окно до **880**, поля страницы **20**, radius **48**. Ниже `768`: padding **32**, логотип **52**, название `title2`, дата `caption2`. От `768`: padding **40**, логотип **72**, название `title1`, дата `caption1`. Кнопка «закрыть» — Accent, над правым краем окна, зазор **24**. Оверлей на весь экран: `surface/overlay dark`, background blur **20**. Закрытие: кнопка, клик по оверлею, Escape. Открытие и закрытие — морф из прямоугольника карточки (позиция, размер, радиус, отступы, логотип и кегль названия) около 600ms, ease-out без отскока; оверлей проявляется вместе с ним. При `prefers-reduced-motion` окно появляется и исчезает сразу. Карточка в State=`Default` не открывает окно.
- `BTNs` — внешние URL.
- `Button Bar`: язык + тема, см. §7.5.

### 5.3 Reduced motion

- **MUST:** при `prefers-reduced-motion: reduce` — без translate/параллакса idle-loop; reveal opacity-only или мгновенный.

### 5.4 Фокус и клавиатура

- Кнопки и кликабельные карточки — focus-visible.
- Порядок таба: intro → roadmap cards → contact → Button Bar.

---

## 6. Звук

### 6.1 Когда играет

Решение владельца по файлам из `public/sounds/`:

- **MUST:** смена темы — `drop_004`. Нажатие на уже включённую половину свитчера без звука.
- **MUST NOT:** звук, когда точка таймлайна доходит до карточки. Браузер не пускает его до клика или клавиши, поэтому триггера нет.
- **MUST:** клик по кнопке (кроме темы), по карточке и по пустому месту — `click`. Поля ввода текста без звука. Disabled-кнопка звук не запускает.
- **MUST NOT:** автоплей при load, hover-only, фоновая музыка.
- Reveal / morph bloub сам по себе без звука.

### 6.2 Mute / toggle

Решение владельца (Iteration 2, макет `405:13070`): кнопки mute в `Button Bar` нет. Звук на сайте включён всегда. Значение `portfolio-muted`, сохранённое старой кнопкой, при загрузке стирается, чтобы сайт не остался без звука.

### 6.3 Ассеты (решение владельца)

- Файлы владельца в `public/sounds/`: `click.mp3`, `drop_004.ogg`. `switch_005.ogg` и `select_008.ogg` не используются.
- Замена файла без смены триггера из §6.1 допустима.

---

## 7. Компоненты и variants

### 7.1 Карта Figma → код

| Figma | Variants | Имя в коде |
|---|---|---|
| `Button` | State: Default / Hover / Pressed; Mode: Fill / Only Icon / Accent | `Button` |
| `Cards` | Default / Active (Work) / Active (Project) | `RoadmapCard` |
| `bloub` | emotion из БД; states: idle / travel-as-dot / arrived | `Bloub` → `BloubBot` (SVG-рендер движка `src/lib/bloub-engine`) |
| `decor/timeline-dot` | travel/rest; size: work 20px / project 10px | `TimelineDot` (часть маркера) |
| `BTNs` | группа Fill | `ButtonGroup` |
| `Button Bar` | Liquid glass: язык + свитчер темы; телефон — кнопка настроек и меню | `FloatingControls` |
| `card/introduction` | — | `IntroCard` |
| `card/telegram` + `card/contact` | — | `ContactCard` |
| `RoadMap` / Header|Footer | — | `Roadmap*` |
| `Text Block` | — | `CaseTextBlock` |

### 7.2 Cards — поля

**Default:** skeleton.  
**Active (Work):** logo, date, title, role, description, **форма / выражение / анимация bloub**.  
**Active (Project):** logo, date, title, tags, description, **форма / выражение / анимация bloub**, link → project page.  
**Size:** desktop и tablet (`≥ 768`) — `XL`: padding **24**; дата и теги `caption1`; title `title2`; role `title3`; description `subheadline`; тег padding 8×4, radius **8**. Телефон (`< 768`, Figma `Size=L`) — padding **20**; дата и теги `caption2` (medium, как `caption1`); title `title3`; role `title4`; description `footnote`; тег padding 6×2, radius **8**; skeleton-плашки title и role **20** высотой. Лого **52** radius **16** в обоих размерах. Картинка логотипа на всю плашку **52**, рамка `border/subtle`, фон `surface/page` — и у места работы, и у проекта. Карточка radius **32**, gap 16. Skeleton-плашки: дата radius **8** и высота **15**, заголовок и роль radius **12**, описание **16**. На `XL` плашка заголовка **28** (строка `title2`).  
**Заголовок, телефон (`< 768`):** одна строка. Если название не помещается в колонку рядом с логотипом, конец обрезается многоточием. От `768` заголовок переносится целиком.  
**Hover (Active), desktop (`≥ 1160`):** tilt как [Tilted Card](https://reactbits.dev/components/tilted-card) через `motion` — `perspective: 800px`, `rotateX/Y` до ±12°, `scale(1.1)`, пружина stiffness 100 / damping 30 / mass 2. Reveal-анимация двигает только элементы внутри карточки, не слой наклона, поэтому наклон не перебивает. Место в потоке не меняется. При `prefers-reduced-motion` эффекта нет.  
**Press, mobile и tablet (`< 1160`):** tilt нет. Пока кнопка мыши или палец зажаты, карточка `transform: scale(0.95)` (на 5% меньше), `transform-origin: center`, 150ms `ease-out`. Место в потоке не меняется.

### 7.3 Button

- Fill: label ± iconLeft; `surface/control`; radius 20; padding 20×12. Фон на hover не меняется.
- Accent (`244:915`): тот же размер и hover, что у Fill. Фон `surface/inverse`, подпись и иконка `text/on-inverse`. На сайте это «закрыть» в модалке, кнопки сохранения в админке и «На главную» на 404.
- Default и Pressed: label `subheadline`, высота 44. Pressed сбрасывает скейл.
- Hover (Fill и Accent): `transform: scale(1.0909)` — визуально 44→48, как UI Kit `105:62` и `244:936`. Место в потоке не меняется, страница не сдвигается.
- Only Icon: 56×56, radius 20, padding 16; фон `surface/overlay`, `backdrop-blur` 12px, `border/default`. Иконка 24px `icon/primary`, на hover — `accent/primary`. Размер не меняется.

### 7.4 Naming

- PascalCase по роли; токены = Figma path; данные из БД §8.

### 7.5 Button Bar: liquid glass (Iteration 2)

Макеты: desktop `405:13070`, телефон `405:14319` и меню `405:14426`. Иконки — `public/icons/` (`globe`, `moon`, `sun`, `settings`), экспорт из Figma, цвет берут от текста.

**Стекло.** Класс `.glass` в `src/app/globals.css`, цвета — токены `--glass-*` для обеих тем. Фон полупрозрачный, под ним blur 12 и saturate 1.8; тонкое кольцо, боковые блики и тень `0 8 15` — как в макете.

- **MUST:** один `backdrop-filter` на поверхность. Без SVG-фильтров и без анимации радиуса blur.
- **MUST:** движение только через `transform`-свойства (`translate`, `scale`, `rotate`) и `opacity`. Исключение — размер самой кнопки языка, которая вырастает в меню: это один маленький fixed-блок, страница не перекладывается.
- **MUST:** без `backdrop-filter` в браузере и при `prefers-reduced-transparency` поверхность сплошная (`--glass-solid`).

**От `768`.** Колонка в правом нижнем углу, отступ **40**, gap **16**: кнопка языка **64×64**, под ней свитчер темы **64×120**.

**Ниже `768`.** Одна кнопка настроек **64×64**, отступ **12**. По нажатию над ней, с зазором **12**, появляется меню шириной **212**: свитчер темы **212×64**, через **8** — список языков **212×100**, radius **32**. Закрытие: повторное нажатие, нажатие мимо, Escape, выбор языка.

**Свитчер темы.** Padding **6**, gap **4**, две половины по **52** в высоту: луна и солнце. Ползунок — `surface/inverse`, иконка на нём `text/on-inverse`. Ползунок переезжает за 520ms с лёгким перелётом и по дороге вытягивается вдоль движения, как капля. При первой отрисовке он стоит на месте без анимации. **MUST:** положение ползунка и цвета иконок берутся из CSS-токенов темы (`--switch-slot`, `--switch-moon-ink`, `--switch-sun-ink`), а не из состояния React: сервер тему не знает, и иначе при загрузке в тёмной теме ползунок сначала стоял бы на солнце и перескакивал на луну.

**Язык.** На desktop кнопка языка сама вырастает в меню **212×100** (480ms, с перелётом), иконка гаснет, строки выезжают справа по очереди. Строка **40** высотой: слот галочки **24**, подпись `body`. «Русский» выбран. «English» отключён (`disabled`, `text/muted`) до появления перевода.

**Нажатие.** Круглая кнопка: hover `scale 1.05`, нажатие `0.94`. При `prefers-reduced-motion` всё меняется сразу.

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
  dateLabel: string; // строка на карточке, собирается из полей периода
  startMonth?: number | null; // 1–12
  startYear?: number | null;
  endMonth?: number | null;
  endYear?: number | null;
  ongoing: boolean; // «по настоящее время»
  description: string; // текст карточки
  logoSrc: string;
  url?: string;
  order: number; // запасной порядок при одинаковой дате
  manualRank?: number | null; // ручная позиция; null — стоять по дате периода
  bloubShape: string; // ShapeId, по умолчанию cercle
  bloubState: string; // анимация: idle | thinking | wink | …
  bloubExpression?: string | null; // ExpressionId; на таймлайне видно в `idle`
  bloubEmotion: string; // устаревший FK справочника, таймлайн компании его не читает
  blocks: Array<{
    kind: "heading" | "subheading" | "paragraph";
    text: string;
    sortOrder: number;
  }>; // подробности в модалке места работы, на карточке не показываются
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
  createdMonth?: number | null;
  createdYear?: number | null;
  description: string;
  tags: string[];
  logoSrc: string;
  order: number;
  bloubShape: string; // ShapeId, по умолчанию cercle
  bloubState: string; // анимация: idle | thinking | wink | …
  bloubExpression?: string | null; // ExpressionId; на таймлайне видно в `idle`
  bloubEmotion: string; // устаревший FK справочника, таймлайн проекта его не читает
  summary: string;
  heroImage: string; // первая фотография страницы, для совместимости
  nda: boolean; // тизер: одна фотография, ndaTitle, ndaText, кнопки связи; без индексации
  ndaTitle: string; // заголовок тизера, пустой не показывается
  ndaText: string;
  sections: Array<{
    kind: "legacy" | "heading" | "subheading" | "paragraph" | "image" | "video";
    heading: string;
    body: string;
    text?: string;
    imageSrc?: string; // путь фото или видео (`/uploads/…`)
    videoAutoplay?: boolean; // только для video и только вместе с videoMuted
    videoMuted?: boolean;
    videoLoop?: boolean;
    videoPoster?: string; // обложка до старта
    videoControls?: boolean; // false — без панели времени и настроек
    sortOrder: number;
  }>;
  published: boolean;
};
```

### 8.4 Bloub emotions (справочник в БД)

```ts
type BloubEmotion = {
  id: string;          // ключ, напр. "wave" | "focus" — устаревший FK Company и Project
  label: string;       // для админки
  state: string;       // StateId движка: idle | thinking | wink | wide | alert | notify |
                       // exclaim | sleep | egg | hexagon | play | orbit | burst | comet
  expression?: string; // ExpressionId для `idle` (neutre, heureux, curieux, fier, …); null = измеренное лицо
};
```

**Движок bloub.** Анимация — не ассеты (svg/gif), а процедурный движок, вендоренный из
[jeremy-prt/bloub](https://github.com/jeremy-prt/bloub) (MIT, `src/lib/bloub-engine/LICENSE`):
`BotEngine.sample(t)` — чистая функция времени, выдаёт path тела, глаза-дырки в маске и декор
(кольца, частицы). React-рендер — `BloubBot` (`src/components/portfolio/bloub-bot.tsx`).

- **MUST:** цвета только из токенов, `skins.ts`/`NOTIF_BLUE` движка не используются: тело — `accent/primary`,
  глаза — `surface/page` (подложка под дырками маски, поэтому меняются с темой), кольца/частицы —
  `accent/primary` → `accent/primary-hover`, пастилька notify — `accent/information`.
- **MUST:** у каждого bloub внутреннее свечение (Figma `405:13014`): inset `0 4px 8px`, белый 60%, в расчёте на шар 44px. Рисуется радиальным градиентом внутри маски тела в `BloubBot` — без SVG-фильтра, чтобы не пересчитывать blur на каждом кадре. Цвет — токен `--bloub-glow`, в обеих темах одинаковый.
- Форма по умолчанию — круг (как в Figma). У проекта в админке выбирается форма персонализатора (`cercle`, `galet`, `squircle`, `capsule`, `triangle`, `hexagone`, `nuage`, `goutte`). Анимации со своим силуэтом её не подменяют; выражение лица применяется в `idle`. Состояния `swirl` (служебное) в выборе нет.
- Появление и исчезновение на `decor/timeline-dot`: 200ms `ease-in-out` (scale от диаметра точки к 44px и обратно, opacity кроссфейдом с точкой).
  Нарративные состояния (`orbit`, `burst`, `alert`…) проигрываются один раз и держат финальную позу — это
  поведение движка, не баг.
- `prefers-reduced-motion`: один кадр `POSES[state]`, без rAF-цикла.
- Справочник компаний — `BloubEmotion`, сид — `prisma/seed.ts`. Проект не выбирает строку справочника: форма, выражение и анимация лежат на самой карточке и правятся раскрывающимся блоком в `/admin`.

### 8.5 Site meta

```ts
type SiteContent = {
  intro: {
    headline: string;
    bio: string;
    avatarSrc: string;
    faces: string[]; // портреты на главной и в шапке кейса, по порядку нажатия
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
- [ ] Компании + лого + форма / выражение / анимация bloub  
- [ ] Проекты + slug + секции + изображения и видео + форма / выражение / анимация bloub + флаг NDA  
- [ ] Справочник эмоций bloub  
- [ ] Favicon / OG  

---

## 9. Технические ограничения

### 9.1 Стек

**Фреймворк не зафиксирован** владельцем.

> Нужно уточнить: Next.js / иное? Какая БД (Postgres / SQLite / hosted)? ORM?  
> Хостинг публичной сборки решён: GitHub Pages, §9.4.

**MUST:** стек включает **персистентную БД** и путь наполнения контента владельцем.  
До выбора конкретного продукта агент **MUST NOT** лочить стек «навсегда», но **MUST** заложить слой данных под схемы §8 (не только статический JSON как единственный источник правды).

### 9.2 Обязательные требования

- **a11y:** семантика, контраст Light/Dark, focus, reduced-motion, aria на icon-кнопках.
- **performance:** lazy images; видео кейса по умолчанию без автоплея, автовоспроизведение только без звука и без старта при `prefers-reduced-motion` (§3.4); LCP — intro.
- **responsive:** desktop 1440 — Figma; mobile — `MOB Home Full Page` (`161:559`), см. §3.2.
- **i18n:** сейчас RU (+ EN в CTA макета). Язык: <!-- TODO:user -->.

### 9.3 Секреты и данные

- **MUST:** credentials БД только в env; сиды для local/dev.
- Auth админки — минимально необходимая (защита `/admin`), не публичный login для посетителей сайта.
- **MUST NOT** требовать аккаунт у посетителя портфолио.

### 9.4 Публикация

Сборка сайта хранится в [adentxxx/adentxxx.github.io](https://github.com/adentxxx/adentxxx.github.io). Это GitHub Pages. Исходники приложения остаются в [adentxxx/portfolio](https://github.com/adentxxx/portfolio).

- **MUST:** деплой сайта делать туда, на GitHub Pages. В репозиторий попадает статическая сборка.
- **MUST:** в корне Pages-репозитория сохранять файл `CNAME` со значением `hereisalex.art`. Новая выкладка его не стирает.
- **MUST NOT:** выкладывать на GitHub Pages админку, API и базу. Админка остаётся локально.

---

## 10. Правила для агента (MUST / MUST NOT)

### MUST

1. Следовать Figma + `docs/tokens/` + этому SDD.
2. Roadmap: на desktop компании слева, проекты справа; на mobile обе колонки справа от connector (§3.2). Reveal по скроллу.
3. Реализовать lifecycle bloub: idle animated → timeline-dot при скролле → bloub на точке карточки; эмоции из БД. На mobile/tablet morph садится в начало верхнего connector; вертикальная полоса заливается accent по скроллу, вместе с travel-точкой (§3.2).
4. Темы только через Mapped Light/Dark variables.
5. Type scale только из `size/*` + `line-height/*`.
6. Звук по §6: `click`, `drop_004`. Точка таймлайна без звука.
7. Предусмотреть БД и CRUD для проектов (и связанных сущностей).
8. `prefers-reduced-motion`.
9. Variants `Cards` / `Button` как контракт.
10. Не выдумывать био/названия; UI-копия без lorem.
11. Деплой публичного сайта — статическая сборка в `adentxxx/adentxxx.github.io` (GitHub Pages), с сохранением `CNAME` (§9.4).

### MUST NOT

1. Выдумывать имена компаний, проекты, био, даты.
2. Автопроигрывать звук при load и hover. Звук прибытия точки таймлайна на карточку — тоже нет (§6.1).
3. Хардкодить цвета / font-size в обход токенов.
4. Заменять Vollkorn / Ubuntu Sans без согласия.
5. Игнорировать morph bloub↔dot.
6. Делать контент только захардкоженным JSON без пути записи в БД (сиды OK для bootstrap).
7. Копировать демо Figma в прод без подтверждения.
8. Лочить фреймворк до решения §11 — но не отменять требование БД.

### SHOULD

1. Theme в `localStorage`.
2. Prefetch кейса при hover на project-card.
3. Документировать источник SFX, если файлы снова меняются.

---

## 11. Открытые решения

| # | Решение | Зачем | Где |
|---|---|---|---|
| 1 | Выбор стека + конкретной БД + админки | Реализация §8–§9 | §9.1 |
| 2 | Утвердить контент intro/companies/projects в БД | Прод-данные | §8 |
| 3 | ~~Набор эмоций bloub (ассеты + ключи)~~ — закрыто: эмоции = состояния движка, см. §8.4 | Маркер timeline | §5.1, §8.4 |
| 4 | ~~Easing/ms morph bloub↔dot~~ — закрыто, см. §4.5 | Полировка | §4.5 |
| 5 | ~~Клик по company-карточке~~ — закрыто: модалка места работы, см. §5.2 | UX | §5.2 |
| 6 | ~~Назначение кнопок Button Bar~~ — закрыто: язык и тема, см. §7.5 | UI | §5.2 |
| 7 | ~~Default mute on/off~~ — закрыто: mute убран, звук включён всегда, см. §6.2 | Звук | §6.2 |
| 8 | ~~Финальная замена сток-SFX~~ — закрыто: файлы владельца, см. §6.3 | Прод-аудио | §6.3 |
| 9 | ~~Mobile-макет roadmap~~ — закрыто: `161:559`, см. §3.2 | Responsive | §9.2 |
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
| **Button Bar** | Плавающие стеклянные контролы: язык и тема |
| **SDD** | Этот документ |
| **Liquid glass** | Полупрозрачная поверхность `Button Bar` с blur под ней, §7.5 |

---

*Обновлено: Iteration 2 — `Button Bar` в liquid glass со сменой языка, mute убран (§6.2, §7.5); внутреннее свечение bloub (§8.4).*
