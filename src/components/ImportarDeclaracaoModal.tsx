import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface ImportarDeclaracaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeclaracaoImportada: (declaracao: any) => void;
}

export default function ImportarDeclaracaoModal({
  open,
  onOpenChange,
  onDeclaracaoImportada
}: ImportarDeclaracaoModalProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [tipoArquivo, setTipoArquivo] = useState("");
  const [anoDeclaracao, setAnoDeclaracao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [etapaAtual, setEtapaAtual] = useState("");
  const [tempoEstimado, setTempoEstimado] = useState("");
  const { toast } = useToast();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setArquivo(null);
      setTipoArquivo("");
      setAnoDeclaracao("");
      setObservacoes("");
      setProgresso(0);
      setEtapaAtual("");
      setTempoEstimado("");
      // Reset file input
      const fileInput = document.getElementById('arquivo') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivo(file);
      
      // Detectar tipo de arquivo automaticamente
      if (file.name.includes('.rec')) {
        setTipoArquivo("recibo");
      } else if (file.name.includes('.dec') || file.name.includes('.txt')) {
        setTipoArquivo("declaracao");
      } else if (file.name.includes('.pdf')) {
        setTipoArquivo("pdf");
      }
    }
  };

  const handleImportar = async () => {
    if (!arquivo || !tipoArquivo || !anoDeclaracao) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um arquivo, tipo e ano da declaração.",
        variant: "destructive"
      });
      return;
    }

    setCarregando(true);
    setProgresso(0);
    setEtapaAtual("Enviando arquivo...");
    setTempoEstimado("");

    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Você precisa estar autenticado para importar declarações");
      }

      setProgresso(20);
      setEtapaAtual("Analisando PDF com inteligência artificial...");
      setTempoEstimado("Esta etapa pode levar 60-90 segundos");

      // Prepare form data
      const formData = new FormData();
      formData.append('file', arquivo);
      formData.append('ano', anoDeclaracao);

      setProgresso(30);
      
      // Simular progresso durante o processamento da IA
      const progressInterval = setInterval(() => {
        setProgresso(prev => {
          if (prev < 70) return prev + 5;
          return prev;
        });
      }, 4000);

      // Call edge function to process the declaration
      const { data, error } = await supabase.functions.invoke('processar-declaracao-irpf', {
        body: formData,
      });
      
      clearInterval(progressInterval);

      if (error) {
        console.error('Edge function error:', error);
        clearInterval(progressInterval);
        
        // Try to get more details from the response
        let errorMessage = 'Erro ao processar declaração';
        if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      if (data?.error) {
        clearInterval(progressInterval);
        throw new Error(data.error);
      }

      setProgresso(80);
      setEtapaAtual("Categorizando e salvando dados...");
      setTempoEstimado("");

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao processar a declaração');
      }

      setProgresso(100);
      setEtapaAtual("Concluído!");

      const dadosExtraidos = data.dados_extraidos;
      
      toast({
        title: "✅ Declaração importada com sucesso!",
        description: (
          <div className="space-y-2">
            <p className="font-semibold">Declaração de {anoDeclaracao} processada.</p>
            <p className="text-amber-600 font-semibold text-sm">📊 Dados categorizados automaticamente:</p>
            <ul className="text-sm space-y-1 ml-2">
              <li>• <span className="font-medium">Imobilizado:</span> {dadosExtraidos.bens_imobilizados} itens</li>
              <li>• <span className="font-medium">Aplicações:</span> {dadosExtraidos.aplicacoes} itens</li>
              <li>• <span className="font-medium">Previdência:</span> {dadosExtraidos.previdencia} planos</li>
              <li>• <span className="font-medium">Contas Bancárias:</span> {dadosExtraidos.contas_bancarias} contas</li>
              <li>• <span className="font-medium">Dívidas:</span> {dadosExtraidos.dividas} itens</li>
              <li>• <span className="font-medium">Rendimentos:</span> {dadosExtraidos.rendimentos} itens</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              🔄 A página recarregará automaticamente. Depois navegue para cada guia para conferir os dados.
            </p>
          </div>
        ),
        duration: 12000
      });

      // Notify parent component
      onDeclaracaoImportada({
        id: data.declaracao_id,
        ano: parseInt(anoDeclaracao),
        status: "Importada",
        prazoLimite: `${anoDeclaracao}-04-30`,
        arquivoOriginal: arquivo.name,
        dataImportacao: new Date().toISOString(),
        observacoes
      });
      
      // Force reload after a short delay to ensure data is visible
      setTimeout(() => {
        window.location.reload();
      }, 2000);

      // Reset form
      setArquivo(null);
      setTipoArquivo("");
      setAnoDeclaracao("");
      setObservacoes("");
      setProgresso(0);
      setEtapaAtual("");
      onOpenChange(false);

    } catch (error: any) {
      console.error('Import error:', error);
      
      // Provide more descriptive error messages
      let errorMessage = "Não foi possível importar a declaração. Verifique o arquivo e tente novamente.";
      let errorTitle = "Erro na importação";
      
      if (error.message) {
        errorMessage = error.message;
        
        // Special handling for payment/credit errors
        if (error.message.includes('Créditos insuficientes') || error.message.includes('credits')) {
          errorTitle = "⚠️ Créditos insuficientes";
          errorMessage = "Você precisa adicionar créditos na Lovable AI para usar esta funcionalidade. Acesse Settings → Workspace → Usage no painel da Lovable.";
        } else if (error.message.includes('Rate limit') || error.message.includes('429')) {
          errorTitle = "⏱️ Limite atingido";
          errorMessage = "Você atingiu o limite de requisições. Por favor, aguarde alguns minutos e tente novamente.";
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 7000
      });
    } finally {
      setCarregando(false);
    }
  };

  const tiposArquivoSuportados = [
    { value: "declaracao", label: "Arquivo de Declaração (.dec/.txt)" },
    { value: "recibo", label: "Recibo de Entrega (.rec)" },
    { value: "pdf", label: "Declaração em PDF" },
    { value: "backup", label: "Backup do IRPF (.bkp)" }
  ];

  const anosDisponiveis = Array.from({ length: 10 }, (_, i) => {
    const ano = new Date().getFullYear() - i;
    return ano.toString();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Declaração
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Importe declarações em PDF. O sistema extrairá automaticamente os dados usando OCR e categorizará rendimentos, bens, dívidas e aplicações.
            </AlertDescription>
          </Alert>

          {carregando && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-green-600 animate-pulse" />
                {etapaAtual}
              </div>
              <Progress value={progresso} className="w-full" />
              {tempoEstimado && (
                <p className="text-xs text-muted-foreground text-center">
                  ⏱️ {tempoEstimado}
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="arquivo">Arquivo da Declaração</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="arquivo"
                  type="file"
                  onChange={handleFileChange}
                  accept=".dec,.rec,.txt,.pdf,.bkp"
                  className="cursor-pointer"
                />
                {arquivo && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {arquivo.name}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="tipo-arquivo">Tipo de Arquivo</Label>
              <Select value={tipoArquivo} onValueChange={setTipoArquivo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de arquivo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposArquivoSuportados.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ano">Ano da Declaração</Label>
              <Select value={anoDeclaracao} onValueChange={setAnoDeclaracao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={ano}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre esta importação..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={carregando}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleImportar}
              disabled={carregando || !arquivo || !tipoArquivo || !anoDeclaracao}
            >
              {carregando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Declaração
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}