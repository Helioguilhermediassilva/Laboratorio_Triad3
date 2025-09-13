import { Package, TrendingUp, AlertTriangle, CheckCircle, Search, Filter } from "lucide-react";
import StatsCard from "./StatsCard";
import AssetCard from "./AssetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import AddAssetForm from "./AddAssetForm";
import AdvancedFilters, { FilterCriteria } from "./AdvancedFilters";
import heroImage from "@/assets/hero-bg.jpg";
import { useState } from "react";

// Mock data - Financial Assets
const stats = [
  {
    title: "Total de Ativos",
    value: "47",
    icon: Package,
    change: { value: 12, type: "increase" as const }
  },
  {
    title: "Valor da Carteira",
    value: "R$ 485.2K",
    icon: TrendingUp,
    change: { value: 8, type: "increase" as const }
  },
  {
    title: "Rentabilidade",
    value: "+15.8%",
    icon: CheckCircle,
    change: { value: 5, type: "increase" as const }
  },
  {
    title: "Dividendos (Mês)",
    value: "R$ 2.1K",
    icon: AlertTriangle,
    change: { value: 22, type: "increase" as const }
  }
];

const recentAssets = [
  {
    id: "1",
    name: "PETR4",
    category: "Ação",
    location: "XP Investimentos",
    value: 35840,
    purchaseDate: "2024-01-15",
    status: "active" as const,
    condition: "excellent" as const,
    ticker: "PETR4",
    quantity: 1000,
    currentPrice: 35.84
  },
  {
    id: "2", 
    name: "VALE3",
    category: "Ação",
    location: "Rico Investimentos", 
    value: 42650,
    purchaseDate: "2023-11-20",
    status: "active" as const,
    condition: "good" as const,
    ticker: "VALE3",
    quantity: 850,
    currentPrice: 50.18
  },
  {
    id: "3",
    name: "HGLG11",
    category: "FII",
    location: "Inter Investimentos",
    value: 12480,
    purchaseDate: "2024-02-10", 
    status: "active" as const,
    condition: "excellent" as const,
    ticker: "HGLG11",
    quantity: 120,
    currentPrice: 104.00
  }
];

export default function Dashboard() {
  const [assets, setAssets] = useState(recentAssets);
  const [filteredAssets, setFilteredAssets] = useState(recentAssets);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterCriteria | null>(null);

  const handleAddAsset = (newAsset: any) => {
    const updatedAssets = [...assets, newAsset];
    setAssets(updatedAssets);
    applyFiltersAndSearch(updatedAssets, searchTerm, activeFilters);
    setIsAddModalOpen(false);
  };

  const applyFiltersAndSearch = (assetList: typeof recentAssets, search: string, filters: FilterCriteria | null) => {
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
              Gestão Inteligente de Ativos Financeiros
            </h1>
            <p className="text-xl opacity-90 mb-6">
              Controle total da sua carteira de investimentos com análises avançadas
            </p>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="lg" className="shadow-lg">
                  Adicionar Novo Ativo
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
          <CardTitle>Buscar Ativos Financeiros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input 
              placeholder="Buscar por ticker, nome ou corretora..." 
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
            Ativos na Carteira
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
              onEdit={(asset) => console.log("Edit:", asset)}
              onView={(asset) => console.log("View:", asset)}
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
    </div>
  );
}