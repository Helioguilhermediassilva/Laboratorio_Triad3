import { useState, useEffect } from "react";
import { Receipt, Plus, Eye, Trash2, Calendar, DollarSign } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import NovaDividaModal from "@/components/NovaDividaModal";
import VisualizarDividaModal from "@/components/VisualizarDividaModal";
import { supabase } from "@/integrations/supabase/client";

interface DebtCardProps {
  divida: any;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onPagamentoRegistrado: (dividaId: string, valorPago: number, categoria: string) => void;
}

function DebtCard({ divida, onView, onDelete, onPagamentoRegistrado }: DebtCardProps) {
  const percentualPago = (divida.parcelasPagas / divida.parcelas) * 100;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em dia": return "bg-green-500";
      case "Atrasado": return "bg-yellow-500";
      case "Vencido": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Em dia": return "default";
      case "Atrasado": return "secondary";
      case "Vencido": return "destructive";
      default: return "outline";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(divida.status)}`} />
            <div>
              <CardTitle className="text-lg">{divida.tipo}</CardTitle>
              <p className="text-sm text-muted-foreground">{divida.credor}</p>
            </div>
          </div>
          <Badge variant={getStatusVariant(divida.status)}>
            {divida.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Valor Pendente</p>
            <p className="font-semibold text-red-600">
              {divida.valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Prestação</p>
            <p className="font-semibold">
              {divida.valorPrestacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso</span>
            <span>{divida.parcelasPagas}/{divida.parcelas} parcelas</span>
          </div>
          <Progress value={percentualPago} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {percentualPago.toFixed(1)}% quitado
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Próximo Vencimento</p>
            <p className="font-medium">{divida.proximoVencimento}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Taxa de Juros</p>
            <p className="font-medium">{divida.juros}% a.a.</p>
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <VisualizarDividaModal 
            divida={divida}
            onPagamentoRegistrado={onPagamentoRegistrado}
          >
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              Detalhes
            </Button>
          </VisualizarDividaModal>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(divida.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dividas() {
  const [dividas, setDividas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dividaToDelete, setDividaToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDividas();
  }, []);

  const loadDividas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca dívidas da tabela principal
      const { data: dividasData, error: dividasError } = await supabase
        .from('dividas')
        .select('*')
        .eq('user_id', user.id);

      // Busca dívidas da declaração de IRPF
      const { data: dividasIRPF, error: irpfError } = await supabase
        .from('dividas_irpf')
        .select('*')
        .eq('user_id', user.id);

      if (dividasError || irpfError) {
        console.error('Error loading dividas:', dividasError || irpfError);
        setLoading(false);
        return;
      }

      // Combina e formata os dados
      const dividasCombinadas = [
        ...(dividasData || []).map(d => ({
          id: d.id,
          tipo: d.tipo,
          credor: d.credor,
          valorTotal: Number(d.valor_original),
          valorPendente: Number(d.saldo_devedor),
          valorPrestacao: Number(d.valor_parcela),
          vencimento: d.data_vencimento || 'Não informado',
          proximoVencimento: d.data_vencimento || 'Não informado',
          parcelas: d.numero_parcelas,
          parcelasPagas: d.parcelas_pagas,
          juros: Number(d.taxa_juros) || 0,
          status: d.status,
          categoria: d.tipo
        })),
        ...(dividasIRPF || []).map(d => ({
          id: d.id,
          tipo: 'Dívida Importada IRPF',
          credor: d.credor,
          valorTotal: Number(d.valor_ano_atual),
          valorPendente: Number(d.valor_ano_atual),
          valorPrestacao: 0,
          vencimento: 'Não informado',
          proximoVencimento: 'Não informado',
          parcelas: 1,
          parcelasPagas: 0,
          juros: 0,
          status: 'Ativo',
          categoria: 'Outro'
        }))
      ];

      setDividas(dividasCombinadas);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dividas:', error);
      setLoading(false);
    }
  };

  const handlePagamentoRegistrado = async (dividaId: string, valorPago: number, categoria: string) => {
    try {
      const divida = dividas.find(d => d.id === dividaId);
      if (!divida) return;

      const novoPendente = Math.max(0, divida.valorPendente - valorPago);
      const parcelasPagasAdicionais = Math.floor(valorPago / divida.valorPrestacao);
      const novasParcelasPagas = Math.min(divida.parcelas, divida.parcelasPagas + parcelasPagasAdicionais);
      const novoStatus = novoPendente <= 0 ? "Quitado" : divida.status;

      // Atualizar no Supabase
      const { error } = await supabase
        .from('dividas')
        .update({
          saldo_devedor: novoPendente,
          parcelas_pagas: novasParcelasPagas,
          status: novoStatus
        })
        .eq('id', dividaId);

      if (error) throw error;

      // Atualiza estado local
      setDividas(prev => prev.map(d => {
        if (d.id === dividaId) {
          return {
            ...d,
            valorPendente: novoPendente,
            parcelasPagas: novasParcelasPagas,
            status: novoStatus
          };
        }
        return d;
      }));

      toast({
        title: "Pagamento registrado!",
        description: "O pagamento foi salvo permanentemente.",
      });
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível registrar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleView = (id: string) => {
    console.log("Visualizar dívida:", id);
  };

  const handleDelete = (id: string) => {
    setDividaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (dividaToDelete) {
      try {
        // Deletar do Supabase
        const { error } = await supabase
          .from('dividas')
          .delete()
          .eq('id', dividaToDelete);

        if (error) throw error;

        // Atualiza estado local
        setDividas(prev => prev.filter(d => d.id !== dividaToDelete));
        toast({
          title: "Dívida excluída",
          description: "A dívida foi removida permanentemente.",
        });
      } catch (error: any) {
        console.error('Erro ao excluir dívida:', error);
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir a dívida. Tente novamente.",
          variant: "destructive"
        });
      }
    }
    setDeleteDialogOpen(false);
    setDividaToDelete(null);
  };

  const handleAddDebt = (novaDivida: any) => {
    setDividas(prev => [...prev, novaDivida]);
  };

  // Calculations
  const totalPendente = dividas.reduce((sum, divida) => sum + divida.valorPendente, 0);
  const totalPrestacoes = dividas.reduce((sum, divida) => sum + divida.valorPrestacao, 0);
  const dividasEmDia = dividas.filter(d => d.status === "Em dia").length;
  const dividasVencidas = dividas.filter(d => d.status === "Vencido" || d.status === "Atrasado").length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dívidas</h1>
            <p className="text-muted-foreground">
              Gerencie todos os seus empréstimos e financiamentos
            </p>
          </div>
          <NovaDividaModal onAdd={handleAddDebt}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Dívida
            </Button>
          </NovaDividaModal>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prestações/Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPrestacoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Dia</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dividasEmDia}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {dividasVencidas}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debt Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dividas.map((divida) => (
            <DebtCard
              key={divida.id}
              divida={divida}
              onView={handleView}
              onDelete={handleDelete}
              onPagamentoRegistrado={handlePagamentoRegistrado}
            />
          ))}
        </div>

        {dividas.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">Nenhuma dívida cadastrada</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Comece adicionando uma nova dívida ou financiamento.
            </p>
            <div className="mt-6">
              <NovaDividaModal onAdd={handleAddDebt}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Dívida
                </Button>
              </NovaDividaModal>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta dívida? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}