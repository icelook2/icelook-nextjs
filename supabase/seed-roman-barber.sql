-- Seed script for Roman Barber with realistic barber data
-- Creates: 10 service groups, 100 services, working days for 1 year, 10 mock users, appointments

-- First, get barber type ID
DO $$
DECLARE
  v_barber_type_id uuid;
  v_owner_id uuid;
  v_beauty_page_id uuid;
  v_group_id uuid;
  v_service_id uuid;
  v_client_id uuid;
  v_working_day_id uuid;
  v_current_date date;
  v_day_of_week int;
  v_start_date date;
  v_end_date date;
  v_appointment_date date;
  v_appointment_time time;
  v_service_record record;
  v_client_record record;
  v_random_status text;
  v_random_hour int;
  v_random_minute int;
  v_appointments_per_day int;
  i int;
  j int;

  -- Service groups and services data
  v_groups text[][] := ARRAY[
    ARRAY['Haircuts', 'Classic Haircut', 'Modern Fade', 'Buzz Cut', 'Crew Cut', 'Undercut', 'Pompadour', 'Textured Crop', 'Caesar Cut', 'Side Part', 'Quiff'],
    ARRAY['Beard Services', 'Beard Trim', 'Full Beard Shaping', 'Beard Line-up', 'Stubble Trim', 'Goatee Styling', 'Mustache Trim', 'Beard Conditioning', 'Hot Towel Beard Treatment', 'Beard Coloring', 'Designer Beard'],
    ARRAY['Shaving', 'Classic Wet Shave', 'Hot Towel Shave', 'Head Shave', 'Straight Razor Shave', 'Face Shave', 'Neck Shave', 'Skin Fade Shave', 'Clean Shave', 'Partial Shave', 'Executive Shave'],
    ARRAY['Hair Coloring', 'Full Hair Color', 'Highlights', 'Lowlights', 'Gray Blending', 'Color Correction', 'Balayage', 'Frosted Tips', 'Root Touch-up', 'Fashion Colors', 'Natural Color'],
    ARRAY['Hair Treatments', 'Deep Conditioning', 'Scalp Treatment', 'Keratin Treatment', 'Hair Mask', 'Anti-Dandruff Treatment', 'Hair Growth Treatment', 'Moisturizing Treatment', 'Protein Treatment', 'Oil Treatment', 'Detox Treatment'],
    ARRAY['Kids Services', 'Kids Haircut (0-5)', 'Kids Haircut (6-12)', 'Teen Haircut', 'First Haircut', 'Kids Buzz Cut', 'Kids Fade', 'Kids Design Cut', 'Kids Mohawk', 'Kids Trim', 'Kids Style'],
    ARRAY['Premium Packages', 'Executive Package', 'Gentleman Package', 'VIP Experience', 'Wedding Groom Package', 'Father & Son', 'Full Grooming', 'Relaxation Package', 'Business Package', 'Deluxe Treatment', 'Royal Treatment'],
    ARRAY['Styling', 'Blow Dry & Style', 'Hair Wax Styling', 'Pomade Finish', 'Gel Styling', 'Natural Styling', 'Formal Styling', 'Casual Look', 'Messy Style', 'Slick Back', 'Textured Styling'],
    ARRAY['Face Services', 'Facial Cleansing', 'Face Massage', 'Eyebrow Trim', 'Nose Wax', 'Ear Wax', 'Face Scrub', 'Blackhead Removal', 'Face Mask', 'Under Eye Treatment', 'Full Face Care'],
    ARRAY['Add-ons', 'Hot Towel', 'Scalp Massage', 'Neck Massage', 'Aftershave Application', 'Hair Product', 'Beard Oil', 'Face Moisturizer', 'Cologne Sample', 'Hair Spray', 'Finishing Touch']
  ];

  -- Prices in cents (UAH) for each service in each group
  v_prices int[][] := ARRAY[
    ARRAY[35000, 45000, 25000, 30000, 40000, 50000, 38000, 32000, 42000, 48000],
    ARRAY[20000, 35000, 15000, 12000, 25000, 10000, 30000, 40000, 50000, 45000],
    ARRAY[40000, 50000, 45000, 55000, 35000, 20000, 30000, 38000, 25000, 60000],
    ARRAY[80000, 70000, 65000, 55000, 90000, 85000, 60000, 45000, 75000, 50000],
    ARRAY[45000, 50000, 80000, 40000, 55000, 60000, 50000, 55000, 45000, 50000],
    ARRAY[20000, 25000, 30000, 25000, 18000, 28000, 35000, 32000, 15000, 22000],
    ARRAY[120000, 100000, 150000, 180000, 70000, 95000, 110000, 85000, 130000, 160000],
    ARRAY[25000, 20000, 20000, 18000, 22000, 35000, 28000, 30000, 32000, 25000],
    ARRAY[35000, 30000, 15000, 12000, 12000, 25000, 20000, 40000, 35000, 55000],
    ARRAY[10000, 15000, 15000, 8000, 12000, 10000, 8000, 5000, 8000, 10000]
  ];

  -- Durations in minutes
  v_durations int[][] := ARRAY[
    ARRAY[30, 45, 20, 25, 40, 50, 35, 30, 40, 45],
    ARRAY[20, 30, 15, 10, 25, 10, 25, 35, 45, 40],
    ARRAY[30, 40, 35, 45, 25, 15, 25, 30, 20, 50],
    ARRAY[60, 75, 60, 45, 90, 80, 50, 30, 70, 45],
    ARRAY[30, 40, 60, 30, 40, 45, 35, 40, 35, 40],
    ARRAY[20, 25, 30, 25, 15, 25, 35, 30, 15, 20],
    ARRAY[90, 75, 120, 150, 60, 80, 90, 70, 100, 120],
    ARRAY[15, 10, 10, 10, 15, 25, 20, 20, 20, 15],
    ARRAY[25, 20, 10, 10, 10, 20, 15, 30, 25, 45],
    ARRAY[5, 10, 10, 5, 10, 5, 5, 5, 5, 10]
  ];

  -- Client names
  v_client_names text[] := ARRAY[
    'Олександр Петренко', 'Максим Коваленко', 'Андрій Шевченко',
    'Дмитро Бондаренко', 'Сергій Мельник', 'Іван Кравченко',
    'Михайло Ткаченко', 'Василь Гончаренко', 'Олег Савченко', 'Юрій Литвиненко'
  ];

  v_client_phones text[] := ARRAY[
    '+380501234567', '+380672345678', '+380933456789',
    '+380504567890', '+380675678901', '+380936789012',
    '+380507890123', '+380678901234', '+380939012345', '+380500123456'
  ];

BEGIN
  -- Get barber type ID
  SELECT id INTO v_barber_type_id FROM beauty_page_types WHERE slug = 'barber' LIMIT 1;

  IF v_barber_type_id IS NULL THEN
    RAISE EXCEPTION 'Barber type not found';
  END IF;

  -- Get Roman Mahotskyi as owner (primary email)
  SELECT id INTO v_owner_id FROM profiles WHERE email = 'roman.mahotskyi@gmail.com' LIMIT 1;

  IF v_owner_id IS NULL THEN
    -- Fallback to test user or first available
    SELECT id INTO v_owner_id FROM profiles WHERE email = 'test@test.com' LIMIT 1;
  END IF;

  IF v_owner_id IS NULL THEN
    SELECT id INTO v_owner_id FROM profiles LIMIT 1;
  END IF;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'No owner found';
  END IF;

  RAISE NOTICE 'Owner ID: %', v_owner_id;

  -- Check if Roman Barber already exists
  SELECT id INTO v_beauty_page_id FROM beauty_pages WHERE slug = 'roman-barber' LIMIT 1;

  IF v_beauty_page_id IS NOT NULL THEN
    RAISE NOTICE 'Roman Barber already exists, deleting old data...';
    -- Delete existing data
    DELETE FROM appointments WHERE beauty_page_id = v_beauty_page_id;
    DELETE FROM working_days WHERE beauty_page_id = v_beauty_page_id;
    DELETE FROM services WHERE service_group_id IN (SELECT id FROM service_groups WHERE beauty_page_id = v_beauty_page_id);
    DELETE FROM service_groups WHERE beauty_page_id = v_beauty_page_id;
    DELETE FROM reviews WHERE beauty_page_id = v_beauty_page_id;
    DELETE FROM beauty_pages WHERE id = v_beauty_page_id;
  END IF;

  -- Create Roman Barber beauty page
  INSERT INTO beauty_pages (
    name, slug, owner_id, type_id,
    display_name, bio, city, address, phone, email,
    currency, timezone, is_active, is_verified, auto_confirm_bookings
  ) VALUES (
    'Roman Barber', 'roman-barber', v_owner_id, v_barber_type_id,
    'Roman', 'Професійний барбер з 10-річним досвідом. Спеціалізуюсь на класичних та сучасних чоловічих стрижках.',
    'Kyiv', 'вул. Хрещатик, 22', '+380501234567', 'roman@barber.com',
    'UAH', 'Europe/Kyiv', true, true, true
  ) RETURNING id INTO v_beauty_page_id;

  RAISE NOTICE 'Created beauty page: %', v_beauty_page_id;

  -- Create 10 service groups with 10 services each
  FOR i IN 1..10 LOOP
    INSERT INTO service_groups (beauty_page_id, name, display_order)
    VALUES (v_beauty_page_id, v_groups[i][1], i)
    RETURNING id INTO v_group_id;

    RAISE NOTICE 'Created group: %', v_groups[i][1];

    FOR j IN 2..11 LOOP
      INSERT INTO services (service_group_id, name, price_cents, duration_minutes, display_order)
      VALUES (v_group_id, v_groups[i][j], v_prices[i][j-1], v_durations[i][j-1], j-1);
    END LOOP;
  END LOOP;

  -- Create working days for the past year (Mon-Sat, 9:00-19:00)
  v_start_date := CURRENT_DATE - INTERVAL '365 days';
  v_end_date := CURRENT_DATE + INTERVAL '30 days';
  v_current_date := v_start_date;

  WHILE v_current_date <= v_end_date LOOP
    v_day_of_week := EXTRACT(DOW FROM v_current_date);

    -- Work Mon (1) through Sat (6), skip Sunday (0)
    IF v_day_of_week BETWEEN 1 AND 6 THEN
      INSERT INTO working_days (beauty_page_id, date, start_time, end_time)
      VALUES (v_beauty_page_id, v_current_date, '09:00', '19:00');
    END IF;

    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;

  RAISE NOTICE 'Created working days';

  -- Create 10 mock users in auth.users and profiles
  FOR i IN 1..10 LOOP
    -- Check if user exists in profiles
    SELECT id INTO v_client_id FROM profiles WHERE email = 'client' || i || '@test.com' LIMIT 1;

    IF v_client_id IS NULL THEN
      -- Check if auth user exists
      SELECT id INTO v_client_id FROM auth.users WHERE email = 'client' || i || '@test.com' LIMIT 1;

      IF v_client_id IS NULL THEN
        -- Create auth user
        INSERT INTO auth.users (
          id, instance_id, aud, role, email,
          encrypted_password, email_confirmed_at,
          created_at, updated_at, confirmation_token,
          recovery_token, email_change_token_new, email_change
        ) VALUES (
          gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'client' || i || '@test.com',
          crypt('password123', gen_salt('bf')), NOW(),
          NOW(), NOW(), '', '', '', ''
        ) RETURNING id INTO v_client_id;
      END IF;

      -- Create profile only if it doesn't exist
      INSERT INTO profiles (id, email, full_name)
      VALUES (v_client_id, 'client' || i || '@test.com', v_client_names[i])
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
    END IF;
  END LOOP;

  RAISE NOTICE 'Created mock users';

  -- Generate appointments for the past year
  -- Approximately 3-8 appointments per working day
  v_current_date := v_start_date;

  WHILE v_current_date < CURRENT_DATE LOOP
    v_day_of_week := EXTRACT(DOW FROM v_current_date);

    -- Only generate for working days (Mon-Sat)
    IF v_day_of_week BETWEEN 1 AND 6 THEN
      -- Random number of appointments per day (3-8)
      v_appointments_per_day := 3 + floor(random() * 6)::int;

      FOR i IN 1..v_appointments_per_day LOOP
        -- Pick random service
        SELECT s.id, s.name, s.price_cents, s.duration_minutes
        INTO v_service_record
        FROM services s
        JOIN service_groups sg ON s.service_group_id = sg.id
        WHERE sg.beauty_page_id = v_beauty_page_id
        ORDER BY random()
        LIMIT 1;

        -- Pick random time (9:00 - 18:00)
        v_random_hour := 9 + floor(random() * 9)::int;
        v_random_minute := (floor(random() * 4)::int) * 15; -- 0, 15, 30, 45
        v_appointment_time := (v_random_hour || ':' || LPAD(v_random_minute::text, 2, '0'))::time;

        -- Pick random client
        j := 1 + floor(random() * 10)::int;
        IF j > 10 THEN j := 10; END IF;

        SELECT id INTO v_client_id FROM profiles WHERE email = 'client' || j || '@test.com' LIMIT 1;

        -- Determine status based on date
        IF v_current_date < CURRENT_DATE - INTERVAL '7 days' THEN
          -- Older appointments: mostly completed, some cancelled/no_show
          v_random_status := CASE floor(random() * 100)::int
            WHEN 0 THEN 'cancelled'
            WHEN 1 THEN 'cancelled'
            WHEN 2 THEN 'cancelled'
            WHEN 3 THEN 'no_show'
            WHEN 4 THEN 'no_show'
            ELSE 'completed'
          END;
        ELSE
          -- Recent appointments: mix of confirmed and completed
          v_random_status := CASE floor(random() * 10)::int
            WHEN 0 THEN 'cancelled'
            WHEN 1 THEN 'no_show'
            ELSE 'completed'
          END;
        END IF;

        -- Insert appointment
        INSERT INTO appointments (
          beauty_page_id, service_id, service_name, service_price_cents,
          service_duration_minutes, service_currency, creator_display_name,
          client_id, client_name, client_phone, client_email,
          date, start_time, end_time, status, timezone
        ) VALUES (
          v_beauty_page_id, v_service_record.id, v_service_record.name,
          v_service_record.price_cents, v_service_record.duration_minutes,
          'UAH', 'Roman',
          v_client_id, v_client_names[j], v_client_phones[j], 'client' || j || '@test.com',
          v_current_date,
          v_appointment_time,
          v_appointment_time + (v_service_record.duration_minutes || ' minutes')::interval,
          v_random_status::appointment_status,
          'Europe/Kyiv'
        );
      END LOOP;
    END IF;

    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;

  RAISE NOTICE 'Created appointments';

  -- Create some reviews
  FOR i IN 1..10 LOOP
    SELECT id INTO v_client_id FROM profiles WHERE email = 'client' || i || '@test.com' LIMIT 1;

    IF v_client_id IS NOT NULL THEN
      INSERT INTO reviews (beauty_page_id, reviewer_id, rating, comment)
      VALUES (
        v_beauty_page_id,
        v_client_id,
        4 + floor(random() * 2)::int, -- Rating 4 or 5
        CASE i
          WHEN 1 THEN 'Відмінний барбер! Завжди задоволений результатом.'
          WHEN 2 THEN 'Професійний підхід та приємна атмосфера.'
          WHEN 3 THEN 'Найкращий барбершоп у місті!'
          WHEN 4 THEN 'Рекомендую всім друзям. Якість на висоті.'
          WHEN 5 THEN 'Завжди вчасно, завжди якісно.'
          WHEN 6 THEN 'Роман - справжній майстер своєї справи.'
          WHEN 7 THEN 'Приходжу сюди вже рік, ніколи не розчаровувався.'
          WHEN 8 THEN 'Стильні стрижки та чудовий сервіс.'
          WHEN 9 THEN 'Доступні ціни та преміум якість.'
          WHEN 10 THEN 'Мій постійний барбер. Дуже задоволений!'
        END
      );
    END IF;
  END LOOP;

  RAISE NOTICE 'Created reviews';
  RAISE NOTICE 'Seed completed successfully!';

  -- Output statistics
  RAISE NOTICE 'Statistics:';
  RAISE NOTICE '- Service groups: %', (SELECT COUNT(*) FROM service_groups WHERE beauty_page_id = v_beauty_page_id);
  RAISE NOTICE '- Services: %', (SELECT COUNT(*) FROM services WHERE service_group_id IN (SELECT id FROM service_groups WHERE beauty_page_id = v_beauty_page_id));
  RAISE NOTICE '- Working days: %', (SELECT COUNT(*) FROM working_days WHERE beauty_page_id = v_beauty_page_id);
  RAISE NOTICE '- Appointments: %', (SELECT COUNT(*) FROM appointments WHERE beauty_page_id = v_beauty_page_id);
  RAISE NOTICE '- Reviews: %', (SELECT COUNT(*) FROM reviews WHERE beauty_page_id = v_beauty_page_id);

END $$;
