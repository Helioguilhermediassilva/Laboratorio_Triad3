import { useState, useEffect } from "react";
import { CreditCard, TrendingUp, TrendingDown, Eye, EyeOff, MoreHorizontal, Plus, Upload } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import NovaContaModal from "@/components/NovaContaModal";
import ExtratoModal from "@/components/ExtratoModal";
import ImportarExtratoModal from "@/components/ImportarExtratoModal";
import { supabase } from "@/integrations/supabase/client";

const CartaoConta = ({ 
  conta, 
  onExtrato, 
  onImportarExtrato
}: { 
  conta: any;
  onExtrato: (conta: any) => void;
  onImportarExtrato: (conta: any) => void;
}) => {
  const cores = ["#FF6B35", "#8A2BE2", "#000000", "#FF8C00"];
  const cor = cores[Math.floor(Math.random() * cores.length)];
  return (
    <Card className="relative overflow-hidden">
      <div 
        className="absolute top-0 left-0 w-full h-2"
        style={{ backgroundColor: cor }}
      />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{conta.banco}</CardTitle>
            <p className="text-sm text-muted-foreground">{conta.tipo_conta}</p>
          </div>
          <Badge variant="outline">{conta.tipo_conta}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Agência</span>
            <span>{conta.agencia}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Conta</span>
            <span>{conta.numero_conta}</span>
          </div>
        </div>
        
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Saldo Atual</span>
            <span className="text-2xl font-bold">
              {Number(conta.saldo_atual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          
          {conta.limite_credito > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Limite Disponível</span>
              <span className="text-green-600">
                {Number(conta.limite_credito).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onExtrato(conta)}
          >
            Extrato
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onImportarExtrato(conta)}
          >
            <Upload className="h-3 w-3 mr-1" />
            Importar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ContasBancarias() {
  const [contas, setContas] = useState<any[]>([]);
  const [novaContaOpen, setNovaContaOpen] = useState(false);
  const [extratoOpen, setExtratoOpen] = useState(false);
  const [importarExtratoOpen, setImportarExtratoOpen] = useState(false);
  
  const [contaSelecionada, setContaSelecionada] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadContas();
  }, []);

  const loadContas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('contas_bancarias')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true);

    if (error) {
      console.error('Error loading contas:', error);
      return;
    }

    setContas(data || []);
  };

  const saldoTotal = contas.reduce((sum, conta) => sum + Number(conta.saldo_atual), 0);
  const limiteTotal = contas.reduce((sum, conta) => sum + Number(conta.limite_credito || 0), 0);

  const handleContaAdicionada = (novaConta: any) => {
    loadContas();
    toast({
      title: "Conta adicionada!",
      description: "A conta foi adicionada com sucesso."
    });
  };

  const handleExtrato = (conta: any) => {
    setContaSelecionada(conta);
    setExtratoOpen(true);
  };

  const handleImportarExtrato = (conta: any) => {
    setContaSelecionada(conta);
    setImportarExtratoOpen(true);
  };


  const handleExtratoImportado = () => {
    toast({
      title: "Extrato importado!",
      description: "As transações foram sincronizadas com sucesso."
    });
  };

  
  const formatCurrency = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Contas Bancárias
            </h1>
            <p className="text-muted-foreground">
              Centralize o controle de todas as suas contas e cartões
            </p>
          </div>
          
          <Button onClick={() => setNovaContaOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Saldo Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(saldoTotal)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Contas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contas.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Contas ativas
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Limite Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(limiteTotal)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Minhas Contas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contas.map((conta) => (
              <CartaoConta 
                key={conta.id} 
                conta={conta} 
                onExtrato={handleExtrato}
                onImportarExtrato={handleImportarExtrato}
              />
            ))}
          </div>
        </div>


        {/* Modals */}
        <NovaContaModal 
          open={novaContaOpen}
          onOpenChange={setNovaContaOpen}
          onContaAdicionada={handleContaAdicionada}
        />
        
        <ExtratoModal 
          open={extratoOpen}
          onOpenChange={setExtratoOpen}
          conta={contaSelecionada}
        />
        
        <ImportarExtratoModal 
          open={importarExtratoOpen}
          onOpenChange={setImportarExtratoOpen}
          conta={contaSelecionada}
          onExtratoImportado={handleExtratoImportado}
        />
        
      </div>
    </Layout>
  );
}