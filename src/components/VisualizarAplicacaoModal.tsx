import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Building, Eye, BarChart3 } from "lucide-react";

interface VisualizarAplicacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aplicacao: any;
}

export default function VisualizarAplicacaoModal({
  open,
  onOpenChange,
  aplicacao
}: VisualizarAplicacaoModalProps) {
  if (!aplicacao) return null;

  const formatCurrency = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const calculateGainLoss = () => {
    const valorAtual = aplicacao.quantity * aplicacao.currentPrice;
    const valorInvestido = aplicacao.value;
    const ganho = valorAtual - valorInvestido;
    const percentual = ((ganho / valorInvestido) * 100);
    
    return {
      valor: ganho,
      percentual,
      isGain: ganho >= 0
    };
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case "Ação": return "bg-blue-100 text-blue-800";
      case "FII": return "bg-green-100 text-green-800";
      case "ETF": return "bg-purple-100 text-purple-800";
      case "Renda Fixa": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const { valor: ganhoPerda, percentual, isGain } = calculateGainLoss();
  const valorAtual = aplicacao.quantity * aplicacao.currentPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalhes da Aplicação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{aplicacao.ticker}</h2>
                      <p className="text-muted-foreground">{aplicacao.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{aplicacao.location}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={getCategoryColor(aplicacao.category)}>
                    {aplicacao.category}
                  </Badge>
                  <Badge className={getStatusColor(aplicacao.status)}>
                    {aplicacao.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Valor Investido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground">
                  {formatCurrency(aplicacao.value)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Valor Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground">
                  {formatCurrency(valorAtual)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Quantidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground">
                  {aplicacao.quantity.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-muted-foreground">
                  cotas/ações
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Preço Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground">
                  {formatCurrency(aplicacao.currentPrice)}
                </div>
                <div className="text-sm text-muted-foreground">
                  por cota/ação
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {isGain ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ganho/Perda</span>
                  <div className={`text-lg font-bold ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                    {isGain ? '+' : ''}{formatCurrency(ganhoPerda)}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rentabilidade</span>
                  <div className={`text-lg font-bold flex items-center gap-1 ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                    {isGain ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {isGain ? '+' : ''}{percentual.toFixed(2)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Data de Compra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-foreground">
                  {formatDate(aplicacao.purchaseDate)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {(() => {
                    const dias = Math.floor((new Date().getTime() - new Date(aplicacao.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
                    return `${dias} dias atrás`;
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Preço Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-foreground">
                  {formatCurrency(aplicacao.value / aplicacao.quantity)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  por cota/ação
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button>
              Editar Aplicação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}