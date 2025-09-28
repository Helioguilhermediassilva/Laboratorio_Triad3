import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import Imobilizado from "./pages/Imobilizado";
import Aplicacoes from "./pages/Aplicacoes";
import Orcamentos from "./pages/Orcamentos";
import LivroCaixa from "./pages/LivroCaixa";
import ImpostoRenda from "./pages/ImpostoRenda";
import ContasBancarias from "./pages/ContasBancarias";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthGuard>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/imobilizado" element={<Imobilizado />} />
            <Route path="/aplicacoes" element={<Aplicacoes />} />
            <Route path="/orcamentos" element={<Orcamentos />} />
            <Route path="/livro-caixa" element={<LivroCaixa />} />
            <Route path="/imposto-renda" element={<ImpostoRenda />} />
            <Route path="/contas-bancarias" element={<ContasBancarias />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthGuard>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
