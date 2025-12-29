import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode;
}

export const SubscriptionProtectedRoute: React.FC<SubscriptionProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [subscriptionActive, setSubscriptionActive] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      checkSubscription();
    } else if (!authLoading && !user) {
      setChecking(false);
    }
  }, [user, authLoading]);

  const checkSubscription = async () => {
    if (!user) {
      setChecking(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error checking subscription:", error);
        setSubscriptionActive(false);
      } else if (data) {
        const isActive = data.status === "active" && 
          (!data.current_period_end || new Date(data.current_period_end) > new Date());
        setSubscriptionActive(isActive);
      } else {
        setSubscriptionActive(false);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscriptionActive(false);
    } finally {
      setChecking(false);
    }
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (subscriptionActive === false) {
    return <Navigate to="/subscription" replace />;
  }

  return <>{children}</>;
};

