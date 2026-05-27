# CoreAsset — Финальный план каркаса

> Стек: Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase · React Hook Form + Zod

---

## 1. Структура папок

```
CoreAsset/
├── app/
│   ├── layout.tsx                        — root layout (шрифты, metadata)
│   ├── globals.css                       — базовые стили + shadcn токены
│   ├── (auth)/
│   │   ├── layout.tsx                    — центрированный layout без sidebar
│   │   └── login/
│   │       └── page.tsx                  — [Экран 1] форма входа
│   ├── (dashboard)/
│   │   ├── layout.tsx                    — sidebar + header
│   │   ├── page.tsx                      — [Экран 2] Dashboard / главная
│   │   ├── computers/
│   │   │   ├── page.tsx                  — [Экран 3] список ПК + фильтры + сортировка
│   │   │   ├── new/
│   │   │   │   └── page.tsx              — форма добавления ПК
│   │   │   └── [id]/
│   │   │       ├── page.tsx              — [Экран 4] карточка ПК
│   │   │       └── edit/
│   │   │           └── page.tsx          — форма редактирования ПК
│   │   ├── employees/
│   │   │   ├── page.tsx                  — список сотрудников + поиск
│   │   │   ├── new/
│   │   │   │   └── page.tsx              — форма добавления сотрудника
│   │   │   └── [id]/
│   │   │       ├── page.tsx              — карточка сотрудника
│   │   │       └── edit/
│   │   │           └── page.tsx          — форма редактирования
│   │   ├── workplaces/
│   │   │   ├── page.tsx                  — список рабочих мест + фильтр по кабинету
│   │   │   ├── new/
│   │   │   │   └── page.tsx              — форма создания рабочего места
│   │   │   └── [id]/
│   │   │       ├── page.tsx              — карточка рабочего места
│   │   │       └── edit/
│   │   │           └── page.tsx          — редактирование (смена ПК / сотрудника)
│   │   ├── licenses/
│   │   │   ├── page.tsx                  — [Экран 5] список пулов лицензий
│   │   │   ├── new/
│   │   │   │   └── page.tsx              — форма добавления пула
│   │   │   └── software/
│   │   │       ├── page.tsx              — справочник ПО (список)
│   │   │       └── new/
│   │   │           └── page.tsx          — форма добавления ПО в справочник
│   │   └── incidents/
│   │       ├── page.tsx                  — список всех тикетов + фильтр по статусу
│   │       └── [id]/
│   │           └── page.tsx              — карточка тикета
│   ├── api/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts              — Supabase Auth callback
│   └── middleware.ts                     — защита (dashboard) от неавторизованных
│
├── components/
│   ├── ui/                               — shadcn/ui (Button, Input, Badge, Dialog, …)
│   ├── layout/
│   │   ├── Sidebar.tsx                   — навигация: Dashboard / Computers / Employees / Workplaces / Licenses / Incidents
│   │   ├── Header.tsx                    — глобальный поиск + имя пользователя + logout
│   │   └── PageHeader.tsx                — заголовок страницы + кнопка «+ Add»
│   ├── dashboard/
│   │   ├── StatCard.tsx                  — карточка метрики (число + иконка)
│   │   └── AlertBanner.tsx               — баннер критических тикетов / истекающих лицензий
│   ├── computers/
│   │   ├── ComputerTable.tsx             — таблица с сортировкой + фильтрами
│   │   ├── ComputerCard.tsx              — детальная карточка (хардвер + ПО + тикеты)
│   │   ├── ComputerForm.tsx              — RHF+Zod форма (add/edit)
│   │   └── SoftwareInstallList.tsx       — список ПО на карточке + Remove / Add Software
│   ├── employees/
│   │   ├── EmployeeTable.tsx
│   │   ├── EmployeeCard.tsx
│   │   └── EmployeeForm.tsx
│   ├── workplaces/
│   │   ├── WorkplaceTable.tsx            — кабинет / ПК / сотрудник / статус
│   │   ├── WorkplaceCard.tsx
│   │   ├── WorkplaceForm.tsx             — создание: выбор кабинета + ПК + сотрудника
│   │   └── AssignEmployeeDialog.tsx      — модалка быстрого назначения сотрудника на ПК
│   ├── licenses/
│   │   ├── LicenseTable.tsx
│   │   ├── LicensePoolBadge.tsx          — used/total + красный алерт < 30 дней
│   │   ├── LicenseForm.tsx
│   │   └── SoftwareCatalogTable.tsx      — справочник ПО
│   ├── incidents/
│   │   ├── IncidentTable.tsx
│   │   ├── IncidentCard.tsx
│   │   ├── IncidentForm.tsx              — создание тикета (привязка к ПК)
│   │   └── IncidentTimeline.tsx          — хронология на карточке ПК
│   └── shared/
│       ├── DeleteConfirmDialog.tsx       — [Экран 7] модалка подтверждения удаления
│       ├── StatusBadge.tsx               — цветные бейджи статусов (Active/Repair/Vacant…)
│       ├── PriorityBadge.tsx             — low / medium / high / critical
│       ├── SortableTable.tsx             — таблица с кликабельными заголовками
│       └── EmptyState.tsx                — заглушка «нет данных»
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     — createBrowserClient()
│   │   └── server.ts                     — createServerClient() (cookies)
│   ├── schemas/
│   │   ├── computer.schema.ts            — Zod: ComputerInsert, ComputerUpdate
│   │   ├── employee.schema.ts            — Zod: EmployeeInsert, EmployeeUpdate
│   │   ├── workplace.schema.ts           — Zod: WorkplaceInsert, WorkplaceUpdate
│   │   ├── license.schema.ts             — Zod: LicensePoolInsert, SoftwareInsert
│   │   └── incident.schema.ts            — Zod: IncidentInsert, IncidentUpdate
│   ├── actions/
│   │   ├── computers.ts                  — createComputer, updateComputer, deleteComputer
│   │   ├── employees.ts                  — createEmployee, updateEmployee, dismissEmployee
│   │   ├── workplaces.ts                 — createWorkplace, assignEmployee, unassignEmployee
│   │   ├── licenses.ts                   — createLicensePool, createSoftware,
│   │   │                                    assignSoftware (с проверкой used < total),
│   │   │                                    removeSoftware
│   │   └── incidents.ts                  — createIncident, updateIncidentStatus
│   └── utils.ts                          — cn(), formatDate(), daysUntilExpiry()
│
├── types/
│   └── database.types.ts                 — генерируется: supabase gen types typescript
│
├── supabase/
│   └── migrations/
│       └── 0001_init.sql                 — CREATE TABLE + индексы + RLS-политики
│
├── plan.md                               — этот файл
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 2. Страницы — что на каждой

### `/login` — Экран 1
- Поля: email + password
- Server Action → `supabase.auth.signInWithPassword()`
- Редирект на `/dashboard` при успехе; ошибка под формой при провале

### `/dashboard` — Экран 2
- 4 метрики: Всего рабочих мест / Активных / В ремонте / Вакантных
- Алерт: тикеты с `priority=critical` и `status≠resolved`
- Алерт: пулы лицензий с `expires_at <= NOW() + 30 days`
- Всё — Server Component (прямой запрос Supabase)

### `/computers` — Экран 3
- Таблица: Инвентарный номер · Тип · Кабинет · Статус · Сотрудник
- Фильтры: lifecycle_status + room (два select)
- Поиск по инвентарному номеру
- Сортировка по любому столбцу
- Кнопка «+ Добавить ПК»

### `/computers/new` + `/computers/[id]/edit` — Экран 6
- ComputerForm: инвентарный номер, серийный номер, тип, кабинет, статус
- Hardware-секция (опционально): CPU, RAM, Storage → сохраняется в JSONB
- Zod + React Hook Form; Server Action createComputer / updateComputer

### `/computers/[id]` — Экран 4
- Шапка: инвентарный номер · статус · Edit / Delete
- Левая колонка: серийный номер, кабинет, привязанное рабочее место, сотрудник
- Правая колонка: CPU / RAM / Storage из JSONB
- Секция «Установленное ПО»: SoftwareInstallList + Remove + «+ Add Software»
- Секция «История тикетов»: IncidentTimeline + «+ Create Ticket»
- DeleteConfirmDialog: предупреждение о каскадном удалении тикетов

### `/employees` + `/employees/new` + `/employees/[id]` + edit
- Таблица: ФИО · Отдел · Должность · Email · Статус
- Поиск по ФИО + табельному номеру
- Карточка сотрудника: все поля + текущее рабочее место
- Кнопка «Уволить» → dismissEmployee (is_active=false, workplace.employee_id→NULL)

### `/workplaces` — список рабочих мест
- Таблица: Кабинет · ПК (инвентарный номер) · Сотрудник · Дата назначения
- Фильтр по кабинету
- Кнопка «+ Создать рабочее место»

### `/workplaces/new` + `/workplaces/[id]/edit`
- WorkplaceForm: выбор кабинета, select ПК (из computers), select сотрудника (опционально)

### `/workplaces/[id]`
- Карточка: кабинет, ПК, сотрудник, дата назначения
- AssignEmployeeDialog — быстро сменить сотрудника без перехода на edit

### `/licenses` — Экран 5
- Таблица пулов: ПО · Тип · Использовано/Лимит · Дата истечения
- LicensePoolBadge: красный при < 30 дней
- Ссылка на «Справочник ПО»; кнопка «+ Добавить пул»

### `/licenses/software`
- Таблица: Название · Версия · Вендор
- Кнопка «+ Добавить ПО»

### `/licenses/software/new`
- SoftwareForm: name, version, vendor (все текстовые поля)

### `/incidents` — список тикетов
- Таблица: ПК · Тип · Описание · Приоритет · Статус · Дата
- Фильтр по статусу (open / in_progress / resolved)
- PriorityBadge + StatusBadge

### `/incidents/[id]` — карточка тикета
- Все поля; кнопки смены статуса (Открыт → В работе → Исправлен)
- Если `status=resolved` — кнопки скрыты (read-only архив)

---

## 3. Ключевые алгоритмы (из документации)

### Назначение лицензии (`assignSoftware`)
```
1. Получить license_pool по software_id
2. Проверить: used_seats < total_seats
   → НЕТ: вернуть ошибку «Лицензии исчерпаны»
   → ДА: INSERT software_installations
3. UPDATE license_pools SET used_seats = used_seats + 1
4. revalidatePath('/computers/[id]') + revalidatePath('/licenses')
```

### Увольнение сотрудника (`dismissEmployee`)
```
1. UPDATE employees SET is_active = false WHERE id = ?
2. DB ON DELETE SET NULL: workplaces.employee_id → NULL автоматически
3. UPDATE computers SET lifecycle_status = 'vacant' WHERE id = workplace.computer_id
4. revalidatePath('/employees') + revalidatePath('/computers')
```

### Алерт истечения лицензий
```
SELECT * FROM license_pools
WHERE license_type = 'subscription'
AND expires_at <= NOW() + INTERVAL '30 days'
→ Для каждой → красный LicensePoolBadge
```

---

## 4. Middleware (auth guard)

```ts
// middleware.ts
matcher: ['/(dashboard)/:path*']
→ createServerClient() → getSession()
→ нет сессии → redirect('/login')
```

---

## 5. Роли (RBAC)

| Роль | Права |
|------|-------|
| **admin** | Полный CRUD + управление лицензиями + управление пользователями |
| **tech** | CRUD ПК, тикетов, сотрудников; без удаления лицензий |
| **readonly** | Только просмотр и дашборд |

Роль хранится в `auth.users.app_metadata.role`. RLS-политики проверяют `auth.jwt() → role`.

---

## 6. shadcn/ui компоненты (установить)

```bash
npx shadcn@latest add button input badge dialog table select form label textarea separator skeleton
```

---

## 7. Порядок реализации (строго пошагово)

| Шаг | Что делаем | КТ |
|-----|------------|----|
| 1 | `create-next-app` + shadcn init + `.env.local` | — |
| 2 | `lib/supabase/client.ts` + `lib/supabase/server.ts` + `middleware.ts` | — |
| 3 | `supabase/migrations/0001_init.sql` → `supabase db push` | КТ-2 |
| 4 | `supabase gen types typescript` → `types/database.types.ts` | КТ-2 |
| 5 | Zod схемы (`lib/schemas/`) | — |
| 6 | `app/(auth)/login` + Server Action signIn | — |
| 7 | `app/(dashboard)/layout.tsx` — Sidebar + Header | — |
| 8 | `app/(dashboard)/page.tsx` — Dashboard + StatCard + AlertBanner | — |
| 9 | Computers CRUD (list → new → [id] → edit) + Server Actions | КТ-3 |
| 10 | Employees CRUD + dismissEmployee | КТ-3 |
| 11 | Workplaces CRUD + AssignEmployeeDialog | КТ-3 |
| 12 | Software catalog CRUD | КТ-3 |
| 13 | License pools CRUD + assignSoftware (с проверкой лимита) | КТ-3 |
| 14 | Incidents CRUD + статусы + архив | КТ-3 |
| 15 | Поиск + фильтрация + сортировка таблиц | КТ-4 |
| 16 | SoftwareInstallList на карточке ПК + IncidentTimeline | КТ-4 |
| 17 | DeleteConfirmDialog везде | КТ-4 |
| 18 | Тестирование + seed-данные | КТ-5 |

---

## 8. Маппинг на КТ колледжа

| КТ | День | Что показываем | Покрытие |
|----|------|----------------|----------|
| КТ-1 | День 5 | Спецификация | `docs/specification.md` — готово |
| КТ-2 | День 10 | ER-диаграмма, макеты, архитектура, среда | `docs/database.md`, `docs/ui-mockups-and-algorithms.md`, `docs/architecture.md` + миграция + типы |
| КТ-3 | День 13 | CRUD (добавить, просмотреть, редактировать, удалить) | Шаги 9–14 |
| КТ-4 | День 15 | Поиск, фильтрация, сортировка, отчётность | Шаги 15–17 |
| КТ-5 | День 17 | Тестирование, стабильная версия | Шаг 18 |
