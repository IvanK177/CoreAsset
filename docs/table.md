# Схема базы данных CoreAsset (Обновленная)

PostgreSQL (Supabase) · 3NF

---

## Пользовательские типы данных (ENUMS)

Для обеспечения строгой типизации на уровне базы данных используются следующие ENUM-типы:

* **`user_role`**: `'admin'`, `'employee'`
* **`computer_status`**: `'active'`, `'repair'`, `'decommissioned'`, `'storage'`
* **`license_type`**: `'perpetual'`, `'subscription'`
* **`incident_type`**: `'hardware'`, `'software'`, `'network'`, `'other'`
* **`incident_priority`**: `'low'`, `'medium'`, `'high'`, `'critical'`
* **`incident_status`**: `'open'`, `'in_progress'`, `'resolved'`

---

## Таблицы

### `employees` — Реестр сотрудников (Интегрировано с Supabase Auth)

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ (строго совпадает с `id` из `auth.users`) |
| `full_name` | `text` NOT NULL | ФИО сотрудника |
| `position` | `text` NOT NULL | Должность |
| `email` | `text` UNIQUE NOT NULL | Email / Логин для входа |
| `room` | `text` | Номер кабинета |
| `phone` | `text` | Рабочий телефон |
| `telegram` | `text` | Telegram (ник или номер) |
| `role` | `user_role` NOT NULL | Роль доступа (default: `'employee'`) |
| `is_active` | `boolean` | Статус (уволен → false) (default: `true`) |
| `created_at` | `timestamptz` | Дата добавления |
| `updated_at` | `timestamptz` | Дата последнего обновления |

---

### `computer_templates` — Шаблоны сборок ПК

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ |
| `name` | `text` NOT NULL | Название шаблона (напр. "ПК Разработчика") |
| `description` | `text` | Описание назначения сборки |
| `computer_type` | `text` | Тип (ПК / Ноутбук / Сервер) |
| `hardware` | `jsonb` | Предзаполненный конфиг (Материнская плата, CPU, ОЗУ и т.д.) |
| `created_at` | `timestamptz` | Дата создания |

---

### `computers` — Реестр оборудования

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ |
| `inventory_number` | `text` UNIQUE NOT NULL | Инвентарный номер |
| `serial_number` | `text` UNIQUE | Серийный номер |
| `computer_type` | `text` | Тип устройства |
| `room` | `text` | Кабинет фактического размещения |
| `lifecycle_status` | `computer_status` | Состояние (default: `'storage'`) |
| `hardware` | `jsonb` | Фактический конфиг устройства (cpu, ram, storage, gpu и т.д.) |
| `template_id` | `uuid` FK → `computer_templates.id` | Из какого шаблона был создан (NULL = кастомная сборка) |
| `employee_id` | `uuid` FK → `employees.id` | За кем закреплен ПК (NULL = на складе / свободен) |
| `created_at` | `timestamptz` | Дата регистрации ПК |
| `updated_at` | `timestamptz` | Дата последнего обновления |

**Ограничения:** `ON DELETE SET NULL` на `employee_id` и `template_id`.

---

### `licenses` — Справочник ПО и Лицензии (Объединенная таблица)

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ |
| `software_name` | `text` NOT NULL | Название ПО (напр. "Windows 11 Pro") |
| `version` | `text` | Версия ПО |
| `vendor` | `text` | Производитель / Вендор |
| `license_type` | `license_type` | Тип лицензии (default: `'perpetual'`) |
| `license_key` | `text` | Лицензионный ключ / Номер контракта |
| `total_seats` | `integer` NOT NULL | Куплено активаций (default: `1`) |
| `used_seats` | `integer` NOT NULL | Занято активаций (default: `0`) |
| `price_per_unit` | `numeric` | Стоимость одной единицы |
| `expires_at` | `date` NULL | Дата окончания действия (NULL = бессрочная) |
| `notes` | `text` | Примечания |
| `created_at` | `timestamptz` | Дата регистрации |

**Логика:** Установка на ПК увеличивает `used_seats`, удаление — уменьшает. Триггер/UI не должен позволять `used_seats > total_seats`.

---

### `computer_licenses` — Установки ПО (Связь M:N)

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ |
| `computer_id` | `uuid` FK → `computers.id` | На какой ПК установлено |
| `license_id` | `uuid` FK → `licenses.id` | Какая лицензия выделена |
| `installed_at` | `timestamptz` | Дата установки / активации |

**Ограничения:** - `UNIQUE(computer_id, license_id)` — запрет дублирования одной и той же лицензии на одном ПК.
- `ON DELETE CASCADE` на обоих ключах.

---

### `incidents` — Журнал заявок и неисправностей

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ |
| `title` | `text` NOT NULL | Краткая тема проблемы |
| `description` | `text` NOT NULL | Подробное описание |
| `incident_type` | `incident_type` | Категория проблемы (default: `'other'`) |
| `priority` | `incident_priority` | Важность (default: `'medium'`) |
| `status` | `incident_status` | Состояние тикета (default: `'open'`) |
| `computer_id` | `uuid` FK → `computers.id` | Проблемный ПК (NULL = общая проблема) |
| `employee_id` | `uuid` FK → `employees.id` | Автор заявки (NOT NULL) |
| `created_at` | `timestamptz` | Дата открытия заявки |
| `resolved_at` | `timestamptz` NULL | Дата закрытия |
| `updated_at` | `timestamptz` | Дата последнего изменения |

**Ограничения:** - `ON DELETE SET NULL` на `computer_id`.
- `ON DELETE CASCADE` на `employee_id` (либо запрет удаления сотрудников с тикетами).

---

## ER-диаграмма (Упрощенная)

```text
auth.users (Supabase)
    │
    ▼
employees ─────────┐
    │              │
    │              ▼
    │          incidents ◄────────┐
    │              ▲              │
    ▼              │              │
computers ─────────┴──────────────┘
    ▲              │
    │              ▼
    │         computer_licenses
    │              ▲
    │              │
computer_          │
templates       licenses