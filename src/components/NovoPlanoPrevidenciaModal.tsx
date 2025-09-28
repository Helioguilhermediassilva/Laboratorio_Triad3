import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const planoSchema = z.object({
  tipo: z.string().min(1, "Tipo é obrigatório"),
  produto: z.string().min(1, "Produto é obrigatório"),
  instituicao: z.string().min(1, "Instituição é obrigatória"),
  valorAcumulado: z.number().min(0, "Valor acumulado não pode ser negativo"),
  aportesMensais: z.number().min(0, "Aportes mensais não podem ser negativos"),
  dataContratacao: z.string().min(1, "Data de contratação é obrigatória"),
  taxaAdministracao: z.number().min(0, "Taxa de administração não pode ser negativa"),
  taxaCarregamento: z.number().min(0, "Taxa de carregamento não pode ser negativa"),
  beneficiarioIdeal: z.number().min(18, "Idade deve ser maior que 18 anos"),
  idadeAtual: z.number().min(18, "Idade deve ser maior que 18 anos"),
  observacoes: z.string().optional(),
});

interface NovoPlanoPrevidenciaModalProps {
  children: React.ReactNode;
  onAdd: (plano: any) => void;
}

export default function NovoPlanoPrevidenciaModal({ children, onAdd }: NovoPlanoPrevidenciaModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    tipo: "",
    produto: "",
    instituicao: "",
    valorAcumulado: "",
    aportesMensais: "",
    dataContratacao: "",
    taxaAdministracao: "",
    taxaCarregamento: "",
    beneficiarioIdeal: "",
    idadeAtual: "",
    observacoes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        valorAcumulado: parseFloat(formData.valorAcumulado) || 0,
        aportesMensais: parseFloat(formData.aportesMensais) || 0,
        taxaAdministracao: parseFloat(formData.taxaAdministracao),
        taxaCarregamento: parseFloat(formData.taxaCarregamento),
        beneficiarioIdeal: parseInt(formData.beneficiarioIdeal),
        idadeAtual: parseInt(formData.idadeAtual),
      };

      planoSchema.parse(data);

      const proximaContribuicao = data.aportesMensais > 0 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
        : "-";

      const novoPlano = {
        id: Date.now(),
        ...data,
        proximaContribuicao,
        rentabilidadeAno: Math.random() * 10 + 5, // Mock rentability between 5-15%
        status: data.aportesMensais > 0 ? "Ativo" : "Suspenso",
        categoria: data.tipo
      };

      onAdd(novoPlano);
      setOpen(false);
      setFormData({
        tipo: "",
        produto: "",
        instituicao: "",
        valorAcumulado: "",
        aportesMensais: "",
        dataContratacao: "",
        taxaAdministracao: "",
        taxaCarregamento: "",
        beneficiarioIdeal: "",
        idadeAtual: "",
        observacoes: "",
      });
      setErrors({});

      toast({
        title: "Plano adicionado!",
        description: "O novo plano previdenciário foi adicionado com sucesso.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Plano Previdenciário</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Plano</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => handleInputChange("tipo", value)}
              >
                <SelectTrigger className={errors.tipo ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PGBL">PGBL</SelectItem>
                  <SelectItem value="VGBL">VGBL</SelectItem>
                  <SelectItem value="FAPI">FAPI</SelectItem>
                  <SelectItem value="Tradicional">Tradicional</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo && <p className="text-sm text-red-500">{errors.tipo}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="produto">Nome do Produto</Label>
              <Input
                id="produto"
                value={formData.produto}
                onChange={(e) => handleInputChange("produto", e.target.value)}
                placeholder="Ex: Brasilprev Exclusivo"
                className={errors.produto ? "border-red-500" : ""}
              />
              {errors.produto && <p className="text-sm text-red-500">{errors.produto}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instituicao">Instituição Financeira</Label>
            <Input
              id="instituicao"
              value={formData.instituicao}
              onChange={(e) => handleInputChange("instituicao", e.target.value)}
              placeholder="Ex: Banco do Brasil"
              className={errors.instituicao ? "border-red-500" : ""}
            />
            {errors.instituicao && <p className="text-sm text-red-500">{errors.instituicao}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorAcumulado">Valor Acumulado Atual</Label>
              <Input
                id="valorAcumulado"
                type="number"
                step="0.01"
                value={formData.valorAcumulado}
                onChange={(e) => handleInputChange("valorAcumulado", e.target.value)}
                placeholder="0,00"
                className={errors.valorAcumulado ? "border-red-500" : ""}
              />
              {errors.valorAcumulado && <p className="text-sm text-red-500">{errors.valorAcumulado}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="aportesMensais">Aportes Mensais</Label>
              <Input
                id="aportesMensais"
                type="number"
                step="0.01"
                value={formData.aportesMensais}
                onChange={(e) => handleInputChange("aportesMensais", e.target.value)}
                placeholder="0,00"
                className={errors.aportesMensais ? "border-red-500" : ""}
              />
              {errors.aportesMensais && <p className="text-sm text-red-500">{errors.aportesMensais}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataContratacao">Data de Contratação</Label>
              <Input
                id="dataContratacao"
                type="date"
                value={formData.dataContratacao}
                onChange={(e) => handleInputChange("dataContratacao", e.target.value)}
                className={errors.dataContratacao ? "border-red-500" : ""}
              />
              {errors.dataContratacao && <p className="text-sm text-red-500">{errors.dataContratacao}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxaAdministracao">Taxa Admin. (% a.a.)</Label>
              <Input
                id="taxaAdministracao"
                type="number"
                step="0.1"
                value={formData.taxaAdministracao}
                onChange={(e) => handleInputChange("taxaAdministracao", e.target.value)}
                placeholder="1,2"
                className={errors.taxaAdministracao ? "border-red-500" : ""}
              />
              {errors.taxaAdministracao && <p className="text-sm text-red-500">{errors.taxaAdministracao}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxaCarregamento">Taxa Carreg. (%)</Label>
              <Input
                id="taxaCarregamento"
                type="number"
                step="0.1"
                value={formData.taxaCarregamento}
                onChange={(e) => handleInputChange("taxaCarregamento", e.target.value)}
                placeholder="2,0"
                className={errors.taxaCarregamento ? "border-red-500" : ""}
              />
              {errors.taxaCarregamento && <p className="text-sm text-red-500">{errors.taxaCarregamento}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="idadeAtual">Idade Atual</Label>
              <Input
                id="idadeAtual"
                type="number"
                value={formData.idadeAtual}
                onChange={(e) => handleInputChange("idadeAtual", e.target.value)}
                placeholder="45"
                className={errors.idadeAtual ? "border-red-500" : ""}
              />
              {errors.idadeAtual && <p className="text-sm text-red-500">{errors.idadeAtual}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="beneficiarioIdeal">Idade p/ Benefício</Label>
              <Input
                id="beneficiarioIdeal"
                type="number"
                value={formData.beneficiarioIdeal}
                onChange={(e) => handleInputChange("beneficiarioIdeal", e.target.value)}
                placeholder="65"
                className={errors.beneficiarioIdeal ? "border-red-500" : ""}
              />
              {errors.beneficiarioIdeal && <p className="text-sm text-red-500">{errors.beneficiarioIdeal}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
              placeholder="Informações adicionais sobre o plano..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Adicionar Plano
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}