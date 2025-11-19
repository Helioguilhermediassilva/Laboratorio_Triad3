-- Create table for dating contracts (contratos de namoro)
CREATE TABLE public.contratos_namoro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  parte_1_nome TEXT NOT NULL,
  parte_1_cpf TEXT NOT NULL,
  parte_1_endereco TEXT,
  parte_2_nome TEXT NOT NULL,
  parte_2_cpf TEXT NOT NULL,
  parte_2_endereco TEXT,
  regime_bens TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_elaboracao DATE NOT NULL DEFAULT CURRENT_DATE,
  deveres_parte_1 TEXT,
  deveres_parte_2 TEXT,
  direitos_parte_1 TEXT,
  direitos_parte_2 TEXT,
  clausulas_adicionais TEXT,
  testemunha_1_nome TEXT,
  testemunha_1_cpf TEXT,
  testemunha_2_nome TEXT,
  testemunha_2_cpf TEXT,
  documento_url TEXT,
  status TEXT NOT NULL DEFAULT 'Vigente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contratos_namoro ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own dating contracts"
  ON public.contratos_namoro FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own dating contracts"
  ON public.contratos_namoro FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dating contracts"
  ON public.contratos_namoro FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dating contracts"
  ON public.contratos_namoro FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.contratos_namoro IS 'Contains dating contracts with rights, duties and property regime definitions. Protected by RLS policies.';

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contratos_namoro_updated_at
  BEFORE UPDATE ON public.contratos_namoro
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better query performance
CREATE INDEX idx_contratos_namoro_user_id ON public.contratos_namoro(user_id);
CREATE INDEX idx_contratos_namoro_status ON public.contratos_namoro(status);