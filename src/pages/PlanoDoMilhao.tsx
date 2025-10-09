import { useState, useMemo } from "react";
import { TrendingUp, Calculator, Target, Info, Zap } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

export default function PlanoDoMilhao() {
  const [capitalInicial, setCapitalInicial] = useState(7920);
  const [aporteMensal, setAporteMensal] = useState(660);
  const [taxaAnual, setTaxaAnual] = useState(8);
  const [periodoAnos, setPeriodoAnos] = useState(20);
  const [inflacao, setInflacao] = useState(0);

  // Cálculo do montante com juros compostos
  const calcularMontante = (capital: number, aporte: number, taxa: number, anos: number) => {
    const taxaMensal = taxa / 100 / 12;
    const meses = anos * 12;
    
    // Montante do capital inicial
    const montanteCapital = capital * Math.pow(1 + taxaMensal, meses);
    
    // Montante dos aportes mensais
    const montanteAportes = aporte * ((Math.pow(1 + taxaMensal, meses) - 1) / taxaMensal);
    
    return montanteCapital + montanteAportes;
  };

  // Calcular tempo para atingir 1 milhão
  const calcularTempoParaMilhao = () => {
    const taxaMensal = taxaAnual / 100 / 12;
    let montante = capitalInicial;
    let meses = 0;
    
    while (montante < 1000000 && meses < 600) { // Limitar a 50 anos
      montante = montante * (1 + taxaMensal) + aporteMensal;
      meses++;
    }
    
    return meses / 12;
  };

  // Gerar dados de evolução de 5 em 5 anos
  const evolucaoPatrimonio = useMemo(() => {
    const dados = [];
    for (let ano = 5; ano <= Math.min(periodoAnos, 50); ano += 5) {
      const montante = calcularMontante(capitalInicial, aporteMensal, taxaAnual, ano);
      const totalAportado = capitalInicial + (aporteMensal * ano * 12);
      const juros = montante - totalAportado;
      const percAportes = (totalAportado / montante) * 100;
      const percJuros = (juros / montante) * 100;
      
      dados.push({
        ano,
        patrimonio: montante,
        totalAportado,
        juros,
        percAportes,
        percJuros
      });
    }
    return dados;
  }, [capitalInicial, aporteMensal, taxaAnual, periodoAnos]);

  // Desafio do 0,01
  const desafioCentavo = useMemo(() => {
    const dados = [];
    let acumulado = 0.01;
    for (let dia = 1; dia <= 30; dia++) {
      dados.push({ dia, acumulado });
      acumulado *= 2;
    }
    return dados;
  }, []);

  const montanteFinal = calcularMontante(capitalInicial, aporteMensal, taxaAnual, periodoAnos);
  const totalAportado = capitalInicial + (aporteMensal * periodoAnos * 12);
  const jurosGanhos = montanteFinal - totalAportado;
  const percCapitalProprio = (totalAportado / montanteFinal) * 100;
  const percJuros = (jurosGanhos / montanteFinal) * 100;
  const tempoParaMilhao = calcularTempoParaMilhao();

  const formatCurrency = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (anos: number) => {
    const dataAtual = new Date();
    dataAtual.setFullYear(dataAtual.getFullYear() + Math.floor(anos));
    const mesesAdicionais = Math.round((anos % 1) * 12);
    dataAtual.setMonth(dataAtual.getMonth() + mesesAdicionais);
    
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    return `${meses[dataAtual.getMonth()]}/${dataAtual.getFullYear()}`;
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Plano do Milhão
          </h1>
          <p className="text-muted-foreground">
            Simule seu caminho para o primeiro milhão através de investimentos consistentes
          </p>
        </div>

        {/* Calculadora */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Parâmetros da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="capitalInicial">Capital Inicial</Label>
                <Input
                  id="capitalInicial"
                  type="number"
                  value={capitalInicial}
                  onChange={(e) => setCapitalInicial(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="aporteMensal">Aporte Mensal</Label>
                <Input
                  id="aporteMensal"
                  type="number"
                  value={aporteMensal}
                  onChange={(e) => setAporteMensal(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="taxaAnual">Taxa Anual (%)</Label>
                <Input
                  id="taxaAnual"
                  type="number"
                  value={taxaAnual}
                  onChange={(e) => setTaxaAnual(Number(e.target.value))}
                  placeholder="0"
                  step="0.1"
                />
              </div>
              
              <div>
                <Label htmlFor="periodoAnos">Período (anos)</Label>
                <Input
                  id="periodoAnos"
                  type="number"
                  value={periodoAnos}
                  onChange={(e) => setPeriodoAnos(Number(e.target.value))}
                  placeholder="0"
                  max="50"
                />
              </div>
              
              <div>
                <Label htmlFor="inflacao">Inflação (%)</Label>
                <Input
                  id="inflacao"
                  type="number"
                  value={inflacao}
                  onChange={(e) => setInflacao(Number(e.target.value))}
                  placeholder="0"
                  step="0.1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
                Patrimônio em {periodoAnos} anos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(montanteFinal)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Tempo para R$ 1 Milhão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatDate(tempoParaMilhao)}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Aprox. {Math.round(tempoParaMilhao)} anos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Capital + Aportes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(totalAportado)}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {percCapitalProprio.toFixed(2)}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Ganho em Juros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {formatCurrency(jurosGanhos)}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {percJuros.toFixed(2)}% do total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para visualizações */}
        <Tabs defaultValue="evolucao" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="evolucao">Evolução do Patrimônio</TabsTrigger>
            <TabsTrigger value="distribuicao">Distribuição Aportes/Juros</TabsTrigger>
            <TabsTrigger value="desafio">Desafio R$ 0,01</TabsTrigger>
          </TabsList>

          {/* Tab: Evolução do Patrimônio */}
          <TabsContent value="evolucao" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Valores tomam forma exponencial ao longo do tempo.</strong> Observe como o crescimento acelera nos anos finais.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Evolução do Patrimônio de 5 em 5 anos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={evolucaoPatrimonio}>
                    <defs>
                      <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorAportes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorJuros" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="ano" 
                      label={{ value: 'Ano', position: 'insideBottom', offset: -5 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="patrimonio" 
                      stroke="#10b981" 
                      fillOpacity={1}
                      fill="url(#colorPatrimonio)"
                      name="Patrimônio"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalAportado" 
                      stroke="#6366f1" 
                      fillOpacity={1}
                      fill="url(#colorAportes)"
                      name="Aportes"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tabela de Evolução</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ano</TableHead>
                      <TableHead className="text-right">Patrimônio</TableHead>
                      <TableHead className="text-right">Aportes Acumulados</TableHead>
                      <TableHead className="text-right">Juros Ganhos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evolucaoPatrimonio.map((item) => (
                      <TableRow key={item.ano}>
                        <TableCell className="font-medium">{item.ano}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(item.patrimonio)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.totalAportado)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">
                          {formatCurrency(item.juros)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Distribuição Aportes/Juros */}
          <TabsContent value="distribuicao" className="space-y-6">
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Aportes têm maior importância no início do que no final.</strong> Com o tempo, os juros compostos tornam-se o principal motor do crescimento.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição % Aportes e % Juros no Patrimônio</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={evolucaoPatrimonio}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="ano" 
                      label={{ value: 'Ano', position: 'insideBottom', offset: -5 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      label={{ value: 'Percentual (%)', angle: -90, position: 'insideLeft' }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(2)}%`}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="percAportes" 
                      stackId="a" 
                      fill="#6366f1" 
                      name="% Aportes"
                    />
                    <Bar 
                      dataKey="percJuros" 
                      stackId="a" 
                      fill="#f59e0b" 
                      name="% Juros"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tabela de Distribuição Percentual</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ano</TableHead>
                      <TableHead className="text-center">% Aportes</TableHead>
                      <TableHead className="text-center">% Juros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evolucaoPatrimonio.map((item) => (
                      <TableRow key={item.ano}>
                        <TableCell className="font-medium">{item.ano}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                            {item.percAportes.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950">
                            {item.percJuros.toFixed(2)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Desafio do R$ 0,01 */}
          <TabsContent value="desafio" className="space-y-6">
            <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
              <Zap className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900 dark:text-amber-100">
                <strong>Você prefere 1 milhão de reais hoje, ou ter 1 centavo dobrando a cada dia?</strong>
                <br />
                Este desafio ilustra o poder exponencial dos juros compostos!
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Desafio do R$ 0,01 - Dobramento Diário</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={desafioCentavo}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="dia" 
                      label={{ value: 'Dia', position: 'insideBottom', offset: -5 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
                        return `R$ ${value.toFixed(2)}`;
                      }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="acumulado" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', r: 4 }}
                      name="Acumulado"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Primeiros 15 Dias</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dia</TableHead>
                        <TableHead className="text-right">Acumulado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {desafioCentavo.slice(0, 15).map((item) => (
                        <TableRow key={item.dia}>
                          <TableCell className="font-medium">{item.dia}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.acumulado)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Últimos 15 Dias</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dia</TableHead>
                        <TableHead className="text-right">Acumulado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {desafioCentavo.slice(15, 30).map((item) => (
                        <TableRow 
                          key={item.dia}
                          className={item.acumulado >= 1000000 ? "bg-green-50 dark:bg-green-950" : ""}
                        >
                          <TableCell className="font-medium">{item.dia}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(item.acumulado)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                <strong>Resultado:</strong> Em apenas 28 dias, você teria mais de R$ 1 milhão! 
                No 30º dia, você teria {formatCurrency(desafioCentavo[29].acumulado)}.
                Este é o poder dos juros compostos em ação!
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}