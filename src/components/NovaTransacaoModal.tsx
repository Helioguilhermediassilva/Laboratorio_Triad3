import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface NovaTransacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransacaoAdded: () => void;
}

const categorias = [
  "Salário",
  "Freelance", 
  "Investimentos",
  "Vendas",
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Lazer",
  "Outros"
];

const contas = [
  "Conta Corrente Itaú",
  "Conta Corrente XP",
  "Conta Corrente Nubank",
  "Cartão de Crédito",
  "Cartão de Débito",
  "PayPal"
];

export default function NovaTransacaoModal({ open, onOpenChange, onTransacaoAdded }: NovaTransacaoModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: "",
    categoria: "",
    tipo: "entrada" as "entrada" | "saida",
    valor: "",
    conta: "",
    observacoes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao || !formData.categoria || !formData.valor || !formData.conta) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para adicionar transações.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('transacoes')
        .insert([
          {
            user_id: user.id,
            data: formData.data,
            descricao: formData.descricao,
            categoria: formData.categoria,
            tipo: formData.tipo,
            valor: parseFloat(formData.valor),
            conta: formData.conta,
            observacoes: formData.observacoes || null
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Transação adicionada com sucesso."
      });

      // Reset form
      setFormData({
        data: new Date().toISOString().split('T')[0],
        descricao: "",
        categoria: "",
        tipo: "entrada",
        valor: "",
        conta: "",
        observacoes: ""
      });

      onTransacaoAdded();
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar transação.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="Ex: Salário mensal"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <RadioGroup
              value={formData.tipo}
              onValueChange={(value: "entrada" | "saida") => setFormData({ ...formData, tipo: value })}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="entrada" id="entrada" />
                <Label htmlFor="entrada" className="flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-green-500" />
                  Entrada
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="saida" id="saida" />
                <Label htmlFor="saida" className="flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-red-500" />
                  Saída
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(categoria => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conta">Conta</Label>
            <Select
              value={formData.conta}
              onValueChange={(value) => setFormData({ ...formData, conta: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {contas.map(conta => (
                  <SelectItem key={conta} value={conta}>
                    {conta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione detalhes sobre esta transação..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Transação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}