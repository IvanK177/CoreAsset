# Схема базы данных CoreAsset

PostgreSQL (Supabase) · 3NF

---

## Таблицы

### `employees` — Реестр сотрудников

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ |
| `full_name` | `text` NOT NULL | ФИО |
| `position` | `text` | Должность |
| `department` | `text` | Отдел |
| `email` | `text` UNIQUE | Email |
| `employee_id` | `text` UNIQUE | Табельный номер |
| `is_active` | `boolean` DEFAULT true | Статус (уволен → false) |
| `created_at` | `timestamptz` | Дата добавления |

---

### `computers` — Реестр оборудования

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ |
| `inventory_number` | `text` UNIQUE NOT NULL | Инвентарный номер |
| `serial_number` | `text` UNIQUE | Серийный номер |
| `type` | `text` | Тип (ПК / ноутбук / моноблок) |
| `room` | `text` | Кабинет |
| `lifecycle_status` | `text` | Активен / В ремонте / Списан / Вакантен |
| `hardware` | `jsonb` | Комплектующие (CPU, GPU, RAM, storage) |
| `ip_address` | `inet` | IP-адрес |
| `mac_address` | `macaddr` | MAC-адрес |
| `created_at` | `timestamptz` | Дата добавления |

---

### `workplaces` — Рабочие места

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ |
| `computer_id` | `uuid` FK → `computers.id` | Компьютер |
| `employee_id` | `uuid` FK → `employees.id` NULL | Сотрудник (NULL = вакантно) |
| `room` | `text` | Кабинет |
| `assigned_at` | `timestamptz` | Дата назначения |

**Ограничения:** `ON DELETE SET NULL` на `employee_id`

---

### `software_catalog` — Справочник ПО

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ |
| `name` | `text` NOT NULL | Название ПО |
| `version` | `text` | Версия |
| `vendor` | `text` | Вендор |

---

### `license_pools` — Пулы лицензий

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ |
| `software_id` | `uuid` FK → `software_catalog.id` | ПО |
| `license_type` | `text` | subscription / perpetual |
| `license_key` | `text` | Лицензионный ключ |
| `total_seats` | `integer` NOT NULL | Лимит активаций |
| `used_seats` | `integer` DEFAULT 0 | Использовано активаций |
| `expires_at` | `date` NULL | Дата окончания (NULL = бессрочная) |

**Логика:** `used_seats >= total_seats` → блокировка новых привязок

---

### `software_installations` — Установленное ПО (M:N)

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ |
| `computer_id` | `uuid` FK → `computers.id` | Компьютер |
| `license_pool_id` | `uuid` FK → `license_pools.id` | Пул лицензий |
| `installed_at` | `timestamptz` | Дата установки |

**Логика:** INSERT увеличивает `license_pools.used_seats`; DELETE уменьшает.

---

### `incidents` — Журнал неисправностей

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ |
| `computer_id` | `uuid` FK → `computers.id` NOT NULL | Компьютер |
| `incident_type` | `text` | hardware_failure / software_bug / maintenance |
| `description` | `text` NOT NULL | Описание |
| `priority` | `text` | low / medium / high / critical |
| `status` | `text` DEFAULT 'open' | open / in_progress / resolved |
| `created_at` | `timestamptz` | Дата открытия |
| `resolved_at` | `timestamptz` NULL | Дата закрытия |

**Ограничения:** `ON DELETE CASCADE` на `computer_id`; запрет DELETE через RLS при `status = 'resolved'`

---

## ER-диаграмма (упрощённая)

```
employees ─────────────┐
                       ▼
computers ─────── workplaces
    │
    ├──── software_installations ──── license_pools ──── software_catalog
    │
    └──── incidents
```

---

## Индексы

```sql
CREATE INDEX idx_computers_inventory ON computers(inventory_number);
CREATE INDEX idx_computers_status    ON computers(lifecycle_status);
CREATE INDEX idx_computers_room      ON computers(room);
CREATE INDEX idx_incidents_computer  ON incidents(computer_id);
CREATE INDEX idx_workplaces_employee ON workplaces(employee_id);
```

---

## Миграции Supabase

Миграции хранятся в `supabase/migrations/`. Применяются командой:

```bash
npx supabase db push
```

или через Supabase Dashboard → SQL Editor.
