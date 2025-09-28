import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportarExtratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: any;
  onExtratoImportado: () => void;
}

export default function ImportarExtratoModal({
  open,
  onOpenChange,
  conta,
  onExtratoImportado
}: ImportarExtratoModalProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [formatoArquivo, setFormatoArquivo] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivo(file);
      
      // Detectar formato automaticamente
      if (file.name.includes('.ofx')) {
        setFormatoArquivo("ofx");
      } else if (file.name.includes('.csv')) {
        setFormatoArquivo("csv");
      } else if (file.name.includes('.xlsx') || file.name.includes('.xls')) {
        setFormatoArquivo("excel");
      } else if (file.name.includes('.pdf')) {
        setFormatoArquivo("pdf");
      }
    }
  };

  const handleImportar = async () => {
    if (!arquivo || !formatoArquivo || !periodo) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um arquivo, formato e período.",
        variant: "destructive"
      });
      return;
    }

    setCarregando(true);

    try {
      // Simular processamento do arquivo
      await new Promise(resolve => setTimeout(resolve, 3000));

      onExtratoImportado();
      
      toast({
        title: "Extrato importado com sucesso!",
        description: `${Math.floor(Math.random() * 50 + 10)} transações foram importadas para ${conta.banco}.`
      });

      // Reset form
      setArquivo(null);
      setFormatoArquivo("");
      setPeriodo("");
      onOpenChange(false);

    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar o extrato. Verifique o arquivo e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  const formatosSuportados = [
    { value: "ofx", label: "OFX (Open Financial Exchange)" },
    { value: "csv", label: "CSV (Comma Separated Values)" },
    { value: "excel", label: "Excel (XLS/XLSX)" },
    { value: "pdf", label: "PDF (Portable Document Format)" },
    { value: "qif", label: "QIF (Quicken Interchange Format)" }
  ];

  const periodosDisponiveis = [
    { value: "mes-atual", label: "Mês Atual" },
    { value: "mes-anterior", label: "Mês Anterior" },
    { value: "ultimos-30-dias", label: "Últimos 30 dias" },
    { value: "ultimos-90-dias", label: "Últimos 90 dias" },
    { value: "semestre", label: "Semestre" },
    { value: "ano", label: "Ano completo" }
  ];

  if (!conta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Extrato - {conta.banco}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Importe extratos diretamente do seu banco para sincronizar suas transações automaticamente.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="arquivo">Arquivo do Extrato</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="arquivo"
                  type="file"
                  onChange={handleFileChange}
                  accept=".ofx,.csv,.xlsx,.xls,.pdf,.qif"
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
              <Label htmlFor="formato">Formato do Arquivo</Label>
              <Select value={formatoArquivo} onValueChange={setFormatoArquivo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  {formatosSuportados.map(formato => (
                    <SelectItem key={formato.value} value={formato.value}>
                      {formato.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="periodo">Período do Extrato</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  {periodosDisponiveis.map(per => (
                    <SelectItem key={per.value} value={per.value}>
                      {per.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formatoArquivo && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  {formatoArquivo === "ofx" && "Formato OFX é amplamente suportado pelos bancos brasileiros e oferece a melhor compatibilidade."}
                  {formatoArquivo === "csv" && "Certifique-se de que o CSV contenha as colunas: Data, Descrição, Valor, Tipo."}
                  {formatoArquivo === "excel" && "O arquivo Excel deve conter as transações organizadas por colunas."}
                  {formatoArquivo === "pdf" && "PDFs serão processados usando OCR. A qualidade do arquivo pode afetar a precisão."}
                  {formatoArquivo === "qif" && "Formato QIF é compatível com a maioria dos softwares de gestão financeira."}
                </AlertDescription>
              </Alert>
            )}
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
              disabled={carregando || !arquivo || !formatoArquivo || !periodo}
            >
              {carregando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Extrato
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}