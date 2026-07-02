/*
  # Change Email Domain Restriction to gmail.com

  ## Changes
  1. Replace INSERT policy to allow any @gmail.com email
  2. Replace email domain validation constraint to allow @gmail.com
  3. Update handle_new_user function to validate the @gmail.com domain

  ## Important Notes
  - Email domain validation: Only emails ending with @gmail.com are allowed
  - Supersedes the previous @astra.xlri.ac.in restriction
*/

-- Update INSERT policy for profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND email LIKE '%@gmail.com');

-- Replace email domain validation constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_domain_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_email_domain_check
  CHECK (email LIKE '%@gmail.com');

-- Update the handle_new_user function to validate the gmail.com domain
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate email domain
  IF NEW.email NOT LIKE '%@gmail.com' THEN
    RAISE EXCEPTION 'Email must be from gmail.com domain';
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    false
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
END;
$$;
