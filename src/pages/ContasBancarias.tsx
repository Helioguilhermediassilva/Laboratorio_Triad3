import { useState } from "react";
import { CreditCard, TrendingUp, TrendingDown, Eye, EyeOff, MoreHorizontal, Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Mock data - Contas Bancárias
const contas = [
  {
    id: "1",
    banco: "Itaú",
    nome: "Conta Corrente",
    numero: "12345-6",
    agencia: "0001",
    tipo: "Conta Corrente",
    saldo: 15420.50,
    limite: 5000,
    cor: "#FF6B35"
  },
  {
    id: "2",
    banco: "Nubank",
    nome: "Conta Digital",
    numero: "98765-4",
    agencia: "0001",
    tipo: "Conta Corrente",
    saldo: 8340.75,
    limite: 2000,
    cor: "#8A2BE2"
  },
  {
    id: "3",
    banco: "XP Investimentos",
    nome: "Conta Investimentos",
    numero: "55555-5",
    agencia: "0001",
    tipo: "Conta Investimento",
    saldo: 45280.30,
    limite: 0,
    cor: "#000000"
  },
  {
    id: "4",
    banco: "Inter",
    nome: "Conta Poupança",
    numero: "77777-7",
    agencia: "0001",
    tipo: "Poupança",
    saldo: 12500.00,
    limite: 0,
    cor: "#FF8C00"
  }
];

const transacoesRecentes = [
  {
    id: "1",
    conta: "Itaú - Conta Corrente",
    descricao: "TED Recebida - Salário",
    tipo: "entrada",
    valor: 8500.00,
    data: "2024-01-15",
    categoria: "Salário"
  },
  {
    id: "2",
    conta: "Nubank - Conta Digital",
    descricao: "PIX Enviado - Aluguel",
    tipo: "saida",
    valor: 2200.00,
    data: "2024-01-16",
    categoria: "Moradia"
  },
  {
    id: "3",
    conta: "XP Investimentos",
    descricao: "Aplicação CDB",
    tipo: "saida",
    valor: 5000.00,
    data: "2024-01-17",
    categoria: "Investimento"
  },
  {
    id: "4",
    conta: "Inter - Conta Poupança",
    descricao: "Transferência Recebida",
    tipo: "entrada",
    valor: 1500.00,
    data: "2024-01-18",
    categoria: "Transferência"
  },
  {
    id: "5",
    conta: "Itaú - Conta Corrente",
    descricao: "Débito Automático - Financiamento",
    tipo: "saida",
    valor: 890.50,
    data: "2024-01-19",
    categoria: "Financiamento"
  }
];

const CartaoConta = ({ conta, mostrarSaldo }: { conta: typeof contas[0], mostrarSaldo: boolean }) => {
  return (
    <Card className="relative overflow-hidden">
      <div 
        className="absolute top-0 left-0 w-full h-2"
        style={{ backgroundColor: conta.cor }}
      />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{conta.banco}</CardTitle>
            <p className="text-sm text-muted-foreground">{conta.nome}</p>
          </div>
          <Badge variant="outline">{conta.tipo}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Agência</span>
            <span>{conta.agencia}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Conta</span>
            <span>{conta.numero}</span>
          </div>
        </div>
        
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Saldo Atual</span>
            <span className="text-2xl font-bold">
              {mostrarSaldo ? 
                conta.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 
                '****'
              }
            </span>
          </div>
          
          {conta.limite > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Limite Disponível</span>
              <span className="text-green-600">
                {mostrarSaldo ? 
                  conta.limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 
                  '****'
                }
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            Extrato
          </Button>
          <Button variant="default" size="sm" className="flex-1">
            Transferir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ContasBancarias() {
  const [mostrarSaldos, setMostrarSaldos] = useState(true);

  const saldoTotal = contas.reduce((sum, conta) => sum + conta.saldo, 0);
  const limiteTotal = contas.reduce((sum, conta) => sum + conta.limite, 0);
  
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Contas Bancárias
            </h1>
            <p className="text-muted-foreground">
              Centralize o controle de todas as suas contas e cartões
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setMostrarSaldos(!mostrarSaldos)}
            >
              {mostrarSaldos ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {mostrarSaldos ? 'Ocultar' : 'Mostrar'} Saldos
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Saldo Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mostrarSaldos ? formatCurrency(saldoTotal) : '****'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Contas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contas.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Contas ativas
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Limite Disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {mostrarSaldos ? formatCurrency(limiteTotal) : '****'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Minhas Contas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contas.map((conta) => (
              <CartaoConta 
                key={conta.id} 
                conta={conta} 
                mostrarSaldo={mostrarSaldos}
              />
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transações Recentes</CardTitle>
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transacoesRecentes.map((transacao) => (
                  <TableRow key={transacao.id}>
                    <TableCell>{formatDate(transacao.data)}</TableCell>
                    <TableCell className="font-medium">{transacao.conta}</TableCell>
                    <TableCell>{transacao.descricao}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transacao.categoria}</Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      transacao.tipo === "entrada" ? "text-green-600" : "text-red-600"
                    }`}>
                      {transacao.tipo === "entrada" ? (
                        <TrendingUp className="h-4 w-4 inline mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 inline mr-1" />
                      )}
                      {transacao.tipo === "entrada" ? "+" : "-"}
                      {mostrarSaldos ? formatCurrency(transacao.valor) : '****'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Categorizar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}