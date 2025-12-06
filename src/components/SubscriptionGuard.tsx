import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CreditCard, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { 
    subscribed, 
    is_trialing, 
    trial_end, 
    loading, 
    error,
    createCheckout,
    checkSubscription
  } = useSubscription();

  // Check authentication first - use getUser() to validate token with server
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        // Clear any stale session
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check for checkout success in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('checkout') === 'success') {
      navigate(location.pathname, { replace: true });
      checkSubscription();
    }
  }, [location, navigate, checkSubscription]);

  // Show loading while checking auth or subscription
  if (isAuthenticated === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // User has active subscription or is in trial
  if (subscribed) {
    // Show trial banner if trialing
    if (is_trialing && trial_end) {
      const trialEndDate = new Date(trial_end);
      const daysRemaining = Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      return (
        <>
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>
                  Período de teste: <strong>{daysRemaining} dias restantes</strong> 
                  (até {format(trialEndDate, "dd 'de' MMMM", { locale: ptBR })})
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={createCheckout}>
                Assinar agora
              </Button>
            </div>
          </div>
          {children}
        </>
      );
    }
    
    return <>{children}</>;
  }

  // User doesn't have subscription - show paywall
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Assinatura Necessária</h1>
          <p className="text-muted-foreground">
            Seu período de teste expirou ou você ainda não possui uma assinatura ativa.
          </p>
        </div>

        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <p className="text-lg font-semibold">Plano Triad3</p>
          <p className="text-3xl font-bold text-primary">R$ 99,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
          <ul className="text-sm text-muted-foreground space-y-1 text-left mt-4">
            <li>✓ Gestão completa de patrimônio</li>
            <li>✓ Análise inteligente com IA</li>
            <li>✓ Relatórios personalizados</li>
            <li>✓ Controle de investimentos</li>
            <li>✓ Planejamento financeiro</li>
          </ul>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="space-y-3">
          <Button 
            className="w-full" 
            size="lg"
            onClick={createCheckout}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Assinar Agora
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => navigate("/")}
          >
            Voltar ao início
          </Button>
        </div>
      </Card>
    </div>
  );
}
