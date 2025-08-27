import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/LoginForm";
import { Navigate } from "react-router-dom";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { useEffect, useState } from "react";

const Index = () => {
  const { user, loading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (user && !checkingOnboarding) {
        setCheckingOnboarding(true);
        try {
          const completed = await hasCompletedOnboarding();
          if (completed) {
            window.location.href = '/dashboard';
          } else {
            window.location.href = '/onboarding/business-intro';
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          window.location.href = '/onboarding/business-intro';
        }
      }
    };

    checkUserStatus();
  }, [user, checkingOnboarding]);

  if (loading || (user && !checkingOnboarding)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <LoginForm />;
};

export default Index;
