import { useState } from "react";
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

// Mock data for testament documents
const mockTestamentos = [
  {
    id: 1,
    titulo: "Testamento Principal",
    tipo: "Testamento Público",
    dataElaboracao: "15/03/2023",
    ultimaAtualizacao: "22/11/2024",
    cartorio: "1º Tabelionato de Notas - São Paulo",
    testamenteiro: "Maria Silva Santos",
    status: "Ativo",
    beneficiarios: ["João Carlos Silva", "Ana Maria Silva", "Pedro Silva Santos"],
    bensIncluidos: [
      "Apartamento - Rua das Flores, 123",
      "Casa de Campo - Campos do Jordão",
      "Conta Corrente - Banco do Brasil",
      "Investimentos - CDB Premium"
    ],
    observacoes: "Documento registrado em cartório com todas as formalidades legais."
  },
  {
    id: 2,
    titulo: "Codicilo - Alterações",
    tipo: "Codicilo",
    dataElaboracao: "05/08/2024",
    ultimaAtualizacao: "05/08/2024",
    cartorio: "1º Tabelionato de Notas - São Paulo",
    testamenteiro: "Maria Silva Santos",
    status: "Ativo",
    beneficiarios: ["Fundação Criança Esperança", "Instituto Amigos dos Animais"],
    bensIncluidos: [
      "Doação de 10% dos investimentos",
      "Biblioteca pessoal completa"
    ],
    observacoes: "Codicilo para incluir doações beneficentes."
  },
  {
    id: 3,
    titulo: "Testamento Anterior",
    tipo: "Testamento Particular",
    dataElaboracao: "10/01/2020",
    ultimaAtualizacao: "10/01/2020",
    cartorio: "-",
    testamenteiro: "José Antonio Silva",
    status: "Revogado",
    beneficiarios: ["João Carlos Silva", "Ana Maria Silva"],
    bensIncluidos: [
      "Apartamento - Centro da Cidade"
    ],
    observacoes: "Testamento revogado pela criação do testamento público atual."
  }
];

interface TestamentCardProps {
  testamento: typeof mockTestamentos[0];
  onView: (id: number) => void;
  onEdit: (testamento: any) => void;
  onDelete: (id: number) => void;
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
          {testamento.status === "Ativo" && (
            <EditarTestamentoModal testamento={testamento} onEdit={onEdit}>
              <Button
                size="sm"
                variant="outline"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </EditarTestamentoModal>
          )}
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
  const [testamentos, setTestamentos] = useState(mockTestamentos);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testamentoToDelete, setTestamentoToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const handleView = (id: number) => {
    console.log("Visualizar testamento:", id);
  };

  const handleEdit = (testamentoAtualizado: any) => {
    setTestamentos(prev => prev.map(t => t.id === testamentoAtualizado.id ? testamentoAtualizado : t));
  };

  const handleDelete = (id: number) => {
    setTestamentoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (testamentoToDelete) {
      setTestamentos(prev => prev.filter(t => t.id !== testamentoToDelete));
      toast({
        title: "Testamento excluído",
        description: "O testamento foi removido com sucesso.",
      });
    }
    setDeleteDialogOpen(false);
    setTestamentoToDelete(null);
  };

  const handleAddTestament = (novoTestamento: any) => {
    setTestamentos(prev => [...prev, novoTestamento]);
  };

  // Calculations
  const testamentosAtivos = testamentos.filter(t => t.status === "Ativo").length;
  const testamentosRascunho = testamentos.filter(t => t.status === "Rascunho").length;
  const totalBeneficiarios = testamentos
    .filter(t => t.status === "Ativo")
    .reduce((acc, t) => acc + t.beneficiarios.length, 0);

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