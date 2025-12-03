import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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

const numberToCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

interface EditarDividaModalProps {
  children: React.ReactNode;
  divida: any;
  onUpdate: (dividaAtualizada: any) => void;
}

export default function EditarDividaModal({ children, divida, onUpdate }: EditarDividaModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    tipo: "",
    credor: "",
    valorTotal: "",
    valorPrestacao: "",
    saldoDevedor: "",
    parcelas: "",
    parcelasPagas: "",
    juros: "",
    vencimento: "",
    categoria: "",
    status: "",
  });

  useEffect(() => {
    if (divida && open) {
      setFormData({
        tipo: divida.tipo || "",
        credor: divida.credor || "",
        valorTotal: numberToCurrency(divida.valorTotal || 0),
        valorPrestacao: numberToCurrency(divida.valorPrestacao || 0),
        saldoDevedor: numberToCurrency(divida.valorPendente || 0),
        parcelas: String(divida.parcelas || ""),
        parcelasPagas: String(divida.parcelasPagas || 0),
        juros: String(divida.juros || ""),
        vencimento: divida.vencimento !== 'Não informado' ? divida.vencimento : "",
        categoria: divida.categoria || "",
        status: divida.status || "Ativo",
      });
    }
  }, [divida, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const valorTotal = parseCurrencyToNumber(formData.valorTotal);
      const valorPrestacao = parseCurrencyToNumber(formData.valorPrestacao);
      const saldoDevedor = parseCurrencyToNumber(formData.saldoDevedor);
      const parcelas = parseInt(formData.parcelas) || 0;
      const parcelasPagas = parseInt(formData.parcelasPagas) || 0;
      const juros = parseFloat(formData.juros) || 0;

      // Determinar status automaticamente
      let novoStatus = formData.status;
      if (parcelasPagas >= parcelas || saldoDevedor <= 0) {
        novoStatus = "Quitado";
      }

      const { error } = await supabase
        .from('dividas')
        .update({
          nome: formData.tipo,
          tipo: formData.categoria,
          credor: formData.credor,
          valor_original: valorTotal,
          saldo_devedor: saldoDevedor,
          valor_parcela: valorPrestacao,
          numero_parcelas: parcelas,
          parcelas_pagas: parcelasPagas,
          taxa_juros: juros,
          data_vencimento: formData.vencimento || null,
          status: novoStatus
        })
        .eq('id', divida.id);

      if (error) throw error;

      const dividaAtualizada = {
        ...divida,
        tipo: formData.tipo,
        credor: formData.credor,
        valorTotal: valorTotal,
        valorPendente: saldoDevedor,
        valorPrestacao: valorPrestacao,
        parcelas: parcelas,
        parcelasPagas: parcelasPagas,
        juros: juros,
        vencimento: formData.vencimento || 'Não informado',
        proximoVencimento: formData.vencimento || 'Não informado',
        categoria: formData.categoria,
        status: novoStatus
      };

      onUpdate(dividaAtualizada);
      setOpen(false);

      toast({
        title: "Dívida atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar dívida:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar a dívida. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCurrencyChange = (field: string, value: string) => {
    const formatted = formatCurrency(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Dívida</DialogTitle>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credor">Credor/Instituição</Label>
              <Input
                id="credor"
                value={formData.credor}
                onChange={(e) => handleInputChange("credor", e.target.value)}
                placeholder="Ex: Banco do Brasil"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorTotal">Valor Total</Label>
              <Input
                id="valorTotal"
                type="text"
                value={formData.valorTotal}
                onChange={(e) => handleCurrencyChange("valorTotal", e.target.value)}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorPrestacao">Valor da Prestação</Label>
              <Input
                id="valorPrestacao"
                type="text"
                value={formData.valorPrestacao}
                onChange={(e) => handleCurrencyChange("valorPrestacao", e.target.value)}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saldoDevedor">Saldo Devedor</Label>
              <Input
                id="saldoDevedor"
                type="text"
                value={formData.saldoDevedor}
                onChange={(e) => handleCurrencyChange("saldoDevedor", e.target.value)}
                placeholder="R$ 0,00"
              />
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parcelasPagas">Parcelas Pagas</Label>
              <Input
                id="parcelasPagas"
                type="number"
                value={formData.parcelasPagas}
                onChange={(e) => handleInputChange("parcelasPagas", e.target.value)}
                placeholder="0"
              />
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
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vencimento">Data de Vencimento</Label>
              <Input
                id="vencimento"
                type="date"
                value={formData.vencimento}
                onChange={(e) => handleInputChange("vencimento", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Em dia">Em dia</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                  <SelectItem value="Vencido">Vencido</SelectItem>
                  <SelectItem value="Quitado">Quitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleInputChange("categoria", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Financiamento Imobiliário">Financiamento Imobiliário</SelectItem>
                <SelectItem value="Financiamento Veículo">Financiamento Veículo</SelectItem>
                <SelectItem value="Empréstimo Pessoal">Empréstimo Pessoal</SelectItem>
                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
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
