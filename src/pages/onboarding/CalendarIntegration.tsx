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
      leftAligned={true}
    >
      <div className="flex flex-col gap-8 w-full">
        {/* Header */}
        <div className="flex flex-col gap-3 w-full">
          <h2 className="text-xl font-bold text-black">
            Connect Your Calendar
          </h2>
          <p className="text-base italic text-[#737373] leading-6 max-w-2xl">
            Sync your calendar so Voicera can manage bookings, calls, and availability automatically.
          </p>
        </div>

        {/* Calendar Integration Card */}
        <div className="w-full">
          <Card className="border-2 border-[#E5E7EB] rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                {/* Google Calendar Icon */}
                <div className="flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 150 150" fill="none">
                    <g>
                      <polygon fill="#1E88E5" points="79.2,67.2 81.8,70.9 85.8,68 85.8,89 90.1,89 90.1,61.4 86.5,61.4"/>
                      <path fill="#1E88E5" d="M72.3,74.4c1.6-1.4,2.6-3.5,2.6-5.7c0-4.4-3.9-8-8.6-8c-4,0-7.5,2.5-8.4,6.2l4.2,1.1c0.4-1.7,2.2-2.9,4.2-2.9c2.4,0,4.3,1.6,4.3,3.6c0,2-1.9,3.6-4.3,3.6h-2.5v4.4h2.5c2.7,0,5,1.9,5,4.1c0,2.3-2.2,4.1-4.9,4.1c-2.4,0-4.5-1.5-4.8-3.6l-4.2,0.7c0.7,4.1,4.6,7.2,9.1,7.2c5.1,0,9.2-3.8,9.2-8.5C75.6,78.2,74.3,75.9,72.3,74.4z"/>
                      <polygon fill="#FBC02D" points="100.2,120.3 49.8,120.3 49.8,100.2 100.2,100.2"/>
                      <polygon fill="#4CAF50" points="120.3,100.2 120.3,49.8 100.2,49.8 100.2,100.2"/>
                      <path fill="#1E88E5" d="M100.2,49.8V29.7h-63c-4.2,0-7.6,3.4-7.6,7.6v63h20.1V49.8H100.2z"/>
                      <polygon fill="#E53935" points="100.2,100.2 100.2,120.3 120.3,100.2"/>
                      <path fill="#1565C0" d="M112.8,29.7h-12.6v20.1h20.1V37.2C120.3,33,117,29.7,112.8,29.7z"/>
                      <path fill="#1565C0" d="M37.2,120.3h12.6v-20.1H29.7v12.6C29.7,117,33,120.3,37.2,120.3z"/>
                    </g>
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
      </div>
    </OnboardingLayout>
  );
}