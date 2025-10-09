import { useState } from "react";
import { GraduationCap, BookOpen, TrendingUp, Shield, Target, Lightbulb, Sparkles, Bell, Calendar } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function EducacaoFinanceira() {
  const [selectedCategory, setSelectedCategory] = useState("todos");

  const novidades = [
    {
      id: 1,
      titulo: "Novo recurso: Análise Inteligente com IA",
      data: "2024-01-15",
      categoria: "Produto",
      conteudo: "Agora você pode gerar análises patrimoniais automáticas usando inteligência artificial. Receba insights personalizados sobre sua distribuição de ativos e recomendações baseadas no método Triad3.",
      icone: Sparkles,
      destaque: true
    },
    {
      id: 2,
      titulo: "Webinar: Como alcançar seu primeiro milhão",
      data: "2024-01-10",
      categoria: "Evento",
      conteudo: "Participe do nosso próximo webinar gratuito sobre estratégias de investimento de longo prazo. Aprenda com especialistas sobre o poder dos juros compostos.",
      icone: Calendar,
      destaque: false
    },
    {
      id: 3,
      titulo: "Artigo: A importância da diversificação",
      data: "2024-01-05",
      categoria: "Educação",
      conteudo: "Descubra por que a diversificação é essencial para proteger seu patrimônio e como o método 33-34-33 pode ajudar você a manter um portfólio equilibrado.",
      icone: BookOpen,
      destaque: false
    },
    {
      id: 4,
      titulo: "Atualização: Integração com bancos",
      data: "2023-12-28",
      categoria: "Produto",
      conteudo: "Agora você pode importar extratos bancários diretamente de suas contas. Suporte para os principais bancos brasileiros já está disponível.",
      icone: TrendingUp,
      destaque: false
    }
  ];

  const pillarsData = [
    {
      title: "Liquidez (33%)",
      icon: TrendingUp,
      color: "bg-blue-100 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
      items: [
        "Contas correntes e poupança",
        "Fundos de emergência (6 meses de despesas)",
        "CDBs de liquidez diária",
        "Fundos DI e Tesouro Selic",
        "Investimentos de curto prazo"
      ],
      objetivo: "Garantir segurança e disponibilidade imediata de recursos para imprevistos e oportunidades."
    },
    {
      title: "Imobilizado (34%)",
      icon: Shield,
      color: "bg-green-100 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
      items: [
        "Imóveis residenciais e comerciais",
        "Veículos e equipamentos",
        "Terrenos e propriedades",
        "Bens duráveis de alto valor",
        "Patrimônio físico tangível"
      ],
      objetivo: "Construir patrimônio sólido e proteção contra inflação através de ativos tangíveis."
    },
    {
      title: "Negócios (33%)",
      icon: Target,
      color: "bg-purple-100 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
      items: [
        "Ações e fundos de ações",
        "Participação em empresas",
        "Fundos imobiliários (FIIs)",
        "Investimentos em startups",
        "Negócios próprios ou sociedades"
      ],
      objetivo: "Maximizar rentabilidade e crescimento patrimonial através de investimentos de longo prazo."
    }
  ];

  const dicasEducativas = [
    {
      titulo: "Comece com pequenos aportes",
      descricao: "Não é necessário ter muito dinheiro para começar a investir. Comece com valores pequenos e aumente gradualmente.",
      icone: Target
    },
    {
      titulo: "Disciplina é mais importante que timing",
      descricao: "Manter aportes regulares é mais eficaz do que tentar acertar o melhor momento do mercado.",
      icone: Shield
    },
    {
      titulo: "Eduque-se constantemente",
      descricao: "O conhecimento financeiro é seu maior ativo. Invista tempo em aprender sobre investimentos e economia.",
      icone: GraduationCap
    },
    {
      titulo: "Mantenha o equilíbrio 33-34-33",
      descricao: "Revise periodicamente seu portfólio para garantir que está seguindo a distribuição ideal da Triad3.",
      icone: TrendingUp
    },
    {
      titulo: "Pense no longo prazo",
      descricao: "Patrimônio sólido é construído ao longo de anos. Tenha paciência e foco em seus objetivos de longo prazo.",
      icone: Lightbulb
    },
    {
      titulo: "Proteja seu legado",
      descricao: "Pense não apenas em construir, mas também em proteger e transmitir seu patrimônio para as próximas gerações.",
      icone: Shield
    }
  ];

  const filteredNovidades = selectedCategory === "todos" 
    ? novidades 
    : novidades.filter(n => n.categoria === selectedCategory);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            Educação Financeira
          </h1>
          <p className="text-muted-foreground">
            Aprenda a filosofia Triad3 e transforme seu patrimônio em legado
          </p>
        </div>

        {/* Missão Triad3 */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              A Filosofia Triad3
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-lg font-semibold text-primary">
              "Transformando seu patrimônio em legado"
            </div>
            <p className="text-muted-foreground leading-relaxed">
              A Triad3 foi idealizada para ajudar pessoas de todas as idades a <strong>construir, administrar e proteger seu legado</strong>. 
              Nossa missão é desburocratizar processos, traduzir linguagens complexas e apoiar você na jornada de crescimento patrimonial.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                <Target className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Idealizado</div>
                  <div className="text-sm text-muted-foreground">
                    Para apoiar o crescimento do seu patrimônio
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                <TrendingUp className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Projetado</div>
                  <div className="text-sm text-muted-foreground">
                    Para aumentar a eficiência das decisões
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Adequado</div>
                  <div className="text-sm text-muted-foreground">
                    Para quem busca construir e administrar patrimônio
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs principais */}
        <Tabs defaultValue="metodologia" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metodologia">Metodologia 33-34-33</TabsTrigger>
            <TabsTrigger value="dicas">Dicas Práticas</TabsTrigger>
            <TabsTrigger value="novidades">
              <Bell className="h-4 w-4 mr-2" />
              Novidades
            </TabsTrigger>
          </TabsList>

          {/* Tab: Metodologia */}
          <TabsContent value="metodologia" className="space-y-6">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <strong>O Método Triad3 33-34-33</strong> é uma estratégia de distribuição patrimonial equilibrada que 
                divide seus investimentos em três pilares fundamentais, garantindo segurança, crescimento e proteção do seu patrimônio.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {pillarsData.map((pillar, index) => {
                const IconComponent = pillar.icon;
                return (
                  <Card key={index} className={`${pillar.color} border-2`}>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-background/50 rounded-lg">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">{pillar.title}</CardTitle>
                      </div>
                      <CardDescription className="text-sm font-medium pt-2">
                        {pillar.objetivo}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Separator className="mb-4" />
                      <div className="space-y-2">
                        <div className="font-semibold text-sm mb-3">O que incluir:</div>
                        <ul className="space-y-2">
                          {pillar.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Lightbulb className="h-5 w-5" />
                  Por que essa distribuição funciona?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-amber-900 dark:text-amber-100">
                <p>
                  <strong>Liquidez (33%)</strong> garante que você sempre tenha recursos disponíveis para emergências 
                  e oportunidades, sem precisar vender ativos em momentos desfavoráveis.
                </p>
                <p>
                  <strong>Imobilizado (34%)</strong> protege seu patrimônio contra inflação e proporciona estabilidade 
                  através de ativos tangíveis que tendem a valorizar ao longo do tempo.
                </p>
                <p>
                  <strong>Negócios (33%)</strong> impulsiona o crescimento do seu patrimônio através de investimentos 
                  de maior rentabilidade, aproveitando o potencial do mercado de capitais.
                </p>
                <Separator className="my-4 bg-amber-300 dark:bg-amber-700" />
                <p className="font-semibold">
                  O equilíbrio entre esses três pilares proporciona segurança, crescimento e proteção simultâneos, 
                  permitindo que você construa um patrimônio sólido e duradouro.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Dicas Práticas */}
          <TabsContent value="dicas" className="space-y-6">
            <Alert>
              <GraduationCap className="h-4 w-4" />
              <AlertDescription>
                <strong>Educação financeira é um processo contínuo.</strong> Estas dicas práticas vão ajudar você 
                a desenvolver hábitos saudáveis de gestão patrimonial.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dicasEducativas.map((dica, index) => {
                const IconComponent = dica.icone;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{dica.titulo}</CardTitle>
                          <CardDescription className="mt-2">
                            {dica.descricao}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Sparkles className="h-5 w-5" />
                  Princípios Fundamentais da Triad3
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-green-900 dark:text-green-100">
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-600 text-white mt-1">1</Badge>
                  <div>
                    <div className="font-semibold mb-1">Desburocratização</div>
                    <p className="text-sm">Simplificamos processos complexos para que você possa focar no que realmente importa: fazer seu patrimônio crescer.</p>
                  </div>
                </div>
                <Separator className="bg-green-300 dark:bg-green-700" />
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-600 text-white mt-1">2</Badge>
                  <div>
                    <div className="font-semibold mb-1">Tradução de Linguagens</div>
                    <p className="text-sm">Transformamos jargões financeiros em informações claras e acionáveis que você pode entender e usar.</p>
                  </div>
                </div>
                <Separator className="bg-green-300 dark:bg-green-700" />
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-600 text-white mt-1">3</Badge>
                  <div>
                    <div className="font-semibold mb-1">Gestão Centralizada</div>
                    <p className="text-sm">Reunimos todas as suas informações patrimoniais em um só lugar para facilitar o acompanhamento e as decisões.</p>
                  </div>
                </div>
                <Separator className="bg-green-300 dark:bg-green-700" />
                <div className="flex items-start gap-3">
                  <Badge className="bg-green-600 text-white mt-1">4</Badge>
                  <div>
                    <div className="font-semibold mb-1">Inteligência Aplicada</div>
                    <p className="text-sm">Usamos tecnologia e IA para fornecer insights personalizados e direcionamentos estratégicos.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Novidades */}
          <TabsContent value="novidades" className="space-y-6">
            <div className="flex items-center justify-between">
              <Alert className="flex-1 mr-4">
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  <strong>Fique por dentro das novidades!</strong> Acompanhe as últimas atualizações, eventos e conteúdos educativos da Triad3.
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge 
                variant={selectedCategory === "todos" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory("todos")}
              >
                Todas
              </Badge>
              <Badge 
                variant={selectedCategory === "Produto" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory("Produto")}
              >
                Produto
              </Badge>
              <Badge 
                variant={selectedCategory === "Educação" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory("Educação")}
              >
                Educação
              </Badge>
              <Badge 
                variant={selectedCategory === "Evento" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory("Evento")}
              >
                Eventos
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {filteredNovidades.map((novidade) => {
                const IconComponent = novidade.icone;
                return (
                  <Card 
                    key={novidade.id} 
                    className={`${novidade.destaque ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' : ''}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl">{novidade.titulo}</CardTitle>
                              {novidade.destaque && (
                                <Badge className="bg-primary text-primary-foreground">Novo</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(novidade.data).toLocaleDateString('pt-BR')}
                              </span>
                              <Badge variant="outline">{novidade.categoria}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {novidade.conteudo}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredNovidades.length === 0 && (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma novidade encontrada nesta categoria.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-foreground">
                Pronto para transformar seu patrimônio em legado?
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Use a Análise Inteligente para descobrir como seu patrimônio está distribuído e 
                receba recomendações personalizadas baseadas no método Triad3 33-34-33.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}