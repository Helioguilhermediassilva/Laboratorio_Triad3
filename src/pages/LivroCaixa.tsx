import { useState } from "react";
import { BookOpen, ArrowUpCircle, ArrowDownCircle, Calendar, Filter, Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data - Livro Caixa
const transacoes = [
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
  },
  {
    id: "6",
    data: "2024-01-20",
    descricao: "Gasolina Posto Shell",
    categoria: "Transporte",
    tipo: "saida" as const,
    valor: 85,
    conta: "Cartão de Débito",
    observacoes: "Abastecimento Honda Civic"
  },
  {
    id: "7",
    data: "2024-01-21",
    descricao: "Consulta Médica",
    categoria: "Saúde",
    tipo: "saida" as const,
    valor: 250,
    conta: "Cartão de Crédito",
    observacoes: "Consulta cardiologista"
  },
  {
    id: "8",
    data: "2024-01-22",
    descricao: "Venda Produto Online",
    categoria: "Vendas",
    tipo: "entrada" as const,
    valor: 650,
    conta: "PayPal",
    observacoes: "Venda curso online"
  }
];

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

  const transacoesFiltradas = transacoes.filter(transacao => {
    const matchCategoria = filtroCategoria === "Todas" || transacao.categoria === filtroCategoria;
    const matchConta = filtroConta === "Todas" || transacao.conta === filtroConta;
    const matchTipo = filtroTipo === "todos" || transacao.tipo === filtroTipo;
    const matchBusca = transacao.descricao.toLowerCase().includes(termoBusca.toLowerCase()) ||
                      transacao.observacoes.toLowerCase().includes(termoBusca.toLowerCase());
    
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
              <Input
                placeholder="Buscar transação..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
              
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

              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
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

            {transacoesFiltradas.length === 0 && (
              <div className="text-center py-8">
                <div className="text-muted-foreground text-lg mb-2">
                  Nenhuma transação encontrada
                </div>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros ou adicionar novas transações
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}