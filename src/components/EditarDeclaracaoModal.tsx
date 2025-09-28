import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Declaracao {
  ano: number;
  status: string;
  prazoLimite: string;
  recibo: string | null;
  valorPagar: number;
  valorRestituir: number;
}

interface EditarDeclaracaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  declaracao: Declaracao | null;
  onDeclaracaoUpdated: (declaracao: Declaracao) => void;
}

export default function EditarDeclaracaoModal({ open, onOpenChange, declaracao, onDeclaracaoUpdated }: EditarDeclaracaoModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    ano: 2024,
    status: "",
    prazoLimite: "",
    recibo: "",
    valorPagar: "",
    valorRestituir: "",
    observacoes: ""
  });

  useEffect(() => {
    if (declaracao) {
      setFormData({
        ano: declaracao.ano,
        status: declaracao.status,
        prazoLimite: declaracao.prazoLimite,
        recibo: declaracao.recibo || "",
        valorPagar: declaracao.valorPagar.toString(),
        valorRestituir: declaracao.valorRestituir.toString(),
        observacoes: ""
      });
    }
  }, [declaracao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.status || !formData.prazoLimite) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedDeclaracao: Declaracao = {
        ano: formData.ano,
        status: formData.status,
        prazoLimite: formData.prazoLimite,
        recibo: formData.recibo || null,
        valorPagar: parseFloat(formData.valorPagar) || 0,
        valorRestituir: parseFloat(formData.valorRestituir) || 0
      };

      onDeclaracaoUpdated(updatedDeclaracao);

      toast({
        title: "Sucesso!",
        description: "Declaração atualizada com sucesso."
      });

      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar declaração.",
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
          <DialogTitle>Editar Declaração {formData.ano}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Entregue">Entregue</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prazoLimite">Prazo Limite</Label>
            <Input
              id="prazoLimite"
              type="date"
              value={formData.prazoLimite}
              onChange={(e) => setFormData({ ...formData, prazoLimite: e.target.value })}
              required
            />
          </div>

          {formData.status === "Entregue" && (
            <div className="space-y-2">
              <Label htmlFor="recibo">Número do Recibo</Label>
              <Input
                id="recibo"
                placeholder="000123456789"
                value={formData.recibo}
                onChange={(e) => setFormData({ ...formData, recibo: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorPagar">Valor a Pagar (R$)</Label>
              <Input
                id="valorPagar"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.valorPagar}
                onChange={(e) => setFormData({ ...formData, valorPagar: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorRestituir">Valor a Restituir (R$)</Label>
              <Input
                id="valorRestituir"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.valorRestituir}
                onChange={(e) => setFormData({ ...formData, valorRestituir: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações sobre esta declaração..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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