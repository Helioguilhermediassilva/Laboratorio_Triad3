import { useState, useEffect } from "react";
import { ScrollText, Plus, Eye, Edit, Trash2, Calendar, Shield, Users, FileText } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import NovoTestamentoModal from "@/components/NovoTestamentoModal";
import VisualizarTestamentoModal from "@/components/VisualizarTestamentoModal";
import EditarTestamentoModal from "@/components/EditarTestamentoModal";
import { supabase } from "@/integrations/supabase/client";

interface TestamentCardProps {
  testamento: any;
  onView: (id: string) => void;
  onEdit: (testamento: any) => void;
  onDelete: (id: string) => void;
}

function TestamentCard({ testamento, onView, onEdit, onDelete }: TestamentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo": return "bg-green-500";
      case "Rascunho": return "bg-yellow-500";
      case "Revogado": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Ativo": return "default";
      case "Rascunho": return "secondary";
      case "Revogado": return "destructive";
      default: return "outline";
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "Testamento Público": return "bg-blue-100 text-blue-800";
      case "Testamento Particular": return "bg-purple-100 text-purple-800";
      case "Codicilo": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(testamento.status)}`} />
            <div>
              <CardTitle className="text-lg">{testamento.titulo}</CardTitle>
              <p className="text-sm text-muted-foreground">{testamento.testamenteiro}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Badge className={getTipoColor(testamento.tipo)}>
              {testamento.tipo}
            </Badge>
            <Badge variant={getStatusVariant(testamento.status)}>
              {testamento.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Data de Elaboração</p>
            <p className="font-medium">{testamento.dataElaboracao}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Última Atualização</p>
            <p className="font-medium">{testamento.ultimaAtualizacao}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Cartório</p>
            <p className="text-sm font-medium">{testamento.cartorio}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Beneficiários ({testamento.beneficiarios.length})</p>
          <div className="flex flex-wrap gap-1">
            {testamento.beneficiarios.slice(0, 2).map((beneficiario, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {beneficiario}
              </Badge>
            ))}
            {testamento.beneficiarios.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{testamento.beneficiarios.length - 2} mais
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Bens Incluídos ({testamento.bensIncluidos.length})</p>
          <div className="text-xs text-muted-foreground">
            {testamento.bensIncluidos.slice(0, 2).map((bem, index) => (
              <div key={index}>• {bem}</div>
            ))}
            {testamento.bensIncluidos.length > 2 && (
              <div>• +{testamento.bensIncluidos.length - 2} outros bens</div>
            )}
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <VisualizarTestamentoModal testamento={testamento}>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              Visualizar
            </Button>
          </VisualizarTestamentoModal>
          <EditarTestamentoModal testamento={testamento} onEdit={onEdit}>
            <Button
              size="sm"
              variant="outline"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </EditarTestamentoModal>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(testamento.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Testamento() {
  const [testamentos, setTestamentos] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testamentoToDelete, setTestamentoToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTestamentos();
  }, []);

  const loadTestamentos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('testamentos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading testamentos:', error);
      return;
    }

    // Transform data to match expected format
    const transformed = (data || []).map((t: any) => ({
      ...t,
      dataElaboracao: new Date(t.data_elaboracao).toLocaleDateString('pt-BR'),
      ultimaAtualizacao: new Date(t.updated_at).toLocaleDateString('pt-BR'),
      testamenteiro: t.titulo,
      beneficiarios: [],
      bensIncluidos: []
    }));

    setTestamentos(transformed);
  };

  const handleView = (id: string) => {
    console.log("Visualizar testamento:", id);
  };

  const handleEdit = (testamentoAtualizado: any) => {
    loadTestamentos();
  };

  const handleDelete = (id: string) => {
    setTestamentoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (testamentoToDelete) {
      const { error } = await supabase
        .from('testamentos')
        .delete()
        .eq('id', testamentoToDelete);

      if (!error) {
        loadTestamentos();
        toast({
          title: "Testamento excluído",
          description: "O testamento foi removido com sucesso.",
        });
      }
    }
    setDeleteDialogOpen(false);
    setTestamentoToDelete(null);
  };

  const handleAddTestament = (novoTestamento: any) => {
    loadTestamentos();
  };

  // Calculations
  const testamentosAtivos = testamentos.filter(t => t.status === "Vigente").length;
  const testamentosRascunho = testamentos.filter(t => t.status === "Rascunho").length;
  const totalBeneficiarios = 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Testamento</h1>
            <p className="text-muted-foreground">
              Gerencie seus documentos testamentários e sucessão
            </p>
          </div>
          <NovoTestamentoModal onAdd={handleAddTestament}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Testamento
            </Button>
          </NovoTestamentoModal>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <Shield className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Importante: Consultoria Jurídica Recomendada
              </p>
              <p className="mt-1 text-blue-700 dark:text-blue-300">
                Este sistema auxilia na organização de informações testamentárias. 
                Recomendamos sempre consultar um advogado especializado em direito sucessório 
                para elaboração e registro oficial de testamentos.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Testamentos Ativos</CardTitle>
              <ScrollText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {testamentosAtivos}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Rascunho</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {testamentosRascunho}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Beneficiários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalBeneficiarios}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {testamentos.length > 0 ? testamentos[0].ultimaAtualizacao : "-"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Testament Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {testamentos.map((testamento) => (
            <TestamentCard
              key={testamento.id}
              testamento={testamento}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {testamentos.length === 0 && (
          <div className="text-center py-12">
            <ScrollText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">Nenhum testamento cadastrado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Comece organizando seus documentos testamentários.
            </p>
            <div className="mt-6">
              <NovoTestamentoModal onAdd={handleAddTestament}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Testamento
                </Button>
              </NovoTestamentoModal>
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
              Tem certeza que deseja excluir este testamento? Esta ação não pode ser desfeita.
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