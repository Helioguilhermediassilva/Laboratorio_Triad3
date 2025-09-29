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
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 25;

      // Define colors
      const primaryColor = [34, 197, 94]; // Green
      const secondaryColor = [59, 130, 246]; // Blue
      const accentColor = [168, 85, 247]; // Purple
      const textColor = [31, 41, 55]; // Gray-800
      const lightGray = [243, 244, 246]; // Gray-100
      const darkGray = [107, 114, 128]; // Gray-500

      // Header Background
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 50, 'F');

      // Header gradient effect (using multiple rectangles with opacity)
      for (let i = 0; i < 10; i++) {
        const alpha = 0.1 - (i * 0.01);
        doc.setFillColor(255, 255, 255, alpha);
        doc.rect(0, 40 + i, pageWidth, 1, 'F');
      }

      // Company Logo Area (placeholder)
      doc.setFillColor(255, 255, 255);
      doc.circle(35, 25, 12, 'F');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("₹", 31, 29);

      // Header Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("RELATÓRIO DE INVESTIMENTOS", 60, 25);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Análise Completa da Carteira", 60, 32);

      // Date and Period Info
      doc.setFontSize(10);
      const currentDate = new Date().toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(`Gerado em: ${currentDate}`, pageWidth - 75, 20);
      doc.text("Período: Últimos 6 meses", pageWidth - 75, 28);
      doc.text("Status: Atualizado", pageWidth - 75, 36);

      yPosition = 70;

      // Executive Summary Box
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(15, yPosition - 5, pageWidth - 30, 60, 3, 3, 'F');
      
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(15, yPosition - 5, pageWidth - 30, 60, 3, 3, 'S');

      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("📊 RESUMO EXECUTIVO", 25, yPosition + 5);

      // Summary Cards in Grid
      const cardWidth = 40;
      const cardHeight = 20;
      const cardSpacing = 45;
      
      // Card 1 - Total Value
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(25, yPosition + 12, cardWidth, cardHeight, 2, 2, 'F');
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.roundedRect(25, yPosition + 12, cardWidth, cardHeight, 2, 2, 'S');
      
      doc.setFontSize(8);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text("VALOR TOTAL", 27, yPosition + 18);
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 27, yPosition + 26);

      // Card 2 - Monthly Growth
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(25 + cardSpacing, yPosition + 12, cardWidth, cardHeight, 2, 2, 'F');
      doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.roundedRect(25 + cardSpacing, yPosition + 12, cardWidth, cardHeight, 2, 2, 'S');
      
      doc.setFontSize(8);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text("CRESCIMENTO MENSAL", 27 + cardSpacing, yPosition + 18);
      doc.setFontSize(12);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(`+${monthlyGrowth}%`, 27 + cardSpacing, yPosition + 26);

      // Card 3 - Annual Growth
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(25 + cardSpacing * 2, yPosition + 12, cardWidth, cardHeight, 2, 2, 'F');
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.roundedRect(25 + cardSpacing * 2, yPosition + 12, cardWidth, cardHeight, 2, 2, 'S');
      
      doc.setFontSize(8);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text("CRESCIMENTO ANUAL", 27 + cardSpacing * 2, yPosition + 18);
      doc.setFontSize(12);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(`+${yearlyGrowth}%`, 27 + cardSpacing * 2, yPosition + 26);

      // Additional metrics
      yPosition += 45;
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont("helvetica", "normal");
      doc.text(`🏆 Melhor Ativo: VALE3 (+24.5%)`, 25, yPosition);
      doc.text(`💰 Dividendos Recebidos: R$ 18.500`, 120, yPosition);

      yPosition += 25;

      // Portfolio Evolution Section
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.rect(15, yPosition, 5, 20, 'F');
      
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("📈 EVOLUÇÃO DA CARTEIRA", 25, yPosition + 8);

      yPosition += 20;

      // Create a visual chart effect for performance data
      const chartStartY = yPosition;
      const chartWidth = pageWidth - 50;
      const chartHeight = 40;
      
      // Chart background
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(25, chartStartY, chartWidth, chartHeight, 2, 2, 'F');
      
      // Chart data visualization
      const maxValue = Math.max(...performanceData.map(d => d.value));
      const minValue = Math.min(...performanceData.map(d => d.value));
      
      performanceData.forEach((data, index) => {
        const x = 30 + (index * (chartWidth - 20) / (performanceData.length - 1));
        const normalizedValue = (data.value - minValue) / (maxValue - minValue);
        const barHeight = normalizedValue * (chartHeight - 20) + 10;
        
        // Draw bars
        doc.setFillColor(data.growth >= 0 ? primaryColor[0] : 220, data.growth >= 0 ? primaryColor[1] : 38, data.growth >= 0 ? primaryColor[2] : 38);
        doc.rect(x - 2, chartStartY + chartHeight - barHeight, 4, barHeight, 'F');
        
        // Month labels
        doc.setFontSize(8);
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(data.month, x - 3, chartStartY + chartHeight + 8);
      });

      yPosition = chartStartY + chartHeight + 20;

      // Performance table
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(25, yPosition, chartWidth, 50, 2, 2, 'F');
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(25, yPosition, chartWidth, 50, 2, 2, 'S');

      yPosition += 10;
      performanceData.forEach((data, index) => {
        if (index < 3) { // Show only first 3 months to fit
          const value = data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const growth = data.growth >= 0 ? `+${data.growth}%` : `${data.growth}%`;
          
          doc.setFontSize(9);
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.setFont("helvetica", "bold");
          doc.text(data.month, 30, yPosition);
          
          doc.setFont("helvetica", "normal");
          doc.text(value, 50, yPosition);
          
          doc.setTextColor(data.growth >= 0 ? primaryColor[0] : 220, data.growth >= 0 ? primaryColor[1] : 38, data.growth >= 0 ? primaryColor[2] : 38);
          doc.text(growth, 120, yPosition);
          
          yPosition += 8;
        }
      });

      yPosition += 20;

      // Asset Distribution Section
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(15, yPosition, 5, 20, 'F');
      
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("🥧 DISTRIBUIÇÃO POR CATEGORIA", 25, yPosition + 8);

      yPosition += 25;

      // Pie chart representation using rectangles
      let currentX = 25;
      categoryDistribution.forEach((item, index) => {
        const colors = [primaryColor, secondaryColor, accentColor, [239, 68, 68]];
        const color = colors[index % colors.length];
        const rectWidth = (item.percentage / 100) * (chartWidth * 0.7);
        
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(currentX, yPosition, rectWidth, 8, 1, 1, 'F');
        
        // Category info
        doc.setFontSize(9);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(`${item.category}: ${item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${item.percentage}%)`, 25, yPosition + 20 + (index * 8));
        
        currentX += rectWidth + 2;
      });

      yPosition += 65;

      // Recent Transactions
      if (yPosition < pageHeight - 80) {
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(15, yPosition, 5, 20, 'F');
        
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("💼 ÚLTIMAS TRANSAÇÕES", 25, yPosition + 8);

        yPosition += 25;

        // Transaction items
        const transactions = [
          { type: "Compra", asset: "PETR4", date: "15/01/2024", value: "R$ 35.840", qty: "1.000 ações" },
          { type: "Dividendos", asset: "HGLG11", date: "10/01/2024", value: "+R$ 124", qty: "120 cotas" }
        ];

        transactions.forEach((transaction, index) => {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(25, yPosition, chartWidth, 15, 2, 2, 'F');
          doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.roundedRect(25, yPosition, chartWidth, 15, 2, 2, 'S');

          doc.setFontSize(9);
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.setFont("helvetica", "bold");
          doc.text(`${transaction.type} ${transaction.asset}`, 30, yPosition + 6);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.text(transaction.date, 30, yPosition + 11);
          
          doc.setTextColor(transaction.type === "Dividendos" ? primaryColor[0] : textColor[0], transaction.type === "Dividendos" ? primaryColor[1] : textColor[1], transaction.type === "Dividendos" ? primaryColor[2] : textColor[2]);
          doc.setFont("helvetica", "bold");
          doc.text(transaction.value, pageWidth - 80, yPosition + 6);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.text(transaction.qty, pageWidth - 80, yPosition + 11);

          yPosition += 20;
        });
      }

      // Footer
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
      
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);
      
      doc.setFontSize(8);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFont("helvetica", "italic");
      doc.text("Relatório gerado automaticamente pela plataforma Triad3 de investimentos", 20, pageHeight - 15);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} | Confidencial`, 20, pageHeight - 8);
      
      doc.setFont("helvetica", "bold");
      doc.text("TRIAD3 INVESTIMENTOS", pageWidth - 60, pageHeight - 10);

      // Save the PDF
      doc.save(`relatorio-investimentos-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "PDF Exportado com Sucesso! 📄",
        description: "Relatório elegante gerado e baixado automaticamente."
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