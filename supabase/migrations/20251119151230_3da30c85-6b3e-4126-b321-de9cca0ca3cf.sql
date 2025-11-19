-- Strengthen RLS policies for declaracoes_irpf table to prevent unauthorized access to tax data
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own declarations" ON public.declaracoes_irpf;
DROP POLICY IF EXISTS "Users can insert their own declarations" ON public.declaracoes_irpf;
DROP POLICY IF EXISTS "Users can update their own declarations" ON public.declaracoes_irpf;
DROP POLICY IF EXISTS "Users can delete their own declarations" ON public.declaracoes_irpf;

-- Create strengthened policies restricted to authenticated users only (not public)
CREATE POLICY "Users can view their own declarations"
ON public.declaracoes_irpf
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own declarations"
ON public.declaracoes_irpf
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own declarations"
ON public.declaracoes_irpf
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own declarations"
ON public.declaracoes_irpf
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add security documentation comments
COMMENT ON TABLE public.declaracoes_irpf IS 'Tax return declarations (IRPF) with highly sensitive financial data including amounts owed/refunded and complete tax information. Protected by RLS policies restricted to authenticated users only. Each user can only access their own declarations.';

COMMENT ON COLUMN public.declaracoes_irpf.valor_pagar IS 'Tax amount owed - sensitive financial data. Access restricted by RLS.';
COMMENT ON COLUMN public.declaracoes_irpf.valor_restituir IS 'Tax refund amount - sensitive financial data. Access restricted by RLS.';
COMMENT ON COLUMN public.declaracoes_irpf.dados_brutos IS 'Raw tax data (JSONB) - highly sensitive. Contains complete financial information. Access restricted by RLS.';
COMMENT ON COLUMN public.declaracoes_irpf.recibo IS 'Tax declaration receipt number - sensitive. Access restricted by RLS.';
COMMENT ON COLUMN public.declaracoes_irpf.arquivo_original IS 'Original file path - may contain sensitive references. Access restricted by RLS.';

-- Create performance index on user_id for faster RLS checks
CREATE INDEX IF NOT EXISTS idx_declaracoes_irpf_user_id ON public.declaracoes_irpf(user_id);

-- Strengthen RLS policies for related tables: rendimentos_irpf
DROP POLICY IF EXISTS "Users can view their own income" ON public.rendimentos_irpf;
DROP POLICY IF EXISTS "Users can insert their own income" ON public.rendimentos_irpf;
DROP POLICY IF EXISTS "Users can update their own income" ON public.rendimentos_irpf;
DROP POLICY IF EXISTS "Users can delete their own income" ON public.rendimentos_irpf;

CREATE POLICY "Users can view their own income"
ON public.rendimentos_irpf
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own income"
ON public.rendimentos_irpf
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income"
ON public.rendimentos_irpf
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income"
ON public.rendimentos_irpf
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

COMMENT ON TABLE public.rendimentos_irpf IS 'Income data from tax returns - highly sensitive financial information including salaries, CNPJ, and withheld taxes. Protected by RLS.';

-- Strengthen RLS policies for related tables: bens_direitos_irpf
DROP POLICY IF EXISTS "Users can view their own assets" ON public.bens_direitos_irpf;
DROP POLICY IF EXISTS "Users can insert their own assets" ON public.bens_direitos_irpf;
DROP POLICY IF EXISTS "Users can update their own assets" ON public.bens_direitos_irpf;
DROP POLICY IF EXISTS "Users can delete their own assets" ON public.bens_direitos_irpf;

CREATE POLICY "Users can view their own assets"
ON public.bens_direitos_irpf
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets"
ON public.bens_direitos_irpf
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets"
ON public.bens_direitos_irpf
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
ON public.bens_direitos_irpf
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

COMMENT ON TABLE public.bens_direitos_irpf IS 'Assets and rights from tax returns - sensitive financial information including property values and descriptions. Protected by RLS.';

-- Strengthen RLS policies for related tables: dividas_irpf
DROP POLICY IF EXISTS "Users can view their own debts" ON public.dividas_irpf;
DROP POLICY IF EXISTS "Users can insert their own debts" ON public.dividas_irpf;
DROP POLICY IF EXISTS "Users can update their own debts" ON public.dividas_irpf;
DROP POLICY IF EXISTS "Users can delete their own debts" ON public.dividas_irpf;

CREATE POLICY "Users can view their own debts"
ON public.dividas_irpf
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debts"
ON public.dividas_irpf
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts"
ON public.dividas_irpf
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts"
ON public.dividas_irpf
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

COMMENT ON TABLE public.dividas_irpf IS 'Debt information from tax returns - sensitive financial data including creditors and amounts. Protected by RLS.';