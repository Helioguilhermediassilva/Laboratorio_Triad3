-- Drop the CPF validation trigger for contratos_namoro since CPFs are encrypted
DROP TRIGGER IF EXISTS validate_cpf_contratos_namoro ON contratos_namoro;