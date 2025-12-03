import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

interface NovaAplicacaoModalProps {
  children: React.ReactNode;
  onAdd: (aplicacao: any) => void;
}

export default function NovaAplicacaoModal({ children, onAdd }: NovaAplicacaoModalProps) {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [valorAplicado, setValorAplicado] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setTicker("");
    setName("");
    setCategory("");
    setLocation("");
    setValorAplicado("");
    setValorAtual("");
    setPurchaseDate(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticker || !name || !category || !location || !valorAplicado || !valorAtual || !purchaseDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const valorAplicadoNum = parseCurrencyToNumber(valorAplicado);
    const valorAtualNum = parseCurrencyToNumber(valorAtual);
    
    if (valorAplicadoNum <= 0 || valorAtualNum <= 0) {
      toast({
        title: "Valores inválidos",
        description: "Os valores devem ser maiores que zero.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para adicionar uma aplicação.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('aplicacoes')
        .insert({
          user_id: user.id,
          nome: ticker.toUpperCase(),
          tipo: category,
          instituicao: location,
          valor_aplicado: valorAplicadoNum,
          valor_atual: valorAtualNum,
          data_aplicacao: format(purchaseDate, 'yyyy-MM-dd')
        })
        .select()
        .single();

      if (error) throw error;

      const novaAplicacao = {
        id: data.id,
        name: name,
        category: category,
        location: location,
        value: valorAtualNum,
        purchaseDate: format(purchaseDate, 'yyyy-MM-dd'),
        status: "active" as const,
        condition: "excellent" as const,
        ticker: ticker.toUpperCase(),
        quantity: 0,
        currentPrice: valorAtualNum
      };

      onAdd(novaAplicacao);
      
      toast({
        title: "Aplicação adicionada!",
        description: "A aplicação foi salva com sucesso."
      });

      resetForm();
      setOpen(false);
    } catch (error: any) {
      console.error('Erro ao adicionar aplicação:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a aplicação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Aplicação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker/Código *</Label>
              <Input
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Ex: PETR4"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome da Aplicação *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Petrobras PN"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ação">Ação</SelectItem>
                  <SelectItem value="FII">FII</SelectItem>
                  <SelectItem value="ETF">ETF</SelectItem>
                  <SelectItem value="Renda Fixa">Renda Fixa</SelectItem>
                  <SelectItem value="Criptomoeda">Criptomoeda</SelectItem>
                  <SelectItem value="Tesouro Direto">Tesouro Direto</SelectItem>
                  <SelectItem value="CDB">CDB</SelectItem>
                  <SelectItem value="LCI/LCA">LCI/LCA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Corretora/Instituição *</Label>
              <Select value={location} onValueChange={setLocation} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a corretora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XP Investimentos">XP Investimentos</SelectItem>
                  <SelectItem value="Rico Investimentos">Rico Investimentos</SelectItem>
                  <SelectItem value="Inter Investimentos">Inter Investimentos</SelectItem>
                  <SelectItem value="BTG Pactual">BTG Pactual</SelectItem>
                  <SelectItem value="Nubank">Nubank</SelectItem>
                  <SelectItem value="Itaú">Itaú</SelectItem>
                  <SelectItem value="Bradesco">Bradesco</SelectItem>
                  <SelectItem value="Santander">Santander</SelectItem>
                  <SelectItem value="Caixa">Caixa</SelectItem>
                  <SelectItem value="Outra">Outra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorAplicado">Valor Aplicado *</Label>
              <Input
                id="valorAplicado"
                type="text"
                value={valorAplicado}
                onChange={(e) => setValorAplicado(formatCurrency(e.target.value))}
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorAtual">Valor Atual *</Label>
              <Input
                id="valorAtual"
                type="text"
                value={valorAtual}
                onChange={(e) => setValorAtual(formatCurrency(e.target.value))}
                placeholder="R$ 0,00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data de Compra *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {purchaseDate ? (
                    format(purchaseDate, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={purchaseDate}
                  onSelect={setPurchaseDate}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Rendimento */}
          {valorAplicado && valorAtual && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Rendimento:
                </span>
                <span className={`text-lg font-bold ${
                  parseCurrencyToNumber(valorAtual) >= parseCurrencyToNumber(valorAplicado) 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {((parseCurrencyToNumber(valorAtual) - parseCurrencyToNumber(valorAplicado)) / parseCurrencyToNumber(valorAplicado) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Adicionar Aplicação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
