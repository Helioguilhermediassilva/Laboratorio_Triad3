-- Create a security definer function to validate beneficiary access
-- This ensures access is only granted through proper testamento ownership
CREATE OR REPLACE FUNCTION public.can_access_beneficiary(_beneficiary_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM beneficiarios_testamento b
    INNER JOIN testamentos t ON b.testamento_id = t.id
    WHERE b.id = _beneficiary_id
      AND t.user_id = auth.uid()
  );
$$;

-- Add comment explaining the security measures
COMMENT ON TABLE public.beneficiarios_testamento IS 'Contains sensitive PII of third parties (nome, CPF). Access strictly controlled via testamento ownership. All CPF data must be handled with extreme care and never exposed in logs or error messages.';

-- Add constraint to ensure testamento_id always references a valid testamento
ALTER TABLE public.beneficiarios_testamento DROP CONSTRAINT IF EXISTS beneficiarios_testamento_testamento_id_fkey;
ALTER TABLE public.beneficiarios_testamento 
  ADD CONSTRAINT beneficiarios_testamento_testamento_id_fkey 
  FOREIGN KEY (testamento_id) 
  REFERENCES testamentos(id) 
  ON DELETE CASCADE;

-- Add index for better JOIN performance
CREATE INDEX IF NOT EXISTS idx_beneficiarios_testamento_id ON beneficiarios_testamento(testamento_id);

-- Add validation trigger to prevent CPF format issues (basic validation)
CREATE OR REPLACE FUNCTION public.validate_cpf_format()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove any non-numeric characters for validation
  IF NEW.cpf IS NOT NULL AND LENGTH(REGEXP_REPLACE(NEW.cpf, '[^0-9]', '', 'g')) != 11 THEN
    RAISE EXCEPTION 'CPF must contain exactly 11 digits';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_beneficiary_cpf
  BEFORE INSERT OR UPDATE ON beneficiarios_testamento
  FOR EACH ROW
  EXECUTE FUNCTION validate_cpf_format();