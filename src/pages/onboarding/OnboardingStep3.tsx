import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';

export const OnboardingStep3: React.FC = () => {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate("/onboarding/step4");
  };

  const handlePrevious = () => {
    navigate("/onboarding/step2");
  };

  return (
    <OnboardingLayout
      step={3}
      totalSteps={5}
      completionPercentage={46}
      onNext={handleNext}
      onPrevious={handlePrevious}
      nextButtonText="Continue"
      showPrevious={true}
    >
      <div className="flex flex-col items-center gap-8">
        <h2 className="text-2xl font-bold text-black text-center">
          Step 3 - Coming Soon
        </h2>
        <p className="text-xl font-semibold text-[#6B7280] max-w-lg leading-7 text-center">
          This step will be implemented next.
        </p>
      </div>
    </OnboardingLayout>
  );
};