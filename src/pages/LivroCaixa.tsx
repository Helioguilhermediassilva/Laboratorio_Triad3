import { useState, useEffect } from "react";
import { BookOpen, ArrowUpCircle, ArrowDownCircle, Calendar, Filter, Plus, Upload, Search } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import NovaTransacaoModal from "@/components/NovaTransacaoModal";
import ImportarLivroCaixaModal from "@/components/ImportarLivroCaixaModal";
import ImportarExtratoModal from "@/components/ImportarExtratoModal";

// Dados de exemplo - Livro Caixa
const transacoesExemplo = [
  {
    id: "1",
    data: "2024-01-15",
    descricao: "Salário - Empresa XYZ",
    categoria: "Salário",
    tipo: "entrada" as const,
    valor: 8500,
    conta: "Conta Corrente Itaú",
    observacoes: "Salário mensal"
  },
  {
    id: "2",
    data: "2024-01-16",
    descricao: "Aluguel Apartamento",
    categoria: "Moradia",
    tipo: "saida" as const,
    valor: 2200,
    conta: "Conta Corrente Itaú",
    observacoes: "Aluguel mensal do apartamento"
  },
  {
    id: "3",
    data: "2024-01-17",
    descricao: "Dividendos PETR4",
    categoria: "Investimentos",
    tipo: "entrada" as const,
    valor: 450,
    conta: "Conta Corrente XP",
    observacoes: "Dividendos ações Petrobras"
  },
  {
    id: "4",
    data: "2024-01-18",
    descricao: "Supermercado Extra",
    categoria: "Alimentação",
    tipo: "saida" as const,
    valor: 380,
    conta: "Cartão de Crédito",
    observacoes: "Compras mensais"
  },
  {
    id: "5",
    data: "2024-01-19",
    descricao: "Freelance - Design",
    categoria: "Freelance",
    tipo: "entrada" as const,
    valor: 1200,
    conta: "Conta Corrente Nubank",
    observacoes: "Projeto de identidade visual"
  }
];

type Transacao = {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  tipo: string;
  valor: number;
  conta: string;
  observacoes: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};

const categorias = [
  "Todas",
  "Salário",
  "Freelance",
  "Investimentos",
  "Vendas",
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Lazer",
  "Outros"
];

const contas = [
  "Todas",
  "Conta Corrente Itaú",
  "Conta Corrente XP",
  "Conta Corrente Nubank",
  "Cartão de Crédito",
  "Cartão de Débito",
  "PayPal"
];

export default function LivroCaixa() {
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroConta, setFiltroConta] = useState("Todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [termoBusca, setTermoBusca] = useState("");
  const [transacoes, setTransacoes] = useState<Transacao[]>(transacoesExemplo);
  const [loading, setLoading] = useState(false);
  const [novaTransacaoOpen, setNovaTransacaoOpen] = useState(false);
  const [importarOpen, setImportarOpen] = useState(false);
  const [importarExtratoOpen, setImportarExtratoOpen] = useState(false);
  const { toast } = useToast();

  const handleTransacaoAdded = () => {
    toast({
      title: "Transação adicionada!",
      description: "A transação foi adicionada com sucesso."
    });
  };

  const handleTransacoesImported = () => {
    toast({
      title: "Transações importadas!",
      description: "As transações foram importadas com sucesso."
    });
  };

  const handleExtratoImportado = () => {
    toast({
      title: "Extrato importado!",
      description: "As transações do extrato foram importadas com sucesso."
    });
  };

  const transacoesFiltradas = transacoes.filter(transacao => {
    const matchCategoria = filtroCategoria === "Todas" || transacao.categoria === filtroCategoria;
    const matchConta = filtroConta === "Todas" || transacao.conta === filtroConta;
    const matchTipo = filtroTipo === "todos" || transacao.tipo === filtroTipo;
    const matchBusca = transacao.descricao.toLowerCase().includes(termoBusca.toLowerCase()) ||
                      (transacao.observacoes && transacao.observacoes.toLowerCase().includes(termoBusca.toLowerCase()));
    
    return matchCategoria && matchConta && matchTipo && matchBusca;
  });

  const totalEntradas = transacoes
    .filter(t => t.tipo === "entrada")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalSaidas = transacoes
    .filter(t => t.tipo === "saida")
    .reduce((sum, t) => sum + t.valor, 0);

  const saldo = totalEntradas - totalSaidas;

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
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Livro Caixa
          </h1>
          <p className="text-muted-foreground">
            Controle detalhado de todas as suas receitas e despesas
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <ArrowUpCircle className="h-4 w-4 mr-2 text-green-500" />
                Total Entradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalEntradas)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <ArrowDownCircle className="h-4 w-4 mr-2 text-red-500" />
                Total Saídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalSaidas)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(saldo)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 flex gap-2">
                <Input
                  placeholder="Buscar transação..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                />
                <Button variant="outline" size="icon" title="Buscar">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroConta} onValueChange={setFiltroConta}>
                <SelectTrigger>
                  <SelectValue placeholder="Conta" />
                </SelectTrigger>
                <SelectContent>
                  {contas.map(conta => (
                    <SelectItem key={conta} value={conta}>
                      {conta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setNovaTransacaoOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
              <Button variant="outline" onClick={() => setImportarOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Livro Caixa
              </Button>
              <Button variant="outline" onClick={() => setImportarExtratoOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Extrato Bancário
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transações ({transacoesFiltradas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Carregando transações...</div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacoesFiltradas.map((transacao) => (
                      <TableRow key={transacao.id}>
                        <TableCell>{formatDate(transacao.data)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transacao.descricao}</div>
                            {transacao.observacoes && (
                              <div className="text-sm text-muted-foreground">
                                {transacao.observacoes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transacao.categoria}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{transacao.conta}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={transacao.tipo === "entrada" ? "default" : "destructive"}
                            className="capitalize"
                          >
                            {transacao.tipo === "entrada" ? (
                              <ArrowUpCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownCircle className="h-3 w-3 mr-1" />
                            )}
                            {transacao.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          transacao.tipo === "entrada" ? "text-green-600" : "text-red-600"
                        }`}>
                          {transacao.tipo === "entrada" ? "+" : "-"}
                          {formatCurrency(transacao.valor)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {transacoesFiltradas.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground text-lg mb-2">
                      Nenhuma transação encontrada
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tente ajustar os filtros ou adicionar novas transações
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <NovaTransacaoModal 
          open={novaTransacaoOpen}
          onOpenChange={setNovaTransacaoOpen}
          onTransacaoAdded={handleTransacaoAdded}
        />
        
        <ImportarLivroCaixaModal 
          open={importarOpen}
          onOpenChange={setImportarOpen}
          onTransacoesImported={handleTransacoesImported}
        />
        
        <ImportarExtratoModal 
          open={importarExtratoOpen}
          onOpenChange={setImportarExtratoOpen}
          conta={{ banco: "Conta Selecionada" }}
          onExtratoImportado={handleExtratoImportado}
        />
      </div>
    </Layout>
  );
}