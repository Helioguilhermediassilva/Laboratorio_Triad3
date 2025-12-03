-- Drop CPF validation triggers on contratos_namoro (CPFs are encrypted)
DROP TRIGGER IF EXISTS validate_contratos_namoro_cpf_format ON contratos_namoro;
DROP TRIGGER IF EXISTS validate_cpf_before_insert ON contratos_namoro;