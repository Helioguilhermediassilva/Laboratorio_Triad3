import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText, Users, Building, Calendar, Shield, FileText } from "lucide-react";

interface Testamento {
  id: number;
  titulo: string;
  tipo: string;
  dataElaboracao: string;
  ultimaAtualizacao: string;
  cartorio: string;
  testamenteiro: string;
  status: string;
  beneficiarios: string[];
  bensIncluidos: string[];
  observacoes?: string;
}

interface VisualizarTestamentoModalProps {
  children: React.ReactNode;
  testamento: Testamento;
}

export default function VisualizarTestamentoModal({ children, testamento }: VisualizarTestamentoModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo": return "bg-green-500";
      case "Rascunho": return "bg-yellow-500";
      case "Revogado": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Ativo": return "default";
      case "Rascunho": return "secondary";
      case "Revogado": return "destructive";
      default: return "outline";
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "Testamento Público": return "bg-blue-100 text-blue-800";
      case "Testamento Particular": return "bg-purple-100 text-purple-800";
      case "Codicilo": return "bg-orange-100 text-orange-800";
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
            <DialogTitle className="text-xl">{testamento.titulo}</DialogTitle>
            <div className="flex space-x-2">
              <Badge className={getTipoColor(testamento.tipo)}>
                {testamento.tipo}
              </Badge>
              <Badge variant={getStatusVariant(testamento.status)}>
                {testamento.status}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">Testamenteiro: {testamento.testamenteiro}</p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Document Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Informações do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data de Elaboração</p>
                  <p className="font-medium">{testamento.dataElaboracao}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última Atualização</p>
                  <p className="font-medium">{testamento.ultimaAtualizacao}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Documento</p>
                  <p className="font-medium">{testamento.tipo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cartório</p>
                  <p className="font-medium">{testamento.cartorio}</p>
                </div>
              </div>
              
              {/* Status indicator */}
              <div className="flex items-center space-x-2 pt-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(testamento.status)}`} />
                <span className="text-sm">Status: {testamento.status}</span>
              </div>
            </CardContent>
          </Card>

          {/* Executor Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Testamenteiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm text-muted-foreground">Responsável pela Execução</p>
                <p className="font-semibold text-lg">{testamento.testamenteiro}</p>
              </div>
            </CardContent>
          </Card>

          {/* Beneficiaries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Beneficiários ({testamento.beneficiarios.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testamento.beneficiarios.map((beneficiario, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="font-medium">{beneficiario}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assets Included */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Bens Incluídos ({testamento.bensIncluidos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testamento.bensIncluidos.map((bem, index) => (
                  <div key={index} className="border-l-4 border-blue-200 pl-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-r-lg">
                    <p className="font-medium">{bem}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          {testamento.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <ScrollText className="w-5 h-5 mr-2" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  {testamento.observacoes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Legal Notice */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex">
              <Shield className="h-5 w-5 text-amber-400 mr-3 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Aviso Legal
                </p>
                <p className="mt-1 text-amber-700 dark:text-amber-300">
                  Este documento é apenas para fins organizacionais. Para validade legal, 
                  consulte sempre um advogado especializado em direito sucessório e 
                  registre o testamento em cartório competente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}