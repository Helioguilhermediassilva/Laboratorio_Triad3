-- Drop existing RLS policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create strengthened RLS policies using security definer function
-- This prevents potential timing attacks and RLS bypass attempts

-- SELECT policy: Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_access_profile(id));

-- INSERT policy: Users can only create their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.can_access_profile(id));

-- UPDATE policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.can_access_profile(id))
WITH CHECK (public.can_access_profile(id));

-- DELETE policy: Profiles cannot be deleted by users (managed by system only)
-- This prevents accidental or malicious profile deletion
CREATE POLICY "Profiles cannot be deleted by users"
ON public.profiles
FOR DELETE
TO authenticated
USING (false);

-- Add security documentation comments
COMMENT ON TABLE public.profiles IS 'User profiles with sensitive PII (CPF, phone, birth date). Protected by RLS policies using security definer functions to prevent timing attacks and policy bypasses. DELETE operations are blocked for users.';

COMMENT ON COLUMN public.profiles.cpf IS 'Brazilian tax ID (CPF) - highly sensitive PII. Access restricted by RLS policies.';
COMMENT ON COLUMN public.profiles.telefone IS 'Phone number - sensitive PII. Access restricted by RLS policies.';
COMMENT ON COLUMN public.profiles.data_nascimento IS 'Birth date - sensitive PII. Access restricted by RLS policies.';

-- Create index on id for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);