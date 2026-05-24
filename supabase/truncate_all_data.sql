-- ============================================================
-- CoreAsset — Полный сброс данных БД (без удаления таблиц)
-- Запуск через Supabase Dashboard → SQL Editor
-- ============================================================
-- Порядок TRUNCATE учитывает FK-зависимости:
--   software_installations → workplaces (дети)
--   затем основные таблицы с CASCADE
-- ============================================================

-- 1. Зависимые таблицы (FK-дети) — сначала их, чтобы избежать
--    конфликтов с циклическими ссылками
TRUNCATE TABLE software_installations CASCADE;
TRUNCATE TABLE workplaces CASCADE;

-- 2. Основные таблицы — CASCADE зачистит всё, что на них ссылается
TRUNCATE TABLE computers    CASCADE;
TRUNCATE TABLE employees    CASCADE;
TRUNCATE TABLE incidents    CASCADE;
TRUNCATE TABLE license_pools CASCADE;
TRUNCATE TABLE software     CASCADE;

-- 3. Сброс auto-increment / UUID-sequences
--    TRUNCATE ... RESET IDENTITY делает это автоматически,
--    но для таблиц с вручную заданными UUID (seed.sql)
--    нужно сбросить последовательности явно:
ALTER TABLE computers            RESTART IDENTITY;
ALTER TABLE employees            RESTART IDENTITY;
ALTER TABLE incidents            RESTART IDENTITY;
ALTER TABLE license_pools        RESTART IDENTITY;
ALTER TABLE software             RESTART IDENTITY;
ALTER TABLE software_installations RESTART IDENTITY;
ALTER TABLE workplaces           RESTART IDENTITY;

-- ============================================================
-- 4. Очистка auth.users — удаление фейковых демо-пользователей
--    Supabase Auth хранит пользователей в auth.users.
--    Если при тестировании создавались аккаунты с теми же email,
--    что и в seed.sql, они вызовут конфликт unique-констрейнта.
-- ============================================================

-- Удаление конкретного проблемного пользователя (ivanov@corp.ru):
DELETE FROM auth.users WHERE email = 'ivanov@corp.ru';

-- Удаление всех демо-пользователей из seed.sql (если они были
-- созданы через Supabase Auth):
DELETE FROM auth.users WHERE email IN (
  'ivanov@coreasset.ru',
  'petrova@coreasset.ru',
  'sidorov@coreasset.ru',
  'kozlova@coreasset.ru',
  'morozov@coreasset.ru',
  'novikova@coreasset.ru',
  'fedorov@coreasset.ru',
  'volkova@coreasset.ru',
  'kuznetsov@coreasset.ru',
  'lebedeva@coreasset.ru'
);

-- Если вы хотите удалить ВСЕХ пользователей (кроме текущего админа),
-- раскомментируйте следующую строку и подставьте свой admin-email:
-- DELETE FROM auth.users WHERE email <> 'your-admin@email.com';

-- ============================================================
-- Готово! Все таблицы пусты, ID начинаются с 1,
-- фейковые auth-пользователи удалены.
-- ============================================================