-- ============================================================================
-- ICELOOK SEED DATA
-- ============================================================================
-- Realistic seed data for development and testing
-- ============================================================================

-- ============================================================================
-- 1. CREATE TEST USERS IN AUTH.USERS
-- ============================================================================

-- Helper function to create auth users (needed before profiles)
DO $$
DECLARE
  user_id_1 uuid := 'a1111111-1111-1111-1111-111111111111';
  user_id_2 uuid := 'a2222222-2222-2222-2222-222222222222';
  user_id_3 uuid := 'a3333333-3333-3333-3333-333333333333';
  user_id_4 uuid := 'a4444444-4444-4444-4444-444444444444';
  user_id_5 uuid := 'a5555555-5555-5555-5555-555555555555';
  user_id_6 uuid := 'a6666666-6666-6666-6666-666666666666';
  user_id_7 uuid := 'a7777777-7777-7777-7777-777777777777';
  user_id_8 uuid := 'a8888888-8888-8888-8888-888888888888';
  user_id_9 uuid := 'a9999999-9999-9999-9999-999999999999';
  user_id_10 uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
BEGIN
  -- Insert auth users (profiles will be created by trigger)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, instance_id, aud, role)
  VALUES
    -- Beauty page owners (creators)
    (user_id_1, 'olena.koval@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(),
     '{"full_name": "Олена Коваль", "avatar_url": null}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (user_id_2, 'dmytro.shevchenko@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(),
     '{"full_name": "Дмитро Шевченко", "avatar_url": null}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (user_id_3, 'maria.bondar@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(),
     '{"full_name": "Марія Бондар", "avatar_url": null}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),

    -- Regular clients
    (user_id_4, 'ivan.petrenko@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(),
     '{"full_name": "Іван Петренко", "avatar_url": null}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (user_id_5, 'anna.sydorenko@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(),
     '{"full_name": "Анна Сидоренко", "avatar_url": null}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (user_id_6, 'viktor.melnyk@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(),
     '{"full_name": "Віктор Мельник", "avatar_url": null}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (user_id_7, 'yulia.tkachenko@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(),
     '{"full_name": "Юлія Ткаченко", "avatar_url": null}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (user_id_8, 'serhii.moroz@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(),
     '{"full_name": "Сергій Мороз", "avatar_url": null}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (user_id_9, 'oksana.lysenko@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(),
     '{"full_name": "Оксана Лисенко", "avatar_url": null}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
    (user_id_10, 'taras.boyko@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(),
     '{"full_name": "Тарас Бойко", "avatar_url": null}'::jsonb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================================
-- 2. UPDATE PROFILE DETAILS
-- ============================================================================

UPDATE public.profiles SET phone = '+380501234567', preferred_locale = 'uk' WHERE id = 'a1111111-1111-1111-1111-111111111111';
UPDATE public.profiles SET phone = '+380502345678', preferred_locale = 'uk' WHERE id = 'a2222222-2222-2222-2222-222222222222';
UPDATE public.profiles SET phone = '+380503456789', preferred_locale = 'uk' WHERE id = 'a3333333-3333-3333-3333-333333333333';
UPDATE public.profiles SET phone = '+380504567890', preferred_locale = 'uk' WHERE id = 'a4444444-4444-4444-4444-444444444444';
UPDATE public.profiles SET phone = '+380505678901', preferred_locale = 'en' WHERE id = 'a5555555-5555-5555-5555-555555555555';
UPDATE public.profiles SET phone = '+380506789012', preferred_locale = 'uk' WHERE id = 'a6666666-6666-6666-6666-666666666666';
UPDATE public.profiles SET phone = '+380507890123', preferred_locale = 'en' WHERE id = 'a7777777-7777-7777-7777-777777777777';
UPDATE public.profiles SET phone = '+380508901234', preferred_locale = 'uk' WHERE id = 'a8888888-8888-8888-8888-888888888888';
UPDATE public.profiles SET phone = '+380509012345', preferred_locale = 'uk' WHERE id = 'a9999999-9999-9999-9999-999999999999';
UPDATE public.profiles SET phone = '+380500123456', preferred_locale = 'uk' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- ============================================================================
-- 3. BEAUTY PAGES
-- ============================================================================

-- Get type IDs
DO $$
DECLARE
  barbershop_type_id uuid;
  hair_salon_type_id uuid;
  nail_salon_type_id uuid;

  bp_olena uuid := 'b1111111-1111-1111-1111-111111111111';
  bp_dmytro uuid := 'b2222222-2222-2222-2222-222222222222';
  bp_maria uuid := 'b3333333-3333-3333-3333-333333333333';
BEGIN
  SELECT id INTO barbershop_type_id FROM public.beauty_page_types WHERE slug = 'barbershop';
  SELECT id INTO hair_salon_type_id FROM public.beauty_page_types WHERE slug = 'hair_salon';
  SELECT id INTO nail_salon_type_id FROM public.beauty_page_types WHERE slug = 'nail_salon';

  -- Olena's Hair Salon
  INSERT INTO public.beauty_pages (
    id, name, slug, type_id, owner_id,
    logo_url, description,
    display_name, avatar_url, bio,
    address, city, postal_code, country_code,
    phone, email, website_url, instagram_url,
    currency, timezone, auto_confirm_bookings, min_booking_notice_hours, max_days_ahead, cancellation_notice_hours,
    is_active, is_verified
  ) VALUES (
    bp_olena, 'Hair Studio Олена', 'olena-hair', hair_salon_type_id, 'a1111111-1111-1111-1111-111111111111',
    NULL, 'Професійний догляд за волоссям. Стрижки, фарбування, укладки для жінок та чоловіків.',
    'Олена Коваль', NULL, 'Стиліст-перукар з 8-річним досвідом. Спеціалізуюсь на складному фарбуванні та відновленні волосся.',
    'вул. Хрещатик, 15', 'Київ', '01001', 'UA',
    '+380501234567', 'olena.hair@example.com', NULL, 'https://instagram.com/olena.hair',
    'UAH', 'Europe/Kyiv', false, 2, 60, 24,
    true, true
  ) ON CONFLICT (id) DO NOTHING;

  -- Dmytro's Barbershop
  INSERT INTO public.beauty_pages (
    id, name, slug, type_id, owner_id,
    logo_url, description,
    display_name, avatar_url, bio,
    address, city, postal_code, country_code,
    phone, email, website_url, instagram_url,
    currency, timezone, auto_confirm_bookings, min_booking_notice_hours, max_days_ahead, cancellation_notice_hours,
    is_active, is_verified
  ) VALUES (
    bp_dmytro, 'Барбершоп Дмитро', 'dmytro-barber', barbershop_type_id, 'a2222222-2222-2222-2222-222222222222',
    NULL, 'Класичний барбершоп для чоловіків. Стрижки, бороди, гоління.',
    'Дмитро Шевченко', NULL, 'Барбер з 5-річним досвідом. Люблю класичні чоловічі стрижки та догляд за бородою.',
    'вул. Шевченка, 25', 'Львів', '79000', 'UA',
    '+380502345678', 'dmytro.barber@example.com', NULL, 'https://instagram.com/dmytro.barber',
    'UAH', 'Europe/Kyiv', true, 1, 30, 12,
    true, false
  ) ON CONFLICT (id) DO NOTHING;

  -- Maria's Nail Studio
  INSERT INTO public.beauty_pages (
    id, name, slug, type_id, owner_id,
    logo_url, description,
    display_name, avatar_url, bio,
    address, city, postal_code, country_code,
    phone, email, website_url, instagram_url,
    currency, timezone, auto_confirm_bookings, min_booking_notice_hours, max_days_ahead, cancellation_notice_hours,
    is_active, is_verified
  ) VALUES (
    bp_maria, 'Nail Art Марія', 'maria-nails', nail_salon_type_id, 'a3333333-3333-3333-3333-333333333333',
    NULL, 'Манікюр, педикюр, nail art. Використовую тільки якісні матеріали.',
    'Марія Бондар', NULL, 'Майстер нігтьового сервісу з 6-річним досвідом. Спеціалізуюсь на арт-дизайні.',
    'вул. Сумська, 10', 'Харків', '61000', 'UA',
    '+380503456789', 'maria.nails@example.com', NULL, 'https://instagram.com/maria.nails',
    'UAH', 'Europe/Kyiv', false, 4, 45, 24,
    true, true
  ) ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================================
-- 4. SERVICE GROUPS AND SERVICES
-- ============================================================================

-- Olena's Hair Salon Services
INSERT INTO public.service_groups (id, beauty_page_id, name, display_order) VALUES
  ('sg111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Стрижки', 1),
  ('sg111111-1111-1111-1111-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Фарбування', 2),
  ('sg111111-1111-1111-1111-333333333333', 'b1111111-1111-1111-1111-111111111111', 'Укладки', 3),
  ('sg111111-1111-1111-1111-444444444444', 'b1111111-1111-1111-1111-111111111111', 'Догляд', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.services (id, service_group_id, name, description, price_cents, duration_minutes, display_order) VALUES
  -- Стрижки
  ('s1111111-1111-1111-1111-111111111111', 'sg111111-1111-1111-1111-111111111111', 'Жіноча стрижка', 'Стрижка будь-якої довжини', 60000, 60, 1),
  ('s1111111-1111-1111-1111-111111111112', 'sg111111-1111-1111-1111-111111111111', 'Чоловіча стрижка', 'Класична чоловіча стрижка', 40000, 45, 2),
  ('s1111111-1111-1111-1111-111111111113', 'sg111111-1111-1111-1111-111111111111', 'Дитяча стрижка', 'Для дітей до 12 років', 30000, 30, 3),
  -- Фарбування
  ('s1111111-1111-1111-1111-222222222221', 'sg111111-1111-1111-1111-222222222222', 'Фарбування коренів', 'Тонування коренів в один тон', 80000, 90, 1),
  ('s1111111-1111-1111-1111-222222222222', 'sg111111-1111-1111-1111-222222222222', 'Повне фарбування', 'Фарбування по всій довжині', 150000, 120, 2),
  ('s1111111-1111-1111-1111-222222222223', 'sg111111-1111-1111-1111-222222222222', 'Мелірування', 'Освітлення прядей', 180000, 150, 3),
  ('s1111111-1111-1111-1111-222222222224', 'sg111111-1111-1111-1111-222222222222', 'Балаяж', 'Техніка плавного переходу кольору', 250000, 180, 4),
  -- Укладки
  ('s1111111-1111-1111-1111-333333333331', 'sg111111-1111-1111-1111-333333333333', 'Святкова укладка', 'Укладка на свято або захід', 70000, 60, 1),
  ('s1111111-1111-1111-1111-333333333332', 'sg111111-1111-1111-1111-333333333333', 'Повсякденна укладка', 'Швидка укладка феном', 40000, 30, 2),
  -- Догляд
  ('s1111111-1111-1111-1111-444444444441', 'sg111111-1111-1111-1111-444444444444', 'Кератинове відновлення', 'Процедура глибокого відновлення волосся', 200000, 120, 1),
  ('s1111111-1111-1111-1111-444444444442', 'sg111111-1111-1111-1111-444444444444', 'Маска для волосся', 'Живильна маска', 30000, 20, 2)
ON CONFLICT (id) DO NOTHING;

-- Dmytro's Barbershop Services
INSERT INTO public.service_groups (id, beauty_page_id, name, display_order) VALUES
  ('sg222222-2222-2222-2222-111111111111', 'b2222222-2222-2222-2222-222222222222', 'Стрижки', 1),
  ('sg222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Борода', 2),
  ('sg222222-2222-2222-2222-333333333333', 'b2222222-2222-2222-2222-222222222222', 'Комбо', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.services (id, service_group_id, name, description, price_cents, duration_minutes, display_order) VALUES
  -- Стрижки
  ('s2222222-2222-2222-2222-111111111111', 'sg222222-2222-2222-2222-111111111111', 'Класична стрижка', 'Стрижка ножицями', 35000, 40, 1),
  ('s2222222-2222-2222-2222-111111111112', 'sg222222-2222-2222-2222-111111111111', 'Стрижка машинкою', 'Коротка стрижка машинкою', 25000, 30, 2),
  ('s2222222-2222-2222-2222-111111111113', 'sg222222-2222-2222-2222-111111111111', 'Фейд', 'Плавний перехід', 40000, 45, 3),
  -- Борода
  ('s2222222-2222-2222-2222-222222222221', 'sg222222-2222-2222-2222-222222222222', 'Стрижка бороди', 'Оформлення бороди', 20000, 20, 1),
  ('s2222222-2222-2222-2222-222222222222', 'sg222222-2222-2222-2222-222222222222', 'Гоління небезпечною бритвою', 'Класичне гоління', 30000, 30, 2),
  ('s2222222-2222-2222-2222-222222222223', 'sg222222-2222-2222-2222-222222222222', 'Догляд за бородою', 'Масла та бальзами', 15000, 15, 3),
  -- Комбо
  ('s2222222-2222-2222-2222-333333333331', 'sg222222-2222-2222-2222-333333333333', 'Стрижка + борода', 'Комплексна послуга', 50000, 60, 1),
  ('s2222222-2222-2222-2222-333333333332', 'sg222222-2222-2222-2222-333333333333', 'Повний догляд', 'Стрижка + борода + гоління', 70000, 80, 2)
ON CONFLICT (id) DO NOTHING;

-- Maria's Nail Studio Services
INSERT INTO public.service_groups (id, beauty_page_id, name, display_order) VALUES
  ('sg333333-3333-3333-3333-111111111111', 'b3333333-3333-3333-3333-333333333333', 'Манікюр', 1),
  ('sg333333-3333-3333-3333-222222222222', 'b3333333-3333-3333-3333-333333333333', 'Педикюр', 2),
  ('sg333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'Nail Art', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.services (id, service_group_id, name, description, price_cents, duration_minutes, display_order) VALUES
  -- Манікюр
  ('s3333333-3333-3333-3333-111111111111', 'sg333333-3333-3333-3333-111111111111', 'Класичний манікюр', 'Обрізний манікюр', 35000, 45, 1),
  ('s3333333-3333-3333-3333-111111111112', 'sg333333-3333-3333-3333-111111111111', 'Апаратний манікюр', 'Манікюр апаратом', 40000, 50, 2),
  ('s3333333-3333-3333-3333-111111111113', 'sg333333-3333-3333-3333-111111111111', 'Манікюр з покриттям', 'Манікюр + гель-лак', 55000, 75, 3),
  ('s3333333-3333-3333-3333-111111111114', 'sg333333-3333-3333-3333-111111111111', 'Зняття покриття', 'Зняття гель-лаку', 15000, 20, 4),
  -- Педикюр
  ('s3333333-3333-3333-3333-222222222221', 'sg333333-3333-3333-3333-222222222222', 'Класичний педикюр', 'Обрізний педикюр', 45000, 60, 1),
  ('s3333333-3333-3333-3333-222222222222', 'sg333333-3333-3333-3333-222222222222', 'Апаратний педикюр', 'Педикюр апаратом', 50000, 70, 2),
  ('s3333333-3333-3333-3333-222222222223', 'sg333333-3333-3333-3333-222222222222', 'Педикюр з покриттям', 'Педикюр + гель-лак', 65000, 90, 3),
  -- Nail Art
  ('s3333333-3333-3333-3333-333333333331', 'sg333333-3333-3333-3333-333333333333', 'Простий дизайн', 'Мінімалістичний дизайн', 10000, 15, 1),
  ('s3333333-3333-3333-3333-333333333332', 'sg333333-3333-3333-3333-333333333333', 'Складний дизайн', 'Художній розпис', 25000, 30, 2),
  ('s3333333-3333-3333-3333-333333333333', 'sg333333-3333-3333-3333-333333333333', 'Стемпінг', 'Дизайн стемпінгом', 15000, 20, 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. WORKING DAYS (next 14 days)
-- ============================================================================

-- Generate working days for each beauty page
DO $$
DECLARE
  d date;
  day_of_week int;
BEGIN
  -- Olena's Hair Salon (Mon-Sat, 9:00-19:00)
  FOR d IN SELECT generate_series(current_date, current_date + interval '14 days', interval '1 day')::date LOOP
    day_of_week := EXTRACT(DOW FROM d);
    IF day_of_week BETWEEN 1 AND 6 THEN -- Mon-Sat
      INSERT INTO public.working_days (beauty_page_id, date, start_time, end_time)
      VALUES ('b1111111-1111-1111-1111-111111111111', d, '09:00'::time, '19:00'::time)
      ON CONFLICT (beauty_page_id, date) DO NOTHING;
    END IF;
  END LOOP;

  -- Dmytro's Barbershop (Tue-Sun, 10:00-20:00)
  FOR d IN SELECT generate_series(current_date, current_date + interval '14 days', interval '1 day')::date LOOP
    day_of_week := EXTRACT(DOW FROM d);
    IF day_of_week = 0 OR day_of_week BETWEEN 2 AND 6 THEN -- Tue-Sun (0=Sun, 2-6=Tue-Sat)
      INSERT INTO public.working_days (beauty_page_id, date, start_time, end_time)
      VALUES ('b2222222-2222-2222-2222-222222222222', d, '10:00'::time, '20:00'::time)
      ON CONFLICT (beauty_page_id, date) DO NOTHING;
    END IF;
  END LOOP;

  -- Maria's Nail Studio (Mon-Fri, 10:00-18:00)
  FOR d IN SELECT generate_series(current_date, current_date + interval '14 days', interval '1 day')::date LOOP
    day_of_week := EXTRACT(DOW FROM d);
    IF day_of_week BETWEEN 1 AND 5 THEN -- Mon-Fri
      INSERT INTO public.working_days (beauty_page_id, date, start_time, end_time)
      VALUES ('b3333333-3333-3333-3333-333333333333', d, '10:00'::time, '18:00'::time)
      ON CONFLICT (beauty_page_id, date) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 6. BUSINESS HOURS (weekly schedule)
-- ============================================================================

-- Olena's Hair Salon
INSERT INTO public.business_hours (beauty_page_id, day_of_week, is_open, open_time, close_time) VALUES
  ('b1111111-1111-1111-1111-111111111111', 0, false, NULL, NULL),           -- Sunday - closed
  ('b1111111-1111-1111-1111-111111111111', 1, true, '09:00', '19:00'),       -- Monday
  ('b1111111-1111-1111-1111-111111111111', 2, true, '09:00', '19:00'),       -- Tuesday
  ('b1111111-1111-1111-1111-111111111111', 3, true, '09:00', '19:00'),       -- Wednesday
  ('b1111111-1111-1111-1111-111111111111', 4, true, '09:00', '19:00'),       -- Thursday
  ('b1111111-1111-1111-1111-111111111111', 5, true, '09:00', '19:00'),       -- Friday
  ('b1111111-1111-1111-1111-111111111111', 6, true, '10:00', '16:00')        -- Saturday
ON CONFLICT (beauty_page_id, day_of_week) DO NOTHING;

-- Dmytro's Barbershop
INSERT INTO public.business_hours (beauty_page_id, day_of_week, is_open, open_time, close_time) VALUES
  ('b2222222-2222-2222-2222-222222222222', 0, true, '11:00', '18:00'),       -- Sunday
  ('b2222222-2222-2222-2222-222222222222', 1, false, NULL, NULL),           -- Monday - closed
  ('b2222222-2222-2222-2222-222222222222', 2, true, '10:00', '20:00'),       -- Tuesday
  ('b2222222-2222-2222-2222-222222222222', 3, true, '10:00', '20:00'),       -- Wednesday
  ('b2222222-2222-2222-2222-222222222222', 4, true, '10:00', '20:00'),       -- Thursday
  ('b2222222-2222-2222-2222-222222222222', 5, true, '10:00', '20:00'),       -- Friday
  ('b2222222-2222-2222-2222-222222222222', 6, true, '10:00', '20:00')        -- Saturday
ON CONFLICT (beauty_page_id, day_of_week) DO NOTHING;

-- Maria's Nail Studio
INSERT INTO public.business_hours (beauty_page_id, day_of_week, is_open, open_time, close_time) VALUES
  ('b3333333-3333-3333-3333-333333333333', 0, false, NULL, NULL),           -- Sunday - closed
  ('b3333333-3333-3333-3333-333333333333', 1, true, '10:00', '18:00'),       -- Monday
  ('b3333333-3333-3333-3333-333333333333', 2, true, '10:00', '18:00'),       -- Tuesday
  ('b3333333-3333-3333-3333-333333333333', 3, true, '10:00', '18:00'),       -- Wednesday
  ('b3333333-3333-3333-3333-333333333333', 4, true, '10:00', '18:00'),       -- Thursday
  ('b3333333-3333-3333-3333-333333333333', 5, true, '10:00', '18:00'),       -- Friday
  ('b3333333-3333-3333-3333-333333333333', 6, false, NULL, NULL)            -- Saturday - closed
ON CONFLICT (beauty_page_id, day_of_week) DO NOTHING;

-- ============================================================================
-- 7. CANCELLATION POLICIES
-- ============================================================================

INSERT INTO public.cancellation_policies (beauty_page_id, allow_cancellation, cancellation_notice_hours, cancellation_fee_percentage, policy_text) VALUES
  ('b1111111-1111-1111-1111-111111111111', true, 24, 0, 'Скасування безкоштовне за 24 години до візиту.'),
  ('b2222222-2222-2222-2222-222222222222', true, 12, 0, 'Скасування безкоштовне за 12 годин до візиту.'),
  ('b3333333-3333-3333-3333-333333333333', true, 24, 50, 'Скасування за 24 години безкоштовне. Пізніше скасування - 50% вартості.')
ON CONFLICT (beauty_page_id) DO NOTHING;

-- ============================================================================
-- 8. APPOINTMENTS (historical and upcoming)
-- ============================================================================

-- Past appointments (completed)
INSERT INTO public.appointments (
  id, beauty_page_id, service_id, client_id,
  creator_display_name, service_name, service_price_cents, service_currency, service_duration_minutes,
  client_name, client_phone, client_email,
  date, start_time, end_time, timezone,
  status, client_notes
) VALUES
  -- Anna at Olena's - completed appointments
  ('ap111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111',
   'a5555555-5555-5555-5555-555555555555',
   'Олена Коваль', 'Жіноча стрижка', 60000, 'UAH', 60,
   'Анна Сидоренко', '+380505678901', 'anna.sydorenko@example.com',
   current_date - interval '30 days', '10:00', '11:00', 'Europe/Kyiv',
   'completed', 'Будь ласка, підстрижіть кінчики'),

  ('ap111111-1111-1111-1111-222222222222', 'b1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-222222222222',
   'a5555555-5555-5555-5555-555555555555',
   'Олена Коваль', 'Фарбування коренів', 80000, 'UAH', 90,
   'Анна Сидоренко', '+380505678901', 'anna.sydorenko@example.com',
   current_date - interval '14 days', '14:00', '15:30', 'Europe/Kyiv',
   'completed', NULL),

  -- Viktor at Dmytro's - completed appointments
  ('ap222222-2222-2222-2222-111111111111', 'b2222222-2222-2222-2222-222222222222', 's2222222-2222-2222-2222-111111111111',
   'a6666666-6666-6666-6666-666666666666',
   'Дмитро Шевченко', 'Класична стрижка', 35000, 'UAH', 40,
   'Віктор Мельник', '+380506789012', 'viktor.melnyk@example.com',
   current_date - interval '21 days', '11:00', '11:40', 'Europe/Kyiv',
   'completed', NULL),

  ('ap222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 's2222222-2222-2222-2222-333333333331',
   'a6666666-6666-6666-6666-666666666666',
   'Дмитро Шевченко', 'Стрижка + борода', 50000, 'UAH', 60,
   'Віктор Мельник', '+380506789012', 'viktor.melnyk@example.com',
   current_date - interval '7 days', '15:00', '16:00', 'Europe/Kyiv',
   'completed', 'Як минулого разу'),

  -- Yulia at Maria's - completed appointments
  ('ap333333-3333-3333-3333-111111111111', 'b3333333-3333-3333-3333-333333333333', 's3333333-3333-3333-3333-111111111113',
   'a7777777-7777-7777-7777-777777777777',
   'Марія Бондар', 'Манікюр з покриттям', 55000, 'UAH', 75,
   'Юлія Ткаченко', '+380507890123', 'yulia.tkachenko@example.com',
   current_date - interval '10 days', '12:00', '13:15', 'Europe/Kyiv',
   'completed', 'Нюдові кольори'),

  -- Serhii at Dmytro's - no-show
  ('ap222222-2222-2222-2222-333333333333', 'b2222222-2222-2222-2222-222222222222', 's2222222-2222-2222-2222-111111111111',
   'a8888888-8888-8888-8888-888888888888',
   'Дмитро Шевченко', 'Класична стрижка', 35000, 'UAH', 40,
   'Сергій Мороз', '+380508901234', 'serhii.moroz@example.com',
   current_date - interval '5 days', '14:00', '14:40', 'Europe/Kyiv',
   'no_show', NULL),

  -- Cancelled appointment
  ('ap111111-1111-1111-1111-333333333333', 'b1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-333333333331',
   'a9999999-9999-9999-9999-999999999999',
   'Олена Коваль', 'Святкова укладка', 70000, 'UAH', 60,
   'Оксана Лисенко', '+380509012345', 'oksana.lysenko@example.com',
   current_date - interval '3 days', '16:00', '17:00', 'Europe/Kyiv',
   'cancelled', 'Вибачте, не зможу прийти')
ON CONFLICT (id) DO NOTHING;

-- Upcoming appointments (pending and confirmed)
INSERT INTO public.appointments (
  id, beauty_page_id, service_id, client_id,
  creator_display_name, service_name, service_price_cents, service_currency, service_duration_minutes,
  client_name, client_phone, client_email,
  date, start_time, end_time, timezone,
  status, client_notes
) VALUES
  -- Tomorrow's appointments
  ('ap111111-1111-1111-1111-444444444444', 'b1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111',
   'a5555555-5555-5555-5555-555555555555',
   'Олена Коваль', 'Жіноча стрижка', 60000, 'UAH', 60,
   'Анна Сидоренко', '+380505678901', 'anna.sydorenko@example.com',
   current_date + interval '1 day', '10:00', '11:00', 'Europe/Kyiv',
   'confirmed', NULL),

  ('ap222222-2222-2222-2222-444444444444', 'b2222222-2222-2222-2222-222222222222', 's2222222-2222-2222-2222-333333333332',
   'a4444444-4444-4444-4444-444444444444',
   'Дмитро Шевченко', 'Повний догляд', 70000, 'UAH', 80,
   'Іван Петренко', '+380504567890', 'ivan.petrenko@example.com',
   current_date + interval '1 day', '12:00', '13:20', 'Europe/Kyiv',
   'pending', 'Перший візит'),

  -- Next week appointments
  ('ap333333-3333-3333-3333-222222222222', 'b3333333-3333-3333-3333-333333333333', 's3333333-3333-3333-3333-222222222223',
   'a7777777-7777-7777-7777-777777777777',
   'Марія Бондар', 'Педикюр з покриттям', 65000, 'UAH', 90,
   'Юлія Ткаченко', '+380507890123', 'yulia.tkachenko@example.com',
   current_date + interval '5 days', '14:00', '15:30', 'Europe/Kyiv',
   'confirmed', NULL),

  ('ap111111-1111-1111-1111-555555555555', 'b1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-222222222224',
   'a9999999-9999-9999-9999-999999999999',
   'Олена Коваль', 'Балаяж', 250000, 'UAH', 180,
   'Оксана Лисенко', '+380509012345', 'oksana.lysenko@example.com',
   current_date + interval '7 days', '09:00', '12:00', 'Europe/Kyiv',
   'pending', 'Хочу натуральні відтінки')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. BEAUTY PAGE CLIENTS (auto-created by trigger, but add notes and blocks)
-- ============================================================================

-- Add notes to some clients
UPDATE public.beauty_page_clients
SET notes = 'Постійна клієнтка. Любить натуральні відтінки.'
WHERE beauty_page_id = 'b1111111-1111-1111-1111-111111111111'
  AND client_id = 'a5555555-5555-5555-5555-555555555555';

UPDATE public.beauty_page_clients
SET notes = 'VIP клієнт. Приходить регулярно.'
WHERE beauty_page_id = 'b2222222-2222-2222-2222-222222222222'
  AND client_id = 'a6666666-6666-6666-6666-666666666666';

UPDATE public.beauty_page_clients
SET notes = 'Надає перевагу мінімалістичному дизайну.'
WHERE beauty_page_id = 'b3333333-3333-3333-3333-333333333333'
  AND client_id = 'a7777777-7777-7777-7777-777777777777';

-- Block Serhii at Dmytro's barbershop (had a no-show)
UPDATE public.beauty_page_clients
SET blocked_at = now() - interval '4 days', blocked_until = NULL
WHERE beauty_page_id = 'b2222222-2222-2222-2222-222222222222'
  AND client_id = 'a8888888-8888-8888-8888-888888888888';

-- Temporary block Taras at Olena's (blocked for 30 days)
INSERT INTO public.beauty_page_clients (beauty_page_id, client_id, blocked_at, blocked_until, notes)
VALUES ('b1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        now() - interval '5 days', now() + interval '25 days',
        'Тимчасово заблокований за грубість')
ON CONFLICT (beauty_page_id, client_id) DO UPDATE
SET blocked_at = EXCLUDED.blocked_at,
    blocked_until = EXCLUDED.blocked_until,
    notes = EXCLUDED.notes;

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================
