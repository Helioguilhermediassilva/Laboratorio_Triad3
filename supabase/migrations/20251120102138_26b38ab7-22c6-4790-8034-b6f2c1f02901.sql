-- ============================================
-- SECURITY ENHANCEMENT: Field-level encryption for CPF in contratos_namoro table
-- ============================================
-- This migration encrypts all CPF fields (both parties and witnesses) using the existing encrypt_cpf function

-- Add a validation trigger for CPF format before encryption
CREATE OR REPLACE FUNCTION public.validate_cpf_format()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate CPF columns based on table name
  IF TG_TABLE_NAME = 'contratos_namoro' THEN
    -- Validate parte_1_cpf (required)
    IF NEW.parte_1_cpf IS NOT NULL AND LENGTH(REGEXP_REPLACE(NEW.parte_1_cpf, '[^0-9]', '', 'g')) != 11 THEN
      RAISE EXCEPTION 'CPF da Parte 1 must contain exactly 11 digits';
    END IF;
    
    -- Validate parte_2_cpf (required)
    IF NEW.parte_2_cpf IS NOT NULL AND LENGTH(REGEXP_REPLACE(NEW.parte_2_cpf, '[^0-9]', '', 'g')) != 11 THEN
      RAISE EXCEPTION 'CPF da Parte 2 must contain exactly 11 digits';
    END IF;
    
    -- Validate testemunha_1_cpf (optional, but if provided must be valid)
    IF NEW.testemunha_1_cpf IS NOT NULL AND NEW.testemunha_1_cpf != '' AND LENGTH(REGEXP_REPLACE(NEW.testemunha_1_cpf, '[^0-9]', '', 'g')) != 11 THEN
      RAISE EXCEPTION 'CPF da Testemunha 1 must contain exactly 11 digits';
    END IF;
    
    -- Validate testemunha_2_cpf (optional, but if provided must be valid)
    IF NEW.testemunha_2_cpf IS NOT NULL AND NEW.testemunha_2_cpf != '' AND LENGTH(REGEXP_REPLACE(NEW.testemunha_2_cpf, '[^0-9]', '', 'g')) != 11 THEN
      RAISE EXCEPTION 'CPF da Testemunha 2 must contain exactly 11 digits';
    END IF;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    -- Original validation for profiles table
    IF NEW.cpf IS NOT NULL AND LENGTH(REGEXP_REPLACE(NEW.cpf, '[^0-9]', '', 'g')) != 11 THEN
      RAISE EXCEPTION 'CPF must contain exactly 11 digits';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply validation trigger to contratos_namoro
DROP TRIGGER IF EXISTS validate_cpf_before_insert ON public.contratos_namoro;
CREATE TRIGGER validate_cpf_before_insert
  BEFORE INSERT OR UPDATE ON public.contratos_namoro
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cpf_format();

-- Add temporary encrypted columns for migration
ALTER TABLE public.contratos_namoro 
  ADD COLUMN IF NOT EXISTS parte_1_cpf_encrypted text,
  ADD COLUMN IF NOT EXISTS parte_2_cpf_encrypted text,
  ADD COLUMN IF NOT EXISTS testemunha_1_cpf_encrypted text,
  ADD COLUMN IF NOT EXISTS testemunha_2_cpf_encrypted text;

-- Migrate existing CPF data to encrypted columns
UPDATE public.contratos_namoro
SET 
  parte_1_cpf_encrypted = public.encrypt_cpf(parte_1_cpf),
  parte_2_cpf_encrypted = public.encrypt_cpf(parte_2_cpf),
  testemunha_1_cpf_encrypted = CASE 
    WHEN testemunha_1_cpf IS NOT NULL AND testemunha_1_cpf != '' 
    THEN public.encrypt_cpf(testemunha_1_cpf)
    ELSE NULL
  END,
  testemunha_2_cpf_encrypted = CASE 
    WHEN testemunha_2_cpf IS NOT NULL AND testemunha_2_cpf != '' 
    THEN public.encrypt_cpf(testemunha_2_cpf)
    ELSE NULL
  END
WHERE parte_1_cpf_encrypted IS NULL;

-- Drop old unencrypted columns
ALTER TABLE public.contratos_namoro 
  DROP COLUMN IF EXISTS parte_1_cpf,
  DROP COLUMN IF EXISTS parte_2_cpf,
  DROP COLUMN IF EXISTS testemunha_1_cpf,
  DROP COLUMN IF EXISTS testemunha_2_cpf;

-- Rename encrypted columns to original names
ALTER TABLE public.contratos_namoro 
  RENAME COLUMN parte_1_cpf_encrypted TO parte_1_cpf;
ALTER TABLE public.contratos_namoro 
  RENAME COLUMN parte_2_cpf_encrypted TO parte_2_cpf;
ALTER TABLE public.contratos_namoro 
  RENAME COLUMN testemunha_1_cpf_encrypted TO testemunha_1_cpf;
ALTER TABLE public.contratos_namoro 
  RENAME COLUMN testemunha_2_cpf_encrypted TO testemunha_2_cpf;

-- Add indexes for encrypted CPF fields (for lookup performance)
CREATE INDEX IF NOT EXISTS idx_contratos_parte_1_cpf ON public.contratos_namoro(parte_1_cpf);
CREATE INDEX IF NOT EXISTS idx_contratos_parte_2_cpf ON public.contratos_namoro(parte_2_cpf);

-- Update table and column comments
COMMENT ON TABLE public.contratos_namoro IS 'Dating contracts with PII data. Protected by RLS policies and field-level encryption. All CPF fields are encrypted at rest using AES-256.';
COMMENT ON COLUMN public.contratos_namoro.parte_1_cpf IS 'Party 1 CPF (Brazilian tax ID) - ENCRYPTED at rest using AES-256. Use decrypt_cpf() to retrieve plain text.';
COMMENT ON COLUMN public.contratos_namoro.parte_2_cpf IS 'Party 2 CPF (Brazilian tax ID) - ENCRYPTED at rest using AES-256. Use decrypt_cpf() to retrieve plain text.';
COMMENT ON COLUMN public.contratos_namoro.testemunha_1_cpf IS 'Witness 1 CPF (Brazilian tax ID) - ENCRYPTED at rest using AES-256. Use decrypt_cpf() to retrieve plain text. Optional field.';
COMMENT ON COLUMN public.contratos_namoro.testemunha_2_cpf IS 'Witness 2 CPF (Brazilian tax ID) - ENCRYPTED at rest using AES-256. Use decrypt_cpf() to retrieve plain text. Optional field.';