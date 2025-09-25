import { useState } from "react";
import { FileText, Calculator, Calendar, TrendingUp, AlertTriangle, Download } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

// Mock data - Imposto de Renda
const declaracoes = [
  {
    ano: 2024,
    status: "Em Andamento",
    prazoLimite: "2024-04-30",
    recibo: null,
    valorPagar: 2840,
    valorRestituir: 0
  },
  {
    ano: 2023,
    status: "Entregue",
    prazoLimite: "2023-04-28",
    recibo: "000123456789",
    valorPagar: 0,
    valorRestituir: 1250
  },
  {
    ano: 2022,
    status: "Entregue",
    prazoLimite: "2022-04-29",
    recibo: "000987654321",
    valorPagar: 890,
    valorRestituir: 0
  }
];

const rendimentos = [
  {
    fonte: "Empresa XYZ Ltda",
    cnpj: "12.345.678/0001-90",
    tipo: "Salário",
    valor: 102000,
    irrf: 8500,
    ano: 2024
  },
  {
    fonte: "Freelance - Diversos",
    cnpj: "Pessoa Física",
    tipo: "Serviços",
    valor: 14400,
    irrf: 0,
    ano: 2024
  },
  {
    fonte: "Dividendos - PETR4",
    cnpj: "33.000.167/0001-01",
    tipo: "Dividendos",
    valor: 5400,
    irrf: 0,
    ano: 2024
  }
];

const despesasDedutivel = [
  {
    categoria: "Saúde",
    descricao: "Plano de Saúde",
    valor: 4800,
    comprovantes: 12
  },
  {
    categoria: "Educação",
    descricao: "Curso Superior",
    valor: 12000,
    comprovantes: 10
  },
  {
    categoria: "Previdência",
    descricao: "INSS",
    valor: 7200,
    comprovantes: 12
  },
  {
    categoria: "Dependentes",
    descricao: "Filho menor",
    valor: 2275.08,
    comprovantes: 1
  }
];

const prazos = [
  {
    evento: "Entrega da Declaração IRPF 2024",
    data: "2024-04-30",
    status: "Pendente",
    diasRestantes: 45
  },
  {
    evento: "Primeira parcela DARF 2024",
    data: "2024-04-30",
    status: "Pendente",
    diasRestantes: 45
  },
  {
    evento: "Carnê-Leão Março 2024",
    data: "2024-04-15",
    status: "Pendente",
    diasRestantes: 30
  }
];

export default function ImpostoRenda() {
  const [anoSelecionado, setAnoSelecionado] = useState(2024);
  
  const declaracaoAtual = declaracoes.find(d => d.ano === anoSelecionado) || declaracoes[0];
  const rendimentosAno = rendimentos.filter(r => r.ano === anoSelecionado);
  const totalRendimentos = rendimentosAno.reduce((sum, r) => sum + r.valor, 0);
  const totalIRRF = rendimentosAno.reduce((sum, r) => sum + r.irrf, 0);
  const totalDeducoes = despesasDedutivel.reduce((sum, d) => sum + d.valor, 0);

  const formatCurrency = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Entregue": return "bg-green-100 text-green-800";
      case "Em Andamento": return "bg-yellow-100 text-yellow-800";
      case "Pendente": return "bg-red-100 text-red-800";
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
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Nova Declaração
              </Button>
            </div>
            
            <div className="grid gap-4">
              {declaracoes.map((declaracao) => (
                <Card key={declaracao.ano}>
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
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        {declaracao.status === "Entregue" && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Recibo
                          </Button>
                        )}
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
              <Button>Adicionar Rendimento</Button>
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
                          <Button variant="outline" size="sm">
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
              <Button>Adicionar Despesa</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {despesasDedutivel.map((despesa, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{despesa.categoria}</h3>
                        <Badge variant="outline">{despesa.comprovantes} docs</Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{despesa.descricao}</p>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(despesa.valor)}
                        </span>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="prazos" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Próximos Prazos</h2>
              <Button>Adicionar Lembrete</Button>
            </div>
            
            <div className="space-y-4">
              {prazos.map((prazo, index) => (
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
                        <Button variant="outline" size="sm">
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
      </div>
    </Layout>
  );
}