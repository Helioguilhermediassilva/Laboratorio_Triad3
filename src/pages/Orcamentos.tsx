import { useState, useEffect } from "react";
import { Calculator, TrendingUp, TrendingDown, DollarSign, Target, Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import NovoOrcamentoModal from "@/components/NovoOrcamentoModal";
import NovaMetaModal from "@/components/NovaMetaModal";
import { supabase } from "@/integrations/supabase/client";

const MetaCard = ({ meta }: { meta: any }) => {
  const percentual = (meta.valorAtual / meta.valorMeta) * 100;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">{meta.nome}</h3>
          <Badge variant="outline">{meta.prazo}</Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Meta</span>
            <span>{meta.valorMeta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Atual</span>
            <span>{meta.valorAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          
          <Progress value={percentual} className="h-2" />
          
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{percentual.toFixed(1)}% alcançado</span>
            <span className="text-muted-foreground">
              Faltam {(meta.valorMeta - meta.valorAtual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [novoOrcamentoOpen, setNovoOrcamentoOpen] = useState(false);
  const [novaMetaOpen, setNovaMetaOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrcamentos();
    loadMetas();
  }, []);

  const loadOrcamentos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading orcamentos:', error);
      return;
    }

    setOrcamentos(data || []);
  };

  const loadMetas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('metas_financeiras')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading metas:', error);
      return;
    }

    setMetas(data || []);
  };
  
  const totalPrevisto = orcamentos.reduce((sum, o) => sum + Number(o.valor_planejado), 0);
  const totalRealizado = orcamentos.reduce((sum, o) => sum + Number(o.valor_gasto), 0);
  const percentualGeral = totalPrevisto > 0 ? (totalRealizado / totalPrevisto) * 100 : 0;
  const saldoGeral = totalPrevisto - totalRealizado;

  const handleOrcamentoAdicionado = (novoOrcamento: any) => {
    loadOrcamentos();
    toast({
      title: "Orçamento criado!",
      description: "O orçamento foi criado com sucesso."
    });
  };

  const handleMetaAdicionada = (novaMeta: any) => {
    loadMetas();
    toast({
      title: "Meta criada!",
      description: "A meta foi criada com sucesso."
    });
  };
  
  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Orçamentos e Metas
          </h1>
          <p className="text-muted-foreground">
            Planeje e acompanhe seus gastos e objetivos financeiros
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Calculator className="h-4 w-4 mr-2" />
                Orçamento Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPrevisto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Gasto Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalRealizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-sm text-muted-foreground">
                {percentualGeral.toFixed(1)}% do previsto
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Saldo Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {saldoGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Metas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metas.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orcamento" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
            <TabsTrigger value="metas">Metas</TabsTrigger>
          </TabsList>

          <TabsContent value="orcamento" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Categorias do Orçamento</h2>
              <Button onClick={() => setNovoOrcamentoOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Orçamento
              </Button>
            </div>
            
            {orcamentos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum orçamento cadastrado ainda
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orcamentos.map((orcamento) => (
                  <Card key={orcamento.id}>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2">{orcamento.categoria}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Planejado</span>
                          <span>{Number(orcamento.valor_planejado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Gasto</span>
                          <span>{Number(orcamento.valor_gasto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <Progress value={(Number(orcamento.valor_gasto) / Number(orcamento.valor_planejado)) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="metas" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Metas Financeiras</h2>
              <Button onClick={() => setNovaMetaOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Meta
              </Button>
            </div>
            
            {metas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma meta financeira cadastrada ainda
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {metas.map((meta) => {
                  const metaFormatted = {
                    nome: meta.titulo,
                    valorMeta: Number(meta.valor_objetivo),
                    valorAtual: Number(meta.valor_atual),
                    prazo: new Date(meta.data_objetivo).toLocaleDateString('pt-BR')
                  };
                  return <MetaCard key={meta.id} meta={metaFormatted} />;
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <NovoOrcamentoModal 
          open={novoOrcamentoOpen}
          onOpenChange={setNovoOrcamentoOpen}
          onOrcamentoAdicionado={handleOrcamentoAdicionado}
        />
        
        <NovaMetaModal 
          open={novaMetaOpen}
          onOpenChange={setNovaMetaOpen}
          onMetaAdicionada={handleMetaAdicionada}
        />
      </div>
    </Layout>
  );
}
