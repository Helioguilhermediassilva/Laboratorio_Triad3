import { TrendingUp, MapPin, Calendar, DollarSign, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

interface AssetCardProps {
  asset: Asset;
  onEdit?: (asset: Asset) => void;
  onView?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
}

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

export default function AssetCard({ asset, onEdit, onView, onDelete }: AssetCardProps) {
  const isFinancialAsset = asset.ticker && asset.quantity && asset.currentPrice;
  
  return (
    <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-1 bg-gradient-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {isFinancialAsset ? (
                <TrendingUp className="h-5 w-5 text-primary" />
              ) : (
                <DollarSign className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground line-clamp-1">
                {isFinancialAsset ? asset.ticker : asset.name}
              </h3>
              <p className="text-sm text-muted-foreground">{asset.category}</p>
            </div>
          </div>
          <Badge 
            variant="secondary"
            className={`${
              statusColors[asset.status] === 'success' ? 'bg-success/10 text-success hover:bg-success/20' :
              statusColors[asset.status] === 'warning' ? 'bg-warning/10 text-warning hover:bg-warning/20' :
              'bg-destructive/10 text-destructive hover:bg-destructive/20'
            }`}
          >
            {asset.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2" />
          {asset.location}
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          {new Date(asset.purchaseDate).toLocaleDateString('pt-BR')}
        </div>
        
        {isFinancialAsset && (
          <div className="flex items-center text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 mr-2" />
            <span>
              {asset.quantity} cotas × R$ {asset.currentPrice?.toFixed(2)}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm">
            <TrendingUp className="h-4 w-4 mr-2 text-primary" />
            <span className="font-semibold text-foreground">
              {asset.value.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </span>
          </div>
          
          <Badge 
            variant="outline"
            className={`${
              conditionColors[asset.condition] === 'success' ? 'border-success/50 text-success' :
              conditionColors[asset.condition] === 'accent' ? 'border-accent/50 text-accent' :
              conditionColors[asset.condition] === 'warning' ? 'border-warning/50 text-warning' :
              'border-destructive/50 text-destructive'
            }`}
          >
            {asset.condition}
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex space-x-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onView?.(asset)}
          >
            Visualizar
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit?.(asset)}
          >
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir "{asset.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete?.(asset)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
