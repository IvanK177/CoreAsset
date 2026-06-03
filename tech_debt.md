# Технический долг — CoreAsset

В данном файле собран актуальный список технического долга проекта: ошибки линтинга (ESLint), потенциальные проблемы с производительностью и запланированные архитектурные улучшения для PWA и офлайн-режима.

---

## 🚨 1. Ошибки линтинга и качества кода (ESLint)
Всего обнаружено: **12 ошибок** и **5 предупреждений**. Они блокируют строгие проверки при сборке в CI/CD.

### А. Непосредственные вызовы `setState` внутри `useEffect` (`react-hooks/set-state-in-effect`)
Синхронная смена локального состояния в теле эффекта вызывает повторный рендер сразу после монтирования, ухудшая производительность.

| Файл | Строка | Описание |
| :--- | :--- | :--- |
| [`components/shared/ThemeToggle.tsx`](file:///c:/Users/TopMob/Documents/Projects/Ivank/CoreAsset/components/shared/ThemeToggle.tsx#L17) | 17 | Вызовы `setMounted(true)` и `setTheme` при монтировании компонента переключения темы. |
| [`app/(auth)/login/page.tsx`](file:///c:/Users/TopMob/Documents/Projects/Ivank/CoreAsset/app/(auth)/login/page.tsx#L47) | 47 | Вызов `setParamsMessage` во время чтения query-параметров при проверке ошибок входа. |
| [`components/TicketChat.tsx`](file:///c:/Users/TopMob/Documents/Projects/Ivank/CoreAsset/components/TicketChat.tsx#L96) | 96 | Синхронная установка сообщений `setMessages` для сверки оптимистичных сообщений при обновлении пропсов. |

### Б. Использование небезопасного типа `any` (`@typescript-eslint/no-explicit-any`)
Отключает проверки типов компилятором, увеличивая риск ошибок выполнения.

| Файл | Строка | Контекст |
| :--- | :--- | :--- |
| [`lib/supabase/client.ts`](file:///c:/Users/TopMob/Documents/Projects/Ivank/CoreAsset/lib/supabase/client.ts#L22) | 22 | Инициализация клиента Supabase. |
| [`lib/actions/auth.ts`](file:///c:/Users/TopMob/Documents/Projects/Ivank/CoreAsset/lib/actions/auth.ts#L54) | 54 | Данные сессии пользователя в Server Action. |
| [`app/(auth)/login/actions.ts`](file:///c:/Users/TopMob/Documents/Projects/Ivank/CoreAsset/app/(auth)/login/actions.ts#L278) | 278 | Обработка данных формы авторизации. |
| [`app/(auth)/reset-password/page.tsx`](file:///c:/Users/TopMob/Documents/Projects/Ivank/CoreAsset/app/(auth)/reset-password/page.tsx#L13) | 13 | Параметры страницы сброса пароля. |
| [`components/TicketChat.tsx`](file:///c:/Users/TopMob/Documents/Projects/Ivank/CoreAsset/components/TicketChat.tsx#L160) | 160, 177, 198, 204, 244 | Realtime-канал Supabase, обработчики событий подписки и получение данных чата. |

### В. Неиспользуемый импорт / переменные (`@typescript-eslint/no-unused-vars`)
Лишний код, засоряющий сборку.

* [`lib/actions/support.ts`](file:///c:/Users/TopMob/Documents/Projects/Ivank/CoreAsset/lib/actions/support.ts#L3-L4) (строки 3, 4): Импортированные `createClient` и `cookies` не используются.
* [`app/(common)/layout.tsx`](file:///c:/Users/TopMob/Documents/Projects/Ivank/CoreAsset/app/(common)/layout.tsx#L2) (строка 2): Импортированный тип `Tables` не используется.
* [`components/TicketChat.tsx`](file:///c:/Users/TopMob/Documents/Projects/Ivank/CoreAsset/components/TicketChat.tsx#L6) (строка 6): Импортированная иконка `ImageIcon` (`Image`) не используется.

### Г. Отсутствие зависимостей эффекта (`react-hooks/exhaustive-deps`)
* [`components/TicketChat.tsx`](file:///c:/Users/TopMob/Documents/Projects/Ivank/CoreAsset/components/TicketChat.tsx#L131) (строка 131): В `useEffect` используется объект `senderDetails` для кэширования профилей, но он не добавлен в массив зависимостей. Это может приводить к устареванию данных отправителей сообщений в реальном времени.

---

## 🛠️ 2. Архитектурные задачи и стабильность PWA
Задачи по улучшению UX на мобильных устройствах, складах и при слабом интернет-соединении (на основе исследований в `docs/ai_architecture_insights.md`).

### А. Оповещение об обновлении PWA (PWA Update Prompt)
* **Проблема:** Браузеры активно кэшируют Service Worker. При выходе новой версии приложения пользователи могут долго оставаться на старых файлах/интерфейсе, пока не закроют все вкладки.
* **Решение:** Доработать `PWARegister.tsx` и `sw.js` для перехвата событий `updatefound` и `controllerchange` и выводить UI-плашку (Toast): *"Доступна новая версия. Обновить"* для принудительного обновления через `skipWaiting()`.

### Б. Офлайн-режим для форм (Offline Queue / Smart Forms)
* **Проблема:** Сейчас при смене статуса инцидента или редактировании устройства на выезде/складе с плохой связью запросы падают с ошибками сети.
* **Решение:** 
  1. Реализовать перехват сетевых ошибок в мутациях (функция `isLikelyNetworkError`).
  2. Добавить локальное IndexedDB хранилище (`localforage` / `offlineStore`).
  3. Сохранять мутации во временную очередь и автоматически отправлять их на сервер через `SyncProvider` при восстановлении сети (событие `online`).

### В. Клиентский кэш справочников без Hydration Mismatch
* **Проблема:** Загрузка полных списков сотрудников и оборудования при открытии модальных окон замедляет работу.
* **Решение:** Кэшировать справочники на клиенте в IndexedDB и рендерить UI по схеме: *Skeleton -> Локальный кэш -> Фоновое обновление с сервера*. Это предотвратит появление ошибок несоответствия гидратации (Hydration Mismatch) в Next.js.
