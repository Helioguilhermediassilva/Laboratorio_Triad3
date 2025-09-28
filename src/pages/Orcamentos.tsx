import { useState } from "react";
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

// Mock data - Orçamentos iniciais
const orcamentosIniciais = [
  {
    id: "1",
    nome: "Orçamento Familiar 2024",
    periodo: "Anual",
    totalPrevisto: 180000,
    totalRealizado: 142500,
    categorias: [
      { nome: "Moradia", previsto: 48000, realizado: 45200, cor: "#3b82f6" },
      { nome: "Alimentação", previsto: 24000, realizado: 26800, cor: "#ef4444" },
      { nome: "Transporte", previsto: 18000, realizado: 15600, cor: "#10b981" },
      { nome: "Saúde", previsto: 15000, realizado: 12300, cor: "#f59e0b" },
      { nome: "Educação", previsto: 12000, realizado: 11800, cor: "#8b5cf6" },
      { nome: "Lazer", previsto: 9600, realizado: 8400, cor: "#ec4899" },
      { nome: "Investimentos", previsto: 36000, realizado: 22400, cor: "#06b6d4" },
      { nome: "Outros", previsto: 17400, realizado: 15000, cor: "#84cc16" }
    ]
  }
];

const metasIniciais = [
  { id: "1", nome: "Reserva de Emergência", valorMeta: 50000, valorAtual: 38000, prazo: "Dez 2024" },
  { id: "2", nome: "Viagem Europa", valorMeta: 25000, valorAtual: 12000, prazo: "Jun 2025" },
  { id: "3", nome: "Carro Novo", valorMeta: 80000, valorAtual: 45000, prazo: "Mar 2025" },
  { id: "4", nome: "Aposentadoria", valorMeta: 1000000, valorAtual: 285000, prazo: "2040" }
];

const OrcamentoCard = ({ categoria }: { categoria: any }) => {
  const percentualRealizado = (categoria.realizado / categoria.previsto) * 100;
  const isOver = categoria.realizado > categoria.previsto;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">{categoria.nome}</h3>
          <Badge variant={isOver ? "destructive" : "secondary"}>
            {percentualRealizado.toFixed(1)}%
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Previsto</span>
            <span>{categoria.previsto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Realizado</span>
            <span className={isOver ? "text-red-600" : "text-foreground"}>
              {categoria.realizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          
          <Progress 
            value={Math.min(percentualRealizado, 100)} 
            className="h-2"
            style={{
              backgroundColor: `${categoria.cor}20`,
            }}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Saldo</span>
            <span className={isOver ? "text-red-600" : "text-green-600"}>
              {(categoria.previsto - categoria.realizado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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
  const [orcamentos, setOrcamentos] = useState(orcamentosIniciais);
  const [metas, setMetas] = useState(metasIniciais);
  const [novoOrcamentoOpen, setNovoOrcamentoOpen] = useState(false);
  const [novaMetaOpen, setNovaMetaOpen] = useState(false);
  const { toast } = useToast();
  
  const orcamento = orcamentos[0];
  const percentualGeral = (orcamento.totalRealizado / orcamento.totalPrevisto) * 100;
  const saldoGeral = orcamento.totalPrevisto - orcamento.totalRealizado;

  const handleOrcamentoAdicionado = (novoOrcamento: any) => {
    setOrcamentos(prev => [...prev, novoOrcamento]);
    toast({
      title: "Orçamento criado!",
      description: "O orçamento foi criado com sucesso."
    });
  };

  const handleMetaAdicionada = (novaMeta: any) => {
    setMetas(prev => [...prev, novaMeta]);
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
                {orcamento.totalPrevisto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                {orcamento.totalRealizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orcamento.categorias.map((categoria, index) => (
                <OrcamentoCard key={index} categoria={categoria} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="metas" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Metas Financeiras</h2>
              <Button onClick={() => setNovaMetaOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Meta
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {metas.map((meta, index) => (
                <MetaCard key={index} meta={meta} />
              ))}
            </div>
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