import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Filter, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: any;
}

const transacoesMock = [
  {
    id: "1",
    data: "2024-01-20",
    descrição: "TED Recebida - Salário",
    tipo: "entrada",
    valor: 8500.00,
    saldo: 15420.50,
    categoria: "Salário"
  },
  {
    id: "2",
    data: "2024-01-19",
    descrição: "PIX Enviado - Supermercado",
    tipo: "saida",
    valor: 245.80,
    saldo: 6920.50,
    categoria: "Alimentação"
  },
  {
    id: "3",
    data: "2024-01-18",
    descrição: "Débito Automático - Financiamento",
    tipo: "saida",
    valor: 890.50,
    saldo: 7166.30,
    categoria: "Financiamento"
  },
  {
    id: "4",
    data: "2024-01-17",
    descrição: "PIX Recebido - Freelance",
    tipo: "entrada",
    valor: 1200.00,
    saldo: 8056.80,
    categoria: "Trabalho"
  },
  {
    id: "5",
    data: "2024-01-16",
    descrição: "Compra no Débito - Posto",
    tipo: "saida",
    valor: 150.00,
    saldo: 6856.80,
    categoria: "Transporte"
  },
  {
    id: "6",
    data: "2024-01-15",
    descrição: "DOC Recebido - Dividendos",
    tipo: "entrada",
    valor: 420.30,
    saldo: 7006.80,
    categoria: "Investimento"
  },
  {
    id: "7",
    data: "2024-01-14",
    descrição: "PIX Enviado - Farmácia",
    tipo: "saida",
    valor: 85.60,
    saldo: 6586.50,
    categoria: "Saúde"
  },
  {
    id: "8",
    data: "2024-01-13",
    descrição: "Transferência Recebida",
    tipo: "entrada",
    valor: 300.00,
    saldo: 6672.10,
    categoria: "Transferência"
  }
];

export default function ExtratoModal({
  open,
  onOpenChange,
  conta
}: ExtratoModalProps) {
  const [periodo, setPeriodo] = useState("30");
  const [categoria, setCategoria] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const { toast } = useToast();

  if (!conta) return null;

  const transacoesFiltradas = transacoesMock.filter(transacao => {
    const matchCategoria = categoria === "todas" || transacao.categoria.toLowerCase() === categoria.toLowerCase();
    const matchTipo = tipo === "todos" || transacao.tipo === tipo;
    return matchCategoria && matchTipo;
  });

  const totalEntradas = transacoesFiltradas
    .filter(t => t.tipo === "entrada")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalSaidas = transacoesFiltradas
    .filter(t => t.tipo === "saida")
    .reduce((sum, t) => sum + t.valor, 0);

  const saldoPeriodo = totalEntradas - totalSaidas;

  const formatCurrency = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const handleDownloadExtrato = () => {
    toast({
      title: "Download iniciado",
      description: "O extrato está sendo gerado e será baixado em breve."
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Extrato - {conta.banco} ({conta.nome})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={periodo} onValueChange={setPeriodo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="salário">Salário</SelectItem>
                      <SelectItem value="alimentação">Alimentação</SelectItem>
                      <SelectItem value="transporte">Transporte</SelectItem>
                      <SelectItem value="saúde">Saúde</SelectItem>
                      <SelectItem value="investimento">Investimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="entrada">Entradas</SelectItem>
                      <SelectItem value="saida">Saídas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleDownloadExtrato} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
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
                  <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
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
                  <Calendar className="h-4 w-4 mr-2" />
                  Saldo do Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${saldoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(saldoPeriodo)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Transações */}
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
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoesFiltradas.map((transacao) => (
                    <TableRow key={transacao.id}>
                      <TableCell>{formatDate(transacao.data)}</TableCell>
                      <TableCell className="font-medium">{transacao.descrição}</TableCell>
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
                        {formatCurrency(transacao.valor)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transacao.saldo)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}