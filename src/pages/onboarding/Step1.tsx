import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const OnboardingStep1: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleNext = () => {
    navigate("/onboarding/step2");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header Section */}
      <div className="flex justify-between items-center px-8 py-4">
        {/* App Title */}
        <h1 className="text-4xl font-bold text-black">Voicera AI</h1>
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] rounded-xl hover:bg-gray-200 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="16,17 21,12 16,7" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="21" y1="12" x2="9" y2="12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-base text-[#6B7280]">Logout</span>
        </button>
      </div>

      {/* Progress Section */}
      <div className="flex flex-col items-center px-8 mb-12">
        <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
          {/* Step Counter */}
          <div className="text-xl font-semibold text-[#6B7280]">
            Step 1 of 5
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-[#D1D5DB] rounded-full overflow-hidden">
            <div className="h-full bg-black rounded-full transition-all duration-300" style={{ width: "6%" }} />
          </div>
          
          {/* Completion Text */}
          <div className="text-xl font-semibold text-[#6B7280]">
            6% completed
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="flex justify-center px-4">
        <div className="w-full max-w-4xl bg-white rounded-[28px] border-2 border-[#E5E7EB] p-8">
          {/* Page Content */}
          <div className="flex flex-col items-center gap-8">
            {/* Icon */}
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

            {/* Content */}
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-2xl font-bold text-black">
                Let's Get Your AI Assistant Ready!
              </h2>
              
              <p className="text-xl font-semibold text-[#6B7280] max-w-lg leading-7 text-center">
                We'll ask a few quick questions to set up your voice AI agent. It only takes 7 minutes.
              </p>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-10">
            {/* Previous Button (Hidden on Step 1) */}
            <div />
            
            {/* Next Button */}
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-3.5 bg-black rounded-xl hover:bg-gray-800 transition-colors"
            >
              <span className="text-lg font-semibold text-white">Let's go</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 12H4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.0001 17C15.0001 17 20 13.3176 20 12C20 10.6824 15 7 15 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};