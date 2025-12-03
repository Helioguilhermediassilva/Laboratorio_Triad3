-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Update encrypt_cpf function to use correct schema reference
CREATE OR REPLACE FUNCTION public.encrypt_cpf(cpf_plain text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  encryption_key text := 'triad3-cpf-encryption-key-2025';
BEGIN
  IF cpf_plain IS NULL OR cpf_plain = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN encode(
    encrypt(
      cpf_plain::bytea,
      encryption_key::bytea,
      'aes'
    ),
    'base64'
  );
END;
$function$;

-- Update decrypt_cpf function to use correct schema reference
CREATE OR REPLACE FUNCTION public.decrypt_cpf(cpf_encrypted text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  encryption_key text := 'triad3-cpf-encryption-key-2025';
BEGIN
  IF cpf_encrypted IS NULL OR cpf_encrypted = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN convert_from(
    decrypt(
      decode(cpf_encrypted, 'base64'),
      encryption_key::bytea,
      'aes'
    ),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$function$;