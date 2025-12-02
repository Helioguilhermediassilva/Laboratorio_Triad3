import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, AlertCircle, CheckCircle2, FileSearch, Database, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ImportarDeclaracaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeclaracaoImportada: (declaracao: any) => void;
}

interface ImportResumo {
  rendimentos_importados: number;
  bens_importados: number;
  aplicacoes_importadas: number;
  contas_importadas: number;
  transacoes_importadas: number;
  dividas_importadas: number;
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
  const [resumoImportacao, setResumoImportacao] = useState<ImportResumo | null>(null);
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
      setResumoImportacao(null);
      const fileInput = document.getElementById('arquivo') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [open]);

  // Function to extract text from PDF using pdfjs-dist
  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText;
    } catch (error) {
      console.error('Erro ao extrair texto do PDF:', error);
      throw new Error('Não foi possível ler o arquivo PDF. Verifique se o arquivo está correto.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 20MB.",
          variant: "destructive"
        });
        return;
      }

      setArquivo(file);
      
      // Auto-detect file type
      if (file.name.includes('.rec')) {
        setTipoArquivo("recibo");
      } else if (file.name.includes('.dec') || file.name.includes('.txt')) {
        setTipoArquivo("declaracao");
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
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

    // Validate PDF for full extraction
    if (tipoArquivo === "pdf" && !arquivo.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: "Formato inválido",
        description: "Para extração automática, selecione um arquivo PDF.",
        variant: "destructive"
      });
      return;
    }

    setCarregando(true);
    setProgresso(0);
    setEtapaAtual("Lendo arquivo PDF...");
    setResumoImportacao(null);

    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Você precisa estar autenticado para importar declarações");
      }

      setProgresso(10);
      setEtapaAtual("Extraindo texto do PDF...");

      // Extract text from PDF on client side
      const pdfText = await extractTextFromPdf(arquivo);

      if (!pdfText || pdfText.trim().length < 100) {
        throw new Error('O PDF parece estar vazio ou não contém texto legível.');
      }

      setProgresso(30);
      setEtapaAtual("Enviando dados para processamento...");

      // Send extracted text (not FormData) to edge function
      const { data, error } = await supabase.functions.invoke('processar-declaracao-irpf', {
        body: {
          pdfText: pdfText,
          ano: parseInt(anoDeclaracao),
          fileName: arquivo.name
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao enviar declaração para processamento');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success) {
        throw new Error('Falha ao processar a declaração');
      }

      setProgresso(80);
      setEtapaAtual("Salvando dados no banco...");

      // Get results
      const declaracaoId = data.declaracao_id;
      const resumo = data.resumo as ImportResumo;
      
      setResumoImportacao(resumo);
      setProgresso(100);
      setEtapaAtual("Importação concluída!");

      // Show success with details
      const totalItens = (resumo?.rendimentos_importados || 0) + 
                        (resumo?.bens_importados || 0) + 
                        (resumo?.aplicacoes_importadas || 0) +
                        (resumo?.contas_importadas || 0) +
                        (resumo?.dividas_importadas || 0);

      toast({
        title: "✅ Declaração importada com sucesso!",
        description: totalItens > 0 
          ? `Ano ${data.ano || anoDeclaracao}: ${resumo.rendimentos_importados} rendimentos, ${resumo.bens_importados} bens, ${resumo.aplicacoes_importadas} aplicações extraídos.`
          : `Declaração de ${data.ano || anoDeclaracao} importada. Você pode adicionar dados manualmente.`,
        duration: 6000
      });

      // Notify parent component
      onDeclaracaoImportada({
        id: declaracaoId,
        ano: parseInt(anoDeclaracao),
        status: "Processada",
        prazoLimite: `${anoDeclaracao}-04-30`,
        arquivoOriginal: arquivo.name,
        dataImportacao: new Date().toISOString(),
        observacoes,
        resumo
      });

      // Close modal after delay
      setTimeout(() => {
        setArquivo(null);
        setTipoArquivo("");
        setAnoDeclaracao("");
        setObservacoes("");
        setProgresso(0);
        setEtapaAtual("");
        setResumoImportacao(null);
        onOpenChange(false);
        
        // Reload page to show new data
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Import error:', error);
      
      let errorMessage = "Não foi possível importar a declaração. Verifique o arquivo e tente novamente.";
      let errorTitle = "Erro na importação";
      
      if (error.message) {
        errorMessage = error.message;
        
        if (error.message.includes('Não autorizado') || error.message.includes('Unauthorized')) {
          errorTitle = "🔒 Sessão expirada";
          errorMessage = "Sua sessão expirou. Por favor, faça login novamente.";
        } else if (error.message.includes('PDF') || error.message.includes('ler o arquivo')) {
          errorTitle = "📄 Arquivo inválido";
          errorMessage = "O arquivo enviado não é um PDF válido ou está corrompido. Verifique e tente novamente.";
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
    { value: "pdf", label: "Declaração em PDF (Extração Automática)" },
    { value: "declaracao", label: "Arquivo de Declaração (.dec/.txt)" },
    { value: "recibo", label: "Recibo de Entrega (.rec)" },
    { value: "backup", label: "Backup do IRPF (.bkp)" }
  ];

  const anosDisponiveis = Array.from({ length: 10 }, (_, i) => {
    const ano = new Date().getFullYear() - i;
    return ano.toString();
  });

  const etapasProcessamento = [
    { id: 1, label: "Lendo PDF", icon: FileText },
    { id: 2, label: "Extraindo dados", icon: FileSearch },
    { id: 3, label: "Salvando", icon: Database },
    { id: 4, label: "Concluído", icon: CheckCircle2 }
  ];

  const getEtapaAtiva = () => {
    if (progresso < 25) return 1;
    if (progresso < 50) return 2;
    if (progresso < 90) return 3;
    return 4;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Declaração de IRPF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <FileSearch className="h-4 w-4" />
            <AlertDescription>
              Faça upload do PDF da sua declaração de Imposto de Renda. O sistema extrairá automaticamente 
              rendimentos, bens, direitos e dívidas para organizar suas informações financeiras.
            </AlertDescription>
          </Alert>

          {carregando && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                {etapasProcessamento.map((etapa) => {
                  const Icon = etapa.icon;
                  const isActive = getEtapaAtiva() === etapa.id;
                  const isComplete = getEtapaAtiva() > etapa.id;
                  
                  return (
                    <div key={etapa.id} className="flex flex-col items-center gap-1">
                      <div className={`p-2 rounded-full transition-colors ${
                        isComplete ? 'bg-green-500 text-white' :
                        isActive ? 'bg-primary text-primary-foreground animate-pulse' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {isActive ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <span className={`text-xs ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                        {etapa.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <Progress value={progresso} className="w-full h-2" />
              
              <p className="text-sm text-center text-muted-foreground">
                {etapaAtual}
              </p>
            </div>
          )}

          {resumoImportacao && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Dados importados com sucesso!</strong>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>✅ {resumoImportacao.rendimentos_importados} rendimentos</div>
                  <div>✅ {resumoImportacao.bens_importados} bens</div>
                  <div>✅ {resumoImportacao.aplicacoes_importadas} aplicações</div>
                  <div>✅ {resumoImportacao.contas_importadas} contas</div>
                  <div>✅ {resumoImportacao.transacoes_importadas} transações</div>
                  <div>✅ {resumoImportacao.dividas_importadas} dívidas</div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!carregando && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="arquivo">Arquivo da Declaração *</Label>
                <Input
                  id="arquivo"
                  type="file"
                  accept=".pdf,.dec,.txt,.rec,.bkp"
                  onChange={handleFileChange}
                  disabled={carregando}
                />
                {arquivo && (
                  <p className="text-sm text-muted-foreground">
                    {arquivo.name} ({(arquivo.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoArquivo">Tipo de Arquivo *</Label>
                <Select value={tipoArquivo} onValueChange={setTipoArquivo} disabled={carregando}>
                  <SelectTrigger id="tipoArquivo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposArquivoSuportados.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anoDeclaracao">Ano-Calendário *</Label>
                <Select value={anoDeclaracao} onValueChange={setAnoDeclaracao} disabled={carregando}>
                  <SelectTrigger id="anoDeclaracao">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anosDisponiveis.map((ano) => (
                      <SelectItem key={ano} value={ano}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Adicione observações sobre esta declaração..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  disabled={carregando}
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={carregando}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImportar}
              disabled={!arquivo || !tipoArquivo || !anoDeclaracao || carregando}
              className="flex-1"
            >
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
