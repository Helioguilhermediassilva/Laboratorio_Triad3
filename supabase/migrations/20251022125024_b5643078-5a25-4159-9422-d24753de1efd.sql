-- ==========================================
-- ESTRUTURA COMPLETA DO BANCO DE DADOS TRIAD3
-- ==========================================

-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome_completo TEXT,
  cpf TEXT UNIQUE,
  telefone TEXT,
  data_nascimento DATE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil ao registrar usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- CONTAS BANCÁRIAS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.contas_bancarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banco TEXT NOT NULL,
  agencia TEXT,
  numero_conta TEXT NOT NULL,
  tipo_conta TEXT NOT NULL CHECK (tipo_conta IN ('Corrente', 'Poupança', 'Salário', 'Investimento')),
  saldo_atual NUMERIC NOT NULL DEFAULT 0,
  limite_credito NUMERIC DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==========================================
-- APLICAÇÕES FINANCEIRAS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.aplicacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('CDB', 'LCI', 'LCA', 'Tesouro Direto', 'Fundo', 'Ações', 'Outro')),
  instituicao TEXT NOT NULL,
  valor_aplicado NUMERIC NOT NULL,
  valor_atual NUMERIC NOT NULL,
  data_aplicacao DATE NOT NULL,
  data_vencimento DATE,
  taxa_rentabilidade NUMERIC,
  rentabilidade_tipo TEXT CHECK (rentabilidade_tipo IN ('CDI', 'IPCA', 'Pré-fixado', 'Variável')),
  liquidez TEXT CHECK (liquidez IN ('Diária', 'Mensal', 'No Vencimento')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==========================================
-- BENS IMOBILIZADOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.bens_imobilizados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Imóvel', 'Veículo', 'Equipamento', 'Móveis', 'Outro')),
  valor_aquisicao NUMERIC NOT NULL,
  valor_atual NUMERIC NOT NULL,
  data_aquisicao DATE NOT NULL,
  descricao TEXT,
  localizacao TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Vendido', 'Doado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==========================================
-- DÍVIDAS E FINANCIAMENTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.dividas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Financiamento Imobiliário', 'Financiamento Veículo', 'Empréstimo Pessoal', 'Cartão de Crédito', 'Outro')),
  credor TEXT NOT NULL,
  valor_original NUMERIC NOT NULL,
  saldo_devedor NUMERIC NOT NULL,
  valor_parcela NUMERIC NOT NULL,
  numero_parcelas INTEGER NOT NULL,
  parcelas_pagas INTEGER NOT NULL DEFAULT 0,
  taxa_juros NUMERIC,
  data_contratacao DATE NOT NULL,
  data_vencimento DATE,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Quitado', 'Atrasado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==========================================
-- PLANOS DE PREVIDÊNCIA
-- ==========================================
CREATE TABLE IF NOT EXISTS public.planos_previdencia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('PGBL', 'VGBL', 'Previdência Privada', 'INSS')),
  instituicao TEXT NOT NULL,
  valor_acumulado NUMERIC NOT NULL DEFAULT 0,
  contribuicao_mensal NUMERIC NOT NULL,
  data_inicio DATE NOT NULL,
  idade_resgate INTEGER,
  taxa_administracao NUMERIC,
  rentabilidade_acumulada NUMERIC DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==========================================
-- ORÇAMENTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  valor_planejado NUMERIC NOT NULL,
  valor_gasto NUMERIC NOT NULL DEFAULT 0,
  mes_referencia DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Mensal' CHECK (tipo IN ('Mensal', 'Anual')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==========================================
-- METAS FINANCEIRAS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.metas_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  valor_objetivo NUMERIC NOT NULL,
  valor_atual NUMERIC NOT NULL DEFAULT 0,
  data_inicio DATE NOT NULL,
  data_objetivo DATE NOT NULL,
  categoria TEXT,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'Em Andamento' CHECK (status IN ('Em Andamento', 'Concluída', 'Pausada', 'Cancelada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==========================================
-- TESTAMENTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.testamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Público', 'Particular', 'Cerrado', 'Vital')),
  data_elaboracao DATE NOT NULL,
  cartorio TEXT,
  livro_numero TEXT,
  folha_numero TEXT,
  observacoes TEXT,
  documento_url TEXT,
  status TEXT NOT NULL DEFAULT 'Vigente' CHECK (status IN ('Vigente', 'Revogado', 'Modificado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==========================================
-- BENEFICIÁRIOS DO TESTAMENTO
-- ==========================================
CREATE TABLE IF NOT EXISTS public.beneficiarios_testamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  testamento_id UUID NOT NULL REFERENCES public.testamentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  parentesco TEXT,
  percentual_heranca NUMERIC CHECK (percentual_heranca >= 0 AND percentual_heranca <= 100),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==========================================
-- LEMBRETES E PRAZOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.lembretes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_vencimento DATE NOT NULL,
  categoria TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'Média' CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')),
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Concluído', 'Cancelado')),
  notificar_dias_antes INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aplicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bens_imobilizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_previdencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiarios_testamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lembretes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES - PROFILES
-- ==========================================
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ==========================================
-- RLS POLICIES - CONTAS BANCÁRIAS
-- ==========================================
CREATE POLICY "Users can view own accounts"
  ON public.contas_bancarias FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own accounts"
  ON public.contas_bancarias FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON public.contas_bancarias FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON public.contas_bancarias FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- RLS POLICIES - APLICAÇÕES
-- ==========================================
CREATE POLICY "Users can view own investments"
  ON public.aplicacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own investments"
  ON public.aplicacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments"
  ON public.aplicacoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments"
  ON public.aplicacoes FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- RLS POLICIES - BENS IMOBILIZADOS
-- ==========================================
CREATE POLICY "Users can view own assets"
  ON public.bens_imobilizados FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assets"
  ON public.bens_imobilizados FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON public.bens_imobilizados FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.bens_imobilizados FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- RLS POLICIES - DÍVIDAS
-- ==========================================
CREATE POLICY "Users can view own debts"
  ON public.dividas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own debts"
  ON public.dividas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts"
  ON public.dividas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts"
  ON public.dividas FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- RLS POLICIES - PREVIDÊNCIA
-- ==========================================
CREATE POLICY "Users can view own retirement plans"
  ON public.planos_previdencia FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own retirement plans"
  ON public.planos_previdencia FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own retirement plans"
  ON public.planos_previdencia FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own retirement plans"
  ON public.planos_previdencia FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- RLS POLICIES - ORÇAMENTOS
-- ==========================================
CREATE POLICY "Users can view own budgets"
  ON public.orcamentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets"
  ON public.orcamentos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON public.orcamentos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON public.orcamentos FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- RLS POLICIES - METAS
-- ==========================================
CREATE POLICY "Users can view own goals"
  ON public.metas_financeiras FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
  ON public.metas_financeiras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.metas_financeiras FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.metas_financeiras FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- RLS POLICIES - TESTAMENTOS
-- ==========================================
CREATE POLICY "Users can view own wills"
  ON public.testamentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wills"
  ON public.testamentos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wills"
  ON public.testamentos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wills"
  ON public.testamentos FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- RLS POLICIES - BENEFICIÁRIOS
-- ==========================================
CREATE POLICY "Users can view beneficiaries of own wills"
  ON public.beneficiarios_testamento FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.testamentos
    WHERE testamentos.id = beneficiarios_testamento.testamento_id
    AND testamentos.user_id = auth.uid()
  ));

CREATE POLICY "Users can create beneficiaries for own wills"
  ON public.beneficiarios_testamento FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.testamentos
    WHERE testamentos.id = beneficiarios_testamento.testamento_id
    AND testamentos.user_id = auth.uid()
  ));

CREATE POLICY "Users can update beneficiaries of own wills"
  ON public.beneficiarios_testamento FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.testamentos
    WHERE testamentos.id = beneficiarios_testamento.testamento_id
    AND testamentos.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete beneficiaries of own wills"
  ON public.beneficiarios_testamento FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.testamentos
    WHERE testamentos.id = beneficiarios_testamento.testamento_id
    AND testamentos.user_id = auth.uid()
  ));

-- ==========================================
-- RLS POLICIES - LEMBRETES
-- ==========================================
CREATE POLICY "Users can view own reminders"
  ON public.lembretes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminders"
  ON public.lembretes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON public.lembretes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON public.lembretes FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contas_bancarias_updated_at
  BEFORE UPDATE ON public.contas_bancarias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aplicacoes_updated_at
  BEFORE UPDATE ON public.aplicacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bens_imobilizados_updated_at
  BEFORE UPDATE ON public.bens_imobilizados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dividas_updated_at
  BEFORE UPDATE ON public.dividas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planos_previdencia_updated_at
  BEFORE UPDATE ON public.planos_previdencia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metas_financeiras_updated_at
  BEFORE UPDATE ON public.metas_financeiras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_testamentos_updated_at
  BEFORE UPDATE ON public.testamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lembretes_updated_at
  BEFORE UPDATE ON public.lembretes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_user_id ON public.contas_bancarias(user_id);
CREATE INDEX IF NOT EXISTS idx_aplicacoes_user_id ON public.aplicacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_bens_imobilizados_user_id ON public.bens_imobilizados(user_id);
CREATE INDEX IF NOT EXISTS idx_dividas_user_id ON public.dividas(user_id);
CREATE INDEX IF NOT EXISTS idx_planos_previdencia_user_id ON public.planos_previdencia(user_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_user_id ON public.orcamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_financeiras_user_id ON public.metas_financeiras(user_id);
CREATE INDEX IF NOT EXISTS idx_testamentos_user_id ON public.testamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_user_id ON public.lembretes(user_id);
CREATE INDEX IF NOT EXISTS idx_declaracoes_irpf_user_id ON public.declaracoes_irpf(user_id);
CREATE INDEX IF NOT EXISTS idx_rendimentos_irpf_user_id ON public.rendimentos_irpf(user_id);