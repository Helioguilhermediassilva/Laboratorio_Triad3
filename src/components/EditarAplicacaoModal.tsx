import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface EditarAplicacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aplicacao: any;
  onAplicacaoEditada: (aplicacao: any) => void;
}

export default function EditarAplicacaoModal({
  open,
  onOpenChange,
  aplicacao,
  onAplicacaoEditada
}: EditarAplicacaoModalProps) {
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date>();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Populate form with existing data when aplicacao changes
  useEffect(() => {
    if (aplicacao) {
      setTicker(aplicacao.ticker || "");
      setName(aplicacao.name || "");
      setCategory(aplicacao.category || "");
      setLocation(aplicacao.location || "");
      setQuantity(aplicacao.quantity?.toString() || "");
      setCurrentPrice(aplicacao.currentPrice?.toString() || "");
      setPurchaseDate(aplicacao.purchaseDate ? new Date(aplicacao.purchaseDate) : undefined);
      setStatus(aplicacao.status || "");
    }
  }, [aplicacao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticker || !name || !category || !location || !quantity || !currentPrice || !purchaseDate || !status) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(currentPrice);
    
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser um número maior que zero.",
        variant: "destructive"
      });
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      toast({
        title: "Preço inválido",
        description: "O preço deve ser um número maior que zero.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('aplicacoes')
        .update({
          nome: ticker.toUpperCase(),
          tipo: category,
          instituicao: location,
          valor_atual: quantityNum * priceNum,
          data_aplicacao: format(purchaseDate, 'yyyy-MM-dd')
        })
        .eq('id', aplicacao.id);

      if (error) throw error;

      const aplicacaoEditada = {
        ...aplicacao,
        ticker: ticker.toUpperCase(),
        name,
        category,
        location,
        quantity: quantityNum,
        currentPrice: priceNum,
        value: quantityNum * priceNum,
        purchaseDate: format(purchaseDate, 'yyyy-MM-dd'),
        status
      };

      onAplicacaoEditada(aplicacaoEditada);
      
      toast({
        title: "Aplicação atualizada!",
        description: "As alterações foram salvas permanentemente."
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar aplicação:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!aplicacao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Aplicação
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
                  <SelectItem value="Outra">Outra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 100"
                min="0"
                step="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPrice">Preço Atual (R$) *</Label>
              <Input
                id="currentPrice"
                type="number"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                placeholder="Ex: 35.50"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={setStatus} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor Total Calculado */}
          {quantity && currentPrice && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Valor Total Calculado:
                </span>
                <span className="text-lg font-bold text-foreground">
                  {(parseFloat(quantity || "0") * parseFloat(currentPrice || "0")).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Edit className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
