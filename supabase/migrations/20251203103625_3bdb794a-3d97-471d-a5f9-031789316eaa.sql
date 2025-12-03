-- Encrypt existing CPF data in profiles table
UPDATE profiles 
SET cpf = (SELECT public.encrypt_cpf(cpf))
WHERE cpf IS NOT NULL 
AND cpf != '' 
AND cpf NOT LIKE '%==%';