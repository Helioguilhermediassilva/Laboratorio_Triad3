import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NovoOrcamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrcamentoAdicionado: (orcamento: any) => void;
}

interface Categoria {
  nome: string;
  valor: string;
  cor: string;
}

const coresDisponiveis = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

const categoriasComuns = [
  "Moradia", "Alimentação", "Transporte", "Saúde", "Educação",
  "Lazer", "Investimentos", "Roupas", "Eletrônicos", "Outros"
];

export default function NovoOrcamentoModal({
  open,
  onOpenChange,
  onOrcamentoAdicionado
}: NovoOrcamentoModalProps) {
  const [nome, setNome] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([
    { nome: "", valor: "", cor: coresDisponiveis[0] }
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !periodo) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome e período do orçamento.",
        variant: "destructive"
      });
      return;
    }

    const categoriasValidas = categorias.filter(cat => cat.nome && cat.valor);
    
    if (categoriasValidas.length === 0) {
      toast({
        title: "Categorias obrigatórias",
        description: "Adicione pelo menos uma categoria com nome e valor.",
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
          description: "Você precisa estar logado para criar um orçamento.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Insert each category as a separate budget entry
      const mesReferencia = new Date().toISOString().split('T')[0];
      
      const orcamentosToInsert = categoriasValidas.map(cat => ({
        user_id: user.id,
        categoria: cat.nome,
        valor_planejado: parseFloat(cat.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        valor_gasto: 0,
        mes_referencia: mesReferencia,
        tipo: periodo
      }));

      const { data: savedData, error } = await supabase
        .from('orcamentos')
        .insert(orcamentosToInsert)
        .select();

      if (error) throw error;

      const categoriasFormatadas = categoriasValidas.map(cat => ({
        nome: cat.nome,
        previsto: parseFloat(cat.valor.replace(/[^\d,]/g, '').replace(',', '.')),
        realizado: 0,
        cor: cat.cor
      }));

      const totalPrevisto = categoriasFormatadas.reduce((sum, cat) => sum + cat.previsto, 0);

      const novoOrcamento = {
        id: savedData?.[0]?.id || Date.now().toString(),
        nome,
        periodo,
        totalPrevisto,
        totalRealizado: 0,
        categorias: categoriasFormatadas,
        dataCriacao: new Date().toISOString()
      };

      onOrcamentoAdicionado(novoOrcamento);
      
      toast({
        title: "Orçamento criado!",
        description: "O orçamento foi salvo com sucesso."
      });

      // Reset form
      setNome("");
      setPeriodo("");
      setCategorias([{ nome: "", valor: "", cor: coresDisponiveis[0] }]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o orçamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarCategoria = () => {
    const proximaCor = coresDisponiveis[categorias.length % coresDisponiveis.length];
    setCategorias([...categorias, { nome: "", valor: "", cor: proximaCor }]);
  };

  const removerCategoria = (index: number) => {
    if (categorias.length > 1) {
      setCategorias(categorias.filter((_, i) => i !== index));
    }
  };

  const atualizarCategoria = (index: number, campo: keyof Categoria, valor: string) => {
    const novasCategorias = [...categorias];
    novasCategorias[index][campo] = valor;
    setCategorias(novasCategorias);
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return "";
    
    const formattedValue = (parseFloat(numericValue) / 100).toFixed(2);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(formattedValue));
  };

  const totalOrcamento = categorias.reduce((sum, cat) => {
    const valor = parseFloat(cat.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    return sum + valor;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Novo Orçamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Orçamento *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Orçamento Familiar 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodo">Período *</Label>
              <Select value={periodo} onValueChange={setPeriodo} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Semestral">Semestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Categorias */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Categorias do Orçamento</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={adicionarCategoria}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Categoria
              </Button>
            </div>

            <div className="space-y-3">
              {categorias.map((categoria, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <div className="space-y-2">
                        <Label>Nome da Categoria</Label>
                        <Select 
                          value={categoria.nome} 
                          onValueChange={(value) => atualizarCategoria(index, 'nome', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione ou digite" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoriasComuns.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Valor Previsto</Label>
                        <Input
                          value={categoria.valor}
                          onChange={(e) => {
                            const formatted = formatCurrency(e.target.value);
                            atualizarCategoria(index, 'valor', formatted);
                          }}
                          placeholder="R$ 0,00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Cor</Label>
                        <div className="flex gap-2">
                          {coresDisponiveis.slice(0, 5).map(cor => (
                            <button
                              key={cor}
                              type="button"
                              className={`w-8 h-8 rounded-full border-2 ${
                                categoria.cor === cor ? 'border-foreground' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: cor }}
                              onClick={() => atualizarCategoria(index, 'cor', cor)}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        {categorias.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removerCategoria(index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Total */}
          {totalOrcamento > 0 && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total do Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {totalOrcamento.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {periodo && `Valor ${periodo.toLowerCase()}`}
                </div>
              </CardContent>
            </Card>
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
              <Calculator className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Criar Orçamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
