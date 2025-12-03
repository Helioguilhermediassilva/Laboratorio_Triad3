import { Package, TrendingUp, AlertTriangle, CheckCircle, Search, Filter } from "lucide-react";
import StatsCard from "./StatsCard";
import AssetCard from "./AssetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import AddAssetForm from "./AddAssetForm";
import AdvancedFilters, { FilterCriteria } from "./AdvancedFilters";
import ViewAssetModal from "./ViewAssetModal";
import EditAssetModal from "./EditAssetModal";
import heroImage from "@/assets/hero-bg.jpg";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [assets, setAssets] = useState<any[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
  const [stats, setStats] = useState([
    {
      title: "Patrimônio Total",
      value: "R$ 0",
      icon: Package,
      change: { value: 0, type: "increase" as const }
    },
    {
      title: "Aplicações",
      value: "R$ 0",
      icon: TrendingUp,
      change: { value: 0, type: "increase" as const }
    },
    {
      title: "Imobilizado",
      value: "R$ 0",
      icon: CheckCircle,
      change: { value: 0, type: "increase" as const }
    },
    {
      title: "Receita Mensal",
      value: "R$ 0",
      icon: AlertTriangle,
      change: { value: 0, type: "increase" as const }
    }
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterCriteria | null>(null);
  const [viewAsset, setViewAsset] = useState<any>(null);
  const [editAsset, setEditAsset] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Busca automática - executa sempre que searchTerm muda
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFiltersAndSearch(assets, searchTerm, activeFilters);
    }, 300); // Debounce de 300ms para evitar muitas execuções

    return () => clearTimeout(timer);
  }, [searchTerm, assets, activeFilters]);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const allAssets: any[] = [];

    // Load aplicações
    const { data: aplicacoes } = await supabase
      .from('aplicacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (aplicacoes) {
      const transformedAplicacoes = aplicacoes.map((a: any) => ({
        id: a.id,
        name: a.nome,
        category: a.tipo,
        location: a.instituicao,
        value: Number(a.valor_atual),
        purchaseDate: a.data_aplicacao,
        status: "active" as const,
        condition: "excellent" as const,
        ticker: a.nome,
        quantity: 0,
        currentPrice: Number(a.valor_atual)
      }));
      allAssets.push(...transformedAplicacoes);
    }

    // Load bens imobilizados for display
    const { data: bensRecentes } = await supabase
      .from('bens_imobilizados')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (bensRecentes) {
      const transformedBens = bensRecentes.map((b: any) => ({
        id: b.id,
        name: b.nome,
        category: b.categoria,
        location: b.localizacao || 'N/A',
        value: Number(b.valor_atual),
        purchaseDate: b.data_aquisicao,
        status: b.status === 'Ativo' ? "active" as const : "inactive" as const,
        condition: "excellent" as const,
        ticker: b.nome,
        quantity: 1,
        currentPrice: Number(b.valor_atual)
      }));
      allAssets.push(...transformedBens);
    }

    setAssets(allAssets);
    setFilteredAssets(allAssets);

    // Calculate all totals
    const { data: todasAplicacoes } = await supabase
      .from('aplicacoes')
      .select('valor_atual')
      .eq('user_id', user.id);

    const { data: todosBens } = await supabase
      .from('bens_imobilizados')
      .select('valor_atual')
      .eq('user_id', user.id);

    const totalAplicacoes = todasAplicacoes ? todasAplicacoes.reduce((sum, a) => sum + Number(a.valor_atual), 0) : 0;
    const totalBens = todosBens ? todosBens.reduce((sum, b) => sum + Number(b.valor_atual), 0) : 0;
    const totalPatrimonio = totalAplicacoes + totalBens;

    setStats([
      {
        title: "Patrimônio Total",
        value: totalPatrimonio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        icon: Package,
        change: { value: 0, type: "increase" as const }
      },
      {
        title: "Aplicações",
        value: totalAplicacoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        icon: TrendingUp,
        change: { value: 0, type: "increase" as const }
      },
      {
        title: "Imobilizado",
        value: totalBens.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        icon: CheckCircle,
        change: { value: 0, type: "increase" as const }
      },
      {
        title: "Receita Mensal",
        value: "R$ 0,00",
        icon: AlertTriangle,
        change: { value: 0, type: "increase" as const }
      }
    ]);
  };

  const handleAddAsset = (newAsset: any) => {
    loadDashboardData();
    setIsAddModalOpen(false);
  };

  const applyFiltersAndSearch = (assetList: any[], search: string, filters: FilterCriteria | null) => {
    let filtered = [...assetList];

    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(asset => 
        asset.ticker.toLowerCase().includes(search.toLowerCase()) ||
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.location.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply advanced filters
    if (filters) {
      if (filters.category !== "all") {
        filtered = filtered.filter(asset => asset.category === filters.category);
      }
      if (filters.broker !== "all") {
        filtered = filtered.filter(asset => asset.location === filters.broker);
      }
      if (filters.minValue) {
        filtered = filtered.filter(asset => asset.value >= parseFloat(filters.minValue));
      }
      if (filters.maxValue) {
        filtered = filtered.filter(asset => asset.value <= parseFloat(filters.maxValue));
      }
      if (filters.dateFrom) {
        filtered = filtered.filter(asset => new Date(asset.purchaseDate) >= new Date(filters.dateFrom));
      }
      if (filters.dateTo) {
        filtered = filtered.filter(asset => new Date(asset.purchaseDate) <= new Date(filters.dateTo));
      }
      if (filters.status !== "all") {
        filtered = filtered.filter(asset => asset.status === filters.status);
      }
      if (filters.condition !== "all") {
        filtered = filtered.filter(asset => asset.condition === filters.condition);
      }
    }

    setFilteredAssets(filtered);
  };

  const handleSearch = () => {
    applyFiltersAndSearch(assets, searchTerm, activeFilters);
  };

  const handleApplyFilters = (filters: FilterCriteria) => {
    setActiveFilters(filters);
    applyFiltersAndSearch(assets, searchTerm, filters);
    setIsFiltersModalOpen(false);
  };

  const handleClearFilters = () => {
    setActiveFilters(null);
    applyFiltersAndSearch(assets, searchTerm, null);
    setIsFiltersModalOpen(false);
  };

  const handleViewAsset = (asset: any) => {
    setViewAsset(asset);
  };

  const handleEditAsset = (asset: any) => {
    setEditAsset(asset);
  };

  const handleSaveAsset = (updatedAsset: any) => {
    const updatedAssets = assets.map(asset => 
      asset.id === updatedAsset.id ? updatedAsset : asset
    );
    setAssets(updatedAssets);
    applyFiltersAndSearch(updatedAssets, searchTerm, activeFilters);
    setEditAsset(null);
  };

  const handleDeleteAsset = async (asset: any) => {
    try {
      // Determine which table to delete from based on category
      const isAplicacao = ['Ação', 'Fundo Imobiliário', 'ETF', 'BDR', 'Tesouro Direto', 'CDB', 'LCI', 'LCA', 'Debênture', 'Criptomoeda', 'acao', 'fii', 'etf', 'bdr', 'tesouro', 'cdb', 'lci', 'lca', 'debenture', 'crypto'].includes(asset.category);
      const isBemImobilizado = ['Imóvel', 'Veículo', 'Equipamento', 'Móveis', 'Outros', 'imovel', 'veiculo', 'maquina', 'movel', 'joia', 'outro'].includes(asset.category);

      let error = null;

      if (isAplicacao) {
        const { error: deleteError } = await supabase
          .from('aplicacoes')
          .delete()
          .eq('id', asset.id);
        error = deleteError;
      } else if (isBemImobilizado) {
        const { error: deleteError } = await supabase
          .from('bens_imobilizados')
          .delete()
          .eq('id', asset.id);
        error = deleteError;
      } else {
        // Try both tables
        const { error: errorAplicacoes } = await supabase
          .from('aplicacoes')
          .delete()
          .eq('id', asset.id);
        
        if (errorAplicacoes) {
          const { error: errorBens } = await supabase
            .from('bens_imobilizados')
            .delete()
            .eq('id', asset.id);
          error = errorBens;
        }
      }

      if (error) throw error;

      toast({
        title: "Ativo excluído",
        description: `${asset.name} foi removido com sucesso.`,
      });

      // Reload data
      loadDashboardData();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o ativo.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div 
        className="relative h-64 rounded-2xl bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-accent/80" />
        <div className="relative h-full flex items-center px-8">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl font-bold mb-4">
              Gestão Inteligente de Patrimônio
            </h1>
            <p className="text-xl opacity-90 mb-6">
              Reúna todas as suas informações patrimoniais em um só lugar com comandos inteligentes
            </p>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="lg" className="shadow-lg">
                  Adicionar Novo Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <AddAssetForm 
                  onSubmit={handleAddAsset}
                  onCancel={() => setIsAddModalOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Itens do Patrimônio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input 
              placeholder="Buscar por nome, categoria ou localização..." 
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="default" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Dialog open={isFiltersModalOpen} onOpenChange={setIsFiltersModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros Avançados
                  {activeFilters && (
                    <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                      Ativo
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <AdvancedFilters 
                  onApplyFilters={handleApplyFilters}
                  onClearFilters={handleClearFilters}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Recent Assets */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Itens Recentes do Patrimônio
          </h2>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                Ver Todos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <AddAssetForm 
                onSubmit={handleAddAsset}
                onCancel={() => setIsAddModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <AssetCard 
              key={asset.id} 
              asset={asset}
              onEdit={handleEditAsset}
              onView={handleViewAsset}
              onDelete={handleDeleteAsset}
            />
          ))}
        </div>

        {filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg mb-2">
              Nenhum ativo encontrado
            </div>
            <p className="text-sm text-muted-foreground">
              {searchTerm || activeFilters ? 
                "Tente ajustar os filtros de busca ou limpar os filtros aplicados" : 
                "Adicione novos ativos para começar"
              }
            </p>
            {(searchTerm || activeFilters) && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setActiveFilters(null);
                  setFilteredAssets(assets);
                }}
              >
                Limpar Busca e Filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* View Asset Modal */}
      <ViewAssetModal
        asset={viewAsset}
        isOpen={!!viewAsset}
        onClose={() => setViewAsset(null)}
      />

      {/* Edit Asset Modal */}
      <EditAssetModal
        asset={editAsset}
        isOpen={!!editAsset}
        onClose={() => setEditAsset(null)}
        onSave={handleSaveAsset}
      />
    </div>
  );
}