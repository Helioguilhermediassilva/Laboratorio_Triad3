import { useState, useEffect } from "react";
import { Shield, Plus, Eye, Trash2, Calendar, DollarSign, TrendingUp, Clock, Edit } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import NovoPlanoPrevidenciaModal from "@/components/NovoPlanoPrevidenciaModal";
import VisualizarPlanoModal from "@/components/VisualizarPlanoModal";
import { EditarPlanoPrevidenciaModal } from "@/components/EditarPlanoPrevidenciaModal";
import { supabase } from "@/integrations/supabase/client";

interface PensionCardProps {
  plano: any;
  onView: (id: string) => void;
  onUpdate: (plano: any) => void;
  onDelete: (id: string) => void;
}

function PensionCard({ plano, onView, onUpdate, onDelete }: PensionCardProps) {
  const idadeAtual = 45; // Default age
  const beneficiarioIdeal = plano.idade_resgate || 65;
  const anosParaBeneficio = beneficiarioIdeal - idadeAtual;
  const progressoIdade = (idadeAtual / beneficiarioIdeal) * 100;
  
  const status = plano.ativo ? "Ativo" : "Suspenso";
  
  // Transform database data to modal format
  const planoFormatado = {
    id: plano.id,
    tipo: plano.tipo || '',
    produto: plano.nome || '',
    instituicao: plano.instituicao || '',
    valorAcumulado: Number(plano.valor_acumulado) || 0,
    aportesMensais: Number(plano.contribuicao_mensal) || 0,
    dataContratacao: new Date(plano.data_inicio).toLocaleDateString('pt-BR'),
    proximaContribuicao: plano.ativo ? new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('pt-BR') : '-',
    rentabilidadeAno: Number(plano.rentabilidade_acumulada) || 0,
    taxaAdministracao: Number(plano.taxa_administracao) || 0,
    taxaCarregamento: 0, // Not available in database
    beneficiarioIdeal: beneficiarioIdeal,
    idadeAtual: idadeAtual,
    status: status,
    categoria: plano.tipo || ''
  };
  
  const getStatusColor = (ativo: boolean) => {
    return ativo ? "bg-green-500" : "bg-yellow-500";
  };

  const getStatusVariant = (ativo: boolean) => {
    return ativo ? "default" : "secondary";
  };

  const getCategoryColor = (tipo: string) => {
    switch (tipo) {
      case "PGBL": return "bg-blue-100 text-blue-800";
      case "VGBL": return "bg-green-100 text-green-800";
      case "FAPI": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(plano.ativo)}`} />
            <div>
              <CardTitle className="text-lg">{plano.nome}</CardTitle>
              <p className="text-sm text-muted-foreground">{plano.instituicao}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Badge className={getCategoryColor(plano.tipo)}>
              {plano.tipo}
            </Badge>
            <Badge variant={getStatusVariant(plano.ativo)}>
              {status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Valor Acumulado</p>
            <p className="font-semibold text-green-600 text-lg">
              {Number(plano.valor_acumulado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Aporte Mensal</p>
            <p className="font-semibold">
              {plano.contribuicao_mensal > 0 
                ? Number(plano.contribuicao_mensal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : "Suspenso"
              }
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso para benefício</span>
            <span>{idadeAtual} / {beneficiarioIdeal} anos</span>
          </div>
          <Progress value={progressoIdade} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {anosParaBeneficio > 0 ? `${anosParaBeneficio} anos restantes` : "Elegível para benefício"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Rentabilidade (Ano)</p>
            <p className="font-medium text-green-600">+{Number(plano.rentabilidade_acumulada || 0).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Taxa Admin.</p>
            <p className="font-medium">{Number(plano.taxa_administracao || 0).toFixed(1)}% a.a.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Data Contratação</p>
            <p className="font-medium">{new Date(plano.data_inicio).toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Próxima Contribuição</p>
            <p className="font-medium">{plano.ativo ? new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('pt-BR') : '-'}</p>
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <VisualizarPlanoModal plano={planoFormatado}>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              Detalhes
            </Button>
          </VisualizarPlanoModal>
          <EditarPlanoPrevidenciaModal plano={plano} onUpdate={onUpdate}>
            <Button
              size="sm"
              variant="outline"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </EditarPlanoPrevidenciaModal>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(plano.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Previdencia() {
  const [planos, setPlanos] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planoToDelete, setPlanoToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPlanos();
  }, []);

  const loadPlanos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('planos_previdencia')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading planos:', error);
      return;
    }

    setPlanos(data || []);
  };

  const handleView = (id: string) => {
    console.log("Visualizar plano:", id);
  };

  const handleUpdate = async (updatedPlano: any) => {
    const { error } = await supabase
      .from('planos_previdencia')
      .update({
        nome: updatedPlano.nome,
        tipo: updatedPlano.tipo,
        instituicao: updatedPlano.instituicao,
        valor_acumulado: updatedPlano.valor_acumulado,
        contribuicao_mensal: updatedPlano.contribuicao_mensal,
        data_inicio: updatedPlano.data_inicio,
        idade_resgate: updatedPlano.idade_resgate,
        taxa_administracao: updatedPlano.taxa_administracao,
        rentabilidade_acumulada: updatedPlano.rentabilidade_acumulada,
        ativo: updatedPlano.ativo,
      })
      .eq('id', updatedPlano.id);

    if (!error) {
      setPlanos(prev => prev.map(p => p.id === updatedPlano.id ? updatedPlano : p));
      toast({
        title: "Plano atualizado",
        description: "O plano previdenciário foi atualizado com sucesso.",
      });
    } else {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o plano.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    setPlanoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (planoToDelete) {
      const { error } = await supabase
        .from('planos_previdencia')
        .delete()
        .eq('id', planoToDelete);

      if (!error) {
        setPlanos(prev => prev.filter(p => p.id !== planoToDelete));
        toast({
          title: "Plano excluído",
          description: "O plano previdenciário foi removido com sucesso.",
        });
      }
    }
    setDeleteDialogOpen(false);
    setPlanoToDelete(null);
  };

  const handleAddPlan = (novoPlano: any) => {
    loadPlanos();
  };

  // Calculations
  const totalAcumulado = planos.reduce((sum, plano) => sum + Number(plano.valor_acumulado), 0);
  const totalAportesMensais = planos.reduce((sum, plano) => sum + Number(plano.contribuicao_mensal), 0);
  const planosAtivos = planos.filter(p => p.ativo).length;
  const mediaRentabilidade = planos.length > 0 ? planos.reduce((sum, plano) => sum + Number(plano.rentabilidade_acumulada || 0), 0) / planos.length : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Previdência</h1>
            <p className="text-muted-foreground">
              Gerencie seus planos previdenciários e aposentadoria
            </p>
          </div>
          <NovoPlanoPrevidenciaModal onAdd={handleAddPlan}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Button>
          </NovoPlanoPrevidenciaModal>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Acumulado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aportes/Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalAportesMensais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {planosAtivos}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rentab. Média</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{mediaRentabilidade.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pension Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {planos.map((plano) => (
            <PensionCard
              key={plano.id}
              plano={plano}
              onView={handleView}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {planos.length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">Nenhum plano previdenciário cadastrado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Comece adicionando um novo plano de previdência.
            </p>
            <div className="mt-6">
              <NovoPlanoPrevidenciaModal onAdd={handleAddPlan}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Plano
                </Button>
              </NovoPlanoPrevidenciaModal>
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
              Tem certeza que deseja excluir este plano previdenciário? Esta ação não pode ser desfeita.
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