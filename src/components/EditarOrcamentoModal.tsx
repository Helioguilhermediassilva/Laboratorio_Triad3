import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EditarOrcamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: any;
  onOrcamentoEditado: (orcamento: any) => void;
}

export default function EditarOrcamentoModal({
  open,
  onOpenChange,
  orcamento,
  onOrcamentoEditado
}: EditarOrcamentoModalProps) {
  const [categoria, setCategoria] = useState("");
  const [valorPlanejado, setValorPlanejado] = useState("");
  const [valorGasto, setValorGasto] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (orcamento) {
      setCategoria(orcamento.categoria || "");
      setValorPlanejado(formatCurrency(String(orcamento.valor_planejado * 100)));
      setValorGasto(formatCurrency(String(orcamento.valor_gasto * 100)));
    }
  }, [orcamento]);

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    const formattedValue = (parseFloat(numericValue) / 100).toFixed(2);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(formattedValue));
  };

  const parseCurrencyToNumber = (value: string): number => {
    const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(numericValue) || 0;
  };

  const handleValorPlanejadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorPlanejado(formatCurrency(e.target.value));
  };

  const handleValorGastoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorGasto(formatCurrency(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoria || !valorPlanejado) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .update({
          categoria,
          valor_planejado: parseCurrencyToNumber(valorPlanejado),
          valor_gasto: parseCurrencyToNumber(valorGasto),
          updated_at: new Date().toISOString()
        })
        .eq('id', orcamento.id)
        .select()
        .single();

      if (error) throw error;

      onOrcamentoEditado(data);
      
      toast({
        title: "Orçamento atualizado!",
        description: "As alterações foram salvas com sucesso."
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar orçamento:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o orçamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!orcamento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Orçamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Input
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex: Alimentação"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorPlanejado">Valor Planejado *</Label>
              <Input
                id="valorPlanejado"
                value={valorPlanejado}
                onChange={handleValorPlanejadoChange}
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorGasto">Valor Gasto</Label>
              <Input
                id="valorGasto"
                value={valorGasto}
                onChange={handleValorGastoChange}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
