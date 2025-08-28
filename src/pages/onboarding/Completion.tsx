import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { getLatestOnboardingResponse } from "@/lib/onboarding";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Completion() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGoingLive, setIsGoingLive] = useState(false);

  // You can configure this webhook URL as needed
  const WEBHOOK_URL = "https://teamhypergrowth.app.n8n.cloud/webhook-test/8db104dd-28a3-49ca-8fde-d76ce84a889b"; // Replace with your webhook URL

  const handleGoLive = async () => {
    setIsGoingLive(true);
    
    try {
      // Fetch user information
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("User not authenticated");
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();

      // Fetch latest onboarding response
      const { data: onboardingData, error: onboardingError } = await getLatestOnboardingResponse();
      if (onboardingError) {
        throw new Error("Failed to fetch onboarding data");
      }

      // Construct webhook payload with complete data
      const webhookPayload = {
        event: "agent_went_live",
        user_id: user.user.id,
        user_email: user.user.email,
        profile: profile,
        onboarding_data: onboardingData,
        timestamp: new Date().toISOString()
      };

      // Call webhook with complete payload
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }

      toast({
        title: "Success!",
        description: "Your AI agent has gone live successfully.",
      });

      // Navigate to dashboard after successful webhook
      navigate("/dashboard");

    } catch (error) {
      console.error('Error going live:', error);
      
      toast({
        title: "Webhook Error",
        description: "There was an issue notifying our system, but you can still proceed to the dashboard.",
        variant: "destructive",
      });

      // Allow user to proceed to dashboard even on webhook failure
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } finally {
      setIsGoingLive(false);
    }
  };

  const handleTestAI = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex justify-between items-center px-8 py-6">
        <div className="flex-1"></div>
        <h1 className="text-4xl font-bold text-foreground text-center">
          Voicera AI
        </h1>
        <div className="flex-1 flex justify-end">
          <button className="flex items-center gap-3 px-4 py-2 bg-muted rounded-xl">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.75 3.125H3.75V16.875H8.75"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              />
              <path
                d="M8.75 10H17.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              />
              <path
                d="M14.375 6.875L17.5 10L14.375 13.125"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              />
            </svg>
            <span className="text-base text-muted-foreground">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-xl bg-card border-2 border-border rounded-3xl p-8">
          <div className="flex flex-col items-center gap-2">
            {/* Success Icon */}
            <svg
              width="60"
              height="60"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M50 0C53.3123 0.000209749 55.9778 2.66607 61.3086 7.99707C64.507 11.1955 67.6773 12.6816 72.2393 12.6816C76.1961 12.6816 81.8387 11.9126 84.9521 15C88.0901 18.1121 87.3174 23.7784 87.3174 27.7607C87.3174 32.7929 88.4189 35.1068 92.002 38.6904C97.3334 44.0215 99.999 46.6875 99.999 50C99.9989 53.3119 97.3333 55.9777 92.002 61.3086C88.418 64.8925 87.3174 67.2068 87.3174 72.2393C87.3174 76.2217 88.0906 81.888 84.9521 85C81.8387 88.0873 76.1962 87.3184 72.2393 87.3184C67.3823 87.3184 65.0426 88.2679 61.5762 91.7344C58.6248 94.6863 54.6682 99.9987 50 99.999C45.3316 99.999 41.3745 94.6864 38.4229 91.7344C34.9564 88.2679 32.6169 87.3184 27.7598 87.3184C23.8029 87.3184 18.1602 88.0874 15.0469 85C11.9085 81.888 12.6816 76.2217 12.6816 72.2393C12.6816 67.2068 11.5809 64.8925 7.99707 61.3086C2.66599 55.9777 0.000178797 53.3119 0 50C4.99996e-05 46.6875 2.66596 44.0215 7.99707 38.6904C11.1959 35.4914 12.6816 32.3214 12.6816 27.7607C12.6816 23.8037 11.9125 18.1604 15 15.0469C18.1121 11.909 23.7775 12.6816 27.7598 12.6816C32.3207 12.6816 35.4913 11.1962 38.6904 7.99707C44.0216 2.66586 46.6875 0 50 0ZM68.3252 35.7676C67.3683 33.9313 65.1042 33.2174 63.2676 34.1738C56.4129 37.744 50.7315 44.6457 46.9072 50.2227C45.4835 52.2989 44.2692 54.2645 43.2998 55.9248C42.3703 55.0595 41.4493 54.3116 40.6309 53.6953C39.5892 52.911 38.6513 52.292 37.9688 51.8662C37.6268 51.6529 37.3454 51.4861 37.1436 51.3691C37.0426 51.3106 36.9609 51.2639 36.9014 51.2305C36.8717 51.2138 36.8467 51.2007 36.8281 51.1904C36.819 51.1854 36.811 51.1802 36.8047 51.1768C36.8017 51.1752 36.7982 51.1741 36.7959 51.1729C36.7949 51.1723 36.7938 51.1714 36.793 51.1709L36.791 51.1699C36.7884 51.1733 36.7367 51.2676 35.418 53.6953L36.79 51.1689C34.9702 50.1807 32.6936 50.8551 31.7051 52.6748C30.7174 54.4933 31.3893 56.7681 33.2061 57.7578L33.2354 57.7734C33.2651 57.7901 33.3154 57.8188 33.3838 57.8584C33.5215 57.9382 33.7324 58.0632 33.999 58.2295C34.5351 58.5639 35.2861 59.0593 36.1191 59.6865C37.8387 60.9813 39.676 62.6662 40.8242 64.4941C41.5506 65.6506 42.8485 66.3213 44.2119 66.2441C45.5755 66.1668 46.7898 65.3534 47.3809 64.1221L47.3799 64.1211L47.3818 64.1191C47.3845 64.1136 47.3897 64.1038 47.3965 64.0898C47.4104 64.0613 47.4332 64.0149 47.4639 63.9531C47.5253 63.8292 47.62 63.6402 47.7461 63.3945C47.9989 62.9022 48.3777 62.1817 48.8711 61.2939C49.8603 59.5142 51.2995 57.079 53.0928 54.4639C56.7684 49.1037 61.5875 43.5058 66.7324 40.8262C68.5691 39.8694 69.2818 37.6044 68.3252 35.7676Z"
                fill="#22C55E"
              />
            </svg>

            {/* Content */}
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-2xl font-bold text-foreground tracking-[-0.168px] leading-9">
                Your AI Agent Is Ready!
              </h2>
              <p className="text-lg text-muted-foreground leading-6 tracking-[-0.12px] max-w-[600px]">
                Great! We've set up your AI assistant. You can test it now or go
                live when you're ready.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 w-full">
              <button
                onClick={handleGoLive}
                disabled={isGoingLive}
                className="flex-1 h-10 bg-muted text-muted-foreground text-base font-bold rounded-xl flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoingLive ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Going Live...
                  </>
                ) : (
                  "Go Live"
                )}
              </button>
              <button
                onClick={handleTestAI}
                disabled={isGoingLive}
                className="flex-1 h-10 bg-primary text-primary-foreground text-base font-bold rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test My AI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}