-- Strengthen RLS policies for contratos_namoro table to prevent unauthorized access to CPF data
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own dating contracts" ON public.contratos_namoro;
DROP POLICY IF EXISTS "Users can create own dating contracts" ON public.contratos_namoro;
DROP POLICY IF EXISTS "Users can update own dating contracts" ON public.contratos_namoro;
DROP POLICY IF EXISTS "Users can delete own dating contracts" ON public.contratos_namoro;

-- Create strengthened policies restricted to authenticated users only (not public)
CREATE POLICY "Users can view own dating contracts"
ON public.contratos_namoro
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own dating contracts"
ON public.contratos_namoro
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dating contracts"
ON public.contratos_namoro
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dating contracts"
ON public.contratos_namoro
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add trigger to validate CPF format for all CPF columns before insert/update
CREATE TRIGGER validate_contratos_namoro_cpf_format
BEFORE INSERT OR UPDATE ON public.contratos_namoro
FOR EACH ROW
EXECUTE FUNCTION public.validate_cpf_format();

-- Update the validate_cpf_format function to handle contratos_namoro CPF columns
CREATE OR REPLACE FUNCTION public.validate_cpf_format()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Add security documentation comments
COMMENT ON TABLE public.contratos_namoro IS 'Dating contracts with sensitive PII for multiple parties (CPF, names, addresses). Contains CPF data for 2 parties and up to 2 witnesses. Protected by RLS policies restricted to authenticated users. Server-side CPF validation enforced via trigger.';

COMMENT ON COLUMN public.contratos_namoro.parte_1_cpf IS 'Brazilian tax ID (CPF) for first party - highly sensitive PII. Validated server-side, access restricted by RLS.';
COMMENT ON COLUMN public.contratos_namoro.parte_2_cpf IS 'Brazilian tax ID (CPF) for second party - highly sensitive PII. Validated server-side, access restricted by RLS.';
COMMENT ON COLUMN public.contratos_namoro.testemunha_1_cpf IS 'Brazilian tax ID (CPF) for first witness - highly sensitive PII. Optional field, validated if provided.';
COMMENT ON COLUMN public.contratos_namoro.testemunha_2_cpf IS 'Brazilian tax ID (CPF) for second witness - highly sensitive PII. Optional field, validated if provided.';

-- Create performance index on user_id for faster RLS checks
CREATE INDEX IF NOT EXISTS idx_contratos_namoro_user_id ON public.contratos_namoro(user_id);