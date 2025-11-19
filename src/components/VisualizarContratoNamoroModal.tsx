import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

interface ContratoNamoro {
  id: string;
  titulo: string;
  parte_1_nome: string;
  parte_1_cpf: string;
  parte_1_endereco?: string;
  parte_2_nome: string;
  parte_2_cpf: string;
  parte_2_endereco?: string;
  regime_bens: string;
  data_inicio: string;
  data_elaboracao: string;
  deveres_parte_1?: string;
  deveres_parte_2?: string;
  direitos_parte_1?: string;
  direitos_parte_2?: string;
  clausulas_adicionais?: string;
  testemunha_1_nome?: string;
  testemunha_1_cpf?: string;
  testemunha_2_nome?: string;
  testemunha_2_cpf?: string;
  status: string;
  observacoes?: string;
}

interface VisualizarContratoNamoroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: ContratoNamoro;
}

export default function VisualizarContratoNamoroModal({ open, onOpenChange, contrato }: VisualizarContratoNamoroModalProps) {
  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" } = {
      "Vigente": "default",
      "Rescindido": "destructive",
      "Suspenso": "secondary"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{contrato.titulo}</DialogTitle>
            {getStatusBadge(contrato.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Gerais */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Informações do Contrato</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Data de Elaboração</p>
                <p className="font-medium">
                  {format(new Date(contrato.data_elaboracao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Início do Namoro</p>
                <p className="font-medium">
                  {format(new Date(contrato.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Regime de Bens</p>
                <p className="font-medium">{contrato.regime_bens}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Parte 1 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Primeira Parte (Parte 1)</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Nome Completo</p>
                <p className="font-medium">{contrato.parte_1_nome}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">CPF</p>
                  <p className="font-medium">{contrato.parte_1_cpf}</p>
                </div>
                {contrato.parte_1_endereco && (
                  <div>
                    <p className="text-muted-foreground">Endereço</p>
                    <p className="font-medium">{contrato.parte_1_endereco}</p>
                  </div>
                )}
              </div>
              {contrato.deveres_parte_1 && (
                <div>
                  <p className="text-muted-foreground">Deveres</p>
                  <p className="font-medium whitespace-pre-wrap">{contrato.deveres_parte_1}</p>
                </div>
              )}
              {contrato.direitos_parte_1 && (
                <div>
                  <p className="text-muted-foreground">Direitos</p>
                  <p className="font-medium whitespace-pre-wrap">{contrato.direitos_parte_1}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Parte 2 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Segunda Parte (Parte 2)</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Nome Completo</p>
                <p className="font-medium">{contrato.parte_2_nome}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">CPF</p>
                  <p className="font-medium">{contrato.parte_2_cpf}</p>
                </div>
                {contrato.parte_2_endereco && (
                  <div>
                    <p className="text-muted-foreground">Endereço</p>
                    <p className="font-medium">{contrato.parte_2_endereco}</p>
                  </div>
                )}
              </div>
              {contrato.deveres_parte_2 && (
                <div>
                  <p className="text-muted-foreground">Deveres</p>
                  <p className="font-medium whitespace-pre-wrap">{contrato.deveres_parte_2}</p>
                </div>
              )}
              {contrato.direitos_parte_2 && (
                <div>
                  <p className="text-muted-foreground">Direitos</p>
                  <p className="font-medium whitespace-pre-wrap">{contrato.direitos_parte_2}</p>
                </div>
              )}
            </div>
          </div>

          {/* Testemunhas */}
          {(contrato.testemunha_1_nome || contrato.testemunha_2_nome) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Testemunhas</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {contrato.testemunha_1_nome && (
                    <div>
                      <p className="text-muted-foreground">Testemunha 1</p>
                      <p className="font-medium">{contrato.testemunha_1_nome}</p>
                      {contrato.testemunha_1_cpf && (
                        <p className="text-xs text-muted-foreground">CPF: {contrato.testemunha_1_cpf}</p>
                      )}
                    </div>
                  )}
                  {contrato.testemunha_2_nome && (
                    <div>
                      <p className="text-muted-foreground">Testemunha 2</p>
                      <p className="font-medium">{contrato.testemunha_2_nome}</p>
                      {contrato.testemunha_2_cpf && (
                        <p className="text-xs text-muted-foreground">CPF: {contrato.testemunha_2_cpf}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Cláusulas Adicionais */}
          {contrato.clausulas_adicionais && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Cláusulas Adicionais</h3>
                <p className="text-sm whitespace-pre-wrap">{contrato.clausulas_adicionais}</p>
              </div>
            </>
          )}

          {/* Observações */}
          {contrato.observacoes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Observações</h3>
                <p className="text-sm whitespace-pre-wrap">{contrato.observacoes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
