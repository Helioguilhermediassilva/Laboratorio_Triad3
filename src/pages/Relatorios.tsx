import { TrendingUp, TrendingDown, BarChart3, PieChart, FileText } from "lucide-react";
import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

// Mock data for reports
const performanceData = [
  { month: "Jan", value: 425000, growth: 8.2 },
  { month: "Fev", value: 438000, growth: 3.1 },
  { month: "Mar", value: 465000, growth: 6.2 },
  { month: "Abr", value: 452000, growth: -2.8 },
  { month: "Mai", value: 485200, growth: 7.3 },
  { month: "Jun", value: 495600, growth: 2.1 }
];

const categoryDistribution = [
  { category: "Ações", value: 298560, percentage: 60.2 },
  { category: "FIIs", value: 99520, percentage: 20.1 },
  { category: "Renda Fixa", value: 74640, percentage: 15.1 },
  { category: "ETFs", value: 22880, percentage: 4.6 }
];

export default function Relatorios() {
  const { toast } = useToast();
  const totalValue = 495600;
  const monthlyGrowth = 2.1;
  const yearlyGrowth = 18.7;

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Investimentos", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);
      yPosition += 20;

      // Performance Stats
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Executivo", 20, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Valor Total da Carteira: ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Crescimento Mensal: +${monthlyGrowth}%`, 20, yPosition);
      yPosition += 8;
      doc.text(`Crescimento Anual: +${yearlyGrowth}%`, 20, yPosition);
      yPosition += 8;
      doc.text(`Melhor Ativo: VALE3 (+24.5%)`, 20, yPosition);
      yPosition += 8;
      doc.text(`Dividendos (Ano): R$ 18.5K`, 20, yPosition);
      yPosition += 20;

      // Portfolio Evolution
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Evolução da Carteira (Últimos 6 Meses)", 20, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      performanceData.forEach((data) => {
        const value = data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const growth = data.growth >= 0 ? `+${data.growth}%` : `${data.growth}%`;
        doc.text(`${data.month}: ${value} (${growth})`, 20, yPosition);
        yPosition += 8;
      });
      yPosition += 15;

      // Category Distribution
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Distribuição por Categoria", 20, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      categoryDistribution.forEach((item) => {
        const value = item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        doc.text(`${item.category}: ${value} (${item.percentage}%)`, 20, yPosition);
        yPosition += 8;
      });
      yPosition += 15;

      // Recent Transactions
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Últimas Transações", 20, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("• Compra PETR4 - 15/01/2024 - R$ 35.840 (1.000 ações)", 20, yPosition);
      yPosition += 8;
      doc.text("• Dividendos HGLG11 - 10/01/2024 - +R$ 124 (120 cotas)", 20, yPosition);
      yPosition += 20;

      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Relatório gerado automaticamente pela plataforma de investimentos", 20, 280);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 285);

      // Save the PDF
      doc.save(`relatorio-investimentos-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "PDF Exportado!",
        description: "O relatório foi exportado com sucesso."
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