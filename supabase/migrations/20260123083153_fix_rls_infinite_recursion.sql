/*
  # Fix RLS Infinite Recursion in Profiles Table

  ## Problem
  The "Admins can view all profiles" policy causes infinite recursion because it queries
  the profiles table itself to check if a user is an admin, creating a circular dependency.

  ## Solution
  Remove the problematic policy. Admin functionality should be handled at the application
  level or through service role access. Users can only view their own profile.

  ## Changes
  1. Drop "Admins can view all profiles" policy
  2. Keep "Users can view own profile" policy for regular users
  
  ## Security Impact
  - Regular users can still view their own profile
  - Admin operations should be performed using the service role or application logic
  - This prevents the infinite recursion error while maintaining security
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Ensure the basic user policy exists (it should already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;
