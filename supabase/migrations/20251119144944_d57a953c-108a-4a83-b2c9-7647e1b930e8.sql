-- Adicionar campos de estado civil e regime de bens na tabela testamentos
ALTER TABLE public.testamentos
ADD COLUMN estado_civil TEXT,
ADD COLUMN regime_bens TEXT,
ADD COLUMN nome_conjuge TEXT;