-- ============================================================
-- CoreAsset — Seed-данные (профессиональный реалистичный массив)
-- Запуск:  npx supabase db seed
--           или через Supabase Dashboard → SQL Editor
-- ============================================================

-- 0. Очистка существующих данных (кроме employees!)
TRUNCATE TABLE 
  public.device_licenses, 
  public.incident_messages, 
  public.incidents, 
  public.devices, 
  public.room_requests, 
  public.support_requests, 
  public.licenses, 
  public.computer_templates 
CASCADE;

-- ============================================================
-- 1. computer_templates — Шаблоны конфигураций устройств
-- ============================================================
INSERT INTO public.computer_templates (id, name, description, computer_type, hardware) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Офисный ПК Стандарт', 'Рабочая станция для офисных сотрудников', 'desktop', '{"cpu": "Intel Core i5-12400", "ram": "16 GB DDR4", "storage": "512 GB SSD NVMe", "gpu": "Intel UHD Graphics 730"}'),
  ('00000000-0000-0000-0000-000000000002', 'Ноутбук Разработчика Pro', 'Мобильная рабочая станция для программирования и разработки', 'laptop', '{"cpu": "Apple M3 Pro", "ram": "32 GB", "storage": "1 TB SSD", "gpu": "Apple 18-core GPU"}'),
  ('00000000-0000-0000-0000-000000000003', 'ПК Дизайнера Мощный', 'Высокопроизводительная станция для графического дизайна и видео', 'desktop', '{"cpu": "Intel Core i7-13700", "ram": "32 GB DDR5", "storage": "1 TB SSD NVMe", "gpu": "NVIDIA RTX 4060"}'),
  ('00000000-0000-0000-0000-000000000004', 'Терминал Бюджетный', 'Компактный неттоп для базовых задач бухгалтерии и секретариата', 'desktop', '{"cpu": "Intel Core i3-12100", "ram": "8 GB DDR4", "storage": "256 GB SSD", "gpu": "Intel UHD Graphics 730"}');

-- ============================================================
-- 2. devices — Список оборудования
-- ============================================================
INSERT INTO public.devices (id, inventory_number, serial_number, computer_type, room, device_type, lifecycle_status, hardware, template_id, employee_id) VALUES
  -- Рабочие компьютеры сотрудников
  ('10000000-0000-0000-0000-000000000001', 'CA-PC-001', 'SN-OFFICE-001', 'desktop', '101', 'pc'::device_type, 'active'::computer_status, '{"cpu": "Intel Core i5-12400", "ram": "16 GB DDR4", "storage": "512 GB SSD NVMe", "gpu": "Intel UHD Graphics 730"}', '00000000-0000-0000-0000-000000000001', '689eed46-7a0b-4e2f-bb51-717585ce0e21'),
  ('10000000-0000-0000-0000-000000000002', 'CA-PC-002', 'SN-DEV-001', 'laptop', '204', 'pc'::device_type, 'active'::computer_status, '{"cpu": "Apple M3 Pro", "ram": "32 GB", "storage": "1 TB SSD", "gpu": "Apple 18-core GPU"}', '00000000-0000-0000-0000-000000000002', 'f3e4523e-3f0e-49d5-b229-18ed555fc675'),
  ('10000000-0000-0000-0000-000000000003', 'CA-PC-003', 'SN-DESIGN-001', 'desktop', '102', 'pc'::device_type, 'active'::computer_status, '{"cpu": "Intel Core i7-13700", "ram": "32 GB DDR5", "storage": "1 TB SSD NVMe", "gpu": "NVIDIA RTX 4060"}', '00000000-0000-0000-0000-000000000003', '93ac4a41-f75e-4495-9470-86f80f891105'),
  ('10000000-0000-0000-0000-000000000004', 'CA-PC-004', 'SN-BUDGET-001', 'desktop', '101', 'pc'::device_type, 'active'::computer_status, '{"cpu": "Intel Core i3-12100", "ram": "8 GB DDR4", "storage": "256 GB SSD", "gpu": "Intel UHD Graphics 730"}', '00000000-0000-0000-0000-000000000004', '96459dfc-bda5-47c1-b379-2bebe1ec536a'),
  
  -- Склад и Ремонт
  ('10000000-0000-0000-0000-000000000005', 'CA-PC-005', 'SN-DEV-002', 'laptop', 'Склад', 'pc'::device_type, 'storage'::computer_status, '{"cpu": "Apple M3 Pro", "ram": "32 GB", "storage": "1 TB SSD", "gpu": "Apple 18-core GPU"}', '00000000-0000-0000-0000-000000000002', NULL),
  ('10000000-0000-0000-0000-000000000006', 'CA-PC-006', 'SN-OFFICE-002', 'desktop', '105', 'pc'::device_type, 'repair'::computer_status, '{"cpu": "Intel Core i5-12400", "ram": "16 GB DDR4", "storage": "512 GB SSD NVMe", "gpu": "Intel UHD Graphics 730"}', '00000000-0000-0000-0000-000000000001', NULL),
  
  -- Мониторы
  ('10000000-0000-0000-0000-000000000007', 'CA-MON-001', 'SN-DELL-2723', 'Dell UltraSharp U2723QE', '101', 'monitor'::device_type, 'active'::computer_status, '{"diagonal": "27 дюймов", "resolution": "3840x2160"}', NULL, '689eed46-7a0b-4e2f-bb51-717585ce0e21'),
  ('10000000-0000-0000-0000-000000000008', 'CA-MON-002', 'SN-LG-27GP850', 'LG UltraGear 27GP850-B', '102', 'monitor'::device_type, 'active'::computer_status, '{"diagonal": "27 дюймов", "resolution": "2560x1440"}', NULL, '93ac4a41-f75e-4495-9470-86f80f891105'),
  ('10000000-0000-0000-0000-000000000009', 'CA-MON-003', 'SN-SAMSUNG-24', 'Samsung Essential S3', '101', 'monitor'::device_type, 'active'::computer_status, '{"diagonal": "24 дюйма", "resolution": "1920x1080"}', NULL, '96459dfc-bda5-47c1-b379-2bebe1ec536a'),
  ('10000000-0000-0000-0000-000000000010', 'CA-MON-004', 'SN-DELL-24', 'Dell P2422H', 'Склад', 'monitor'::device_type, 'storage'::computer_status, '{"diagonal": "24 дюйма", "resolution": "1920x1080"}', NULL, NULL),

  -- Принтеры
  ('10000000-0000-0000-0000-000000000011', 'CA-PRN-001', 'SN-HP-M428', 'HP LaserJet Pro MFP M428fdw', '101', 'printer'::device_type, 'active'::computer_status, '{}', NULL, NULL),
  ('10000000-0000-0000-0000-000000000012', 'CA-PRN-002', 'SN-KYOCERA-2040', 'Kyocera ECOSYS M2040dn', '204', 'printer'::device_type, 'active'::computer_status, '{}', NULL, NULL),

  -- Периферия
  ('10000000-0000-0000-0000-000000000013', 'CA-KB-001', 'SN-LOGI-KEYS', 'Logitech MX Keys S', '101', 'keyboard'::device_type, 'active'::computer_status, '{}', NULL, '689eed46-7a0b-4e2f-bb51-717585ce0e21'),
  ('10000000-0000-0000-0000-000000000014', 'CA-MSE-001', 'SN-LOGI-M3S', 'Logitech MX Master 3S', '101', 'mouse'::device_type, 'active'::computer_status, '{}', NULL, '689eed46-7a0b-4e2f-bb51-717585ce0e21');

-- ============================================================
-- 3. licenses — Программное обеспечение и лицензионные ключи
-- ============================================================
INSERT INTO public.licenses (id, software_name, version, vendor, license_type, license_key, total_seats, used_seats, price_per_unit, expires_at, notes) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Microsoft Windows 11 Enterprise', '23H2', 'Microsoft', 'subscription'::license_type, 'W269N-WFGWX-YVC9B-4J6C9-T83GX', 20, 3, 15.00, '2026-12-31', 'Корпоративная подписка на ОС'),
  ('20000000-0000-0000-0000-000000000002', 'JetBrains All Products Pack', '2024.1', 'JetBrains', 'subscription'::license_type, 'JB-8827-KEY-9912', 5, 1, 249.00, '2026-08-15', 'Подписки для разработчиков'),
  ('20000000-0000-0000-0000-000000000003', 'Adobe Creative Cloud All Apps', '2024', 'Adobe', 'subscription'::license_type, 'ADOBE-CC-9912-8821', 3, 1, 549.99, '2026-06-15', 'Лицензия для дизайнеров'),
  ('20000000-0000-0000-0000-000000000004', 'Kaspersky Endpoint Security', '12.1', 'Kaspersky', 'perpetual'::license_type, 'KASP-KEY-SECURITY-99', 50, 0, 25.50, NULL, 'Антивирусная корпоративная защита'),
  ('20000000-0000-0000-0000-000000000005', '1C:Enterprise 8', '8.3', '1С', 'perpetual'::license_type, '1C-ENT-83-BOOH-9912', 10, 0, 120.00, NULL, 'Лицензии для бухгалтерии и склада');

-- ============================================================
-- 4. device_licenses — Установка лицензий на устройства
-- ============================================================
INSERT INTO public.device_licenses (id, device_id, license_id, installed_at) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2025-01-15T10:00:00Z'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '2025-02-01T09:00:00Z'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '2025-03-10T11:00:00Z'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '2025-02-01T09:30:00Z'),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '2025-03-10T11:15:00Z');

-- ============================================================
-- 5. incidents — Заявки / Инциденты
-- ============================================================
INSERT INTO public.incidents (id, title, description, incident_type, priority, status, device_id, employee_id, assigned_to, created_at, resolved_at, resolution) VALUES
  ('40000000-0000-0000-0000-000000000001', 'Не работает доступ к сети Интернет', 'Компьютер подключен к Wi-Fi, но страницы не загружаются. Выдает DNS error.', 'network'::incident_type, 'high'::incident_priority, 'in_progress'::incident_status, '10000000-0000-0000-0000-000000000001', '689eed46-7a0b-4e2f-bb51-717585ce0e21', 'f3e4523e-3f0e-49d5-b229-18ed555fc675', NOW() - INTERVAL '1 day', NULL, NULL),
  ('40000000-0000-0000-0000-000000000002', 'Пролился кофе на клавиатуру ноутбука', 'Ноутбук случайно залили сладким кофе. Некоторые клавиши залипают, тачпад работает нестабильно.', 'hardware'::incident_type, 'critical'::incident_priority, 'open'::incident_status, '10000000-0000-0000-0000-000000000002', 'f3e4523e-3f0e-49d5-b229-18ed555fc675', NULL, NOW() - INTERVAL '2 hours', NULL, NULL),
  ('40000000-0000-0000-0000-000000000003', 'Гул и перегрев процессора ПК', 'При запуске ресурсоемких приложений вентилятор сильно гудит, температура CPU достигает 90 градусов.', 'hardware'::incident_type, 'medium'::incident_priority, 'resolved'::incident_status, '10000000-0000-0000-0000-000000000003', '93ac4a41-f75e-4495-9470-86f80f891105', 'f3e4523e-3f0e-49d5-b229-18ed555fc675', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', 'Произведена чистка системного блока от пыли, заменена термопаста на процессоре. Температура под нагрузкой стабильна, не превышает 65 градусов.'),
  ('40000000-0000-0000-0000-000000000004', 'Не запускается 1С:Бухгалтерия', 'При старте программы выдает ошибку лицензии. Бухгалтерия простаивает.', 'software'::incident_type, 'high'::incident_priority, 'resolved'::incident_status, '10000000-0000-0000-0000-000000000004', '96459dfc-bda5-47c1-b379-2bebe1ec536a', 'f3e4523e-3f0e-49d5-b229-18ed555fc675', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', 'Обновлен сетевой драйвер HASP-ключа, перезапущена служба лицензирования. Доступ к 1С восстановлен.'),
  ('40000000-0000-0000-0000-000000000005', 'Мерцает экран монитора', 'Монитор Dell мерцает с частотой примерно раз в секунду. Проверено подключение кабеля.', 'hardware'::incident_type, 'medium'::incident_priority, 'open'::incident_status, '10000000-0000-0000-0000-000000000007', '689eed46-7a0b-4e2f-bb51-717585ce0e21', NULL, NOW() - INTERVAL '4 hours', NULL, NULL);

-- ============================================================
-- 6. incident_messages — Сообщения чата инцидентов
-- ============================================================
INSERT INTO public.incident_messages (id, incident_id, sender_id, text, created_at) VALUES
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '689eed46-7a0b-4e2f-bb51-717585ce0e21', 'Добрый день! Подскажите, когда сможете посмотреть интернет? Очень нужно выгрузить отчеты.', NOW() - INTERVAL '20 hours'),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'f3e4523e-3f0e-49d5-b229-18ed555fc675', 'Здравствуйте! Сейчас занимаюсь этой заявкой. Проверьте, пожалуйста, включен ли VPN или прокси-сервер?', NOW() - INTERVAL '19 hours'),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '689eed46-7a0b-4e2f-bb51-717585ce0e21', 'VPN выключен, прокси в настройках браузера тоже сняла. Другие компьютеры в нашей комнате работают нормально.', NOW() - INTERVAL '18 hours'),
  ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', 'f3e4523e-3f0e-49d5-b229-18ed555fc675', 'Понял, тогда дело в сетевой розетке или в кабеле. Зайду к вам после обеда, проверю физическое подключение.', NOW() - INTERVAL '17 hours');

-- ============================================================
-- 7. room_requests — Заявки АХЧ
-- ============================================================
INSERT INTO public.room_requests (id, room, type, description, status, author_id, assigned_to, priority, created_at, resolution) VALUES
  ('60000000-0000-0000-0000-000000000001', '102', 'Электрика', 'Искрит розетка при подключении зарядного устройства ноутбука. Прошу отремонтировать или заменить розетку.', 'open', '93ac4a41-f75e-4495-9470-86f80f891105', NULL, 'high', NOW() - INTERVAL '1 day', NULL),
  ('60000000-0000-0000-0000-000000000002', '204', 'Кондиционирование', 'Кондиционер течет прямо на рабочий стол. Требуется чистка дренажа.', 'in_progress', '689eed46-7a0b-4e2f-bb51-717585ce0e21', 'f0000000-0000-0000-0000-000000000001', 'medium', NOW() - INTERVAL '12 hours', NULL),
  ('60000000-0000-0000-0000-000000000003', '101', 'Освещение', 'Перегорели три светодиодные лампы в потолочном светильнике. В комнате стало очень темно работать.', 'resolved', '96459dfc-bda5-47c1-b379-2bebe1ec536a', 'f0000000-0000-0000-0000-000000000001', 'low', NOW() - INTERVAL '4 days', 'Заменены перегоревшие лампы T8 в количестве 3 штук. Освещенность восстановлена.');

-- ============================================================
-- 8. support_requests — Обращения в поддержку портала
-- ============================================================
INSERT INTO public.support_requests (id, author_id, message, status, created_at) VALUES
  ('70000000-0000-0000-0000-000000000001', 'f3e4523e-3f0e-49d5-b229-18ed555fc675', 'Хотелось бы иметь возможность экспортировать список устройств в CSV или Excel для отправки отчетов руководству.', 'open', NOW() - INTERVAL '1 day'),
  ('70000000-0000-0000-0000-000000000002', '689eed46-7a0b-4e2f-bb51-717585ce0e21', 'Было бы удобно получать Telegram-оповещения, когда статус моей заявки меняется или в чате появляется новое сообщение.', 'open', NOW() - INTERVAL '12 hours');