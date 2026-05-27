# CoreAsset

**Система учёта рабочих мест, ИТ-оборудования и программных лицензий (ITAM)**

Тема практики №149 · IT.Москва · Колледж «ИТ.Бирюлёво» ИТ.Москва · 2026
---

## О проекте

**CoreAsset** — веб-приложение для ИТ-отделов и системных администраторов:
- Реестр сотрудников и рабочих мест
- Инвентаризация оборудования и характеристик
- Управление пулами лицензий ПО с контролем баланса
- Service Desk: журнал неисправностей и тикеты
- Дашборд с аналитикой

---

## Документация

| Файл | Содержание |
|------|-----------|
| [docs/specification.md](docs/specification.md) | Спецификация ПО: функциональные и нефункциональные требования (КТ-1) |
| [docs/features.md](docs/features.md) | Описание модулей и функций системы |
| [docs/database.md](docs/database.md) | Схема БД, таблицы, индексы (КТ-2) |
| [docs/ui-mockups-and-algorithms.md](docs/ui-mockups-and-algorithms.md) | Макеты UI (7 экранов), схема навигации, алгоритмы (КТ-2) |
| [docs/architecture.md](docs/architecture.md) | Архитектура приложения, структура проекта |
| [docs/roadmap.md](docs/roadmap.md) | Календарный план (20 рабочих дней практики) |
| [docs/user-guide.md](docs/user-guide.md) | Руководство пользователя |

---

## Технологический стек

| Слой | Технология |
|------|-----------|
| Фреймворк | Next.js 15 (App Router) |
| Язык | TypeScript |
| Стилизация | Tailwind CSS + shadcn/ui |
| Формы / Валидация | React Hook Form + Zod |
| База данных | Supabase (PostgreSQL) |
| Supabase SDK | `@supabase/supabase-js` + `@supabase/ssr` |
| Аутентификация | Supabase Auth (JWT) |
| Иконки | lucide-react |
| Даты | date-fns |
| Деплой | Vercel |

---

## Быстрый старт (локально)

### 1. Клонировать репозиторий

```bash
git clone https://github.com/IvanK177/CoreAsset.git
cd CoreAsset
```

### 2. Установить зависимости

```bash
npm install
```

### 3. Создать `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxciOixIUzI1N...
```

> Полный anon key находится в Supabase Dashboard → Project Settings → API.

### 4. Запустить

```bash
npm run dev
```

Приложение: `http://localhost:3000`

---

## Деплой на Vercel

1. Импортируйте репозиторий в [vercel.com](https://vercel.com)
2. В разделе **Environment Variables** добавьте:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://XXX.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ваш anon key
3. Нажмите **Deploy** — всё остальное Vercel сделает автоматически

---

## Ресурсы проекта

| Ресурс | https://core-asset-api.vercel.app/dashboard |
|--------|--------|
| Репозиторий | https://github.com/IvanK177/CoreAsset |
| Деплой | https://vercel.com/ivank177s-projects/core-asset-api |
| База данных | https://supabase.com/dashboard/project/tmivtbessykjksntdcwl |

---

## Структура репозитория

```
CoreAsset/
├── docs/                          — проектная документация
│   ├── specification.md           — спецификация ПО (КТ-1)
│   ├── features.md                — описание функций по модулям
│   ├── database.md                — схема БД (КТ-2)
│   ├── ui-mockups-and-algorithms.md — макеты и алгоритмы (КТ-2)
│   ├── architecture.md            — архитектура приложения
│   ├── roadmap.md                 — план 20 дней практики
│   └── user-guide.md              — руководство пользователя
├── college_assignments/           — задания колледжа (исходники)
└── README.md
```

---

## Авторы

Миняев Иван(документация), Копаев Иван(разработчик) 

Главные инструменты: Claude Sonnet 4.6, Gemini, GLM-5.1, VS Code
