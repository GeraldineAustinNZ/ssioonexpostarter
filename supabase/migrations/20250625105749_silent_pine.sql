/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current RLS policies on profiles table are causing infinite recursion
    - Policies that check user roles are querying the profiles table from within profiles table policies
    - This creates a circular reference when trying to access profile data

  2. Solution
    - Remove the problematic policies that cause recursion
    - Create simpler, non-recursive policies
    - Use auth.uid() directly instead of complex subqueries that reference profiles table

  3. Changes
    - Drop existing problematic policies
    - Create new policies that don't cause recursion
    - Ensure users can still access their own profiles
    - Ensure providers can access all profiles through a different mechanism
*/

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Providers can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Providers can update any profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create simple, non-recursive policies

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow system to insert profiles (for new user registration)
CREATE POLICY "System can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- For provider access, we'll create a simpler approach
-- Create a function that checks if a user is a provider without causing recursion
CREATE OR REPLACE FUNCTION is_provider(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = user_id 
    AND raw_user_meta_data->>'role' IN ('nurse', 'coordinator', 'admin', 'sales')
  );
$$;

-- Allow providers to read all profiles using the function
CREATE POLICY "Providers can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_provider(auth.uid()));

-- Allow providers to update any profile using the function
CREATE POLICY "Providers can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_provider(auth.uid()))
  WITH CHECK (is_provider(auth.uid()));