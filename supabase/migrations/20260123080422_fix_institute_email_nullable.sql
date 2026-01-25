/*
  # Fix Institute Email Column

  1. Changes
    - Make `institute_email` column nullable in profiles table
    
  2. Reason
    - The handle_new_user trigger only populates id, email, and is_admin
    - institute_email was NOT NULL causing sign-up failures
    - Making it nullable allows profiles to be created during sign-up
    
  3. Security
    - No security changes
    - Existing RLS policies remain unchanged
*/

-- Make institute_email nullable
ALTER TABLE profiles 
ALTER COLUMN institute_email DROP NOT NULL;
