import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, DollarSign, Percent, Receipt, Building, Calendar } from "lucide-react";

interface Divida {
  id: number;
  tipo: string;
  credor: string;
  valorTotal: number;
  valorPendente: number;
  valorPrestacao: number;
  vencimento: string;
  proximoVencimento: string;
  parcelas: number;
  parcelasPagas: number;
  juros: number;
  status: string;
  categoria: string;
}

interface VisualizarDividaModalProps {
  children: React.ReactNode;
  divida: Divida;
}

export default function VisualizarDividaModal({ children, divida }: VisualizarDividaModalProps) {
  const percentualPago = (divida.parcelasPagas / divida.parcelas) * 100;
  const valorPago = divida.valorTotal - divida.valorPendente;
  const parcelasRestantes = divida.parcelas - divida.parcelasPagas;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em dia": return "bg-green-500";
      case "Atrasado": return "bg-yellow-500";
      case "Vencido": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Em dia": return "default";
      case "Atrasado": return "secondary";
      case "Vencido": return "destructive";
      default: return "outline";
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{divida.tipo}</DialogTitle>
            <Badge variant={getStatusVariant(divida.status)}>
              {divida.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{divida.credor}</p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Receipt className="w-5 h-5 mr-2" />
                Progresso do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progresso</span>
                  <span>{divida.parcelasPagas} de {divida.parcelas} parcelas pagas</span>
                </div>
                <Progress value={percentualPago} className="h-3" />
                <p className="text-sm text-muted-foreground mt-1">
                  {percentualPago.toFixed(1)}% quitado
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pago</p>
                  <p className="text-lg font-semibold text-green-600">
                    {valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pendente</p>
                  <p className="text-lg font-semibold text-red-600">
                    {divida.valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor Total:</span>
                  <span className="font-medium">
                    {divida.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor da Prestação:</span>
                  <span className="font-medium">
                    {divida.valorPrestacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de Juros:</span>
                  <span className="font-medium">{divida.juros}% a.a.</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Prazos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Parcelas Restantes:</span>
                  <span className="font-medium">{parcelasRestantes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Próximo Vencimento:</span>
                  <span className="font-medium">{divida.proximoVencimento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Vencimento Final:</span>
                  <span className="font-medium">{divida.vencimento}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Informações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-medium">{divida.categoria}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Instituição</p>
                  <p className="font-medium">{divida.credor}</p>
                </div>
              </div>
              
              {/* Status indicator */}
              <div className="flex items-center space-x-2 pt-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(divida.status)}`} />
                <span className="text-sm">Status: {divida.status}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Projection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CalendarDays className="w-5 h-5 mr-2" />
                Projeção de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total a Pagar (Restante)</p>
                  <p className="text-lg font-semibold">
                    {(parcelasRestantes * divida.valorPrestacao).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Juros Restantes (Est.)</p>
                  <p className="text-lg font-semibold">
                    {((parcelasRestantes * divida.valorPrestacao) - divida.valorPendente).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}