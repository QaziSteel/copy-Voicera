import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

interface OnboardingLayoutProps {
  step: number;
  totalSteps: number;
  completionPercentage: number;
  children: ReactNode;
  onPrevious?: () => void;
  onNext?: () => void;
  nextButtonText?: string;
  showPrevious?: boolean;
  nextDisabled?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  step,
  totalSteps,
  completionPercentage,
  children,
  onPrevious,
  onNext,
  nextButtonText = "Next",
  showPrevious = true,
  nextDisabled = false
}) => {
  const { signOut } = useAuth();

  // Helper function to get display step based on step ranges
  const getDisplayStep = (currentStep: number): number => {
    if (currentStep >= 1 && currentStep <= 4) return 1;
    if (currentStep >= 5 && currentStep <= 7) return 2;
    if (currentStep >= 8 && currentStep <= 9) return 3;
    if (currentStep >= 10 && currentStep <= 11) return 4;
    return 5; // For steps 12 and above
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header Section */}
      <div className="grid grid-cols-3 items-center px-8 py-4">
        <div></div>
        {/* App Title - Centered */}
        <h1 className="text-4xl font-bold text-black text-center">Voicera AI</h1>
        
        {/* Logout Button */}
        <div className="flex justify-end">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] rounded-xl hover:bg-gray-200 transition-colors"
          >
            <LogOut className="w-4 h-4 text-[#6B7280]" />
            <span className="text-base text-[#6B7280]">Logout</span>
          </button>
        </div>
      </div>

      {/* Progress Section - Hidden for step 1 and step 5 */}
      {step > 1 && step !== 5 && (
        <div className="flex flex-col items-center px-8 mb-12">
          <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
            
            {/* Step Counter */}
            <div className="text-xl font-semibold text-[#6B7280]">
              Step {getDisplayStep(step)} of 5
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-[#D1D5DB] rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-300"
                style={{ width: `${step === 2 ? 6 : step === 3 ? 12 : step === 6 ? 24 : completionPercentage}%` }}
              />
            </div>

            {/* Completion Percentage */}
            <div className="text-xl font-semibold text-[#6B7280]">
              {step === 2 ? 6 : step === 3 ? 12 : step === 6 ? 24 : completionPercentage}% completed
            </div>
          </div>
        </div>
      )}

      {/* Main Content Section */}
      <div className="flex justify-center px-4">
        <div className="w-full max-w-4xl bg-white rounded-[28px] border-2 border-[#E5E7EB] p-8">
          {/* Page Content */}
          <div className="flex flex-col items-center gap-8">
            {children}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-10">
            {/* Previous Button */}
            {showPrevious && onPrevious ? (
              <button 
                onClick={onPrevious}
                className="flex items-center gap-2 px-5 py-3.5 bg-[#F3F4F6] rounded-xl hover:bg-gray-200 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12H20" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.99988 17C8.99988 17 4 13.3176 4 12C4 10.6824 9 7 9 7" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-lg font-semibold text-[#6B7280]">Previous</span>
              </button>
            ) : (
              <div />
            )}
            
            {/* Next Button */}
            {onNext && (
              <button 
                onClick={onNext}
                disabled={nextDisabled}
                className="flex items-center gap-2 px-5 py-3.5 bg-black rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-lg font-semibold text-white">{nextButtonText}</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 12H4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.0001 17C15.0001 17 20 13.3176 20 12C20 10.6824 15 7 15 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};