# Технический аудит CoreAsset: База данных Supabase и Кодовая база

Этот отчет содержит результаты технического аудита базы данных Supabase и репозитория Next.js для проекта CoreAsset, выявляет критические проблемы безопасности, частично реализованные функции и предлагает архитектурные решения.

---

## 1. Аудит базы данных Supabase

### 1.1. Row Level Security (RLS) и уязвимости доступа
> [!CAUTION]
> **Критическая уязвимость безопасности: Политики `Dev Access`**
>
> Во всех таблицах базы данных включен RLS, однако для каждой таблицы создана политика вида `Dev Access [TableName]`, предоставляющая права **ALL** (SELECT, INSERT, UPDATE, DELETE) для роли `{public}` с условием `USING (true) WITH CHECK (true)`.
>
> **Риск:** Любой неавторизованный пользователь может напрямую через Supabase API прочитать, изменить или удалить любые данные (сотрудников, инциденты, компьютеры, лицензии). Специфичные политики для ролей (например, `it_specialist_can_view_incidents`) фактически не работают, так как `Dev Access` разрешает любые действия.

### 1.2. Триггеры и подсчет занятых лицензий (`used_seats`)
> [!WARNING]
> **Отсутствие транзакционной целостности для `licenses.used_seats`**
>
> Схема была обновлена: вместо `software_installations` и `license_pools` теперь используются таблицы `computer_licenses` (связующая M:N) и `licenses`.
> 
> * **Проблема:** В текущей базе данных отсутствуют триггеры на таблицу `computer_licenses`. Функция `trg_fn_software_installations_seats` осталась от старой схемы и не срабатывает.
> * **Как работает сейчас:** Серверные экшены (`installSoftwareDialog` и `removeSoftware`) вручную инкрементируют и декрементируют `used_seats` в JS-коде.
> * **Риски:**
>   1. **Состояние гонки (Race Condition):** Если два IT-специалиста одновременно привяжут лицензию, они могут превысить лимит `total_seats`, так как проверка лимита и обновление счетчика происходят неатомарно.
>   2. **Рассинхронизация данных:** Если запись в `computer_licenses` будет удалена или вставлена напрямую через СУБД или другой интерфейс, счетчик `used_seats` в таблице `licenses` не обновится.
>   3. **Отсутствие CHECK-констреинта:** На таблице `licenses` нет ограничения `CHECK (used_seats <= total_seats)`.

### 1.3. Актуальность схемы данных
* Таблицы `workplaces`, `software`, `license_pools` и `software_installations` полностью удалены из БД. Кодовая база Next.js адаптирована под новые таблицы `licenses` и `computer_licenses`.
* Локальные миграции в папке `supabase/migrations` содержат устаревшие SQL-скрипты, что может вызвать проблемы при локальном развертывании СУБД с нуля (`supabase db start`).

---

## 2. Аудит функций Next.js и покрытия UI

### 2.1. Шаблоны сборок ПК (`computer_templates`) — **НЕ реализовано**
В базе данных есть таблица `computer_templates` (для предзаполнения характеристик ПК), но в коде Next.js она практически отсутствует:
* **Роутинг:** Роут `/templates` защищен в `proxy.ts` (`ADMIN_ROUTES`), но физически папка страницы в `app/(dashboard)` отсутствует.
* **Server Actions & Schemas:** Отсутствуют действия CRUD для шаблонов и соответствующая Zod-схема.
* **Интеграция с ПК:** Поле `computers.template_id` не выведено в UI. При добавлении компьютера нет возможности выбрать шаблон, чтобы автоматически предзаполнить характеристики железа (CPU, RAM, Storage, GPU) и тип устройства.

### 2.2. Отображение лицензионных ключей (`licenses.license_key`) — **Частично реализовано**
* **Создание:** Поле ввода ключа добавлено в диалог `AddLicenseDialog`.
* **Отображение:** В таблице `LicensesClientView.tsx` лицензионный ключ вообще не выводится пользователю.
* **Требование:** Показывать ключ в списке лицензий (или при клике на строку) с маскировкой (например, `••••-••••-••••`) и кнопкой показа/копирования, так как это чувствительные данные.

### 2.3. Интеграция ролей пользователей (`employees.role`) — **Реализовано**
* Поле `role` (ENUM: `admin`, `employee`, `it_specialist`) полностью интегрировано:
  * В формах создания/редактирования сотрудников (`AddEmployeeDialog`, `EmployeeForm`).
  * В middleware (`proxy.ts`) для защиты роутов и перенаправления на соответствующий портал (Админ -> `/dashboard`, IT-специалист -> `/it-portal`, Сотрудник -> `/portal`).
  * Для предотвращения бесконечной рекурсии при RLS-проверках на таблице `employees` создана функция `is_it_specialist` с флагом `SECURITY DEFINER`.

---

## 3. Предлагаемые решения и план доработки

### Решение 1: Закрытие дыр в безопасности (RLS)
1. Удалить все политики `Dev Access` в Supabase.
2. Настроить строгие политики доступа для каждой роли:
   * **`employees`**: Администраторы имеют полный CRUD. Сотрудники и IT-специалисты могут читать профили коллег (для назначения инцидентов/просмотра контактов). Сотрудник может обновлять свой профиль (в рамках onboarding).
   * **`computers`**: Администраторы и IT-специалисты имеют полный доступ. Сотрудники могут видеть только компьютеры, привязанные к ним (`employee_id = auth.uid()`).
   * **`licenses`** и **`computer_licenses`**: Доступ только для Администраторов и IT-специалистов.
   * **`incidents`**: Администраторы и IT-специалисты имеют полный доступ. Сотрудники могут видеть и создавать инциденты только от своего имени (`employee_id = auth.uid()`).

### Решение 2: Атомарный контроль лицензий на уровне БД
1. Создать триггер в PostgreSQL для таблицы `computer_licenses`:
   ```sql
   CREATE OR REPLACE FUNCTION public.trg_fn_computer_licenses_seats()
   RETURNS trigger AS $$
   BEGIN
     IF TG_OP = 'INSERT' THEN
       UPDATE public.licenses
       SET used_seats = used_seats + 1
       WHERE id = NEW.license_id;
       RETURN NEW;
     ELSIF TG_OP = 'DELETE' THEN
       UPDATE public.licenses
       SET used_seats = used_seats - 1
       WHERE id = OLD.license_id;
       RETURN OLD;
     ELSIF TG_OP = 'UPDATE' THEN
       IF OLD.license_id IS DISTINCT FROM NEW.license_id THEN
         UPDATE public.licenses SET used_seats = used_seats - 1 WHERE id = OLD.license_id;
         UPDATE public.licenses SET used_seats = used_seats + 1 WHERE id = NEW.license_id;
       END IF;
       RETURN NEW;
     END IF;
     RETURN NULL;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```
2. Привязать его к таблице `computer_licenses`:
   ```sql
   CREATE TRIGGER trg_computer_licenses_seats
   AFTER INSERT OR UPDATE OR DELETE ON public.computer_licenses
   FOR EACH ROW EXECUTE FUNCTION public.trg_fn_computer_licenses_seats();
   ```
3. Добавить CHECK-ограничение:
   ```sql
   ALTER TABLE public.licenses ADD CONSTRAINT licenses_used_seats_limit CHECK (used_seats <= total_seats);
   ```
4. Удалить ручное изменение `used_seats` из Server Actions `lib/actions/licenses.ts` (функции `installSoftwareDialog` и `removeSoftware`). Теперь БД сама гарантирует точность подсчета и не позволит установить ПО сверх лимита на уровне транзакции.

### Решение 3: Реализация CRUD шаблонов сборок ПК
1. Создать схему `lib/schemas/computer_template.schema.ts` и Server Actions `lib/actions/computer_templates.ts`.
2. Создать страницы управления шаблонами в `app/(dashboard)/templates/page.tsx`, `app/(dashboard)/templates/new/page.tsx` и `app/(dashboard)/templates/[id]/edit/page.tsx`.
3. Добавить пункт "Шаблоны ПК" в боковое меню администратора (`Sidebar`).
4. Внедрить поле `template_id` в форму создания компьютера: при выборе шаблона заполнять поля CPU, RAM, HDD, GPU и тип устройства дефолтными значениями из шаблона.

### Решение 4: Отображение и скрытие лицензионных ключей
1. В `LicensesClientView.tsx` добавить отображение колонки "Ключ" или выводить его в раскрывающейся панели.
2. Использовать скрытый вид по умолчанию (например, `••••-••••-••••`) с иконкой "Глаз" (`Eye` / `EyeOff`), по клику на которую ключ временно отображается в открытом виде с возможностью копирования.
