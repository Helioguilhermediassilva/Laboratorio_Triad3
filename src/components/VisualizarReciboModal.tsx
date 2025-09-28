import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Calendar, DollarSign } from "lucide-react";

interface Declaracao {
  ano: number;
  status: string;
  prazoLimite: string;
  recibo: string | null;
  valorPagar: number;
  valorRestituir: number;
}

interface VisualizarReciboModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  declaracao: Declaracao | null;
}

export default function VisualizarReciboModal({ open, onOpenChange, declaracao }: VisualizarReciboModalProps) {
  const { toast } = useToast();

  const formatCurrency = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const handleDownloadPDF = () => {
    // Simulate PDF download
    toast({
      title: "Download iniciado",
      description: "O recibo está sendo baixado em PDF..."
    });
    
    // Simulate file download
    setTimeout(() => {
      toast({
        title: "Download concluído!",
        description: `Recibo_IRPF_${declaracao?.ano}_${declaracao?.recibo}.pdf baixado com sucesso.`
      });
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
    toast({
      title: "Enviado para impressão",
      description: "O recibo foi enviado para a impressora."
    });
  };

  if (!declaracao || !declaracao.recibo) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recibo de Entrega - IRPF {declaracao.ano}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header do Recibo */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold">RECEITA FEDERAL DO BRASIL</h2>
                <p className="text-sm text-muted-foreground">
                  Recibo de Entrega de Declaração
                </p>
                <p className="text-sm text-muted-foreground">
                  Imposto sobre a Renda da Pessoa Física
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Recibo */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Número do Recibo
                </Label>
                <p className="font-mono text-lg font-bold">{declaracao.recibo}</p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Ano-Calendário
                </Label>
                <p className="text-lg font-semibold">{declaracao.ano}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Data de Entrega
                </Label>
                <p className="font-medium">{formatDate(declaracao.prazoLimite)}</p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  Status
                </Label>
                <p className="font-medium text-green-600">{declaracao.status}</p>
              </div>
            </div>

            <Separator />

            {/* Valores */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Resumo Financeiro
              </h3>
              
              {declaracao.valorPagar > 0 && (
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium">Imposto a Pagar:</span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(declaracao.valorPagar)}
                  </span>
                </div>
              )}
              
              {declaracao.valorRestituir > 0 && (
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Imposto a Restituir:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(declaracao.valorRestituir)}
                  </span>
                </div>
              )}

              {declaracao.valorPagar === 0 && declaracao.valorRestituir === 0 && (
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">Situação:</span>
                  <span className="text-lg font-bold text-blue-600">
                    Sem Imposto a Pagar/Restituir
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Informações Adicionais */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                Este recibo comprova que sua Declaração de Ajuste Anual do 
                Imposto sobre a Renda foi recebida pela Receita Federal.
              </p>
              <p>
                Guarde este recibo para seus arquivos pessoais.
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              Imprimir
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}