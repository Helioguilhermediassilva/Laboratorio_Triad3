import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Car, Wrench, MapPin, Calendar, DollarSign, Info, Eye } from "lucide-react";

interface VisualizarBemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bem: any;
}

export default function VisualizarBemModal({
  open,
  onOpenChange,
  bem
}: VisualizarBemModalProps) {
  if (!bem) return null;

  const getIcon = () => {
    switch (bem.categoria) {
      case "Imóvel": return <Home className="h-6 w-6" />;
      case "Veículo": return <Car className="h-6 w-6" />;
      case "Equipamento": return <Wrench className="h-6 w-6" />;
      default: return <Home className="h-6 w-6" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Próprio": return "bg-green-100 text-green-800";
      case "Financiado": return "bg-blue-100 text-blue-800";
      case "Alugado": return "bg-yellow-100 text-yellow-800";
      case "Comodato": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCondicaoColor = (condicao: string) => {
    switch (condicao) {
      case "Excelente": return "bg-green-100 text-green-800";
      case "Boa": return "bg-blue-100 text-blue-800";
      case "Regular": return "bg-yellow-100 text-yellow-800";
      case "Precisa Reforma": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalhes do Bem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    {getIcon()}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{bem.nome}</CardTitle>
                    <div className="flex items-center text-muted-foreground mt-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {bem.endereco}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={getStatusColor(bem.status)}>
                    {bem.status}
                  </Badge>
                  <Badge className={getCondicaoColor(bem.condicao)}>
                    {bem.condicao}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Valor Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(bem.valor)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Data de Aquisição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-foreground">
                  {formatDate(bem.dataAquisicao)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {bem.categoria}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tempo de Posse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-foreground">
                  {(() => {
                    const hoje = new Date();
                    const aquisicao = new Date(bem.dataAquisicao);
                    const diffTime = Math.abs(hoje.getTime() - aquisicao.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const anos = Math.floor(diffDays / 365);
                    const meses = Math.floor((diffDays % 365) / 30);
                    
                    if (anos > 0) {
                      return `${anos} ano${anos > 1 ? 's' : ''} e ${meses} mês${meses !== 1 ? 'es' : ''}`;
                    } else {
                      return `${meses} mês${meses !== 1 ? 'es' : ''}`;
                    }
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Observações */}
          {bem.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">
                  {bem.observacoes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button>
              Editar Bem
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}