/*
  # Full schema bootstrap (domain restricted to @gmail.com)

  Reconstructs the complete application schema in one migration, since the
  original CREATE TABLE statements were never committed to the repo. Folds in
  every prior ALTER migration and applies the @gmail.com domain restriction.

  Tables: profiles, menu_items, feedback, complaints
  Safe to run on an empty database.
*/

-- ---------- PROFILES ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          text NOT NULL,
  institute_email text,
  is_admin       boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_email_domain_check CHECK (email LIKE '%@gmail.com')
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND email LIKE '%@gmail.com');

-- Auto-create a profile whenever a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email NOT LIKE '%@gmail.com' THEN
    RAISE EXCEPTION 'Email must be from gmail.com domain';
  END IF;

  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (NEW.id, NEW.email, false);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- MENU ITEMS ----------
CREATE TABLE IF NOT EXISTS public.menu_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date NOT NULL,
  meal_type   text NOT NULL,
  item_name   text NOT NULL,
  description text DEFAULT '',
  time_start  time,
  time_end    time,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT menu_items_meal_type_check
    CHECK (meal_type = ANY (ARRAY['breakfast','lunch','evening_snacks','dinner'])),
  CONSTRAINT menu_items_date_meal_unique UNIQUE (date, meal_type)
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
CREATE POLICY "Anyone can view menu items"
  ON public.menu_items FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can insert menu items" ON public.menu_items;
CREATE POLICY "Admins can insert menu items"
  ON public.menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );

DROP POLICY IF EXISTS "Authenticated can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON public.menu_items;
CREATE POLICY "Admins can update menu items"
  ON public.menu_items FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "Authenticated can delete menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON public.menu_items;
CREATE POLICY "Admins can delete menu items"
  ON public.menu_items FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- ---------- FEEDBACK ----------
CREATE TABLE IF NOT EXISTS public.feedback (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  rating       integer,
  ate          boolean DEFAULT false,
  comment      text DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_user_menu_unique UNIQUE (user_id, menu_item_id)
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own feedback" ON public.feedback;
CREATE POLICY "Users manage own feedback"
  ON public.feedback FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------- COMPLAINTS ----------
CREATE TABLE IF NOT EXISTS public.complaints (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title       text NOT NULL,
  category    text NOT NULL,
  description text NOT NULL,
  status      text NOT NULL DEFAULT 'Pending',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT complaints_category_check
    CHECK (category = ANY (ARRAY['Food Quality','Hygiene','Service','Other'])),
  CONSTRAINT complaints_status_check
    CHECK (status = ANY (ARRAY['Pending','In Progress','Resolved']))
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert complaints" ON public.complaints;
CREATE POLICY "Users can insert complaints"
  ON public.complaints FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Anonymous users can submit complaints" ON public.complaints;
CREATE POLICY "Anonymous users can submit complaints"
  ON public.complaints FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Users and admins can view complaints" ON public.complaints;
CREATE POLICY "Users and admins can view complaints"
  ON public.complaints FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin)
  );

DROP POLICY IF EXISTS "Users and admins can update complaints" ON public.complaints;
CREATE POLICY "Users and admins can update complaints"
  ON public.complaints FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin)
  )
  WITH CHECK (true);
