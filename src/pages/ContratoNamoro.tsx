import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Eye, Edit, Trash2, FileText, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Layout from "@/components/Layout";
import NovoContratoNamoroModal from "@/components/NovoContratoNamoroModal";
import EditarContratoNamoroModal from "@/components/EditarContratoNamoroModal";
import VisualizarContratoNamoroModal from "@/components/VisualizarContratoNamoroModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContratoNamoro {
  id: string;
  titulo: string;
  parte_1_nome: string;
  parte_1_cpf: string;
  parte_1_endereco?: string;
  parte_2_nome: string;
  parte_2_cpf: string;
  parte_2_endereco?: string;
  regime_bens: string;
  data_inicio: string;
  data_elaboracao: string;
  deveres_parte_1?: string;
  deveres_parte_2?: string;
  direitos_parte_1?: string;
  direitos_parte_2?: string;
  clausulas_adicionais?: string;
  testemunha_1_nome?: string;
  testemunha_1_cpf?: string;
  testemunha_2_nome?: string;
  testemunha_2_cpf?: string;
  status: string;
  observacoes?: string;
  created_at: string;
}

export default function ContratoNamoro() {
  const { toast } = useToast();
  const [contratos, setContratos] = useState<ContratoNamoro[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<ContratoNamoro | null>(null);
  const [contratoToDelete, setContratoToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadContratos();
  }, []);

  const loadContratos = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para acessar esta página",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('contratos_namoro')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContratos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar contratos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contratoToDelete) return;

    try {
      const { error } = await supabase
        .from('contratos_namoro')
        .delete()
        .eq('id', contratoToDelete);

      if (error) throw error;

      toast({
        title: "Contrato excluído",
        description: "O contrato foi excluído com sucesso"
      });

      loadContratos();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir contrato",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setContratoToDelete(null);
    }
  };

  const handleView = (contrato: ContratoNamoro) => {
    setSelectedContrato(contrato);
    setIsViewModalOpen(true);
  };

  const handleEdit = (contrato: ContratoNamoro) => {
    setSelectedContrato(contrato);
    setIsEditModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" } = {
      "Vigente": "default",
      "Rescindido": "destructive",
      "Suspenso": "secondary"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Contrato de Namoro</h1>
            <p className="text-muted-foreground">
              Gerencie contratos de namoro com definição de regime de bens e direitos
            </p>
          </div>
        </div>
        <Button onClick={() => setIsNovoModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando contratos...</p>
        </div>
      ) : contratos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum contrato cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro contrato de namoro
            </p>
            <Button onClick={() => setIsNovoModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Contrato
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contratos.map((contrato) => (
            <Card key={contrato.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{contrato.titulo}</CardTitle>
                    <CardDescription className="mt-1">
                      {format(new Date(contrato.data_elaboracao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </CardDescription>
                  </div>
                  {getStatusBadge(contrato.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold text-muted-foreground">Parte 1:</p>
                    <p>{contrato.parte_1_nome}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Parte 2:</p>
                    <p>{contrato.parte_2_nome}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Regime de Bens:</p>
                    <p>{contrato.regime_bens}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Início do Namoro:</p>
                    <p>{format(new Date(contrato.data_inicio), "dd/MM/yyyy")}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleView(contrato)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(contrato)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setContratoToDelete(contrato.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NovoContratoNamoroModal
        open={isNovoModalOpen}
        onOpenChange={setIsNovoModalOpen}
        onSuccess={loadContratos}
      />

      {selectedContrato && (
        <>
          <EditarContratoNamoroModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            contrato={selectedContrato}
            onSuccess={loadContratos}
          />
          <VisualizarContratoNamoroModal
            open={isViewModalOpen}
            onOpenChange={setIsViewModalOpen}
            contrato={selectedContrato}
          />
        </>
      )}

      <AlertDialog open={!!contratoToDelete} onOpenChange={() => setContratoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </Layout>
  );
}
