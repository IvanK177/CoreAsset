# Архитектура CoreAsset

---

## Обзор

CoreAsset — **API-first** монолит на Next.js 16 (Turbopack) с Supabase в роли BaaS.  
Нет отдельного бэкенд-сервера — вся серверная логика живёт в **Next.js Server Actions / Route Handlers** и **Supabase Edge Functions** (при необходимости).

```
Browser
  │
  ▼
Next.js (Vercel Edge Network)
  ├── App Router (RSC + Server Actions)
  │     ├── Server Components — fetch данных напрямую через @supabase/ssr
  │     └── Client Components — интерактивность (формы, таблицы)
  │
  └── Supabase JS SDK (@supabase/supabase-js)
        │
        ▼
     Supabase (PostgreSQL + Auth + RLS)
```

---

## Структура папок

```
CoreAsset/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            — sidebar + header
│   │   ├── page.tsx              — дашборд (главная)
│   │   ├── devices/
│   │   │   ├── page.tsx          — список устройств
│   │   │   ├── [id]/page.tsx     — карточка устройства
│   │   │   └── new/page.tsx      — форма добавления
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── licenses/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   └── incidents/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── api/
│   │   └── [...supabase]/route.ts  — Supabase Auth callback
│   ├── layout.tsx
│   └── globals.css               — глобальные стили Tailwind CSS v4
│
├── components/
│   ├── ui/                        — shadcn/ui компоненты
│   ├── devices/
│   │   ├── DeviceTable.tsx
│   │   ├── DeviceCard.tsx
│   │   └── DeviceForm.tsx
│   ├── employees/
│   ├── licenses/
│   │   └── LicensePoolBadge.tsx   — индикатор баланса / алерт истечения
│   ├── incidents/
│   │   └── IncidentTimeline.tsx
│   └── dashboard/
│       └── DashboardStats.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              — createBrowserClient()
│   │   └── server.ts              — createServerClient() (cookies)
│   ├── schemas/                   — Zod схемы (валидация форм)
│   │   ├── device.schema.ts
│   │   ├── employee.schema.ts
│   │   ├── license.schema.ts
│   │   └── incident.schema.ts
│   └── utils.ts
│
├── types/
│   └── database.types.ts          — генерируется: supabase gen types typescript
│
├── docs/                          — проектная документация
├── dock/                          — материалы практики
├── supabase/
│   └── migrations/                — SQL-миграции
├── .env.local                     — переменные окружения (не коммитить)
├── next.config.ts
├── postcss.config.mjs             — конфигурация PostCSS (для Tailwind v4)
└── tsconfig.json
```

---

## Аутентификация и авторизация

| Механизм | Детали |
|----------|--------|
| Auth provider | Supabase Auth (email + password) |
| Сессия | JWT в httpOnly cookie через `@supabase/ssr` |
| Middleware | Проверка сессии на каждый запрос к `(dashboard)` |
| RBAC | Роль хранится в `auth.users.app_metadata.role` (admin / employee / it_specialist / facilities / developer) |
| RLS | Политики на каждой таблице, читают `auth.uid()` и `auth.jwt() → role` |

---

## Поток данных (пример: добавление устройства)

```
1. Client: заполняет DeviceForm (React Hook Form + Zod)
2. Client: вызывает Server Action createDevice(formData)
3. Server Action: повторная валидация через Zod
4. Server Action: supabase.from('devices').insert(data)
5. Supabase: проверяет RLS (роль = admin / it_specialist / facilities)
6. PostgreSQL: INSERT + обновление индексов
7. Server Action: revalidatePath('/devices')
8. Client: таблица обновляется (RSC refetch)
```

---

## Переменные окружения

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

> Секретный `service_role` ключ **никогда** не используется на клиенте.
