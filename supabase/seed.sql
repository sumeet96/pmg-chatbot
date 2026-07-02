-- Seed data: one week of mess menu.
-- Each weekday is placed on its next occurrence within the coming 7 days
-- (relative to CURRENT_DATE), so it always lands in the chatbot's
-- "today -> +7 days" window regardless of when this is run.
-- Safe to re-run: ON CONFLICT refreshes existing rows.

WITH menu(dow, meal_type, item_name, t_start, t_end) AS (
  VALUES
    -- Monday
    (1, 'breakfast',      'Puri, Aloo Sabji, Tea + Milk, Sprout',                         '08:00', '10:30'),
    (1, 'lunch',          'Dal Makhani, Palak Corn Sabji, Baigan Pakoda, Rice + Roti + Curd', '12:00', '14:30'),
    (1, 'evening_snacks', 'Samosa Chat, Tea + Coffee',                                    '17:30', '18:30'),
    (1, 'dinner',         'Chicken Curry, Kadhai Paneer, Dal, Rice, Roti, Sevaiyan Kheer', '20:00', '22:00'),
    -- Tuesday
    (2, 'breakfast',      'Idli, Chutney, Sambar, Fruits, Tea + Milk',                    '08:00', '10:30'),
    (2, 'lunch',          'Mix Dal, Jira Rice, Mix Veg, Curd, Aloo Jira',                 '12:00', '14:30'),
    (2, 'evening_snacks', 'Vada Pao, Tea + Coffee, Biscuits',                             '17:30', '18:30'),
    (2, 'dinner',         'Matar Mushroom, Dal Tadka, Sabji, Rice, Roti',                 '20:00', '22:00'),
    -- Wednesday
    (3, 'breakfast',      'Methi Parantha, Aloo Sabji, Boiled Eggs, Chocos, Tea + Milk',  '08:00', '10:30'),
    (3, 'lunch',          'Rajma Curry, Finger Chips, Capsicum Aloo, Thandai, Jira Rice', '12:00', '14:30'),
    (3, 'evening_snacks', 'Golgappa, Tea + Milk, Sweetcorn',                              '17:30', '18:30'),
    (3, 'dinner',         'Chicken Biryani, Mix Veg Palao, Dal, Raita',                   '20:00', '22:00'),
    -- Thursday
    (4, 'breakfast',      'Uttapam + Sambar, Chutney, Tea + Milk, Fruits',                '08:00', '10:30'),
    (4, 'lunch',          'Curd Rice, Roti, Plain Rice, Sambar, Medu Vada, Chutney',      '12:00', '14:30'),
    (4, 'evening_snacks', 'Spring Pasta, Pyaaz Pakoda, Kabuli Chana',                     '17:30', '18:30'),
    (4, 'dinner',         'Sattu Parantha, Paneer Bhurji, Dal, Aloo Tari',                '20:00', '22:00'),
    -- Friday
    (5, 'breakfast',      'Poha, Tea + Milk, Aloo Sandwich, Egg Bhujiya',                 '08:00', '10:30'),
    (5, 'lunch',          'Soya Chapp, Rice, Roti, Methi Aloo Bhujiya, Dal',              '12:00', '14:30'),
    (5, 'evening_snacks', 'Veg Cutlet, Sprouts, Tea + Milk',                              '17:30', '18:30'),
    (5, 'dinner',         'Mutton, Paneer, Rice, Roti',                                   '20:00', '22:00'),
    -- Saturday
    (6, 'breakfast',      'Aloo Paratha / Palak, Green Chutney, Tea + Milk',              '08:00', '10:30'),
    (6, 'lunch',          'Chole Bhature, Aloo Sukha, Rice, Curd, Salad',                 '12:00', '14:30'),
    (6, 'evening_snacks', 'Masala Maggi, Tea + Milk, Biscuits',                           '17:30', '18:30'),
    (6, 'dinner',         'Mix Veg Devani, Chana Dal Tadka, Rice, Roti',                  '20:00', '22:00'),
    -- Sunday
    (7, 'breakfast',      'Masala Dosa, Sambar, Chutney, Tea + Milk, Chocos',             '08:00', '10:30'),
    (7, 'lunch',          'Tehari Rice, Dal, Green Chutney, Bundiya Raita, Roti, Papad',  '12:00', '14:30'),
    (7, 'evening_snacks', 'Bhel Puri, Tea + Milk',                                        '17:30', '18:30'),
    (7, 'dinner',         'Special Tandoori Chicken',                                     '20:00', '22:00')
)
INSERT INTO public.menu_items (date, meal_type, item_name, description, time_start, time_end)
SELECT
  (CURRENT_DATE + ((dow - EXTRACT(ISODOW FROM CURRENT_DATE)::int + 7) % 7))::date,
  meal_type,
  item_name,
  '',
  t_start::time,
  t_end::time
FROM menu
ON CONFLICT (date, meal_type) DO UPDATE
  SET item_name  = EXCLUDED.item_name,
      time_start = EXCLUDED.time_start,
      time_end   = EXCLUDED.time_end;
