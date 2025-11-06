import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface PlanoPrevidencia {
  id: string;
  nome: string;
  tipo: string;
  instituicao: string;
  valor_acumulado: number;
  contribuicao_mensal: number;
  data_inicio: string;
  idade_resgate?: number;
  taxa_administracao?: number;
  rentabilidade_acumulada?: number;
  ativo: boolean;
}

interface EditarPlanoPrevidenciaModalProps {
  children: React.ReactNode;
  plano: PlanoPrevidencia;
  onUpdate: (updatedPlano: PlanoPrevidencia) => void;
}

export function EditarPlanoPrevidenciaModal({ children, plano, onUpdate }: EditarPlanoPrevidenciaModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: plano.nome,
    tipo: plano.tipo,
    instituicao: plano.instituicao,
    valor_acumulado: plano.valor_acumulado.toString(),
    contribuicao_mensal: plano.contribuicao_mensal.toString(),
    data_inicio: plano.data_inicio,
    idade_resgate: plano.idade_resgate?.toString() || "",
    taxa_administracao: plano.taxa_administracao?.toString() || "",
    rentabilidade_acumulada: plano.rentabilidade_acumulada?.toString() || "",
    ativo: plano.ativo,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updatedPlano: PlanoPrevidencia = {
        ...plano,
        nome: formData.nome,
        tipo: formData.tipo,
        instituicao: formData.instituicao,
        valor_acumulado: parseFloat(formData.valor_acumulado),
        contribuicao_mensal: parseFloat(formData.contribuicao_mensal),
        data_inicio: formData.data_inicio,
        idade_resgate: formData.idade_resgate ? parseInt(formData.idade_resgate) : undefined,
        taxa_administracao: formData.taxa_administracao ? parseFloat(formData.taxa_administracao) : undefined,
        rentabilidade_acumulada: formData.rentabilidade_acumulada ? parseFloat(formData.rentabilidade_acumulada) : undefined,
        ativo: formData.ativo,
      };

      await onUpdate(updatedPlano);
      setOpen(false);
      toast.success("Plano de previdência atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar plano de previdência");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Plano de Previdência</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Plano *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PGBL">PGBL</SelectItem>
                  <SelectItem value="VGBL">VGBL</SelectItem>
                  <SelectItem value="Previdência Privada">Previdência Privada</SelectItem>
                  <SelectItem value="Previdência Corporativa">Previdência Corporativa</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instituicao">Instituição *</Label>
              <Input
                id="instituicao"
                value={formData.instituicao}
                onChange={(e) => setFormData({ ...formData, instituicao: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_acumulado">Valor Acumulado (R$) *</Label>
              <Input
                id="valor_acumulado"
                type="number"
                step="0.01"
                value={formData.valor_acumulado}
                onChange={(e) => setFormData({ ...formData, valor_acumulado: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contribuicao_mensal">Contribuição Mensal (R$) *</Label>
              <Input
                id="contribuicao_mensal"
                type="number"
                step="0.01"
                value={formData.contribuicao_mensal}
                onChange={(e) => setFormData({ ...formData, contribuicao_mensal: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início *</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idade_resgate">Idade de Resgate</Label>
              <Input
                id="idade_resgate"
                type="number"
                value={formData.idade_resgate}
                onChange={(e) => setFormData({ ...formData, idade_resgate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxa_administracao">Taxa de Administração (%)</Label>
              <Input
                id="taxa_administracao"
                type="number"
                step="0.01"
                value={formData.taxa_administracao}
                onChange={(e) => setFormData({ ...formData, taxa_administracao: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentabilidade_acumulada">Rentabilidade Acumulada (%)</Label>
              <Input
                id="rentabilidade_acumulada"
                type="number"
                step="0.01"
                value={formData.rentabilidade_acumulada}
                onChange={(e) => setFormData({ ...formData, rentabilidade_acumulada: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ativo">Status</Label>
              <Select
                value={formData.ativo ? "true" : "false"}
                onValueChange={(value) => setFormData({ ...formData, ativo: value === "true" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Alterações</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
