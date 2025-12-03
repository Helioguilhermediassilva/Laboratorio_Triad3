import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface EditarMetaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta: any;
  onMetaEditada: (meta: any) => void;
}

export default function EditarMetaModal({
  open,
  onOpenChange,
  meta,
  onMetaEditada
}: EditarMetaModalProps) {
  const [titulo, setTitulo] = useState("");
  const [valorObjetivo, setValorObjetivo] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [dataObjetivo, setDataObjetivo] = useState<Date>();
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (meta) {
      setTitulo(meta.titulo || "");
      setValorObjetivo(formatCurrency(String(meta.valor_objetivo * 100)));
      setValorAtual(formatCurrency(String(meta.valor_atual * 100)));
      setDataObjetivo(meta.data_objetivo ? new Date(meta.data_objetivo) : undefined);
      setDescricao(meta.descricao || "");
    }
  }, [meta]);

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

  const handleValorObjetivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorObjetivo(formatCurrency(e.target.value));
  };

  const handleValorAtualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorAtual(formatCurrency(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo || !valorObjetivo || !dataObjetivo) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const valorObjetivoNum = parseCurrencyToNumber(valorObjetivo);
      const valorAtualNum = parseCurrencyToNumber(valorAtual);

      // Determinar status baseado no progresso
      let status = "Em Andamento";
      if (valorAtualNum >= valorObjetivoNum) {
        status = "Concluída";
      }

      const { data, error } = await supabase
        .from('metas_financeiras')
        .update({
          titulo,
          valor_objetivo: valorObjetivoNum,
          valor_atual: valorAtualNum,
          data_objetivo: format(dataObjetivo, 'yyyy-MM-dd'),
          descricao,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', meta.id)
        .select()
        .single();

      if (error) throw error;

      onMetaEditada(data);
      
      toast({
        title: "Meta atualizada!",
        description: "As alterações foram salvas com sucesso."
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar meta:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar a meta.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!meta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Meta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título da Meta *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reserva de Emergência"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorObjetivo">Valor da Meta *</Label>
              <Input
                id="valorObjetivo"
                value={valorObjetivo}
                onChange={handleValorObjetivoChange}
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorAtual">Valor Atual</Label>
              <Input
                id="valorAtual"
                value={valorAtual}
                onChange={handleValorAtualChange}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data Objetivo *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataObjetivo ? (
                    format(dataObjetivo, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataObjetivo}
                  onSelect={setDataObjetivo}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes sobre a meta..."
              rows={3}
            />
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
