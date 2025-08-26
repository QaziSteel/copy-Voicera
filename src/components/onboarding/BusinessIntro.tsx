import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from './OnboardingLayout';

export const BusinessIntro: React.FC = () => {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate("/onboarding/business-name");
  };

  return (
    <OnboardingLayout
      onNext={handleNext}
      nextButtonText="Let's go"
      showPrevious={false}
    >
      {/* Pencil Icon */}
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_207_112)">
          <path d="M29.8609 17.639C33.6109 13.889 33.8453 9.42805 33.7281 7.43899C33.7086 7.13583 33.5794 6.85015 33.3646 6.63534C33.1498 6.42054 32.8641 6.2913 32.5609 6.2718C30.5719 6.15462 26.1141 6.38587 22.3609 10.139L12.5 19.9999L20 27.4999L29.8609 17.639Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21.25 11.25H11.6172C11.2861 11.2502 10.9686 11.3816 10.7343 11.6156L5.36716 16.9828C5.20329 17.147 5.08836 17.3536 5.03523 17.5795C4.9821 17.8053 4.99287 18.0415 5.06634 18.2615C5.1398 18.4816 5.27305 18.6769 5.45119 18.8255C5.62933 18.9741 5.84531 19.0703 6.07497 19.1031L12.5 20" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M28.75 18.75V28.3828C28.7498 28.7139 28.6184 29.0314 28.3844 29.2656L23.0172 34.6328C22.853 34.7967 22.6464 34.9116 22.4205 34.9647C22.1947 35.0179 21.9585 35.0071 21.7385 34.9336C21.5184 34.8602 21.3231 34.7269 21.1745 34.5488C21.0259 34.3706 20.9297 34.1547 20.8969 33.925L20 27.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.775 29.347C14.1703 30.6735 12.1328 33.7501 6.25 33.7501C6.25 27.8673 9.32656 25.8298 10.6531 25.2251" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
          <clipPath id="clip0_207_112">
            <rect width="40" height="40" fill="white" />
          </clipPath>
        </defs>
      </svg>

      {/* Main Content */}
      <div className="flex flex-col items-center gap-2">
        {/* Step Indicator */}
        <h1 className="text-lg font-bold text-gray-500 text-center">
          Step 1 of 5
        </h1>
        
        {/* Main Heading */}
        <h2 className="text-xl font-bold text-black text-center">
          Let's Get Your AI Assistant Ready!
        </h2>

        {/* Subtitle/Description */}
        <p className="text-lg font-semibold text-[#6B7280] max-w-md leading-6 text-center">
          We'll ask a few quick questions to set up your voice AI agent. It only takes 7 minutes.
        </p>
      </div>
    </OnboardingLayout>
  );
};