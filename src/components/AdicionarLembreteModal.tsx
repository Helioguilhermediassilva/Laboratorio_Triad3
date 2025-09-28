import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AdicionarLembreteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLembreteAdded: () => void;
}

export default function AdicionarLembreteModal({ open, onOpenChange, onLembreteAdded }: AdicionarLembreteModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    evento: "",
    data: "",
    observacoes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.evento || !formData.data) {
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

      toast({
        title: "Sucesso!",
        description: "Lembrete adicionado com sucesso."
      });

      // Reset form
      setFormData({
        evento: "",
        data: "",
        observacoes: ""
      });

      onLembreteAdded();
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar lembrete.",
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
          <DialogTitle>Adicionar Lembrete</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="evento">Nome do Evento</Label>
            <Input
              id="evento"
              placeholder="Ex: Entrega da Declaração IRPF 2024"
              value={formData.evento}
              onChange={(e) => setFormData({ ...formData, evento: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data do Prazo</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações sobre este prazo..."
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
              {loading ? "Salvando..." : "Salvar Lembrete"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}