/*
  # Allow Anonymous Complaint Submissions

  1. Changes
    - Make user_id nullable in complaints table to allow anonymous submissions
    - Add RLS policy to allow anonymous users to insert complaints
    - Keep existing policies for authenticated users intact

  2. Security
    - Anonymous users can only INSERT complaints (read-only for their own data not supported)
    - Authenticated users can view and update their own complaints
    - Admins can view and update all complaints
*/

-- Make user_id nullable to allow anonymous complaints
DO $$
BEGIN
  ALTER TABLE complaints ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN
    -- Column is already nullable, continue
    NULL;
END $$;

-- Drop existing INSERT policy and recreate with anonymous support
DROP POLICY IF EXISTS "Users can insert complaints" ON complaints;

CREATE POLICY "Users can insert complaints"
  ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add policy for anonymous complaint submissions
CREATE POLICY "Anonymous users can submit complaints"
  ON complaints FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);