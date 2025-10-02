import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AnaliseInteligente = () => {
  const [loading, setLoading] = useState(false);
  const [analise, setAnalise] = useState<any>(null);
  const { toast } = useToast();

  const gerarAnalise = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analise-triad3');

      if (error) {
        console.error("Error invoking function:", error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setAnalise(data);
      toast({
        title: "Análise Gerada",
        description: "Sua análise patrimonial foi gerada com sucesso!",
      });
    } catch (error: any) {
      console.error("Error generating analysis:", error);
      toast({
        title: "Erro ao Gerar Análise",
        description: error.message || "Não foi possível gerar a análise. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getProgressColor = (desvio: number) => {
    const absDesvio = Math.abs(desvio);
    if (absDesvio <= 5) return "bg-green-500";
    if (absDesvio <= 15) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Análise Inteligente Triad3</h1>
            <p className="text-muted-foreground mt-2">
              Análise patrimonial baseada no conceito 33-34-33: Liquidez, Imobilizado e Negócios
            </p>
          </div>
          <Button 
            onClick={gerarAnalise} 
            disabled={loading}
            size="lg"
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Gerar Análise com IA
              </>
            )}
          </Button>
        </div>

        {/* Conceito Triad3 */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Conceito Triad3
            </CardTitle>
            <CardDescription>
              Metodologia de gestão patrimonial equilibrada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-card border">
                <div className="text-2xl font-bold text-primary">33%</div>
                <div className="font-semibold mt-1">Liquidez</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Investimentos líquidos, contas correntes, poupança
                </div>
              </div>
              <div className="p-4 rounded-lg bg-card border">
                <div className="text-2xl font-bold text-primary">34%</div>
                <div className="font-semibold mt-1">Imobilizado</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Imóveis, veículos, bens duráveis
                </div>
              </div>
              <div className="p-4 rounded-lg bg-card border">
                <div className="text-2xl font-bold text-primary">33%</div>
                <div className="font-semibold mt-1">Negócios</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Empresas, participações, rendimentos empresariais
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados da Análise */}
        {analise && (
          <>
            {/* Distribuição Atual */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição Patrimonial Atual</CardTitle>
                <CardDescription>
                  Análise da sua distribuição em relação ao ideal Triad3
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Patrimônio Bruto Total
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      {formatCurrency(analise.dados.totais.total)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Total de Dívidas
                    </div>
                    <div className="text-2xl font-bold text-destructive">
                      {formatCurrency(analise.dados.dividas)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Patrimônio Líquido
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(analise.dados.patrimonioLiquido)}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Liquidez */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Liquidez</span>
                        {parseFloat(analise.dados.desvios.liquidez) > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : parseFloat(analise.dados.desvios.liquidez) < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{analise.dados.percentuais.liquidez}%</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(analise.dados.totais.liquidez)}
                        </div>
                        <div className={`text-xs ${parseFloat(analise.dados.desvios.liquidez) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {parseFloat(analise.dados.desvios.liquidez) > 0 ? '+' : ''}{analise.dados.desvios.liquidez}% do ideal
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={parseFloat(analise.dados.percentuais.liquidez)} 
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-16 text-right">Meta: 34%</span>
                    </div>
                  </div>

                  {/* Imobilizado */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Imobilizado</span>
                        {parseFloat(analise.dados.desvios.imobilizado) > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : parseFloat(analise.dados.desvios.imobilizado) < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{analise.dados.percentuais.imobilizado}%</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(analise.dados.totais.imobilizado)}
                        </div>
                        <div className={`text-xs ${parseFloat(analise.dados.desvios.imobilizado) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {parseFloat(analise.dados.desvios.imobilizado) > 0 ? '+' : ''}{analise.dados.desvios.imobilizado}% do ideal
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={parseFloat(analise.dados.percentuais.imobilizado)} 
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-16 text-right">Meta: 33%</span>
                    </div>
                  </div>

                  {/* Negócios */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Negócios</span>
                        {parseFloat(analise.dados.desvios.negocios) > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : parseFloat(analise.dados.desvios.negocios) < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{analise.dados.percentuais.negocios}%</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(analise.dados.totais.negocios)}
                        </div>
                        <div className={`text-xs ${parseFloat(analise.dados.desvios.negocios) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {parseFloat(analise.dados.desvios.negocios) > 0 ? '+' : ''}{analise.dados.desvios.negocios}% do ideal
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={parseFloat(analise.dados.percentuais.negocios)} 
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-16 text-right">Meta: 33%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Análise da IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Análise Detalhada com IA
                </CardTitle>
                <CardDescription>
                  Insights e recomendações personalizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {analise.analise}
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t text-xs text-muted-foreground">
                  Análise gerada em: {new Date(analise.timestamp).toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Estado inicial */}
        {!analise && !loading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pronto para começar?</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Clique em "Gerar Análise com IA" para receber uma análise detalhada da distribuição do seu patrimônio 
                baseada no conceito Triad3 e recomendações personalizadas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AnaliseInteligente;
