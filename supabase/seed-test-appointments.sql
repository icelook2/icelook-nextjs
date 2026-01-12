-- Seed script to add working days and test appointments for the next 2 months
-- For roman-barber beauty page - useful for testing drag & drop functionality

DO $$
DECLARE
  v_beauty_page_id uuid;
  v_service_id uuid;
  v_client_id uuid;
  v_current_date date;
  v_day_of_week int;
  v_start_date date;
  v_end_date date;
  v_appointment_time time;
  v_service_record record;
  v_client_record record;
  v_random_hour int;
  v_random_minute int;
  v_appointments_per_day int;
  v_status text;
  i int;
  j int;

  -- Client names for appointments
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
  -- Get roman-barber beauty page ID
  SELECT id INTO v_beauty_page_id FROM beauty_pages WHERE slug = 'roman-barber' LIMIT 1;

  IF v_beauty_page_id IS NULL THEN
    RAISE EXCEPTION 'roman-barber beauty page not found. Run seed-roman-barber.sql first.';
  END IF;

  RAISE NOTICE 'Found roman-barber beauty page: %', v_beauty_page_id;

  -- Delete future working days and appointments to avoid duplicates
  DELETE FROM appointments
  WHERE beauty_page_id = v_beauty_page_id
    AND date >= CURRENT_DATE;

  DELETE FROM working_days
  WHERE beauty_page_id = v_beauty_page_id
    AND date >= CURRENT_DATE;

  RAISE NOTICE 'Cleared existing future working days and appointments';

  -- Create working days for the next 2 months (Mon-Sat, 9:00-19:00)
  v_start_date := CURRENT_DATE;
  v_end_date := CURRENT_DATE + INTERVAL '60 days';
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

  RAISE NOTICE 'Created working days for next 60 days';

  -- Generate appointments for the next 2 months
  -- Mix of pending and confirmed - good for testing drag & drop
  v_current_date := v_start_date;

  WHILE v_current_date <= v_end_date LOOP
    v_day_of_week := EXTRACT(DOW FROM v_current_date);

    -- Only generate for working days (Mon-Sat)
    IF v_day_of_week BETWEEN 1 AND 6 THEN
      -- 2-5 appointments per day to test drag functionality
      v_appointments_per_day := 2 + floor(random() * 4)::int;

      FOR i IN 1..v_appointments_per_day LOOP
        -- Pick random service from roman-barber
        SELECT s.id, s.name, s.price_cents, s.duration_minutes
        INTO v_service_record
        FROM services s
        JOIN service_groups sg ON s.service_group_id = sg.id
        WHERE sg.beauty_page_id = v_beauty_page_id
        ORDER BY random()
        LIMIT 1;

        -- Generate time slots spread throughout the day (9:00 - 17:00)
        -- Using different slots to avoid overlaps for easier drag testing
        v_random_hour := 9 + (i * 2); -- 9, 11, 13, 15, 17
        IF v_random_hour > 17 THEN
          v_random_hour := 9 + floor(random() * 8)::int;
        END IF;
        v_random_minute := (floor(random() * 2)::int) * 30; -- 0 or 30
        v_appointment_time := (v_random_hour || ':' || LPAD(v_random_minute::text, 2, '0'))::time;

        -- Pick random client and get their profile data including visit preferences
        j := 1 + floor(random() * 10)::int;
        IF j > 10 THEN j := 10; END IF;

        SELECT id, full_name, visit_preferences INTO v_client_record
        FROM profiles WHERE email = 'client' || j || '@test.com' LIMIT 1;

        -- Mix of pending and confirmed for drag testing
        -- More confirmed than pending, realistic scenario
        v_status := CASE floor(random() * 10)::int
          WHEN 0 THEN 'pending'
          WHEN 1 THEN 'pending'
          WHEN 2 THEN 'pending'
          ELSE 'confirmed'
        END;

        -- Insert appointment using profile data for consistency (including visit preferences snapshot)
        DECLARE
          v_appointment_id uuid;
        BEGIN
          INSERT INTO appointments (
            beauty_page_id, service_id, service_name, service_price_cents,
            service_duration_minutes, service_currency, creator_display_name,
            client_id, client_name, client_phone, client_email,
            date, start_time, end_time, status, timezone, visit_preferences
          ) VALUES (
            v_beauty_page_id, v_service_record.id, v_service_record.name,
            v_service_record.price_cents, v_service_record.duration_minutes,
            'UAH', 'Roman',
            v_client_record.id,
            COALESCE(v_client_record.full_name, v_client_names[j]),
            v_client_phones[j],
            'client' || j || '@test.com',
            v_current_date,
            v_appointment_time,
            v_appointment_time + (v_service_record.duration_minutes || ' minutes')::interval,
            v_status::appointment_status,
            'Europe/Kyiv',
            v_client_record.visit_preferences
          ) RETURNING id INTO v_appointment_id;

          -- Also insert into appointment_services table
          INSERT INTO appointment_services (appointment_id, service_id, service_name, price_cents, duration_minutes)
          VALUES (v_appointment_id, v_service_record.id, v_service_record.name, v_service_record.price_cents, v_service_record.duration_minutes);
        END;
      END LOOP;
    END IF;

    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;

  RAISE NOTICE 'Created test appointments for next 60 days';

  -- Output statistics
  RAISE NOTICE '';
  RAISE NOTICE '✅ Seed completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Statistics for roman-barber:';
  RAISE NOTICE '- Working days (future): %', (
    SELECT COUNT(*) FROM working_days
    WHERE beauty_page_id = v_beauty_page_id AND date >= CURRENT_DATE
  );
  RAISE NOTICE '- Appointments (future): %', (
    SELECT COUNT(*) FROM appointments
    WHERE beauty_page_id = v_beauty_page_id AND date >= CURRENT_DATE
  );
  RAISE NOTICE '  - Pending: %', (
    SELECT COUNT(*) FROM appointments
    WHERE beauty_page_id = v_beauty_page_id AND date >= CURRENT_DATE AND status = 'pending'
  );
  RAISE NOTICE '  - Confirmed: %', (
    SELECT COUNT(*) FROM appointments
    WHERE beauty_page_id = v_beauty_page_id AND date >= CURRENT_DATE AND status = 'confirmed'
  );

END $$;
