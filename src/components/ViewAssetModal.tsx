import { TrendingUp, MapPin, Calendar, DollarSign, BarChart3, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  value: number;
  purchaseDate: string;
  status: "active" | "maintenance" | "inactive";
  condition: "excellent" | "good" | "fair" | "poor";
  ticker?: string;
  quantity?: number;
  currentPrice?: number;
}

interface ViewAssetModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusLabels = {
  active: "Ativo",
  maintenance: "Manutenção",
  inactive: "Inativo"
};

const conditionLabels = {
  excellent: "Excelente",
  good: "Boa", 
  fair: "Regular",
  poor: "Ruim"
};

const statusColors = {
  active: "success",
  maintenance: "warning",
  inactive: "destructive"
} as const;

const conditionColors = {
  excellent: "success",
  good: "accent", 
  fair: "warning",
  poor: "destructive"
} as const;

export default function ViewAssetModal({ asset, isOpen, onClose }: ViewAssetModalProps) {
  if (!asset) return null;

  const isFinancialAsset = asset.ticker && asset.quantity && asset.currentPrice;
  const purchaseValue = isFinancialAsset ? (asset.quantity * asset.currentPrice) : asset.value;
  const currentValue = asset.value;
  const profitLoss = currentValue - purchaseValue;
  const profitLossPercentage = ((profitLoss / purchaseValue) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Detalhes do Ativo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                {isFinancialAsset ? (
                  <TrendingUp className="h-6 w-6 text-primary" />
                ) : (
                  <DollarSign className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {isFinancialAsset ? asset.ticker : asset.name}
                </h2>
                <p className="text-muted-foreground">{asset.category}</p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Badge 
                variant="secondary"
                className={`${
                  statusColors[asset.status] === 'success' ? 'bg-success/10 text-success' :
                  statusColors[asset.status] === 'warning' ? 'bg-warning/10 text-warning' :
                  'bg-destructive/10 text-destructive'
                }`}
              >
                {statusLabels[asset.status]}
              </Badge>
              <Badge 
                variant="outline"
                className={`${
                  conditionColors[asset.condition] === 'success' ? 'border-success/50 text-success' :
                  conditionColors[asset.condition] === 'accent' ? 'border-accent/50 text-accent' :
                  conditionColors[asset.condition] === 'warning' ? 'border-warning/50 text-warning' :
                  'border-destructive/50 text-destructive'
                }`}
              >
                {conditionLabels[asset.condition]}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Localização/Corretora</p>
                    <p className="font-medium">{asset.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Data de Compra</p>
                    <p className="font-medium">{new Date(asset.purchaseDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              {isFinancialAsset && (
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Quantidade & Preço Atual</p>
                    <p className="font-medium">
                      {asset.quantity} cotas × R$ {asset.currentPrice?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Atual</p>
                    <p className="text-2xl font-bold text-foreground">
                      {currentValue.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </p>
                  </div>
                  
                  {isFinancialAsset && (
                    <div>
                      <p className="text-sm text-muted-foreground">Valor na Compra</p>
                      <p className="text-lg font-semibold text-muted-foreground">
                        {purchaseValue.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {isFinancialAsset && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ganho/Perda</p>
                      <p className={`text-lg font-semibold ${
                        profitLoss >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {profitLoss >= 0 ? '+' : ''}{profitLoss.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Rentabilidade</p>
                      <p className={`text-lg font-semibold ${
                        profitLossPercentage >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">ID do Ativo</p>
                  <p className="font-mono">{asset.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Categoria</p>
                  <p>{asset.category}</p>
                </div>
                {isFinancialAsset && asset.ticker && (
                  <div>
                    <p className="text-muted-foreground">Ticker</p>
                    <p className="font-mono font-semibold">{asset.ticker}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}