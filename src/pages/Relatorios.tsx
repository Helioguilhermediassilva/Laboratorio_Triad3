import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, BarChart3, PieChart, FileText, Building, Wallet, PiggyBank, BookOpen, CreditCard, Receipt } from "lucide-react";
import Layout from "@/components/Layout";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import { supabase } from "@/integrations/supabase/client";

interface CategoryData {
  category: string;
  value: number;
  percentage: number;
  icon: any;
  color: string;
}

interface TransactionData {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  data: string;
  categoria: string;
}

export default function Relatorios() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionData[]>([]);
  
  // Totais por categoria
  const [totalImobilizado, setTotalImobilizado] = useState(0);
  const [totalAplicacoes, setTotalAplicacoes] = useState(0);
  const [totalPrevidencia, setTotalPrevidencia] = useState(0);
  const [totalContasBancarias, setTotalContasBancarias] = useState(0);
  const [totalDividas, setTotalDividas] = useState(0);
  const [totalTransacoes, setTotalTransacoes] = useState({ receitas: 0, despesas: 0 });

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Carregar dados de todas as tabelas em paralelo
      const [
        imobilizadoRes,
        aplicacoesRes,
        previdenciaRes,
        contasRes,
        dividasRes,
        transacoesRes
      ] = await Promise.all([
        supabase.from('bens_imobilizados').select('*').eq('user_id', user.id),
        supabase.from('aplicacoes').select('*').eq('user_id', user.id),
        supabase.from('planos_previdencia').select('*').eq('user_id', user.id),
        supabase.from('contas_bancarias').select('*').eq('user_id', user.id),
        supabase.from('dividas').select('*').eq('user_id', user.id),
        supabase.from('transacoes').select('*').eq('user_id', user.id).order('data', { ascending: false }).limit(10)
      ]);

      // Calcular totais
      const imobilizadoTotal = (imobilizadoRes.data || []).reduce((sum, item) => sum + Number(item.valor_atual || 0), 0);
      const aplicacoesTotal = (aplicacoesRes.data || []).reduce((sum, item) => sum + Number(item.valor_atual || 0), 0);
      const previdenciaTotal = (previdenciaRes.data || []).reduce((sum, item) => sum + Number(item.valor_acumulado || 0), 0);
      const contasTotal = (contasRes.data || []).reduce((sum, item) => sum + Number(item.saldo_atual || 0), 0);
      const dividasTotal = (dividasRes.data || []).reduce((sum, item) => sum + Number(item.saldo_devedor || 0), 0);
      
      const receitas = (transacoesRes.data || [])
        .filter(t => t.tipo === 'Receita' || t.tipo === 'entrada')
        .reduce((sum, t) => sum + Number(t.valor || 0), 0);
      const despesas = (transacoesRes.data || [])
        .filter(t => t.tipo === 'Despesa' || t.tipo === 'saida')
        .reduce((sum, t) => sum + Number(t.valor || 0), 0);

      setTotalImobilizado(imobilizadoTotal);
      setTotalAplicacoes(aplicacoesTotal);
      setTotalPrevidencia(previdenciaTotal);
      setTotalContasBancarias(contasTotal);
      setTotalDividas(dividasTotal);
      setTotalTransacoes({ receitas, despesas });

      // Calcular distribuição por categoria (apenas ativos - patrimônio positivo)
      const totalPatrimonio = imobilizadoTotal + aplicacoesTotal + previdenciaTotal + contasTotal;
      
      const distribution: CategoryData[] = [];
      
      if (imobilizadoTotal > 0) {
        distribution.push({
          category: 'Imobilizado',
          value: imobilizadoTotal,
          percentage: totalPatrimonio > 0 ? Number(((imobilizadoTotal / totalPatrimonio) * 100).toFixed(1)) : 0,
          icon: Building,
          color: 'bg-blue-500'
        });
      }
      
      if (aplicacoesTotal > 0) {
        distribution.push({
          category: 'Aplicações',
          value: aplicacoesTotal,
          percentage: totalPatrimonio > 0 ? Number(((aplicacoesTotal / totalPatrimonio) * 100).toFixed(1)) : 0,
          icon: TrendingUp,
          color: 'bg-green-500'
        });
      }
      
      if (previdenciaTotal > 0) {
        distribution.push({
          category: 'Previdência',
          value: previdenciaTotal,
          percentage: totalPatrimonio > 0 ? Number(((previdenciaTotal / totalPatrimonio) * 100).toFixed(1)) : 0,
          icon: PiggyBank,
          color: 'bg-purple-500'
        });
      }
      
      if (contasTotal > 0) {
        distribution.push({
          category: 'Contas Bancárias',
          value: contasTotal,
          percentage: totalPatrimonio > 0 ? Number(((contasTotal / totalPatrimonio) * 100).toFixed(1)) : 0,
          icon: CreditCard,
          color: 'bg-orange-500'
        });
      }

      // Ordenar por valor
      distribution.sort((a, b) => b.value - a.value);
      setCategoryDistribution(distribution);

      // Transações recentes
      setRecentTransactions(transacoesRes.data || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPatrimonio = totalImobilizado + totalAplicacoes + totalPrevidencia + totalContasBancarias;
  const patrimonioLiquido = totalPatrimonio - totalDividas;

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFillColor(255, 102, 32);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("RELATÓRIO PATRIMONIAL", 20, yPos);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPos + 8);

      yPos = 60;

      // Resumo Executivo
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "bold");
      doc.text("RESUMO PATRIMONIAL", 20, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Patrimônio Total: ${totalPatrimonio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
      yPos += 8;
      doc.text(`Total em Dívidas: ${totalDividas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
      yPos += 8;
      doc.text(`Patrimônio Líquido: ${patrimonioLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
      yPos += 20;

      // Detalhamento por Categoria
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DETALHAMENTO POR CATEGORIA", 20, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Imobilizado: ${totalImobilizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
      yPos += 8;
      doc.text(`Aplicações: ${totalAplicacoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
      yPos += 8;
      doc.text(`Previdência: ${totalPrevidencia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
      yPos += 8;
      doc.text(`Contas Bancárias: ${totalContasBancarias.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
      yPos += 8;
      doc.text(`Dívidas: ${totalDividas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
      yPos += 20;

      // Livro Caixa
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("LIVRO CAIXA", 20, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Receitas: ${totalTransacoes.receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
      yPos += 8;
      doc.text(`Despesas: ${totalTransacoes.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
      yPos += 8;
      doc.text(`Saldo: ${(totalTransacoes.receitas - totalTransacoes.despesas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
      yPos += 20;

      // Distribuição por Categoria
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DISTRIBUIÇÃO PERCENTUAL", 20, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      categoryDistribution.forEach((item) => {
        const value = item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        doc.text(`${item.category}: ${value} (${item.percentage}%)`, 20, yPos);
        yPos += 6;
      });

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text("Relatório gerado pela plataforma Triad3 - Confidencial", 20, pageHeight - 20);
      doc.text(`Página 1 de 1 - ${new Date().toLocaleString('pt-BR')}`, 20, pageHeight - 12);

      doc.save(`relatorio-patrimonial-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "PDF exportado com sucesso!",
        description: "Relatório patrimonial baixado."
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
              Visão consolidada do seu patrimônio em todas as categorias
            </p>
          </div>
          
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Patrimônio Total"
            value={totalPatrimonio.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            })}
            icon={Wallet}
            change={{ value: 0, type: "increase" }}
          />
          <StatsCard
            title="Total em Dívidas"
            value={totalDividas.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            })}
            icon={Receipt}
            change={{ value: 0, type: "decrease" }}
          />
          <StatsCard
            title="Patrimônio Líquido"
            value={patrimonioLiquido.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            })}
            icon={TrendingUp}
            change={{ value: 0, type: patrimonioLiquido >= 0 ? "increase" : "decrease" }}
          />
          <StatsCard
            title="Saldo Livro Caixa"
            value={(totalTransacoes.receitas - totalTransacoes.despesas).toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            })}
            icon={BookOpen}
            change={{ value: 0, type: totalTransacoes.receitas >= totalTransacoes.despesas ? "increase" : "decrease" }}
          />
        </div>

        {/* Detalhamento por Categoria */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imobilizado</CardTitle>
              <Building className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalImobilizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Bens e propriedades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aplicações</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalAplicacoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Investimentos financeiros
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Previdência</CardTitle>
              <PiggyBank className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPrevidencia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Planos de previdência
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas Bancárias</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalContasBancarias.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Saldo em contas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dívidas</CardTitle>
              <Receipt className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {totalDividas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Passivos e financiamentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livro Caixa</CardTitle>
              <BookOpen className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receitas:</span>
                  <span className="text-green-600 font-medium">
                    {totalTransacoes.receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Despesas:</span>
                  <span className="text-red-600 font-medium">
                    {totalTransacoes.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Asset Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição do Patrimônio por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryDistribution.length > 0 ? (
                categoryDistribution.map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${item.color} bg-opacity-20`}>
                        <item.icon className={`h-5 w-5 ${item.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {item.category}
                        </div>
                        <div className="text-lg font-semibold">
                          {item.value.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-foreground min-w-[4rem] text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum patrimônio cadastrado. Adicione bens, aplicações ou contas para visualizar a distribuição.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Últimas Transações (Livro Caixa)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => {
                  const isReceita = transaction.tipo === 'Receita' || transaction.tipo === 'entrada';
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isReceita 
                            ? 'bg-green-500/10' 
                            : 'bg-red-500/10'
                        }`}>
                          {isReceita ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{transaction.descricao}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(transaction.data).toLocaleDateString('pt-BR')} • {transaction.categoria}
                          </div>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        isReceita 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {isReceita ? '+' : '-'}
                        {Math.abs(Number(transaction.valor)).toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma transação registrada no Livro Caixa
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
