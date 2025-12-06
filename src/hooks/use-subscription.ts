import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionStatus {
  subscribed: boolean;
  is_trialing: boolean;
  trial_end: string | null;
  subscription_end: string | null;
  status?: string;
  loading: boolean;
  error: string | null;
}

export function useSubscription() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    is_trialing: false,
    trial_end: null,
    subscription_end: null,
    loading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      setSubscriptionStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubscriptionStatus({
          subscribed: false,
          is_trialing: false,
          trial_end: null,
          subscription_end: null,
          loading: false,
          error: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setSubscriptionStatus({
        subscribed: data.subscribed,
        is_trialing: data.is_trialing,
        trial_end: data.trial_end,
        subscription_end: data.subscription_end,
        status: data.status,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      setSubscriptionStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to check subscription',
      }));
    }
  }, []);

  const createCheckout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkSubscription();

    // Refresh subscription status every minute
    const interval = setInterval(checkSubscription, 60000);

    // Also check on auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [checkSubscription]);

  return {
    ...subscriptionStatus,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}
