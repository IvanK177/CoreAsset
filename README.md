# CoreAsset

**Система учёта рабочих мест, ИТ-оборудования и программных лицензий (ITAM)**

Тема практики №149 · IT.Москва · Колледж «ИТ.Бирюлёво» ИТ.Москва · 2026
---

## О проекте

**CoreAsset** — многофункциональное веб-приложение для ИТ-отделов, системных администраторов, завхозов (АХЧ) и сотрудников предприятия (ITAM & Service Desk):
- **Реестр сотрудников и рабочих мест**: ведение базы персонала с разграничением прав (5 ролей), автоматический онбординг сотрудников при регистрации.
- **Инвентаризация устройств**: детальный учёт оборудования и характеристик железа с использованием CRUD-шаблонов конфигураций.
- **Управление пулами лицензий ПО**: контроль баланса мест, автоматическое списание/начисление лицензий и алерты об истечении подписок.
- **Финансовая аналитика**: учёт расходов на подписки и бессрочные лицензии по корпусам, визуализация затрат на интерактивных графиках и экспорт отчётов в Excel (XLS).
- **Service Desk**: полноценная система тикетов (ИТ-инциденты со встроенным чатом поддержки и SLA-календарём; заявки АХЧ на ремонт/оснащение с фотоотчётами).
- **Оптимизация**: PWA-поддержка (офлайн-режим), сжатие картинок на клиенте перед отправкой в Supabase Storage, gzip-сжатие длинных описаний в БД.

---

## Документация
| Файл | Содержание |
|------|-----------|
| [docs/specification.md](docs/specification.md) | Спецификация ПО: функциональные и нефункциональные требования (КТ-1) |
| [docs/architecture.md](docs/architecture.md) | Архитектура приложения, структура проекта (КТ-2) |
| [docs/completed_features.md](docs/completed_features.md) | Реализованный функционал проекта |
| [docs/roadmap.md](docs/roadmap.md) | Календарный план (20 рабочих дней практики) |
| [docs/user-guide.md](docs/user-guide.md) | Руководство пользователя |
| [docs/ai_architecture_insights.md](docs/ai_architecture_insights.md) | Архитектурные идеи PWA, офлайн-режимов и кэширования |

---

## Технологический стек

| Слой | Технология |
|------|-----------|
| Фреймворк | Next.js 16 (App Router, Turbopack) |
| Язык | TypeScript |
| Стилизация | Tailwind CSS v4 + shadcn/ui |
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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Важно:** `NEXT_PUBLIC_SITE_URL` отвечает за формирование правильной ссылки сброса пароля (redirect URL) в письмах восстановления доступа. Для локального запуска укажите `http://localhost:3000`, для продакшена — адрес вашего сайта.

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
   - `NEXT_PUBLIC_SITE_URL` = `https://core-asset-api.vercel.app` (ваш домен развертывания; отвечает за формирование корректной ссылки сброса пароля в письмах Supabase Auth)
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
│   ├── architecture.md            — архитектура приложения (КТ-2)
│   ├── completed_features.md      — реализованный функционал
│   ├── roadmap.md                 — план 20 дней практики
│   ├── user-guide.md              — руководство пользователя
│   └── ai_architecture_insights.md — архитектурные идеи
└── README.md
```

---

## Авторы

Миняев Иван (документация), Копаев Иван (разработчик) 

Главные инструменты: Claude Sonnet 4.6, Gemini, GLM-5.1, VS Code
