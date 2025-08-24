import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const OnboardingStep5: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleComplete = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to complete onboarding. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: "Onboarding completed successfully!",
      });

      navigate("/");
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    navigate("/onboarding/step4");
  };

  return (
    <OnboardingLayout
      step={5}
      totalSteps={5}
      completionPercentage={100}
      onNext={handleComplete}
      onPrevious={handlePrevious}
      nextButtonText="Complete Setup"
      showPrevious={true}
    >
      <div className="flex flex-col items-center gap-8">
        <h2 className="text-2xl font-bold text-black text-center">
          Step 5 - Final Step
        </h2>
        <p className="text-xl font-semibold text-[#6B7280] max-w-lg leading-7 text-center">
          You're almost done! Click "Complete Setup" to finish.
        </p>
      </div>
    </OnboardingLayout>
  );
};