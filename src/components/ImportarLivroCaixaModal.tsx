import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Download } from "lucide-react";

interface ImportarLivroCaixaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransacoesImported: () => void;
}

export default function ImportarLivroCaixaModal({ open, onOpenChange, onTransacoesImported }: ImportarLivroCaixaModalProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Verificar se é CSV
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo CSV.",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const transactions = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const transaction: any = {};
        headers.forEach((header, index) => {
          transaction[header] = values[index];
        });
        transactions.push(transaction);
      }
    }
    
    return transactions;
  };

  const validateAndFormatTransaction = (transaction: any) => {
    // Mapear campos do CSV para o formato do banco
    const mapped = {
      data: transaction.data || transaction.Data || transaction.DATE,
      descricao: transaction.descricao || transaction.Descricao || transaction.DESCRIPTION,
      categoria: transaction.categoria || transaction.Categoria || transaction.CATEGORY,
      tipo: (transaction.tipo || transaction.Tipo || transaction.TYPE || 'entrada').toLowerCase(),
      valor: parseFloat((transaction.valor || transaction.Valor || transaction.VALUE || '0').replace('R$', '').replace(',', '.')),
      conta: transaction.conta || transaction.Conta || transaction.ACCOUNT || 'Importado',
      observacoes: transaction.observacoes || transaction.Observacoes || transaction.NOTES || null
    };

    // Validações básicas
    if (!mapped.data || !mapped.descricao || !mapped.categoria || isNaN(mapped.valor)) {
      return null;
    }

    // Formatar data
    const date = new Date(mapped.data);
    if (isNaN(date.getTime())) {
      return null;
    }
    mapped.data = date.toISOString().split('T')[0];

    // Validar tipo
    if (!['entrada', 'saida'].includes(mapped.tipo)) {
      mapped.tipo = 'entrada';
    }

    return mapped;
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para importar transações.",
          variant: "destructive"
        });
        return;
      }

      const text = await file.text();
      const csvTransactions = parseCSV(text);
      
      const validTransactions = csvTransactions
        .map(validateAndFormatTransaction)
        .filter(t => t !== null)
        .map(t => ({ ...t, user_id: user.id }));

      if (validTransactions.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhuma transação válida encontrada no arquivo.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('transacoes')
        .insert(validTransactions);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `${validTransactions.length} transações importadas com sucesso.`
      });

      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onTransacoesImported();
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao importar transações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `data,descricao,categoria,tipo,valor,conta,observacoes
2024-01-15,Salário - Empresa XYZ,Salário,entrada,8500,Conta Corrente Itaú,Salário mensal
2024-01-16,Aluguel Apartamento,Moradia,saida,2200,Conta Corrente Itaú,Aluguel mensal do apartamento
2024-01-17,Dividendos PETR4,Investimentos,entrada,450,Conta Corrente XP,Dividendos ações Petrobras`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'template_livro_caixa.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Template baixado!",
      description: "Use este arquivo como modelo para importar suas transações."
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Livro Caixa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Importe suas transações a partir de um arquivo CSV. 
            O arquivo deve conter as colunas: data, descricao, categoria, tipo, valor, conta, observacoes.
          </div>

          <Button 
            variant="outline" 
            onClick={downloadTemplate}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Template CSV
          </Button>

          <div className="space-y-2">
            <Label htmlFor="csvFile">Selecionar arquivo CSV</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {file ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-green-500" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Alterar arquivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar um arquivo CSV
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Selecionar arquivo
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={loading || !file}
            >
              {loading ? "Importando..." : "Importar Transações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}