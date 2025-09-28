import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, DollarSign, Percent, Shield, Building, Calendar, Clock, TrendingUp } from "lucide-react";

interface PlanoPrevidencia {
  id: number;
  tipo: string;
  produto: string;
  instituicao: string;
  valorAcumulado: number;
  aportesMensais: number;
  dataContratacao: string;
  proximaContribuicao: string;
  rentabilidadeAno: number;
  taxaAdministracao: number;
  taxaCarregamento: number;
  beneficiarioIdeal: number;
  idadeAtual: number;
  status: string;
  categoria: string;
}

interface VisualizarPlanoModalProps {
  children: React.ReactNode;
  plano: PlanoPrevidencia;
}

export default function VisualizarPlanoModal({ children, plano }: VisualizarPlanoModalProps) {
  const anosParaBeneficio = plano.beneficiarioIdeal - plano.idadeAtual;
  const progressoIdade = (plano.idadeAtual / plano.beneficiarioIdeal) * 100;
  const aporteAnual = plano.aportesMensais * 12;
  const valorProjetado = plano.valorAcumulado * Math.pow(1 + (plano.rentabilidadeAno / 100), anosParaBeneficio);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo": return "bg-green-500";
      case "Suspenso": return "bg-yellow-500";
      case "Resgatado": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Ativo": return "default";
      case "Suspenso": return "secondary";
      case "Resgatado": return "outline";
      default: return "outline";
    }
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case "PGBL": return "bg-blue-100 text-blue-800";
      case "VGBL": return "bg-green-100 text-green-800";
      case "FAPI": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{plano.produto}</DialogTitle>
            <div className="flex space-x-2">
              <Badge className={getCategoryColor(plano.categoria)}>
                {plano.tipo}
              </Badge>
              <Badge variant={getStatusVariant(plano.status)}>
                {plano.status}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">{plano.instituicao}</p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Progresso para Aposentadoria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progresso por idade</span>
                  <span>{plano.idadeAtual} de {plano.beneficiarioIdeal} anos</span>
                </div>
                <Progress value={progressoIdade} className="h-3" />
                <p className="text-sm text-muted-foreground mt-1">
                  {anosParaBeneficio > 0 
                    ? `${anosParaBeneficio} anos restantes para elegibilidade`
                    : "Elegível para benefício"
                  }
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Atual</p>
                  <p className="text-lg font-semibold text-green-600">
                    {plano.valorAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Projetado</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {valorProjetado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                  Valores e Aportes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor Acumulado:</span>
                  <span className="font-medium">
                    {plano.valorAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Aporte Mensal:</span>
                  <span className="font-medium">
                    {plano.aportesMensais > 0 
                      ? plano.aportesMensais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : "Suspenso"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Aporte Anual:</span>
                  <span className="font-medium">
                    {aporteAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Percent className="w-5 h-5 mr-2" />
                  Taxas e Rendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rentabilidade (Ano):</span>
                  <span className="font-medium text-green-600">+{plano.rentabilidadeAno.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Taxa Administração:</span>
                  <span className="font-medium">{plano.taxaAdministracao}% a.a.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Taxa Carregamento:</span>
                  <span className="font-medium">{plano.taxaCarregamento}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contract Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Informações do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data de Contratação</p>
                  <p className="font-medium">{plano.dataContratacao}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próxima Contribuição</p>
                  <p className="font-medium">{plano.proximaContribuicao}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Plano</p>
                  <p className="font-medium">{plano.tipo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Instituição</p>
                  <p className="font-medium">{plano.instituicao}</p>
                </div>
              </div>
              
              {/* Status indicator */}
              <div className="flex items-center space-x-2 pt-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(plano.status)}`} />
                <span className="text-sm">Status: {plano.status}</span>
              </div>
            </CardContent>
          </Card>

          {/* Age and Benefits Projection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CalendarDays className="w-5 h-5 mr-2" />
                Projeção de Benefícios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Idade Atual</p>
                  <p className="text-lg font-semibold">{plano.idadeAtual} anos</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Idade para Benefício</p>
                  <p className="text-lg font-semibold">{plano.beneficiarioIdeal} anos</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Restante</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {anosParaBeneficio > 0 ? `${anosParaBeneficio} anos` : "Elegível"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renda Mensal Est.</p>
                  <p className="text-lg font-semibold text-green-600">
                    {(valorProjetado * 0.006).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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