import { useState } from "react";
import { 
  LayoutDashboard, 
  Building2, 
  TrendingUp, 
  Shield,
  Calculator, 
  BookOpen, 
  FileText, 
  CreditCard,
  Receipt,
  BarChart3,
  ScrollText,
  Settings,
  Sparkles,
  GraduationCap,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Imobilizado", href: "/imobilizado", icon: Building2 },
  { name: "Aplicações", href: "/aplicacoes", icon: TrendingUp },
  { name: "Previdência", href: "/previdencia", icon: Shield },
  { name: "Orçamentos", href: "/orcamentos", icon: Calculator },
  { name: "Livro Caixa", href: "/livro-caixa", icon: BookOpen },
  { name: "Imposto de Renda", href: "/imposto-renda", icon: FileText },
  { name: "Contas Bancárias", href: "/contas-bancarias", icon: CreditCard },
  { name: "Dívidas", href: "/dividas", icon: Receipt },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Plano do Milhão", href: "/plano-do-milhao", icon: TrendingUp },
  { name: "Análise Inteligente", href: "/analise-inteligente", icon: Sparkles },
  { name: "Educação Financeira", href: "/educacao-financeira", icon: GraduationCap },
  { name: "Testamento", href: "/testamento", icon: ScrollText },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
      
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform bg-gradient-card shadow-lg transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-bold">
                T3
              </div>
              <span className="ml-3 text-xl font-bold text-foreground">Triad3</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "hover:bg-secondary hover:text-secondary-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  location.pathname === item.href 
                    ? "text-primary-foreground" 
                    : "text-muted-foreground group-hover:text-secondary-foreground"
                )} />
                {item.name}
              </NavLink>
            ))}
          </nav>
          
          {/* Logout Button */}
          <div className="px-4 pb-6">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between bg-card shadow-sm px-6 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Gestão Inteligente de Patrimônio
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}