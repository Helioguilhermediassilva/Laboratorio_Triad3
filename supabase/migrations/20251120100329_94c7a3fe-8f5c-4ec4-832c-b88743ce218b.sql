-- ============================================
-- SECURITY FIX: Hardening profiles table RLS policies
-- ============================================
-- This migration strengthens RLS policies on the profiles table to prevent
-- unauthorized access to sensitive PII data (CPF, nome_completo, telefone, data_nascimento)

-- Drop existing policies to recreate with stronger security
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles cannot be deleted by users" ON public.profiles;

-- Recreate policies with explicit authentication checks
-- This prevents any unauthenticated access and adds additional security layers

-- SELECT policy: Only authenticated users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND id = auth.uid()
);

-- INSERT policy: Only authenticated users can create their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND id = auth.uid()
);

-- UPDATE policy: Only authenticated users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND id = auth.uid()
);

-- DELETE policy: Profiles cannot be deleted by users (only by system/admin)
CREATE POLICY "Profiles cannot be deleted" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (false);

-- Add index on id for performance and timing attack prevention
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Add security comments
COMMENT ON TABLE public.profiles IS 'User profiles with PII data. Protected by RLS policies that ensure users can only access their own data. CPF field contains sensitive Brazilian tax ID - consider field-level encryption for production.';
COMMENT ON COLUMN public.profiles.cpf IS 'Brazilian CPF (tax ID) - highly sensitive PII. Should be encrypted at application layer before storage in production environments.';
COMMENT ON COLUMN public.profiles.telefone IS 'User phone number - sensitive PII protected by RLS';
COMMENT ON COLUMN public.profiles.nome_completo IS 'User full name - sensitive PII protected by RLS';