import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const planoSchema = z.object({
  tipo: z.string().min(1, "Tipo é obrigatório"),
  produto: z.string().min(1, "Produto é obrigatório"),
  instituicao: z.string().min(1, "Instituição é obrigatória"),
  valorAcumulado: z.number().min(0, "Valor acumulado não pode ser negativo"),
  aportesMensais: z.number().min(0, "Aportes mensais não podem ser negativos"),
  dataContratacao: z.string().min(1, "Data de contratação é obrigatória"),
  taxaAdministracao: z.number().min(0, "Taxa de administração não pode ser negativa"),
  beneficiarioIdeal: z.number().min(18, "Idade deve ser maior que 18 anos"),
  idadeAtual: z.number().min(18, "Idade deve ser maior que 18 anos"),
});

interface NovoPlanoPrevidenciaModalProps {
  children: React.ReactNode;
  onAdd: (plano: any) => void;
}

export default function NovoPlanoPrevidenciaModal({ children, onAdd }: NovoPlanoPrevidenciaModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    tipo: "",
    produto: "",
    instituicao: "",
    valorAcumulado: "",
    aportesMensais: "",
    dataContratacao: "",
    taxaAdministracao: "",
    beneficiarioIdeal: "",
    idadeAtual: "",
    observacoes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCurrency = (value: string): string => {
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

  const handleCurrencyChange = (field: string, value: string) => {
    const formatted = formatCurrency(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = {
        ...formData,
        valorAcumulado: parseCurrencyToNumber(formData.valorAcumulado),
        aportesMensais: parseCurrencyToNumber(formData.aportesMensais),
        taxaAdministracao: parseFloat(formData.taxaAdministracao) || 0,
        beneficiarioIdeal: parseInt(formData.beneficiarioIdeal) || 65,
        idadeAtual: parseInt(formData.idadeAtual) || 45,
      };

      planoSchema.parse(data);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para adicionar um plano.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Insert into Supabase
      const { data: savedData, error } = await supabase
        .from('planos_previdencia')
        .insert({
          user_id: user.id,
          nome: data.produto,
          tipo: data.tipo,
          instituicao: data.instituicao,
          valor_acumulado: data.valorAcumulado,
          contribuicao_mensal: data.aportesMensais,
          data_inicio: data.dataContratacao,
          taxa_administracao: data.taxaAdministracao,
          idade_resgate: data.beneficiarioIdeal,
          rentabilidade_acumulada: 0,
          ativo: data.aportesMensais > 0
        })
        .select()
        .single();

      if (error) throw error;

      const novoPlano = {
        id: savedData.id,
        ...data,
        proximaContribuicao: data.aportesMensais > 0 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
          : "-",
        rentabilidadeAno: 0,
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
        beneficiarioIdeal: "",
        idadeAtual: "",
        observacoes: "",
      });
      setErrors({});

      toast({
        title: "Plano adicionado!",
        description: "O plano previdenciário foi salvo com sucesso.",
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
      } else {
        console.error('Erro ao salvar:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar o plano. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
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
                value={formData.valorAcumulado}
                onChange={(e) => handleCurrencyChange("valorAcumulado", e.target.value)}
                placeholder="R$ 0,00"
                className={errors.valorAcumulado ? "border-red-500" : ""}
              />
              {errors.valorAcumulado && <p className="text-sm text-red-500">{errors.valorAcumulado}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="aportesMensais">Aportes Mensais</Label>
              <Input
                id="aportesMensais"
                value={formData.aportesMensais}
                onChange={(e) => handleCurrencyChange("aportesMensais", e.target.value)}
                placeholder="R$ 0,00"
                className={errors.aportesMensais ? "border-red-500" : ""}
              />
              {errors.aportesMensais && <p className="text-sm text-red-500">{errors.aportesMensais}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Adicionar Plano"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
