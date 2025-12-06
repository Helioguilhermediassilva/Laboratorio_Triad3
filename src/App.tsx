import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";
import SubscriptionGuard from "./components/SubscriptionGuard";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Imobilizado from "./pages/Imobilizado";
import Aplicacoes from "./pages/Aplicacoes";
import Previdencia from "./pages/Previdencia";
import Orcamentos from "./pages/Orcamentos";
import LivroCaixa from "./pages/LivroCaixa";
import ImpostoRenda from "./pages/ImpostoRenda";
import ContasBancarias from "./pages/ContasBancarias";
import Dividas from "./pages/Dividas";
import Relatorios from "./pages/Relatorios";
import PlanoDoMilhao from "./pages/PlanoDoMilhao";
import Testamento from "./pages/Testamento";
import ContratoNamoro from "./pages/ContratoNamoro";
import Configuracoes from "./pages/Configuracoes";
import AnaliseInteligente from "./pages/AnaliseInteligente";
import EducacaoFinanceira from "./pages/EducacaoFinanceira";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<AuthGuard><SubscriptionGuard><Index /></SubscriptionGuard></AuthGuard>} />
          <Route path="/imobilizado" element={<AuthGuard><SubscriptionGuard><Imobilizado /></SubscriptionGuard></AuthGuard>} />
          <Route path="/aplicacoes" element={<AuthGuard><SubscriptionGuard><Aplicacoes /></SubscriptionGuard></AuthGuard>} />
          <Route path="/previdencia" element={<AuthGuard><SubscriptionGuard><Previdencia /></SubscriptionGuard></AuthGuard>} />
          <Route path="/orcamentos" element={<AuthGuard><SubscriptionGuard><Orcamentos /></SubscriptionGuard></AuthGuard>} />
          <Route path="/livro-caixa" element={<AuthGuard><SubscriptionGuard><LivroCaixa /></SubscriptionGuard></AuthGuard>} />
          <Route path="/imposto-renda" element={<AuthGuard><SubscriptionGuard><ImpostoRenda /></SubscriptionGuard></AuthGuard>} />
          <Route path="/contas-bancarias" element={<AuthGuard><SubscriptionGuard><ContasBancarias /></SubscriptionGuard></AuthGuard>} />
          <Route path="/dividas" element={<AuthGuard><SubscriptionGuard><Dividas /></SubscriptionGuard></AuthGuard>} />
          <Route path="/relatorios" element={<AuthGuard><SubscriptionGuard><Relatorios /></SubscriptionGuard></AuthGuard>} />
          <Route path="/plano-do-milhao" element={<AuthGuard><SubscriptionGuard><PlanoDoMilhao /></SubscriptionGuard></AuthGuard>} />
          <Route path="/testamento" element={<AuthGuard><SubscriptionGuard><Testamento /></SubscriptionGuard></AuthGuard>} />
          <Route path="/contrato-namoro" element={<AuthGuard><SubscriptionGuard><ContratoNamoro /></SubscriptionGuard></AuthGuard>} />
          <Route path="/analise-inteligente" element={<AuthGuard><SubscriptionGuard><AnaliseInteligente /></SubscriptionGuard></AuthGuard>} />
          <Route path="/educacao-financeira" element={<AuthGuard><SubscriptionGuard><EducacaoFinanceira /></SubscriptionGuard></AuthGuard>} />
          <Route path="/configuracoes" element={<AuthGuard><SubscriptionGuard><Configuracoes /></SubscriptionGuard></AuthGuard>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
