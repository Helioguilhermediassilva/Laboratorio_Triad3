import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/imobilizado" element={<Imobilizado />} />
          <Route path="/aplicacoes" element={<Aplicacoes />} />
          <Route path="/previdencia" element={<Previdencia />} />
          <Route path="/orcamentos" element={<Orcamentos />} />
          <Route path="/livro-caixa" element={<LivroCaixa />} />
          <Route path="/imposto-renda" element={<ImpostoRenda />} />
          <Route path="/contas-bancarias" element={<ContasBancarias />} />
          <Route path="/dividas" element={<Dividas />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/plano-do-milhao" element={<PlanoDoMilhao />} />
          <Route path="/testamento" element={<Testamento />} />
          <Route path="/analise-inteligente" element={<AnaliseInteligente />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
