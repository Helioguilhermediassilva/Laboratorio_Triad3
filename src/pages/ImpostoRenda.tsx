import { useState, useEffect } from "react";
import { FileText, Calculator, Calendar, TrendingUp, AlertTriangle, Download, Upload, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import NovaDeclaracaoModal from "@/components/NovaDeclaracaoModal";
import AdicionarRendimentoModal from "@/components/AdicionarRendimentoModal";
import AdicionarDespesaModal from "@/components/AdicionarDespesaModal";
import AdicionarLembreteModal from "@/components/AdicionarLembreteModal";
import EditarDeclaracaoModal from "@/components/EditarDeclaracaoModal";
import VisualizarReciboModal from "@/components/VisualizarReciboModal";
import EditarRendimentoModal from "@/components/EditarRendimentoModal";
import ImportarDeclaracaoModal from "@/components/ImportarDeclaracaoModal";
import { supabase } from "@/integrations/supabase/client";

export default function ImpostoRenda() {
  const [anoSelecionado, setAnoSelecionado] = useState(2024);
  const [novaDeclaracaoOpen, setNovaDeclaracaoOpen] = useState(false);
  const [adicionarRendimentoOpen, setAdicionarRendimentoOpen] = useState(false);
  const [adicionarDespesaOpen, setAdicionarDespesaOpen] = useState(false);
  const [adicionarLembreteOpen, setAdicionarLembreteOpen] = useState(false);
  const [editarDeclaracaoOpen, setEditarDeclaracaoOpen] = useState(false);
  const [editarRendimentoOpen, setEditarRendimentoOpen] = useState(false);
  const [visualizarReciboOpen, setVisualizarReciboOpen] = useState(false);
  const [importarDeclaracaoOpen, setImportarDeclaracaoOpen] = useState(false);
  const [deleteDeclarationDialogOpen, setDeleteDeclarationDialogOpen] = useState(false);
  const [declaracaoSelecionada, setDeclaracaoSelecionada] = useState<any>(null);
  const [declarationToDelete, setDeclarationToDelete] = useState<any>(null);
  const [rendimentoSelecionado, setRendimentoSelecionado] = useState<any>(null);
  const [rendimentoIndex, setRendimentoIndex] = useState(-1);
  const [declaracoesList, setDeclaracoesList] = useState<any[]>([]);
  const [rendimentosList, setRendimentosList] = useState<any[]>([]);
  const [prazosList, setPrazosList] = useState<any[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const { toast } = useToast();

  // Load declarations from database
  useEffect(() => {
    loadDeclaracoes();
    loadRendimentos();
  }, []);

  const loadDeclaracoes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('declaracoes_irpf')
        .select('*')
        .eq('user_id', user.id)
        .order('ano', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedDeclaracoes = data.map(d => ({
          id: d.id,
          ano: d.ano,
          status: d.status,
          prazoLimite: d.prazo_limite || `${d.ano}-04-30`,
          recibo: d.recibo,
          valorPagar: Number(d.valor_pagar || 0),
          valorRestituir: Number(d.valor_restituir || 0),
          arquivoOriginal: d.arquivo_original
        }));
        setDeclaracoesList(formattedDeclaracoes);
      }
    } catch (error) {
      console.error('Error loading declarations:', error);
    }
  };

  const loadRendimentos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('rendimentos_irpf')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedRendimentos = data.map(r => ({
          id: r.id,
          fonte: r.fonte_pagadora,
          cnpj: r.cnpj || 'N/A',
          tipo: r.tipo,
          valor: Number(r.valor),
          irrf: Number(r.irrf || 0),
          ano: r.ano
        }));
        setRendimentosList(formattedRendimentos);
      }
    } catch (error) {
      console.error('Error loading rendimentos:', error);
    }
  };
  
  const declaracaoAtual = declaracoesList.length > 0 
    ? (declaracoesList.find(d => d.ano === anoSelecionado) || declaracoesList[0])
    : { ano: anoSelecionado, status: 'Pendente', prazoLimite: `${anoSelecionado}-04-30`, valorPagar: 0, valorRestituir: 0 };
  const rendimentosAno = rendimentosList.filter(r => r.ano === anoSelecionado);
  const totalRendimentos = rendimentosAno.reduce((sum, r) => sum + r.valor, 0);
  const totalIRRF = rendimentosAno.reduce((sum, r) => sum + r.irrf, 0);
  const totalDeducoes = 0;

  const handleEditarDeclaracao = (declaracao: any) => {
    setDeclaracaoSelecionada(declaracao);
    setEditarDeclaracaoOpen(true);
  };

  const handleEditarRendimento = (rendimento: any, index: number) => {
    setRendimentoSelecionado(rendimento);
    setRendimentoIndex(index);
    setEditarRendimentoOpen(true);
  };

  const handleVisualizarRecibo = (declaracao: any) => {
    setDeclaracaoSelecionada(declaracao);
    setVisualizarReciboOpen(true);
  };

  const handleDeclaracaoUpdated = (updatedDeclaracao: any) => {
    setDeclaracoesList(prev => 
      prev.map(d => 
        d.id === declaracaoSelecionada.id 
          ? { ...updatedDeclaracao, id: d.id }
          : d
      )
    );
    
    toast({
      title: "Declaração atualizada!",
      description: "As alterações foram salvas com sucesso."
    });
  };

  const handleRendimentoUpdated = (index: number, updatedRendimento: any) => {
    setRendimentosList(prev => 
      prev.map((r, i) => 
        i === index 
          ? { ...updatedRendimento, id: r.id }
          : r
      )
    );
    
    toast({
      title: "Rendimento atualizado!",
      description: "As alterações foram salvas com sucesso."
    });
  };

  const handleDeclaracaoImportada = async (declaracaoImportada: any) => {
    setDeclaracoesList(prev => [...prev, declaracaoImportada]);
    
    // Reload data from database to get the extracted information
    await loadDeclaracoes();
    await loadRendimentos();
    
    toast({
      title: "Declaração importada!",
      description: "A declaração foi importada e os dados foram categorizados automaticamente."
    });
  };

  const handleDeletarDeclaracao = (declaracao: any) => {
    setDeclarationToDelete(declaracao);
    setDeleteDeclarationDialogOpen(true);
  };

  const confirmDeleteDeclaration = async () => {
    if (!declarationToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all related data for this user
      // 1. Delete rendimentos related to this declaration
      await supabase
        .from('rendimentos_irpf')
        .delete()
        .eq('declaracao_id', declarationToDelete.id);

      // 2. Delete bens e direitos related to this declaration
      await supabase
        .from('bens_direitos_irpf')
        .delete()
        .eq('declaracao_id', declarationToDelete.id);

      // 3. Delete dividas related to this declaration
      await supabase
        .from('dividas_irpf')
        .delete()
        .eq('declaracao_id', declarationToDelete.id);

      // 4. Delete all user financial data (from extraction)
      await supabase.from('bens_imobilizados').delete().eq('user_id', user.id);
      await supabase.from('aplicacoes').delete().eq('user_id', user.id);
      await supabase.from('planos_previdencia').delete().eq('user_id', user.id);
      await supabase.from('contas_bancarias').delete().eq('user_id', user.id);
      await supabase.from('dividas').delete().eq('user_id', user.id);

      // 5. Finally delete the declaration
      const { error } = await supabase
        .from('declaracoes_irpf')
        .delete()
        .eq('id', declarationToDelete.id);

      if (error) throw error;

      setDeclaracoesList(prev => prev.filter(d => d.id !== declarationToDelete.id));
      
      toast({
        title: "Declaração removida com sucesso!",
        description: "Todos os dados financeiros relacionados foram excluídos da Triad3."
      });

      // Reload page data to reflect changes
      await loadDeclaracoes();
      await loadRendimentos();
      
    } catch (error) {
      console.error('Error deleting declaration:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar a declaração e seus dados.",
        variant: "destructive"
      });
    } finally {
      setDeleteDeclarationDialogOpen(false);
      setDeclarationToDelete(null);
    }
  };

  const formatCurrency = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const handleDownloadRecibo = (recibo: string) => {
    // Simulate PDF download
    toast({
      title: "Download iniciado",
      description: `Baixando recibo ${recibo}...`
    });
  };

  const handleMarcarFeito = (evento: string, index: number) => {
    setPrazosList(prev => 
      prev.map((prazo, i) => 
        i === index 
          ? { ...prazo, status: "Concluído" }
          : prazo
      )
    );
    
    toast({
      title: "Marcado como feito!",
      description: `${evento} foi marcado como concluído.`
    });
  };

  const handleEditarItem = (tipo: string, item: any) => {
    toast({
      title: "Função em desenvolvimento",
      description: `Edição de ${tipo} será implementada em breve.`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Entregue": return "bg-green-100 text-green-800";
      case "Em Andamento": return "bg-yellow-100 text-yellow-800";
      case "Pendente": return "bg-red-100 text-red-800";
      case "Concluído": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Imposto de Renda
          </h1>
          <p className="text-muted-foreground">
            Organize seus dados e controle suas obrigações fiscais
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Rendimentos {anoSelecionado}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalRendimentos)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Calculator className="h-4 w-4 mr-2" />
                IRRF Retido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalIRRF)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Deduções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalDeducoes)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Status Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(declaracaoAtual.status)}>
                {declaracaoAtual.status}
              </Badge>
              <div className="text-sm text-muted-foreground mt-2">
                Ano: {declaracaoAtual.ano}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="declaracoes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="declaracoes">Declarações</TabsTrigger>
            <TabsTrigger value="rendimentos">Rendimentos</TabsTrigger>
            <TabsTrigger value="deducoes">Deduções</TabsTrigger>
            <TabsTrigger value="prazos">Prazos</TabsTrigger>
          </TabsList>

          <TabsContent value="declaracoes" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Histórico de Declarações</h2>
              <Button 
                variant="outline" 
                onClick={() => setImportarDeclaracaoOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Declaração
              </Button>
            </div>
            
            <div className="grid gap-4">
              {declaracoesList.map((declaracao) => (
                <Card key={declaracao.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold">
                            Declaração {declaracao.ano}
                          </h3>
                          <Badge className={getStatusColor(declaracao.status)}>
                            {declaracao.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Prazo Limite: </span>
                            {formatDate(declaracao.prazoLimite)}
                          </div>
                          {declaracao.recibo && (
                            <div>
                              <span className="text-muted-foreground">Recibo: </span>
                              {declaracao.recibo}
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {declaracao.valorPagar > 0 && (
                            <div className="text-red-600">
                              <span className="text-muted-foreground">A Pagar: </span>
                              {formatCurrency(declaracao.valorPagar)}
                            </div>
                          )}
                          {declaracao.valorRestituir > 0 && (
                            <div className="text-green-600">
                              <span className="text-muted-foreground">A Restituir: </span>
                              {formatCurrency(declaracao.valorRestituir)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditarDeclaracao(declaracao)}
                        >
                          Editar
                        </Button>
                        {declaracao.status === "Entregue" && declaracao.recibo && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVisualizarRecibo(declaracao)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Recibo
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeletarDeclaracao(declaracao)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rendimentos" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Rendimentos {anoSelecionado}</h2>
              <Button onClick={() => setAdicionarRendimentoOpen(true)}>
                Adicionar Rendimento
              </Button>
            </div>
            
            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fonte Pagadora</TableHead>
                      <TableHead>CNPJ/CPF</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">IRRF</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rendimentosAno.map((rendimento, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{rendimento.fonte}</TableCell>
                        <TableCell>{rendimento.cnpj}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{rendimento.tipo}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(rendimento.valor)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(rendimento.irrf)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditarRendimento(rendimento, index)}
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deducoes" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Despesas Dedutíveis</h2>
              <Button onClick={() => setAdicionarDespesaOpen(true)}>
                Adicionar Despesa
              </Button>
            </div>
            
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">Nenhuma despesa cadastrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece adicionando despesas dedutíveis para sua declaração.
              </p>
              <div className="mt-6">
                <Button onClick={() => setAdicionarDespesaOpen(true)}>
                  Adicionar Despesa
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="prazos" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Próximos Prazos</h2>
              <Button onClick={() => setAdicionarLembreteOpen(true)}>
                Adicionar Lembrete
              </Button>
            </div>
            
            <div className="space-y-4">
              {prazosList.map((prazo, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{prazo.evento}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {formatDate(prazo.data)}
                          </span>
                          <span>{prazo.diasRestantes} dias restantes</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(prazo.status)}>
                          {prazo.status}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMarcarFeito(prazo.evento, index)}
                        >
                          Marcar como Feito
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Modals */}
        <NovaDeclaracaoModal 
          open={novaDeclaracaoOpen}
          onOpenChange={setNovaDeclaracaoOpen}
          onDeclaracaoAdded={() => {
            toast({
              title: "Sucesso!",
              description: "Nova declaração criada. Os dados serão atualizados."
            });
          }}
        />
        
        <AdicionarRendimentoModal 
          open={adicionarRendimentoOpen}
          onOpenChange={setAdicionarRendimentoOpen}
          onRendimentoAdded={() => {
            toast({
              title: "Sucesso!",
              description: "Rendimento adicionado. Os cálculos serão atualizados."
            });
          }}
        />
        
        <AdicionarDespesaModal 
          open={adicionarDespesaOpen}
          onOpenChange={setAdicionarDespesaOpen}
          onDespesaAdded={() => {
            toast({
              title: "Sucesso!",
              description: "Despesa adicionada. As deduções serão atualizadas."
            });
          }}
        />
        
        <AdicionarLembreteModal 
          open={adicionarLembreteOpen}
          onOpenChange={setAdicionarLembreteOpen}
          onLembreteAdded={() => {
            toast({
              title: "Sucesso!",
              description: "Lembrete adicionado à sua agenda fiscal."
            });
          }}
        />
        
        <EditarDeclaracaoModal 
          open={editarDeclaracaoOpen}
          onOpenChange={setEditarDeclaracaoOpen}
          declaracao={declaracaoSelecionada}
          onDeclaracaoUpdated={handleDeclaracaoUpdated}
        />
        
        <VisualizarReciboModal 
          open={visualizarReciboOpen}
          onOpenChange={setVisualizarReciboOpen}
          declaracao={declaracaoSelecionada}
        />
        
        <EditarRendimentoModal 
          open={editarRendimentoOpen}
          onOpenChange={setEditarRendimentoOpen}
          rendimento={rendimentoSelecionado}
          rendimentoIndex={rendimentoIndex}
          onRendimentoUpdated={handleRendimentoUpdated}
        />
        
        <ImportarDeclaracaoModal 
          open={importarDeclaracaoOpen}
          onOpenChange={setImportarDeclaracaoOpen}
          onDeclaracaoImportada={handleDeclaracaoImportada}
        />

        {/* Delete Declaration Confirmation Dialog */}
        <AlertDialog open={deleteDeclarationDialogOpen} onOpenChange={setDeleteDeclarationDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Declaração e Dados Financeiros?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Você está prestes a remover a declaração de <strong>{declarationToDelete?.ano}</strong> e <strong>todos os dados financeiros</strong> relacionados a ela na Triad3.
                </p>
                <p className="text-destructive font-medium">
                  Esta ação irá excluir permanentemente:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Rendimentos declarados</li>
                  <li>Bens imobilizados cadastrados</li>
                  <li>Aplicações financeiras</li>
                  <li>Planos de previdência</li>
                  <li>Contas bancárias</li>
                  <li>Dívidas e ônus reais</li>
                </ul>
                <p className="font-medium pt-2">
                  Tem certeza que deseja continuar? Esta ação não pode ser desfeita.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteDeclaration}
                className="bg-destructive hover:bg-destructive/90"
              >
                Sim, remover tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}