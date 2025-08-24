import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';

export const OnboardingStep2: React.FC = () => {
  const [businessName, setBusinessName] = useState("Silhouette Hair Co.");
  const navigate = useNavigate();

  useEffect(() => {
    // Load any previously saved business name
    const savedName = sessionStorage.getItem("businessName");
    if (savedName) {
      setBusinessName(savedName);
    }
  }, []);

  const handlePrevious = () => {
    navigate("/onboarding/step1");
  };

  const handleNext = () => {
    if (businessName.trim()) {
      // Store the business name
      sessionStorage.setItem("businessName", businessName.trim());
      navigate("/onboarding/step3");
    }
  };

  const isNextDisabled = !businessName.trim();

  return (
    <OnboardingLayout
      step={2}
      totalSteps={5}
      completionPercentage={40}
      onPrevious={handlePrevious}
      onNext={handleNext}
      showPrevious={true}
      nextDisabled={isNextDisabled}
    >
      <div className="flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-foreground">
            What's your business name?
          </h2>
          <p className="text-base italic text-muted-foreground leading-6">
            This is how your AI will introduce your business when it answers calls.
          </p>
        </div>

        {/* Business Name Input */}
        <div className="flex flex-col gap-6">
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter your business name..."
            className="w-full p-4 text-lg font-semibold text-foreground border-2 border-border rounded-xl placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors bg-background"
          />
        </div>
      </div>
    </OnboardingLayout>
  );
};