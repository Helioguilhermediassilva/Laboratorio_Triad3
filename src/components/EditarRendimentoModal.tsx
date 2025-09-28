import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Rendimento {
  fonte: string;
  cnpj: string;
  tipo: string;
  valor: number;
  irrf: number;
  ano: number;
}

interface EditarRendimentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rendimento: Rendimento | null;
  rendimentoIndex: number;
  onRendimentoUpdated: (index: number, rendimento: Rendimento) => void;
}

export default function EditarRendimentoModal({ 
  open, 
  onOpenChange, 
  rendimento, 
  rendimentoIndex,
  onRendimentoUpdated 
}: EditarRendimentoModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fonte: "",
    cnpj: "",
    tipo: "",
    valor: "",
    irrf: "",
    ano: new Date().getFullYear()
  });

  useEffect(() => {
    if (rendimento) {
      setFormData({
        fonte: rendimento.fonte,
        cnpj: rendimento.cnpj,
        tipo: rendimento.tipo,
        valor: rendimento.valor.toString(),
        irrf: rendimento.irrf.toString(),
        ano: rendimento.ano
      });
    }
  }, [rendimento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fonte || !formData.tipo || !formData.valor) {
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

      const updatedRendimento: Rendimento = {
        fonte: formData.fonte,
        cnpj: formData.cnpj,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        irrf: parseFloat(formData.irrf) || 0,
        ano: formData.ano
      };

      onRendimentoUpdated(rendimentoIndex, updatedRendimento);

      toast({
        title: "Sucesso!",
        description: "Rendimento atualizado com sucesso."
      });

      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar rendimento.",
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
          <DialogTitle>Editar Rendimento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fonte">Fonte Pagadora</Label>
            <Input
              id="fonte"
              placeholder="Ex: Empresa XYZ Ltda"
              value={formData.fonte}
              onChange={(e) => setFormData({ ...formData, fonte: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ/CPF</Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Rendimento</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Salário">Salário</SelectItem>
                <SelectItem value="Serviços">Serviços</SelectItem>
                <SelectItem value="Dividendos">Dividendos</SelectItem>
                <SelectItem value="Aluguéis">Aluguéis</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="irrf">IRRF (R$)</Label>
              <Input
                id="irrf"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.irrf}
                onChange={(e) => setFormData({ ...formData, irrf: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ano">Ano</Label>
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