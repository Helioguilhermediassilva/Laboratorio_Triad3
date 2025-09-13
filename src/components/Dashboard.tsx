import { Package, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import StatsCard from "./StatsCard";
import AssetCard from "./AssetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import heroImage from "@/assets/hero-bg.jpg";

// Mock data
const stats = [
  {
    title: "Total de Ativos",
    value: "1,247",
    icon: Package,
    change: { value: 12, type: "increase" as const }
  },
  {
    title: "Valor Total",
    value: "R$ 2.4M",
    icon: TrendingUp,
    change: { value: 8, type: "increase" as const }
  },
  {
    title: "Em Manutenção",
    value: "23",
    icon: AlertTriangle,
    change: { value: 5, type: "decrease" as const }
  },
  {
    title: "Ativos Ativos",
    value: "1,224",
    icon: CheckCircle,
    change: { value: 15, type: "increase" as const }
  }
];

const recentAssets = [
  {
    id: "1",
    name: "Laptop Dell Inspiron 15",
    category: "Tecnologia",
    location: "Escritório Principal - SP",
    value: 3500,
    purchaseDate: "2024-01-15",
    status: "active" as const,
    condition: "excellent" as const
  },
  {
    id: "2", 
    name: "Mesa Executiva Premium",
    category: "Móveis",
    location: "Sala de Reunião 2",
    value: 2800,
    purchaseDate: "2023-11-20",
    status: "active" as const,
    condition: "good" as const
  },
  {
    id: "3",
    name: "Impressora Multifuncional HP",
    category: "Equipamentos",
    location: "Área Administrativa",
    value: 1200,
    purchaseDate: "2024-02-10",
    status: "maintenance" as const,
    condition: "fair" as const
  }
];

export default function Dashboard() {
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
              Controle total dos seus ativos com tecnologia 3D avançada
            </p>
            <Button variant="secondary" size="lg" className="shadow-lg">
              Adicionar Novo Ativo
            </Button>
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
          <CardTitle>Buscar Patrimônios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input 
              placeholder="Buscar por nome, categoria ou localização..." 
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
            Ativos Recentes
          </h2>
          <Button variant="outline">
            Ver Todos
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentAssets.map((asset) => (
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