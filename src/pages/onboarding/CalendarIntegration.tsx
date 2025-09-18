import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGoogleIntegration } from '@/hooks/useGoogleIntegration';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function CalendarIntegration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get onboarding ID for Google integration
  const getOnboardingId = () => {
    let onboardingId = sessionStorage.getItem("onboardingId");
    if (!onboardingId) {
      onboardingId = `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("onboardingId", onboardingId);
    }
    return onboardingId;
  };

  const onboardingId = getOnboardingId();
  const { integration, loading, initiateOAuth } = useGoogleIntegration(onboardingId);

  const handlePrevious = () => {
    navigate("/onboarding/contact-number");
  };

  const handleNext = () => {
    navigate("/onboarding/personality-intro");
  };

  const handleConnectGoogle = () => {
    initiateOAuth(onboardingId);
  };

  const isConnected = integration && integration.is_active;

  return (
    <OnboardingLayout
      onNext={handleNext}
      onPrevious={handlePrevious}
      showPrevious={true}
    >
      <div className="flex flex-col gap-8 w-full items-center">
        {/* Header */}
        <div className="flex flex-col gap-3 w-full text-center">
          <h2 className="text-2xl font-bold text-black">
            Connect Your Calendar
          </h2>
          <p className="text-xl font-semibold text-[#6B7280] max-w-2xl leading-7">
            Sync your calendar so Voicera can manage bookings, calls, and availability automatically.
          </p>
        </div>

        {/* Calendar Integration Card */}
        <div className="w-full max-w-md">
          <Card className="border-2 border-[#E5E7EB] rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                {/* Google Calendar Icon */}
                <div className="flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M9 12H39V36C39 37.6569 37.6569 39 36 39H12C10.3431 39 9 37.6569 9 36V12Z" fill="#4285F4"/>
                    <path d="M9 12V15C9 16.6569 10.3431 18 12 18H36C37.6569 18 39 16.6569 39 15V12H9Z" fill="#EA4335"/>
                    <path d="M15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9V12H15V9Z" fill="#34A853"/>
                    <path d="M39 9C39 7.34315 37.6569 6 36 6C34.3431 6 33 7.34315 33 9V12H39V9Z" fill="#FBBC04"/>
                    <path d="M15 24H21V30H15V24Z" fill="white"/>
                    <path d="M27 24H33V30H27V24Z" fill="white"/>
                  </svg>
                </div>

                {/* Calendar Info */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-black mb-2">
                    Google Calendar
                  </h3>
                  
                  {isConnected ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-600 font-medium">
                        ✓ Connected successfully
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        {integration.user_email}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B7280]">
                      Sync your availability and appointments
                    </p>
                  )}
                </div>

                {/* Connect Button */}
                {!isConnected && (
                  <Button
                    onClick={handleConnectGoogle}
                    disabled={loading}
                    className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Google Calendar'
                    )}
                  </Button>
                )}
                
                {isConnected && (
                  <Button
                    variant="outline"
                    className="w-full border-green-200 text-green-600 hover:bg-green-50 rounded-lg"
                    disabled
                  >
                    Connected
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skip Option */}
        {!isConnected && (
          <p className="text-sm text-[#6B7280] text-center">
            You can skip this step and connect your calendar later from the dashboard
          </p>
        )}
      </div>
    </OnboardingLayout>
  );
}