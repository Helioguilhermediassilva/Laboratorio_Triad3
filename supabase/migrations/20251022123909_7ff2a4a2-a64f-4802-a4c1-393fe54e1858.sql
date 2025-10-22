-- Tabela para declarações importadas
CREATE TABLE IF NOT EXISTS public.declaracoes_irpf (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ano INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Importada',
  prazo_limite DATE,
  recibo TEXT,
  valor_pagar NUMERIC DEFAULT 0,
  valor_restituir NUMERIC DEFAULT 0,
  arquivo_original TEXT,
  dados_brutos JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para rendimentos extraídos
CREATE TABLE IF NOT EXISTS public.rendimentos_irpf (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  declaracao_id UUID REFERENCES public.declaracoes_irpf(id) ON DELETE CASCADE,
  fonte_pagadora TEXT NOT NULL,
  cnpj TEXT,
  tipo TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  irrf NUMERIC DEFAULT 0,
  contribuicao_previdenciaria NUMERIC DEFAULT 0,
  decimo_terceiro NUMERIC DEFAULT 0,
  ano INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para bens e direitos (imobilizado)
CREATE TABLE IF NOT EXISTS public.bens_direitos_irpf (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  declaracao_id UUID REFERENCES public.declaracoes_irpf(id) ON DELETE CASCADE,
  codigo TEXT,
  discriminacao TEXT NOT NULL,
  situacao_ano_anterior NUMERIC DEFAULT 0,
  situacao_ano_atual NUMERIC NOT NULL,
  categoria TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para dívidas extraídas
CREATE TABLE IF NOT EXISTS public.dividas_irpf (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  declaracao_id UUID REFERENCES public.declaracoes_irpf(id) ON DELETE CASCADE,
  discriminacao TEXT NOT NULL,
  valor_ano_anterior NUMERIC DEFAULT 0,
  valor_ano_atual NUMERIC NOT NULL,
  credor TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.declaracoes_irpf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendimentos_irpf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bens_direitos_irpf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividas_irpf ENABLE ROW LEVEL SECURITY;

-- RLS Policies for declaracoes_irpf
CREATE POLICY "Users can view their own declarations"
  ON public.declaracoes_irpf FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own declarations"
  ON public.declaracoes_irpf FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own declarations"
  ON public.declaracoes_irpf FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own declarations"
  ON public.declaracoes_irpf FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for rendimentos_irpf
CREATE POLICY "Users can view their own income"
  ON public.rendimentos_irpf FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own income"
  ON public.rendimentos_irpf FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income"
  ON public.rendimentos_irpf FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income"
  ON public.rendimentos_irpf FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for bens_direitos_irpf
CREATE POLICY "Users can view their own assets"
  ON public.bens_direitos_irpf FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets"
  ON public.bens_direitos_irpf FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets"
  ON public.bens_direitos_irpf FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
  ON public.bens_direitos_irpf FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dividas_irpf
CREATE POLICY "Users can view their own debts"
  ON public.dividas_irpf FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debts"
  ON public.dividas_irpf FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts"
  ON public.dividas_irpf FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts"
  ON public.dividas_irpf FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_declaracoes_irpf_updated_at
  BEFORE UPDATE ON public.declaracoes_irpf
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for declaration files
INSERT INTO storage.buckets (id, name, public)
VALUES ('declaracoes-irpf', 'declaracoes-irpf', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own declarations"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'declaracoes-irpf' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own declarations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'declaracoes-irpf' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own declarations"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'declaracoes-irpf' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );