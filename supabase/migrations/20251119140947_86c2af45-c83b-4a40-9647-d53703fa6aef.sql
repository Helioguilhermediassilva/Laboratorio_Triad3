-- Create a security definer function to validate profile access
-- This adds an extra layer of security beyond RLS
CREATE OR REPLACE FUNCTION public.can_access_profile(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = _profile_id;
$$;

-- Add comment explaining the security measures
COMMENT ON TABLE public.profiles IS 'Contains sensitive PII (nome_completo, CPF, telefone). Protected by RLS policies that restrict access to own profile only. All access is validated through auth.uid() matching.';

-- Ensure foreign key to auth.users exists for referential integrity
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Add index for better query performance (without predicate)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);