import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';

export const OnboardingStep5: React.FC = () => {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate("/onboarding/ai-voice");
  };

  const handlePrevious = () => {
    navigate("/onboarding/step4");
  };

  return (
    <OnboardingLayout
      step={5}
      totalSteps={5}
      completionPercentage={80}
      onNext={handleNext}
      onPrevious={handlePrevious}
      nextButtonText="Let's go"
      showPrevious={true}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Robot Icon */}
        <div className="flex items-center justify-center w-20 h-20 bg-[#F3F4F6] border-[1.25px] border-[#E5E7EB] rounded-full">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M31.6663 26.6668V23.3335C31.6663 18.6195 31.6663 16.2624 30.2018 14.798C28.7373 13.3335 26.3803 13.3335 21.6663 13.3335H18.333C13.619 13.3335 11.2619 13.3335 9.79747 14.798C8.33301 16.2624 8.33301 18.6195 8.33301 23.3335V26.6668C8.33301 31.3808 8.33301 33.7378 9.79747 35.2023C11.2619 36.6668 13.619 36.6668 18.333 36.6668H21.6663C26.3803 36.6668 28.7373 36.6668 30.2018 35.2023C31.6663 33.7378 31.6663 31.3808 31.6663 26.6668Z"
              stroke="#141B34"
              strokeWidth="1.875"
              strokeLinejoin="round"
            />
            <path
              d="M31.667 30C34.024 30 35.2025 30 35.9348 29.2678C36.667 28.5355 36.667 27.357 36.667 25C36.667 22.643 36.667 21.4645 35.9348 20.7322C35.2025 20 34.024 20 31.667 20"
              stroke="#141B34"
              strokeWidth="1.875"
              strokeLinejoin="round"
            />
            <path
              d="M8.33301 30C5.97599 30 4.79747 30 4.06524 29.2678C3.33301 28.5355 3.33301 27.357 3.33301 25C3.33301 22.643 3.33301 21.4645 4.06524 20.7322C4.79747 20 5.97599 20 8.33301 20"
              stroke="#141B34"
              strokeWidth="1.875"
              strokeLinejoin="round"
            />
            <path
              d="M22.5 5.8335C22.5 7.21421 21.3807 8.3335 20 8.3335C18.6193 8.3335 17.5 7.21421 17.5 5.8335C17.5 4.45278 18.6193 3.3335 20 3.3335C21.3807 3.3335 22.5 4.45278 22.5 5.8335Z"
              stroke="#141B34"
              strokeWidth="1.875"
            />
            <path
              d="M20 8.3335V13.3335"
              stroke="#141B34"
              strokeWidth="1.875"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16.667 21.6665V23.3332"
              stroke="#141B34"
              strokeWidth="1.875"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M25 21.6665V23.3332"
              stroke="#141B34"
              strokeWidth="1.875"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16.667 29.1665C16.667 29.1665 17.7782 29.9998 20.0003 29.9998C22.2225 29.9998 23.3337 29.1665 23.3337 29.1665"
              stroke="#141B34"
              strokeWidth="1.875"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <h2 className="text-2xl font-bold text-black">
              Give Your AI Its Personality
            </h2>
            <p className="text-xl font-semibold text-[#6B7280] max-w-lg leading-7">
              Let's make your AI sound the way you want.
            </p>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};