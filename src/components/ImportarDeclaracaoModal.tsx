import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const { toast } = useToast();

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

    try {
      // Simular processamento do arquivo
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Dados mockados baseados no arquivo importado
      const declaracaoImportada = {
        id: Date.now().toString(),
        ano: parseInt(anoDeclaracao),
        status: "Importada",
        prazoLimite: `${anoDeclaracao}-04-30`,
        recibo: tipoArquivo === "recibo" ? `${Date.now()}` : null,
        valorPagar: Math.random() > 0.5 ? Math.floor(Math.random() * 5000) : 0,
        valorRestituir: Math.random() > 0.5 ? Math.floor(Math.random() * 3000) : 0,
        arquivoOriginal: arquivo.name,
        dataImportacao: new Date().toISOString(),
        observacoes
      };

      onDeclaracaoImportada(declaracaoImportada);
      
      toast({
        title: "Declaração importada com sucesso!",
        description: `Declaração de ${anoDeclaracao} foi importada e está disponível no histórico.`
      });

      // Reset form
      setArquivo(null);
      setTipoArquivo("");
      setAnoDeclaracao("");
      setObservacoes("");
      onOpenChange(false);

    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar a declaração. Verifique o arquivo e tente novamente.",
        variant: "destructive"
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
              Importe declarações já realizadas do programa IRPF da Receita Federal ou arquivos de backup.
            </AlertDescription>
          </Alert>

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