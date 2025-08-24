import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';

export const OnboardingStep2: React.FC = () => {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate("/onboarding/step3");
  };

  const handlePrevious = () => {
    navigate("/onboarding/step1");
  };

  return (
    <OnboardingLayout
      step={2}
      totalSteps={5}
      completionPercentage={26}
      onNext={handleNext}
      onPrevious={handlePrevious}
      nextButtonText="Continue"
      showPrevious={true}
    >
      <div className="flex flex-col items-center gap-8">
        <h2 className="text-2xl font-bold text-black text-center">
          Step 2 - Coming Soon
        </h2>
        <p className="text-xl font-semibold text-[#6B7280] max-w-lg leading-7 text-center">
          This step will be implemented next.
        </p>
      </div>
    </OnboardingLayout>
  );
};