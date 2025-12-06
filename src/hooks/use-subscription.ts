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
      
      // Use getUser() to validate session with server instead of getSession()
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
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

      // Get the session for the access token
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

      const response = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      // Handle errors - treat auth errors as not subscribed
      if (response.error) {
        const errorName = response.error?.name || '';
        // FunctionsHttpError means non-2xx response - treat as not subscribed
        if (errorName === 'FunctionsHttpError') {
          console.warn('Subscription check returned non-2xx, treating as not subscribed');
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
        throw response.error;
      }

      const data = response.data;
      setSubscriptionStatus({
        subscribed: data?.subscribed ?? false,
        is_trialing: data?.is_trialing ?? false,
        trial_end: data?.trial_end ?? null,
        subscription_end: data?.subscription_end ?? null,
        status: data?.status,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      // Fail gracefully - don't block the user
      setSubscriptionStatus({
        subscribed: false,
        is_trialing: false,
        trial_end: null,
        subscription_end: null,
        loading: false,
        error: null,
      });
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
