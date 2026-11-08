# Демо-сайт «Пудровый сад»: план работ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Одностраничный демо-сайт цветочного магазина в стиле A «Пудровый сад» с анимацией, рамками-арками вместо фото и заказом звонком.

**Architecture:** Статичный `index.html` со всем контентом (блоки клиента помечены `<!-- КЛИЕНТ: ... -->`), `css/style.css` с цветами в CSS-переменных в начале, `js/main.js` только для анимации. Проверки — один Playwright-скрипт `tests/check.js`, который открывает страницу через `file://`.

**Tech Stack:** HTML, CSS, ванильный JS; Google Fonts (Cormorant Garamond, Manrope); Playwright, предустановленный в окружении (`require('playwright')`, без npm install).

**Spec:** `docs/superpowers/specs/2026-11-08-flower-shop-demo-design.md`

## Global Constraints

- Язык страницы `ru`, валюта ₽.
- Палитра стиля A: фон `#f4e2de`, текст `#2c3a2b`, вторичный текст `#4c5a4a`, акцент (лепестки) `#e7a3ae`, светлый лепесток `#f0c4cb`, заливка арки `#f9ece9`. Только светлая тема.
- Шрифты: Cormorant Garamond (заголовки, курсив 500), Manrope (300/400/600) с fallback-стеками.
- Демо-данные: «Лепесток», `+7 (900) 000-00-00` (`tel:+79000000000`), «ул. Цветочная, 1».
- Все кнопки заказа — `<a href="tel:+79000000000">`, номер виден текстом.
- Анимируются только `transform` и `opacity`. `prefers-reduced-motion: reduce` отключает анимацию.
- Без JS весь контент виден (ничего не стартует с `opacity:0` в CSS; скрытие для reveal ставит JS через класс на `<html>`).
- Лепестков: ≤8 при ширине < 700px, ≤12 иначе.
- Никаких сборщиков, npm-зависимостей, фреймворков.

## Review Focus

1. Ширина 360–390px: длинные заголовки и номер телефона в кнопках не вылезают за экран → проверка `scrollWidth <= innerWidth` на 360 и 390 (Task 1, расширяется в каждой задаче).
2. Нижняя закреплённая кнопка «Позвонить» перекрывает контакты/футер на телефоне → у `body` есть нижний отступ ≥ высоты панели (Task 3).
3. Пустая арка выглядит как сломанная картинка → в каждой пустой `.arch` есть SVG-рисунок и подпись (Task 2).
4. Клиент вставил фото другой пропорции → `img` внутри `.arch` с `object-fit: cover`, высота арки не меняется (Task 2).
5. Пользователь с JS выключенным или с reduced motion видит пустые блоки → проверка с `javaScriptEnabled:false` и `reducedMotion:'reduce'` (Task 4).

---

### Task 1: Каркас, тестовый скрипт, первый экран

**Files:**
- Create: `index.html`, `css/style.css`, `js/main.js`, `tests/check.js`

**Interfaces:**
- Produces: `tests/check.js` — запускается `node tests/check.js`, печатает `PASS <name>` / `FAIL <name>: <причина>` и завершается с кодом 1 при любом FAIL. Экспортирует ничего; проверки добавляются в массив `checks` как `{name, run: async (browser) => void}` (бросает Error при провале).
- Produces: CSS-переменные `--bg --fg --fg-soft --accent --petal --petal-light --arch-fill --serif --sans`; класс `.arch` (рамка-арка, Task 2 расширяет); `<header class="site-header">` с `.phone-link`.

- [ ] **Step 1: Написать `tests/check.js` с проверками:** `loads-without-errors` (нет `pageerror` и `console.error`), `no-horizontal-overflow` на 360/390/1440 (`document.documentElement.scrollWidth <= innerWidth`), `meta-tags` (`title` содержит «Лепесток»; есть `meta[name=description]`, `og:title`, `og:description`, `og:image` = `img/og.png`; `script[type="application/ld+json"]` парсится и `@type === "Florist"`, `telephone === "+79000000000"`), `hero` (`h1` непустой, в `.hero` ≥2 `.arch`, ≥1 `.petal`).
- [ ] **Step 2:** `node tests/check.js` → FAIL (нет index.html).
- [ ] **Step 3: Сверстать** `index.html` (head с meta/OG/JSON-LD, шапка: логотип курсивом, меню-якоря на 7 разделов, номер телефона; hero: заголовок, подзаголовок, кнопка «Заказать букет» `tel:`, две арки) и базовые стили по наброску A. Лепестки создаёт `js/main.js` функцией `spawnPetals(container: HTMLElement, count: number): void`.
- [ ] **Step 4:** `node tests/check.js` → все PASS.
- [ ] **Step 5:** commit `feat: page skeleton and hero`.

### Task 2: Арка-заглушка, каталог, поводы

**Files:** Modify `index.html`, `css/style.css`, `tests/check.js`; Create `tests/fixtures/sample.jpg` (сгенерировать скриншотом Playwright любого цветного блока, 600×800).

**Interfaces:**
- Consumes: `.arch`, CSS-переменные из Task 1.
- Produces: разметка арки `<figure class="arch"><svg class="arch-art">…</svg><figcaption>фото букета</figcaption></figure>`; с фото — `<figure class="arch has-photo"><img src="…" alt="…"></figure>`. Карточка: `article.bouquet` с `h3`, `.bouquet-desc`, `.price` (формат `3 900 ₽`), `a.order[href^="tel:"]`. Раздел `#catalog` (8 букетов), `#occasions` (6 поводов, `article.occasion` с кнопкой `tel:`).

- [ ] **Step 1: Тесты:** `catalog` (6–8 `.bouquet`, у каждой `.price` матчится `/^\d[\d\s]* ₽$/`, `a.order` с `href="tel:+79000000000"`), `occasions` (4–6 `.occasion`), `empty-arch-art` (у каждой `.arch:not(.has-photo)` есть `svg` и непустой `figcaption`), `photo-in-arch` (страница-фикстура: подменить через `page.evaluate` первую арку на `has-photo` с `tests/fixtures/sample.jpg`; высота арки до и после совпадает ±1px, `getComputedStyle(img).objectFit === 'cover'`).
- [ ] **Step 2:** запустить → новые FAIL.
- [ ] **Step 3:** сверстать разделы; сетка каталога 1/2/3/4 колонки по ширине; блоки помечены `<!-- КЛИЕНТ: ... -->`.
- [ ] **Step 4:** все PASS.
- [ ] **Step 5:** commit `feat: catalog and occasions with arch placeholders`.

### Task 3: О магазине, заказ и доставка, отзывы, контакты, нижняя кнопка

**Files:** Modify `index.html`, `css/style.css`, `tests/check.js`.

**Interfaces:**
- Produces: `#about`, `#delivery` (3 шага заказа + условия доставки), `#reviews` (3 `blockquote.review`, помечены `<!-- КЛИЕНТ: демо-отзывы, заменить на настоящие или удалить -->`), `#contacts` (адрес, часы, телефон, соцсети-ссылки `#`), `footer`, `.call-bar` (фиксирована внизу на ширине < 700px, учитывает `env(safe-area-inset-bottom)`).

- [ ] **Step 1: Тесты:** `sections` (есть все 7 якорей меню и соответствующие `id`), `all-tel-same` (все `a[href^="tel:"]` имеют один и тот же `href`), `call-bar` (видна на 390, `display:none` на 1440; на 390 `body` padding-bottom ≥ высоты `.call-bar`).
- [ ] **Step 2:** запустить → FAIL.
- [ ] **Step 3:** сверстать.
- [ ] **Step 4:** все PASS.
- [ ] **Step 5:** commit `feat: about, delivery, reviews, contacts, mobile call bar`.

### Task 4: Анимация при прокрутке и доступность движения

**Files:** Modify `js/main.js`, `css/style.css`, `tests/check.js`.

**Interfaces:**
- Produces: `initReveal(): void` — ставит `html.js-reveal`, элементам `[data-reveal]` добавляет `.is-visible` через IntersectionObserver; CSS прячет только `html.js-reveal [data-reveal]:not(.is-visible)`. Hover карточек: подъём `translateY(-4px)`, арка «дышит» `scale(1.02)`.

- [ ] **Step 1: Тесты:** `no-js-visible` (`javaScriptEnabled:false`: у всех `[data-reveal]` computed opacity `1`), `reveal-on-scroll` (после прокрутки до `#contacts` и ожидания 1.5s все `[data-reveal]` до него имеют `.is-visible`), `reduced-motion` (`reducedMotion:'reduce'`: `.petal` отсутствуют или `animationName === 'none'`; все `[data-reveal]` opacity 1), `petal-count` (390 → ≤8, 1440 → ≤12).
- [ ] **Step 2:** запустить → FAIL.
- [ ] **Step 3:** реализовать.
- [ ] **Step 4:** все PASS.
- [ ] **Step 5:** commit `feat: scroll reveal and reduced motion`.

### Task 5: Картинка превью, README, финальная проверка

**Files:** Create `tools/make-og.js`, `img/og.png`, `README.md`.

**Interfaces:**
- Produces: `node tools/make-og.js` — открывает `index.html` в окне 1200×630 с `reducedMotion:'reduce'`, прячет шапку, сохраняет скриншот первого экрана в `img/og.png`.

- [ ] **Step 1: Тест** `og-image` (файл `img/og.png` существует, PNG 1200×630 — читать ширину/высоту из заголовка IHDR).
- [ ] **Step 2:** запустить → FAIL.
- [ ] **Step 3:** написать `tools/make-og.js`, запустить; написать README: как открыть локально, как включить GitHub Pages (Settings → Pages → Deploy from branch → `main` / root), чек-лист переделки под клиента (новый репозиторий, все `КЛИЕНТ`-блоки, JSON-LD и meta, фото в `img/`, `make-og.js`, отзывы, Pages и домен).
- [ ] **Step 4:** `node tests/check.js` → все PASS; скриншоты 390 и 1440 (deviceScaleFactor 1) просмотреть глазами.
- [ ] **Step 5:** commit `feat: og image and README`.
