-- Create transacoes table for Livro Caixa
CREATE TABLE public.transacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor DECIMAL(15,2) NOT NULL,
  conta TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own transacoes"
ON public.transacoes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transacoes"
ON public.transacoes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transacoes"
ON public.transacoes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transacoes"
ON public.transacoes
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_transacoes_updated_at
BEFORE UPDATE ON public.transacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_transacoes_user_id ON public.transacoes(user_id);
CREATE INDEX idx_transacoes_data ON public.transacoes(data);
CREATE INDEX idx_transacoes_categoria ON public.transacoes(categoria);
CREATE INDEX idx_transacoes_tipo ON public.transacoes(tipo);