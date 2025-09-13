import { Package, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import StatsCard from "./StatsCard";
import AssetCard from "./AssetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import AddAssetForm from "./AddAssetForm";
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddAsset = (newAsset: any) => {
    setAssets(prev => [...prev, newAsset]);
    setIsAddModalOpen(false);
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
            />
            <Button variant="default">
              Buscar
            </Button>
            <Button variant="outline">
              Filtros Avançados
            </Button>
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
          {assets.map((asset) => (
            <AssetCard 
              key={asset.id} 
              asset={asset}
              onEdit={(asset) => console.log("Edit:", asset)}
              onView={(asset) => console.log("View:", asset)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}