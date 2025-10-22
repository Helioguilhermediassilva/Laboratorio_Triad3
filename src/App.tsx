import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";
import Auth from "./pages/Auth";
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
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="/imobilizado" element={<AuthGuard><Imobilizado /></AuthGuard>} />
          <Route path="/aplicacoes" element={<AuthGuard><Aplicacoes /></AuthGuard>} />
          <Route path="/previdencia" element={<AuthGuard><Previdencia /></AuthGuard>} />
          <Route path="/orcamentos" element={<AuthGuard><Orcamentos /></AuthGuard>} />
          <Route path="/livro-caixa" element={<AuthGuard><LivroCaixa /></AuthGuard>} />
          <Route path="/imposto-renda" element={<AuthGuard><ImpostoRenda /></AuthGuard>} />
          <Route path="/contas-bancarias" element={<AuthGuard><ContasBancarias /></AuthGuard>} />
          <Route path="/dividas" element={<AuthGuard><Dividas /></AuthGuard>} />
          <Route path="/relatorios" element={<AuthGuard><Relatorios /></AuthGuard>} />
          <Route path="/plano-do-milhao" element={<AuthGuard><PlanoDoMilhao /></AuthGuard>} />
          <Route path="/testamento" element={<AuthGuard><Testamento /></AuthGuard>} />
          <Route path="/analise-inteligente" element={<AuthGuard><AnaliseInteligente /></AuthGuard>} />
          <Route path="/educacao-financeira" element={<AuthGuard><EducacaoFinanceira /></AuthGuard>} />
          <Route path="/configuracoes" element={<AuthGuard><Configuracoes /></AuthGuard>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
