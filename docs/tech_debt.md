# Журнал Технического Долга (Tech Debt)

Этот файл содержит список архитектурных задач и задач по рефакторингу, которые требуют вдумчивого подхода и отложены на будущее.

## 1. Строгая типизация (Отказ от `any`) - **ВЫПОЛНЕНО** ✅
В проекте используется приведение типов `as any` или нетипизированные массивы `any[]`, что отключает проверку TypeScript и может привести к ошибкам при изменении схемы БД.
**Где встречается:**
- `components/shared/RealtimeNotifications.tsx` (приведение payload.new)
- Страницы ИТ-портала (например, `app/(it-portal)/it-portal/page.tsx`)
- `proxy.ts` и `app/layout.tsx` (приведение ролей и сессий)
**Что сделано:**
Заменено `any` на актуальные типы, генерируемые Supabase (`Tables<'...'>`, `Enums<'...'>`).

## 2. Оптимизация React Compiler (Turbopack) - **ВЫПОЛНЕНО** ✅
Линтер сообщает, что использование `form.watch()` в некоторых компонентах ломает мемоизацию, что потенциально ведет к зависаниям или двойным рендерам.
**Где встречается:**
- `components/incidents/AddIncidentDialog.tsx`
- `components/licenses/AddLicenseDialog.tsx`
- `components/devices/EditDeviceDialog.tsx`
- `components/devices/LinkEmployeeDialog.tsx`
- `components/employees/AddEmployeeDialog.tsx`
**Что сделано:**
Переписаны формы, используя `useWatch` из `react-hook-form`. Устранены варнинги React Compiler.

## 3. Антипаттерн каскадного рендеринга
В компоненте переключения темы состояние обновляется синхронно прямо внутри `useEffect`. Это заставляет React рендерить компонент дважды.
**Где встречается:**
- `components/shared/ThemeToggle.tsx`
**Что нужно сделать:**
Использовать паттерн инициализации стейта лениво (через функцию в `useState`) или обновить логику работы с `window.matchMedia`, избегая прямого вызова `setTheme` внутри `useEffect` при монтировании.
