import { useState, useEffect } from "react";
import { Search, Filter, TrendingUp, TrendingDown } from "lucide-react";
import Layout from "@/components/Layout";
import AssetCard from "@/components/AssetCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import VisualizarAplicacaoModal from "@/components/VisualizarAplicacaoModal";
import EditarAplicacaoModal from "@/components/EditarAplicacaoModal";
import { supabase } from "@/integrations/supabase/client";

export default function Carteira() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("value");
  const [assets, setAssets] = useState<any[]>([]);
  const [visualizarAplicacaoOpen, setVisualizarAplicacaoOpen] = useState(false);
  const [editarAplicacaoOpen, setEditarAplicacaoOpen] = useState(false);
  const [aplicacaoSelecionada, setAplicacaoSelecionada] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAplicacoes();
  }, []);

  const loadAplicacoes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('aplicacoes')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading aplicações:', error);
      return;
    }

    // Transform data to match expected format
    const transformedData = (data || []).map((item: any) => ({
      id: item.id,
      name: item.nome,
      category: item.tipo,
      location: item.instituicao,
      value: Number(item.valor_atual),
      purchaseDate: item.data_aplicacao,
      status: "active" as const,
      condition: "excellent" as const,
      ticker: item.nome,
      quantity: 0,
      currentPrice: Number(item.valor_atual)
    }));

    setAssets(transformedData);
  };

  const filteredAssets = assets
    .filter(asset => {
      const matchesSearch = asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || asset.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "value") return b.value - a.value;
      if (sortBy === "name") return a.ticker.localeCompare(b.ticker);
      if (sortBy === "date") return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
      return 0;
    });

  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalAssets = assets.length;

  const handleVisualizarAplicacao = (aplicacao: any) => {
    setAplicacaoSelecionada(aplicacao);
    setVisualizarAplicacaoOpen(true);
  };

  const handleEditarAplicacao = (aplicacao: any) => {
    setAplicacaoSelecionada(aplicacao);
    setEditarAplicacaoOpen(true);
  };

  const handleAplicacaoEditada = (aplicacaoEditada: any) => {
    setAssets(prev => 
      prev.map(asset => 
        asset.id === aplicacaoEditada.id ? aplicacaoEditada : asset
      )
    );
    toast({
      title: "Aplicação atualizada!",
      description: "As alterações foram salvas com sucesso."
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Minha Carteira
          </h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus ativos financeiros em um só lugar
          </p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalValue.toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </div>
              <div className="flex items-center text-sm text-success mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12.5% este mês
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalAssets}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Ativos diferentes
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Melhor Ativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                VALE3
              </div>
              <div className="flex items-center text-sm text-success mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +18.7%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por ticker ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Ação">Ações</SelectItem>
                  <SelectItem value="FII">FIIs</SelectItem>
                  <SelectItem value="ETF">ETFs</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Valor</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assets Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Ativos ({filteredAssets.length})
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <AssetCard 
                key={asset.id} 
                asset={asset}
                onEdit={handleEditarAplicacao}
                onView={handleVisualizarAplicacao}
              />
            ))}
          </div>

          {filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-2">
                Nenhum ativo encontrado
              </div>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros ou adicionar novos ativos
              </p>
            </div>
          )}
        </div>

        {/* Modals */}
        <VisualizarAplicacaoModal 
          open={visualizarAplicacaoOpen}
          onOpenChange={setVisualizarAplicacaoOpen}
          aplicacao={aplicacaoSelecionada}
        />
        
        <EditarAplicacaoModal 
          open={editarAplicacaoOpen}
          onOpenChange={setEditarAplicacaoOpen}
          aplicacao={aplicacaoSelecionada}
          onAplicacaoEditada={handleAplicacaoEditada}
        />
      </div>
    </Layout>
  );
}