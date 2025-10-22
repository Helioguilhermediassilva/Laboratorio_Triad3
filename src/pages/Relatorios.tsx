import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, BarChart3, PieChart, FileText } from "lucide-react";
import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import { supabase } from "@/integrations/supabase/client";

export default function Relatorios() {
  const { toast } = useToast();
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [monthlyGrowth, setMonthlyGrowth] = useState(0);
  const [yearlyGrowth, setYearlyGrowth] = useState(0);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load aplicações data
    const { data: aplicacoes, error } = await supabase
      .from('aplicacoes')
      .select('*')
      .eq('user_id', user.id);

    if (!error && aplicacoes) {
      const total = aplicacoes.reduce((sum, a) => sum + Number(a.valor_atual), 0);
      setTotalValue(total);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Colors
      const primary = '#22c55e';
      const secondary = '#3b82f6';
      const text = '#1f2937';
      const gray = '#6b7280';

      // Header
      doc.setFillColor(34, 197, 94);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("RELATÓRIO DE INVESTIMENTOS", 20, yPos);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPos + 8);

      yPos = 60;

      // Resumo Executivo
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "bold");
      doc.text("RESUMO EXECUTIVO", 20, yPos);
      yPos += 15;

      // Métricas principais
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Valor Total da Carteira: ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
      yPos += 8;
      
      doc.text(`Crescimento Mensal: +${monthlyGrowth}%`, 20, yPos);
      yPos += 8;
      
      doc.text(`Crescimento Anual: +${yearlyGrowth}%`, 20, yPos);
      yPos += 8;
      
      doc.text(`Melhor Ativo: VALE3 (+24.5%)`, 20, yPos);
      yPos += 8;
      
      doc.text(`Dividendos Recebidos (Ano): R$ 18.500,00`, 20, yPos);
      yPos += 20;

      // Evolução da Carteira
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("EVOLUÇÃO DA CARTEIRA", 20, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      performanceData.forEach((data) => {
        const value = data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const growth = data.growth >= 0 ? `+${data.growth}%` : `${data.growth}%`;
        
        doc.text(`${data.month}: ${value} (${growth})`, 20, yPos);
        yPos += 6;
      });
      yPos += 10;

      // Distribuição por Categoria
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DISTRIBUIÇÃO POR CATEGORIA", 20, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      categoryDistribution.forEach((item) => {
        const value = item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        doc.text(`${item.category}: ${value} (${item.percentage}%)`, 20, yPos);
        yPos += 6;
      });
      yPos += 10;

      // Transações Recentes
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("ÚLTIMAS TRANSAÇÕES", 20, yPos);
      yPos += 15;

      const transactions = [
        { type: "Compra", asset: "PETR4", date: "15/01/2024", value: "R$ 35.840", qty: "1.000 ações" },
        { type: "Dividendos", asset: "HGLG11", date: "10/01/2024", value: "R$ 124", qty: "120 cotas" },
        { type: "Venda", asset: "ITUB4", date: "08/01/2024", value: "R$ 15.200", qty: "500 ações" },
        { type: "Compra", asset: "BBDC4", date: "05/01/2024", value: "R$ 28.450", qty: "800 ações" }
      ];

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      transactions.forEach((transaction) => {
        doc.text(`${transaction.date} - ${transaction.type} ${transaction.asset}: ${transaction.value} (${transaction.qty})`, 20, yPos);
        yPos += 6;
      });
      yPos += 15;

      // Análise de Risco
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("ANÁLISE DE RISCO", 20, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Perfil de Risco: Moderado", 20, yPos);
      yPos += 6;
      
      doc.text("Diversificação: Bem diversificada (4 categorias)", 20, yPos);
      yPos += 6;
      
      doc.text("Volatilidade da Carteira: 12.3% (anual)", 20, yPos);
      yPos += 6;
      
      doc.text("Sharpe Ratio: 1.45 (Excelente)", 20, yPos);
      yPos += 15;

      // Recomendações
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("RECOMENDAÇÕES", 20, yPos);
      yPos += 15;

      const recommendations = [
        "Considere rebalancear a carteira para manter a diversificação",
        "Aumente a posição em Renda Fixa para reduzir risco",
        "Monitore o desempenho dos FIIs no próximo trimestre",
        "Considere aportes mensais regulares para aproveitar custo médio"
      ];

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      recommendations.forEach((rec, index) => {
        doc.text(`${index + 1}. ${rec}`, 20, yPos);
        yPos += 6;
      });

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text("Relatório gerado pela plataforma Triad3 - Confidencial", 20, pageHeight - 20);
      doc.text(`Página 1 de 1 - ${new Date().toLocaleString('pt-BR')}`, 20, pageHeight - 12);

      doc.save(`relatorio-investimentos-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "PDF exportado com sucesso!",
        description: "Relatório limpo e organizado baixado."
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao gerar o PDF.",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Relatórios & Análises
            </h1>
            <p className="text-muted-foreground">
              Acompanhe o desempenho da sua carteira de investimentos
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select defaultValue="6m">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Mês</SelectItem>
                <SelectItem value="3m">3 Meses</SelectItem>
                <SelectItem value="6m">6 Meses</SelectItem>
                <SelectItem value="1y">1 Ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Valor Total da Carteira"
            value={totalValue.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            })}
            icon={TrendingUp}
            change={{ value: monthlyGrowth, type: "increase" }}
          />
          <StatsCard
            title="Crescimento Anual"
            value={`+${yearlyGrowth}%`}
            icon={BarChart3}
            change={{ value: yearlyGrowth, type: "increase" }}
          />
          <StatsCard
            title="Melhor Ativo"
            value="VALE3"
            icon={TrendingUp}
            change={{ value: 24.5, type: "increase" }}
          />
          <StatsCard
            title="Dividendos (Ano)"
            value="R$ 18.5K"
            icon={PieChart}
            change={{ value: 15.2, type: "increase" }}
          />
        </div>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolução da Carteira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData.map((data, index) => (
                <div key={data.month} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="font-medium text-foreground w-12">
                      {data.month}
                    </div>
                    <div className="text-lg font-semibold">
                      {data.value.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    data.growth >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {data.growth >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {data.growth >= 0 ? '+' : ''}{data.growth}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Asset Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryDistribution.map((item) => (
                <div key={item.category} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="font-medium text-foreground min-w-0 flex-1">
                      {item.category}
                    </div>
                    <div className="text-lg font-semibold">
                      {item.value.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Últimas Transações</CardTitle>
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <div className="font-medium">Compra PETR4</div>
                    <div className="text-sm text-muted-foreground">15/01/2024</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">R$ 35.840</div>
                  <div className="text-sm text-muted-foreground">1.000 ações</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <PieChart className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium">Dividendos HGLG11</div>
                    <div className="text-sm text-muted-foreground">10/01/2024</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-success">+R$ 124</div>
                  <div className="text-sm text-muted-foreground">120 cotas</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}