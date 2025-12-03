import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Funções de formatação de moeda
const formatCurrency = (value: string): string => {
  const numericValue = value.replace(/\D/g, '');
  if (!numericValue) return '';
  const numberValue = parseInt(numericValue, 10) / 100;
  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const parseCurrencyToNumber = (value: string): number => {
  if (!value) return 0;
  const numericString = value.replace(/[^\d,]/g, '').replace(',', '.');
  const parsed = parseFloat(numericString);
  return isNaN(parsed) ? 0 : parsed;
};

const dividaSchema = z.object({
  tipo: z.string().min(1, "Tipo é obrigatório"),
  credor: z.string().min(1, "Credor é obrigatório"),
  valorTotal: z.number().min(0.01, "Valor deve ser maior que zero"),
  valorPrestacao: z.number().min(0.01, "Valor da prestação deve ser maior que zero"),
  parcelas: z.number().min(1, "Número de parcelas deve ser maior que zero"),
  juros: z.number().min(0, "Taxa de juros não pode ser negativa"),
  vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  observacoes: z.string().optional(),
});

interface NovaDividaModalProps {
  children: React.ReactNode;
  onAdd: (divida: any) => void;
}

export default function NovaDividaModal({ children, onAdd }: NovaDividaModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    tipo: "",
    credor: "",
    valorTotal: "",
    valorPrestacao: "",
    parcelas: "",
    juros: "",
    vencimento: "",
    categoria: "",
    observacoes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        valorTotal: parseCurrencyToNumber(formData.valorTotal),
        valorPrestacao: parseCurrencyToNumber(formData.valorPrestacao),
        parcelas: parseInt(formData.parcelas) || 0,
        juros: parseFloat(formData.juros) || 0,
      };

      dividaSchema.parse(data);

      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para adicionar uma dívida.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Inserir no Supabase
      const { data: dividaData, error } = await supabase
        .from('dividas')
        .insert({
          user_id: user.id,
          nome: data.tipo,
          tipo: data.categoria,
          credor: data.credor,
          valor_original: data.valorTotal,
          saldo_devedor: data.valorTotal,
          valor_parcela: data.valorPrestacao,
          numero_parcelas: data.parcelas,
          parcelas_pagas: 0,
          taxa_juros: data.juros,
          data_contratacao: new Date().toISOString().split('T')[0],
          data_vencimento: data.vencimento,
          status: 'Ativo'
        })
        .select()
        .single();

      if (error) throw error;

      const novaDivida = {
        id: dividaData.id,
        tipo: dividaData.nome,
        credor: dividaData.credor,
        valorTotal: Number(dividaData.valor_original),
        valorPendente: Number(dividaData.saldo_devedor),
        valorPrestacao: Number(dividaData.valor_parcela),
        vencimento: dividaData.data_vencimento || 'Não informado',
        proximoVencimento: dividaData.data_vencimento || 'Não informado',
        parcelas: dividaData.numero_parcelas,
        parcelasPagas: dividaData.parcelas_pagas,
        juros: Number(dividaData.taxa_juros) || 0,
        status: dividaData.status,
        categoria: dividaData.tipo
      };

      onAdd(novaDivida);
      setOpen(false);
      setFormData({
        tipo: "",
        credor: "",
        valorTotal: "",
        valorPrestacao: "",
        parcelas: "",
        juros: "",
        vencimento: "",
        categoria: "",
        observacoes: "",
      });
      setErrors({});

      toast({
        title: "Dívida adicionada!",
        description: "A dívida foi salva permanentemente no sistema.",
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
        console.error('Erro ao salvar dívida:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar a dívida. Tente novamente.",
          variant: "destructive"
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

  const handleCurrencyChange = (field: string, value: string) => {
    const formatted = formatCurrency(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Dívida</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Dívida</Label>
              <Input
                id="tipo"
                value={formData.tipo}
                onChange={(e) => handleInputChange("tipo", e.target.value)}
                placeholder="Ex: Financiamento Imobiliário"
                className={errors.tipo ? "border-red-500" : ""}
              />
              {errors.tipo && <p className="text-sm text-red-500">{errors.tipo}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credor">Credor/Instituição</Label>
              <Input
                id="credor"
                value={formData.credor}
                onChange={(e) => handleInputChange("credor", e.target.value)}
                placeholder="Ex: Banco do Brasil"
                className={errors.credor ? "border-red-500" : ""}
              />
              {errors.credor && <p className="text-sm text-red-500">{errors.credor}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorTotal">Valor Total</Label>
              <Input
                id="valorTotal"
                type="text"
                value={formData.valorTotal}
                onChange={(e) => handleCurrencyChange("valorTotal", e.target.value)}
                placeholder="R$ 0,00"
                className={errors.valorTotal ? "border-red-500" : ""}
              />
              {errors.valorTotal && <p className="text-sm text-red-500">{errors.valorTotal}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorPrestacao">Valor da Prestação</Label>
              <Input
                id="valorPrestacao"
                type="text"
                value={formData.valorPrestacao}
                onChange={(e) => handleCurrencyChange("valorPrestacao", e.target.value)}
                placeholder="R$ 0,00"
                className={errors.valorPrestacao ? "border-red-500" : ""}
              />
              {errors.valorPrestacao && <p className="text-sm text-red-500">{errors.valorPrestacao}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parcelas">Nº de Parcelas</Label>
              <Input
                id="parcelas"
                type="number"
                value={formData.parcelas}
                onChange={(e) => handleInputChange("parcelas", e.target.value)}
                placeholder="60"
                className={errors.parcelas ? "border-red-500" : ""}
              />
              {errors.parcelas && <p className="text-sm text-red-500">{errors.parcelas}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="juros">Taxa de Juros (% a.a.)</Label>
              <Input
                id="juros"
                type="number"
                step="0.1"
                value={formData.juros}
                onChange={(e) => handleInputChange("juros", e.target.value)}
                placeholder="8,5"
                className={errors.juros ? "border-red-500" : ""}
              />
              {errors.juros && <p className="text-sm text-red-500">{errors.juros}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vencimento">Data de Vencimento</Label>
              <Input
                id="vencimento"
                type="date"
                value={formData.vencimento}
                onChange={(e) => handleInputChange("vencimento", e.target.value)}
                className={errors.vencimento ? "border-red-500" : ""}
              />
              {errors.vencimento && <p className="text-sm text-red-500">{errors.vencimento}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleInputChange("categoria", value)}
            >
              <SelectTrigger className={errors.categoria ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Imóvel">Imóvel</SelectItem>
                <SelectItem value="Veículo">Veículo</SelectItem>
                <SelectItem value="Pessoal">Pessoal</SelectItem>
                <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                <SelectItem value="Estudantil">Empréstimo Estudantil</SelectItem>
                <SelectItem value="Empresarial">Empresarial</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
            {errors.categoria && <p className="text-sm text-red-500">{errors.categoria}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
              placeholder="Informações adicionais sobre a dívida..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Adicionar Dívida"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
