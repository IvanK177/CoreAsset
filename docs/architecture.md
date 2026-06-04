# Архитектура CoreAsset

---

## Обзор

CoreAsset — **API-first** монолит на Next.js 16 (Turbopack) с Supabase в роли BaaS (Backend-as-a-Service).  
Вся серверная логика сосредоточена в **Next.js Server Actions и Route Handlers**. Напрямую через `@supabase/ssr` осуществляется выборка и обновление данных.

```
Browser (PWA / Offline Support)
  │
  ▼
Next.js (Vercel Edge Network)
  ├── App Router (RSC + Server Actions)
  │     ├── Server Components — выборка данных на сервере через service/browser clients
  │     └── Client Components — интерактивный UI, локальный кэш, сжатие картинок
  │
  └── Supabase JS SDK (@supabase/supabase-js)
        │
        ▼
     Supabase (PostgreSQL + Auth + RLS + Storage)
```

---

## Структура папок

```
CoreAsset/
├── app/
│   ├── (auth)/                    — аутентификация
│   │   ├── login/                 — страница входа и Server Actions
│   │   ├── register/              — страница регистрации
│   │   └── reset-password/        — сброс пароля
│   ├── (common)/
│   │   └── support/               — отправка обращений разработчикам
│   ├── (dashboard)/               — панель администратора
│   │   ├── layout.tsx             — сайдбар + хедер + глобальный поиск
│   │   ├── page.tsx               — аналитический дашборд
│   │   ├── devices/               — управление оборудованием
│   │   ├── employees/             — управление сотрудниками
│   │   ├── finances/              — расходы на ПО и экспорт XLS
│   │   ├── licenses/              — учет лицензионного ПО
│   │   └── templates/             — шаблоны сборок ПК/мониторов
│   ├── (developer)/
│   │   └── dev-portal/            — просмотр и обработка обращений
│   ├── (employee)/
│   │   └── portal/                — личный кабинет сотрудника (активы, заявки)
│   ├── (facilities)/
│   │   └── facilities-portal/     — управление заявками АХЧ и календарь SLA
│   ├── (it-portal)/
│   │   └── it-portal/             — управление ИТ-инцидентами, архивы и чаты
│   ├── (onboarding)/
│   │   └── onboarding/            — заполнение профиля при первой регистрации
│   ├── api/auth/signout/          — выход с очисткой кук
│   ├── auth/callback/             — обработчик OAuth/email подтверждений
│   ├── supabase-proxy/            — проксирование запросов к Supabase
│   ├── layout.tsx                 — глобальный корневой макет
│   └── globals.css                — глобальные стили Tailwind CSS v4
│
├── components/
│   ├── developer/                 — компоненты портала разработчика
│   ├── facilities/                — компоненты портала АХЧ
│   ├── finances/                  — аналитические карточки и графики финансов
│   ├── it-portal/                 — компоненты ведения ИТ-инцидентов
│   ├── layout/                    — Sidebar, Header, PageHeader
│   ├── portal/                    — формы создания тикетов и личный кабинет сотрудника
│   ├── shared/                    — переиспользуемые UI: Badges, Dialogs, PWARegister
│   ├── ui/                        — компоненты shadcn/ui
│   ├── TaskCalendar.tsx           — SLA Календарь задач
│   └── TicketChat.tsx             — встроенный чат в тикетах
│
├── lib/
│   ├── actions/                   — Server Actions (auth, devices, incidents, etc.)
│   ├── image/                     — утилиты сжатия изображений
│   ├── schemas/                   — Zod-схемы валидации данных
│   ├── supabase/                  — инициализация клиентов (cached, client, server)
│   ├── utils/                     — SLA расчет сроков по приоритетам
│   ├── compression.ts             — утилиты Gzip сжатия строк
│   └── utils.ts                   — хелперы, типы зданий, форматирование дат
│
├── public/
│   ├── sw.js                      — Service Worker для PWA
│   ├── manifest.json              — манифест PWA
│   └── *.png, *.svg               — статические изображения и иконки
│
├── supabase/
│   ├── migrations/                — SQL файлы структуры БД
│   ├── schema.sql                 — консолидированная схема БД
│   └── seed.sql                   — начальные данные для тестирования
│
├── types/
│   └── database.types.ts          — автогенерируемые типы базы данных Supabase
└── tsconfig.json
```

---

## Схема базы данных (Supabase / PostgreSQL)

База данных состоит из 9 таблиц, находящихся в схеме `public`. 

### Таблицы и связи
1. **`employees`** (Сотрудники)
   - `id` UUID PRIMARY KEY (совпадает с `auth.users.id`)
   - `full_name` TEXT NOT NULL
   - `position` TEXT NOT NULL
   - `email` TEXT NOT NULL UNIQUE
   - `room` TEXT
   - `phone` TEXT
   - `telegram` TEXT
   - `role` `user_role` (enum: admin, employee, it_specialist, facilities, developer)
   - `is_active` BOOLEAN DEFAULT true
   - `building` TEXT (выбор из списка корпусов)
   - `avatar_url` TEXT

2. **`computer_templates`** (Шаблоны сборок)
   - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `name` TEXT NOT NULL
   - `description` TEXT
   - `computer_type` TEXT (desktop, laptop, monoblock, server, monitor, etc.)
   - `hardware` JSONB DEFAULT '{}' (cpu, ram, storage, gpu, diagonal, resolution)

3. **`devices`** (Оборудование)
   - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `inventory_number` TEXT NOT NULL UNIQUE
   - `serial_number` TEXT UNIQUE
   - `computer_type` TEXT
   - `room` TEXT
   - `lifecycle_status` `computer_status` (enum: active, repair, decommissioned, storage)
   - `hardware` JSONB DEFAULT '{}'
   - `template_id` UUID REFERENCES `computer_templates.id` ON DELETE SET NULL
   - `employee_id` UUID REFERENCES `employees.id` ON DELETE SET NULL
   - `device_type` `device_type` NOT NULL DEFAULT 'pc' (enum: pc, monitor, keyboard, mouse, printer, other)
   - `photo_urls` TEXT[] DEFAULT '{}'

4. **`licenses`** (Лицензии ПО)
   - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `software_name` TEXT NOT NULL
   - `version` TEXT
   - `vendor` TEXT
   - `license_type` `license_type` (enum: perpetual, subscription)
   - `license_key` TEXT
   - `total_seats` INTEGER NOT NULL DEFAULT 1
   - `used_seats` INTEGER NOT NULL DEFAULT 0
   - `price_per_unit` NUMERIC DEFAULT 0
   - `expires_at` DATE
   - `notes` TEXT
   - Ограничение: `CHECK (used_seats <= total_seats)`

5. **`device_licenses`** (Таблица связки Устройство-Лицензия)
   - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `device_id` UUID REFERENCES `devices.id` ON DELETE CASCADE
   - `license_id` UUID REFERENCES `licenses.id` ON DELETE CASCADE
   - UNIQUE (device_id, license_id)

6. **`incidents`** (ИТ-инциденты)
   - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `title` TEXT NOT NULL
   - `description` TEXT NOT NULL (может сохраняться сжатым)
   - `incident_type` `incident_type` (enum: hardware, software, network, other)
   - `priority` `incident_priority` (enum: low, medium, high, critical)
   - `status` `incident_status` (enum: open, in_progress, resolved, cancelled)
   - `device_id` UUID REFERENCES `devices.id` ON DELETE SET NULL
   - `employee_id` UUID REFERENCES `employees.id` ON DELETE SET NULL
   - `assigned_to` UUID REFERENCES `employees.id` ON DELETE SET NULL
   - `resolved_at` TIMESTAMPTZ
   - `photo_urls` TEXT[]
   - `resolution` TEXT
   - `resolution_photo_urls` TEXT[]

7. **`room_requests`** (Заявки АХЧ)
   - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `room` TEXT NOT NULL
   - `type` TEXT NOT NULL (ремонт, оснащение)
   - `description` TEXT NOT NULL
   - `status` TEXT NOT NULL DEFAULT 'open'
   - `author_id` UUID REFERENCES `employees.id` ON DELETE SET NULL
   - `assigned_to` UUID REFERENCES `employees.id` ON DELETE SET NULL
   - `priority` TEXT NOT NULL DEFAULT 'medium'
   - `photo_urls` TEXT[]
   - `resolution` TEXT
   - `resolution_photo_urls` TEXT[]

8. **`incident_messages`** (Сообщения чата тикетов)
   - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `incident_id` UUID REFERENCES `incidents.id` ON DELETE CASCADE
   - `sender_id` UUID REFERENCES `employees.id` ON DELETE SET NULL
   - `text` TEXT NOT NULL
   - `photo_urls` TEXT[]

9. **`support_requests`** (Обращения разработчикам)
   - `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `author_id` UUID REFERENCES `employees.id` ON DELETE SET NULL
   - `message` TEXT NOT NULL
   - `status` TEXT NOT NULL DEFAULT 'open'

---

## Ключевые алгоритмы и потоки данных

### 1. Безопасность и проверка ролей (RBAC)
- Каждая таблица защищена с помощью **Row Level Security (RLS)**.
- Функция `get_role_security_definer(user_id)` выполняется с правами `SECURITY DEFINER` в PostgreSQL. Она считывает роль из таблицы `employees` напрямую, исключая бесконечную рекурсию при обращении к таблицам сотрудников из RLS политик.
- Для авторизации в Server Actions используется хелпер `requireAuth(requiredRoles)`, проверяющий наличие сессии Supabase Auth либо демонстрационных сессионных кук (`demo_role`, `demo_employee_id`).

### 2. Сжатие текста (Gzip + Base64)
Для минимизации размера хранимых текстовых описаний больших инцидентов / заявок используется утилита `lib/compression.ts`:
- **Сжатие (`compressText`)**: Текст переводится в UTF-8 байты через `TextEncoder`, сжимается с помощью браузерного/Node `CompressionStream("gzip")`, переводится в base64 и сохраняется в БД с префиксом `gz:`.
- **Декомпрессия (`decompressText`)**: Если строка начинается с `gz:`, base64 декодируется в массив байтов, декомпрессируется через `DecompressionStream("gzip")` и преобразуется обратно в текстовую строку.

### 3. Сжатие изображений на клиенте
Перед отправкой в хранилище Supabase Bucket `ticket-attachments` файлы проходят через `compressImageToTarget`:
- Изображение рендерится на HTML5 Canvas.
- Качество сжатия JPEG/WebP динамически уменьшается, пока размер файла не станет меньше целевого (~300-500 КБ).
- Это экономит сетевой трафик пользователей и дисковое пространство облачного хранилища.

### 4. SLA и Календарь задач
- Сроки решения инцидентов рассчитываются функцией `calculateDeadline` в часовой зоне Москвы (`Europe/Moscow`).
- Календарь задач (`TaskCalendar.tsx`) сопоставляет даты создания тикета с SLA приоритетами и визуализирует дедлайны в интерактивной сетке.

### 5. PWA и оффлайн-кэширование
- **Service Worker (`sw.js`)**: перехватывает все сетевые GET-запросы к статическим ресурсам, кэширует их и выдает мгновенно при плохом сигнале сети. Запросы к API, `_next/` разработке, сокетам и доменам `supabase.co` игнорируются, чтобы не нарушать динамику данных.
- **Уведомление об обновлениях (`PWARegister.tsx`)**: отслеживает новые версии сервис-воркера. При обнаружении новой версии выводит Toast с предложением обновить страницу и отправляет сигнал `SKIP_WAITING` для активации нового кэша.
