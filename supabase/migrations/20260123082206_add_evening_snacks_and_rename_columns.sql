/*
  # Add Evening Snacks Meal Type and Rename Columns

  ## Changes
  1. Rename `menu_date` to `date` for consistency with application code
  2. Rename `dish_name` to `item_name` for consistency with application code
  3. Update meal_type check constraint to include 'evening_snacks'
  4. Add time_start and time_end columns for meal timings

  ## Column Mappings
  - `menu_date` → `date`
  - `dish_name` → `item_name`

  ## Meal Types
  - breakfast: 8:00 AM - 10:30 AM
  - lunch: 12:00 PM - 2:30 PM
  - evening_snacks: 5:30 PM - 6:30 PM
  - dinner: 8:00 PM - 10:00 PM

  ## Security
  - All existing RLS policies remain unchanged
*/

-- Rename menu_date to date
ALTER TABLE menu_items RENAME COLUMN menu_date TO date;

-- Rename dish_name to item_name
ALTER TABLE menu_items RENAME COLUMN dish_name TO item_name;

-- Drop the old check constraint
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_meal_type_check;

-- Add new check constraint with evening_snacks
ALTER TABLE menu_items ADD CONSTRAINT menu_items_meal_type_check 
  CHECK (meal_type = ANY (ARRAY['breakfast'::text, 'lunch'::text, 'evening_snacks'::text, 'dinner'::text]));

-- Add time_start and time_end columns for meal timings
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS time_start time DEFAULT NULL;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS time_end time DEFAULT NULL;
