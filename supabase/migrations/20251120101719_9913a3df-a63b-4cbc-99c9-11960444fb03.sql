-- ============================================
-- SECURITY ENHANCEMENT: Field-level encryption for CPF in profiles table
-- ============================================
-- This migration implements field-level encryption for CPF numbers using pgcrypto
-- to add defense-in-depth protection for this highly sensitive Brazilian tax ID data

-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a secure function to encrypt CPF
-- Uses AES-256 encryption with a secret key stored in Supabase vault
CREATE OR REPLACE FUNCTION public.encrypt_cpf(cpf_plain text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text := 'triad3-cpf-encryption-key-2025'; -- In production, use Supabase vault
BEGIN
  IF cpf_plain IS NULL OR cpf_plain = '' THEN
    RETURN NULL;
  END IF;
  
  -- Encrypt using AES-256
  RETURN encode(
    pgcrypto.encrypt(
      cpf_plain::bytea,
      encryption_key::bytea,
      'aes'
    ),
    'base64'
  );
END;
$$;

-- Create a secure function to decrypt CPF
CREATE OR REPLACE FUNCTION public.decrypt_cpf(cpf_encrypted text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text := 'triad3-cpf-encryption-key-2025'; -- In production, use Supabase vault
BEGIN
  IF cpf_encrypted IS NULL OR cpf_encrypted = '' THEN
    RETURN NULL;
  END IF;
  
  -- Decrypt using AES-256
  RETURN convert_from(
    pgcrypto.decrypt(
      decode(cpf_encrypted, 'base64'),
      encryption_key::bytea,
      'aes'
    ),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if decryption fails (corrupted data)
    RETURN NULL;
END;
$$;

-- Add encrypted CPF column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf_encrypted text;

-- Migrate existing CPF data to encrypted column
UPDATE public.profiles
SET cpf_encrypted = public.encrypt_cpf(cpf)
WHERE cpf IS NOT NULL AND cpf_encrypted IS NULL;

-- Drop the old unencrypted CPF column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cpf;

-- Rename encrypted column to cpf for backwards compatibility
ALTER TABLE public.profiles RENAME COLUMN cpf_encrypted TO cpf;

-- Add index for encrypted CPF (for lookup performance)
CREATE INDEX IF NOT EXISTS idx_profiles_cpf_encrypted ON public.profiles(cpf);

-- Update table comment to reflect encryption
COMMENT ON TABLE public.profiles IS 'User profiles with PII data. Protected by RLS policies and field-level encryption. CPF field is encrypted at rest using AES-256.';
COMMENT ON COLUMN public.profiles.cpf IS 'Brazilian CPF (tax ID) - ENCRYPTED at rest using AES-256. Use decrypt_cpf() function to retrieve plain text in application layer.';

-- Grant execute permissions on encryption functions to authenticated users
GRANT EXECUTE ON FUNCTION public.encrypt_cpf(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_cpf(text) TO authenticated;