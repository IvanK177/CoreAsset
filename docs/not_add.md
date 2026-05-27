# Элементы новой схемы БД — Статус интеграции (Выполнено ✅)

> Эти поля и таблицы существовали в новой схеме, но ранее не были подключены. На данный момент они **полностью реализованы** в UI, действиях (actions) и схемах (schemas).

---

## 1. Таблица `computer_templates` — Шаблоны сборок ПК

**Статус:** **Реализовано ✅** (Добавлены CRUD-страницы, компоненты, Server Actions и схемы).

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | `uuid` PK | Первичный ключ |
| `name` | `text` NOT NULL | Название шаблона (напр. "ПК Разработчика") |
| `description` | `text` | Описание назначения сборки |
| `computer_type` | `text` | Тип (ПК / Ноутбук / Сервер) |
| `hardware` | `jsonb` | Предзаполненный конфиг (Материнская плата, CPU, ОЗУ и т.д.) |
| `created_at` | `timestamptz` | Дата создания |

**Что нужно сделать:**
- Создать `lib/schemas/computer_template.schema.ts`
- Создать `lib/actions/computer_templates.ts` (CRUD server actions)
- Создать страницы: `/templates` (список), `/templates/new`, `/templates/[id]`, `/templates/[id]/edit`
- Создать компоненты: `ComputerTemplateForm`, `ComputerTemplateTable`, etc.
- Добавить ссылку в Sidebar

---

## 2. `computers.template_id` — FK → `computer_templates.id`

**Статус:** **Реализовано ✅** (Выбор шаблона добавлен в диалоги и формы добавления/редактирования ПК. При выборе шаблона характеристики железа и тип ПК предзаполняются автоматически).

- При создании ПК можно выбрать шаблон, который предзаполнит `hardware` и `computer_type`
- В UI нужна кнопка «Из шаблона» в форме создания компьютера
- `template_id` сохраняется как FK (NULL = кастомная сборка)

**Что нужно сделать:**
- Добавить `template_id` в `computerSchema` и `computerRowSchema`
- Добавить выбор шаблона в `ComputerForm` / `AddComputerDialog` / `EditComputerDialog`
- При выборе шаблона — предзаполнять `hardware` и `computer_type`

---

## 3. `licenses.license_key` — Лицензионный ключ

**Статус:** **Реализовано ✅** (Лицензионный ключ отображается в общем списке лицензий с маскировкой по умолчанию. Добавлена кнопка раскрытия и копирования ключа).

- В форме создания/редактирования лицензии нужно поле «Лицензионный ключ / Номер контракта»
- В списке лицензий — показывать ключ (с маскировкой по клику, т.к. чувствительные данные)

**Что нужно сделать:**
- Добавить `license_key` в `licenseSchema`
- Добавить поле ввода в `AddLicensePoolDialog` (переименовать в `AddLicenseDialog`)
- Отображать ключ в `LicensesClientView` (с маскировкой)

---

## 4. `employees.role` — Роль доступа (user_role ENUM)

**Статус:** **Реализовано ✅** (Роли `admin`, `employee`, `it_specialist` полностью интегрированы в формы управления сотрудниками, типы базы данных, а также в middleware авторизации/маршрутизации).

- ENUM: `'admin'` | `'employee'` (default: `'employee'`)
- В форме создания/редактирования сотрудника — выбор роли
- Роль влияет на доступ: admin → полный доступ, employee → только портал
- Интеграция с `auth.users` через `app_metadata.role`

**Что нужно сделать:**
- Добавить `user_role` ENUM в `database.types.ts`
- Добавить `role` в `employeeSchema` и формы
- Использовать `role` в `proxy.ts` вместо `demo_role` cookie
- Добавить переключатель роли в AddEmployeeDialog / EmployeeForm

---

## 5. Таблица `computer_licenses` — замена `software_installations`

**Статус:** **Реализовано ✅** (Связующая таблица `computer_licenses` полностью задействована в экшенах установки и удаления ПО с компьютера, а также в просмотре карточки ПК).

Старая структура: `software_installations` (id, computer_id, software_id, license_pool_id, installed_at)
Новая структура: `computer_licenses` (id, computer_id, license_id, installed_at)

Ключевые изменения:
- `license_id` заменяет `software_id` + `license_pool_id` (одна лицензия = одна запись)
- `UNIQUE(computer_id, license_id)` — одна лицензия на один ПК
- `ON DELETE CASCADE` на обоих FK

**Что нужно сделать:**
- Переписать `installSoftwareDialog` → установка через `license_id`
- Переписать `removeSoftware` → удаление из `computer_licenses`
- Обновить все запросы `software_installations` → `computer_licenses`
- Обновить триггер подсчёта `used_seats` (если есть)

---

## 6. `user_role` ENUM — новый тип

**Статус:** **Реализовано ✅** (Тип `user_role` и роли добавлены в генерируемый файл типов и используются по всей кодовой базе).

```sql
CREATE TYPE user_role AS ENUM ('admin', 'employee');
```

**Что нужно сделать:**
- Добавить в `Enums` секцию `database.types.ts`
- Добавить в `Constants.public.Enums`