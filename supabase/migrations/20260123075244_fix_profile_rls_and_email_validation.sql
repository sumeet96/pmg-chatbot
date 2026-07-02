/*
  # Fix Profile RLS and Add Email Domain Validation

  ## Changes
  1. Add INSERT policy for profiles table to allow profile creation
  2. Add email domain validation constraint
  3. Update handle_new_user function to validate email domain
  
  ## Security
  - INSERT policy allows authenticated users to create their own profile
  - Email validation ensures only @astra.xlri.ac.in emails are accepted
  - SECURITY DEFINER function bypasses RLS for automatic profile creation
  
  ## Important Notes
  - Email domain validation: Only emails ending with @astra.xlri.ac.in are allowed
  - The trigger automatically creates profiles when users sign up
  - Manual profile creation is also supported via INSERT policy
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create INSERT policy for profiles (backup for manual inserts)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND email LIKE '%@astra.xlri.ac.in');

-- Add email domain validation constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_email_domain_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_email_domain_check 
    CHECK (email LIKE '%@astra.xlri.ac.in');
  END IF;
END $$;

-- Update the handle_new_user function to validate email domain
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate email domain
  IF NEW.email NOT LIKE '%@astra.xlri.ac.in' THEN
    RAISE EXCEPTION 'Email must be from astra.xlri.ac.in domain';
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
