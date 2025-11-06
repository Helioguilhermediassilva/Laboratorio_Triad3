import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Building2, 
  Wallet, 
  TrendingUp, 
  Shield, 
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Building2,
      title: "Bens Imobilizados",
      description: "Gerencie imóveis, veículos e patrimônio físico em um só lugar"
    },
    {
      icon: TrendingUp,
      title: "Aplicações Financeiras",
      description: "Acompanhe seus investimentos e rentabilidade"
    },
    {
      icon: Wallet,
      title: "Contas Bancárias",
      description: "Centralize informações de todas as suas contas"
    },
    {
      icon: BarChart3,
      title: "Orçamentos e Livro Caixa",
      description: "Controle receitas e despesas com precisão"
    },
    {
      icon: FileText,
      title: "Imposto de Renda",
      description: "Organize documentos e declarações fiscais"
    },
    {
      icon: Shield,
      title: "Previdência e Testamento",
      description: "Planeje o futuro e proteja seu legado"
    }
  ];

  const benefits = [
    "Comandos inteligentes e direcionamentos",
    "Desburocratização de processos complexos",
    "Tradução de linguagem técnica financeira",
    "Administração eficiente do patrimônio",
    "Indicações profissionais específicas",
    "Decisões mais assertivas e rápidas"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">T3</span>
            </div>
            <span className="font-semibold text-lg">TRIAD3</span>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/auth')}
            className="hover:bg-muted"
          >
            Entrar na minha conta
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Transformando seu patrimônio em legado
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Para todas as pessoas,{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              de todas as idades
            </span>
            , construir, administrar e proteger seu legado
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Reúna todas as suas informações patrimoniais em um só lugar. 
            A revolução da eficiência na administração de patrimônio.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth?tab=signup')}
              className="text-lg h-14 px-8 shadow-lg hover:shadow-primary/50 transition-all"
            >
              Começar gratuitamente
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/auth')}
              className="text-lg h-14 px-8"
            >
              Fazer login
            </Button>
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            ✨ <strong>14 dias grátis</strong> para testar • Depois apenas <strong>R$ 299/mês</strong>
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-muted-foreground text-lg">
            Imobilizado, aplicações, orçamentos, livro caixa, imposto de renda, contas bancárias e muito mais
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow bg-card">
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                A revolução da eficiência na administração de patrimônio
              </h2>
              <p className="text-muted-foreground text-lg">
                Idealizado para apoiar o crescimento do seu patrimônio. 
                Projetado para aumentar a eficiência das decisões.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Para quem é a TRIAD3?
              </h2>
              
              <div className="space-y-4 text-lg">
                <p className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <span>
                    <strong>Idealizado</strong> para apoiar o crescimento do seu patrimônio
                  </span>
                </p>
                
                <p className="flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <span>
                    <strong>Projetado</strong> para aumentar a eficiência das decisões
                  </span>
                </p>
                
                <p className="flex items-start gap-3">
                  <span className="text-2xl">🤝</span>
                  <span>
                    <strong>Adequado</strong> para pessoas que precisam de ajuda para construir e administrar seu patrimônio
                  </span>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <blockquote className="text-2xl md:text-3xl font-medium leading-relaxed mb-8">
              "Desburocratizar processos, traduzir linguagens e ajudar a administrar patrimônios costumava ser um sonho. 
              Agora, já é uma realidade e pode ajudar a elevar patrimônios em legados."
            </blockquote>
            <div>
              <p className="font-semibold text-lg">Patricia Dutra</p>
              <p className="text-primary-foreground/80">Founder CEO</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto p-8 md:p-12 text-center bg-gradient-to-br from-card to-muted/50">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comece hoje mesmo
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Teste gratuitamente por 14 dias. Sem compromisso, sem cartão de crédito.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth?tab=signup')}
              className="text-lg h-14 px-8"
            >
              Criar conta gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="pt-6 border-t mt-6">
            <p className="text-sm text-muted-foreground">
              Após o período de teste, continue por apenas <strong className="text-foreground">R$ 299,00/mês</strong>
            </p>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-xs">T3</span>
              </div>
              <span className="text-sm text-muted-foreground">
                TRIAD3 © 2025 • Patrimonial Informática e Sistemas
              </span>
            </div>
            
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                Login
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth?tab=signup')}>
                Cadastro
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
