import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface NovaDeclaracaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeclaracaoAdded: () => void;
}

export default function NovaDeclaracaoModal({ open, onOpenChange, onDeclaracaoAdded }: NovaDeclaracaoModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    ano: new Date().getFullYear(),
    prazoLimite: "",
    observacoes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.prazoLimite) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o prazo limite.",
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
        description: "Nova declaração iniciada com sucesso."
      });

      // Reset form
      setFormData({
        ano: new Date().getFullYear(),
        prazoLimite: "",
        observacoes: ""
      });

      onDeclaracaoAdded();
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao criar nova declaração.",
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
          <DialogTitle>Nova Declaração de Imposto de Renda</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ano">Ano Base</Label>
            <Select
              value={formData.ano.toString()}
              onValueChange={(value) => setFormData({ ...formData, ano: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
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

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Input
              id="observacoes"
              placeholder="Adicione observações sobre esta declaração..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Declaração"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}