import { useState } from "react";
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

// Mock data for debts
const mockDividas = [
  {
    id: 1,
    tipo: "Financiamento Imobiliário",
    credor: "Banco do Brasil",
    valorTotal: 350000,
    valorPendente: 287500,
    valorPrestacao: 2890,
    vencimento: "15/02/2024",
    proximoVencimento: "15/01/2024",
    parcelas: 120,
    parcelasPagas: 32,
    juros: 8.5,
    status: "Em dia",
    categoria: "Imóvel"
  },
  {
    id: 2,
    tipo: "Financiamento Veicular",
    credor: "Santander",
    valorTotal: 85000,
    valorPendente: 45600,
    valorPrestacao: 1245,
    vencimento: "10/02/2024",
    proximoVencimento: "10/01/2024",
    parcelas: 60,
    parcelasPagas: 36,
    juros: 12.3,
    status: "Em dia",
    categoria: "Veículo"
  },
  {
    id: 3,
    tipo: "Empréstimo Pessoal",
    credor: "Nubank",
    valorTotal: 25000,
    valorPendente: 18750,
    valorPrestacao: 890,
    vencimento: "05/02/2024",
    proximoVencimento: "05/01/2024",
    parcelas: 36,
    parcelasPagas: 12,
    juros: 15.2,
    status: "Atrasado",
    categoria: "Pessoal"
  },
  {
    id: 4,
    tipo: "Cartão de Crédito",
    credor: "Itaú",
    valorTotal: 8500,
    valorPendente: 8500,
    valorPrestacao: 850,
    vencimento: "25/01/2024",
    proximoVencimento: "25/01/2024",
    parcelas: 12,
    parcelasPagas: 2,
    juros: 18.9,
    status: "Vencido",
    categoria: "Cartão"
  }
];

interface DebtCardProps {
  divida: typeof mockDividas[0];
  onView: (id: number) => void;
  onDelete: (id: number) => void;
}

function DebtCard({ divida, onView, onDelete }: DebtCardProps) {
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
          <VisualizarDividaModal divida={divida}>
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
  const [dividas, setDividas] = useState(mockDividas);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dividaToDelete, setDividaToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const handleView = (id: number) => {
    console.log("Visualizar dívida:", id);
  };

  const handleDelete = (id: number) => {
    setDividaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (dividaToDelete) {
      setDividas(prev => prev.filter(d => d.id !== dividaToDelete));
      toast({
        title: "Dívida excluída",
        description: "A dívida foi removida com sucesso.",
      });
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