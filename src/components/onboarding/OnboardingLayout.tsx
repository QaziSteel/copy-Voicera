import React, { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OnboardingLayoutProps {
  children: ReactNode;
  onPrevious?: () => void;
  onNext?: () => void;
  nextButtonText?: string;
  showPrevious?: boolean;
  nextDisabled?: boolean;
  leftAligned?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  onPrevious,
  onNext,
  nextButtonText = "Next",
  showPrevious = true,
  nextDisabled = false,
  leftAligned = false
}) => {
  const { signOut, user } = useAuth();
  const { currentProject } = useProject();
  const location = useLocation();
  const navigate = useNavigate();
  const [hasExistingAgents, setHasExistingAgents] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Hardcoded step values based on route
  const getStepInfo = () => {
    switch (location.pathname) {
      case '/onboarding/business-intro':
        return { step: 1, totalSteps: 5, completionPercentage: 0 };
      case '/onboarding/business-name':
        return { step: 1, totalSteps: 5, completionPercentage: 6 };
      case '/onboarding/business-type':
        return { step: 1, totalSteps: 5, completionPercentage: 12 };
      case '/onboarding/business-services':
        return { step: 1, totalSteps: 5, completionPercentage: 14 };
      case '/onboarding/business-location':
        return { step: 1, totalSteps: 5, completionPercentage: 16 };
      case '/onboarding/contact-number':
        return { step: 1, totalSteps: 5, completionPercentage: 18 };
      case '/onboarding/calendar-integration':
        return { step: 1, totalSteps: 5, completionPercentage: 20 };
      case '/onboarding/personality-intro':
        return { step: 2, totalSteps: 5, completionPercentage: 0 };
      case '/onboarding/voice-style':
        return { step: 2, totalSteps: 5, completionPercentage: 24 };
      case '/onboarding/greetings':
        return { step: 2, totalSteps: 5, completionPercentage: 30 };
      case '/onboarding/assistant-name':
        return { step: 2, totalSteps: 5, completionPercentage: 36 };
      case '/onboarding/answer-time':
        return { step: 2, totalSteps: 5, completionPercentage: 42 };
      case '/onboarding/booking-intro':
        return { step: 3, totalSteps: 5, completionPercentage: 0 };
      case '/onboarding/services':
        return { step: 3, totalSteps: 5, completionPercentage: 48 };
      case '/onboarding/business-days':
        return { step: 3, totalSteps: 5, completionPercentage: 54 };
      case '/onboarding/business-hours':
        return { step: 3, totalSteps: 5, completionPercentage: 60 };
      case '/onboarding/faq-intro':
        return { step: 4, totalSteps: 5, completionPercentage: 0 };
      case '/onboarding/faq-questions':
        return { step: 4, totalSteps: 5, completionPercentage: 78 };
      case '/onboarding/integrations':
        return { step: 5, totalSteps: 5, completionPercentage: 0 };
      case '/onboarding/question-handling':
        return { step: 5, totalSteps: 5, completionPercentage: 84 };
      case '/onboarding/summaries':
        return { step: 5, totalSteps: 5, completionPercentage: 90 };
      case '/onboarding/confirmations':
        return { step: 5, totalSteps: 5, completionPercentage: 96 };
      case '/onboarding/reminders':
        return { step: 5, totalSteps: 5, completionPercentage: 100 };
      default:
        return { step: 1, totalSteps: 5, completionPercentage: 0 };
    }
  };

  const { step, totalSteps, completionPercentage } = getStepInfo();

  // Check if the current project already has agents
  useEffect(() => {
    const checkExistingAgents = async () => {
      if (!currentProject?.id) {
        setHasExistingAgents(false);
        return;
      }

      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('id')
        .eq('project_id', currentProject.id)
        .limit(1);

      if (!error && data && data.length > 0) {
        setHasExistingAgents(true);
      } else {
        setHasExistingAgents(false);
      }
    };

    checkExistingAgents();
  }, [currentProject?.id]);

  // Check if we should show the back button (business-intro to reminders)
  const shouldShowBackButton = () => {
    if (!hasExistingAgents) return false;

    const onboardingRoutes = [
      '/onboarding/business-intro',
      '/onboarding/business-name',
      '/onboarding/business-type',
      '/onboarding/business-services',
      '/onboarding/business-location',
      '/onboarding/contact-number',
      '/onboarding/calendar-integration',
      '/onboarding/personality-intro',
      '/onboarding/voice-style',
      '/onboarding/greetings',
      '/onboarding/assistant-name',
      '/onboarding/answer-time',
      '/onboarding/booking-intro',
      '/onboarding/services',
      '/onboarding/business-days',
      '/onboarding/business-hours',
      '/onboarding/faq-intro',
      '/onboarding/faq-questions',
      '/onboarding/integrations',
      '/onboarding/question-handling',
      '/onboarding/summaries',
      '/onboarding/confirmations',
      '/onboarding/reminders',
    ];

    return onboardingRoutes.includes(location.pathname);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleBackToDashboard = () => {
    setShowDiscardDialog(true);
  };

  const handleDiscardAndReturn = async () => {
    try {
      // Clear all onboarding-related sessionStorage data
      const keysToRemove = [
        'businessName', 'businessTypes', 'primaryLocation', 'contactNumber', 
        'purchasedNumberDetails', 'aiVoiceStyle', 'aiGreetingStyle', 'aiAssistantName', 
        'aiHandlingUnknown', 'aiCallSchedule', 'services', 'businessDays', 'businessHours', 
        'scheduleFullAction', 'wantsDailySummary', 'wantsEmailConfirmations', 'reminderSettings', 
        'faqQuestions', 'faqAnswers', 'calendarIntegration', 'calendar_integration_required'
      ];

      // Remove static keys
      keysToRemove.forEach(key => sessionStorage.removeItem(key));

      // Remove dynamic keys by pattern
      const allSessionKeys = Object.keys(sessionStorage);
      const dynamicPatterns = [
        /^onboardingId/,
        /^purchasedContactNumber_/,
        /^contactNumberPurchased_/,
        /^contactNumbersWebhookCalled_/,
        /^cachedContactNumbers_/
      ];

      allSessionKeys.forEach(key => {
        if (dynamicPatterns.some(pattern => pattern.test(key))) {
          sessionStorage.removeItem(key);
        }
      });

      // Deactivate ALL existing active Google integrations for this user
      if (user?.id) {
        await supabase
          .from('google_integrations')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true);
      }

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error during discard:', error);
      // Still navigate even if cleanup fails
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Header Section */}
      <div className="grid grid-cols-3 items-center px-8 md:px-6 sm:px-4 py-6 md:py-5 sm:py-4 mb-8 md:mb-6 sm:mb-4">
        {/* Back to Dashboard Button - Left */}
        <div className="flex justify-start">
          {shouldShowBackButton() && (
            <button 
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] rounded-xl hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 md:w-3.5 md:h-3.5 sm:w-3 sm:h-3 text-[#6B7280]" />
              <span className="text-base md:text-sm sm:text-xs text-[#6B7280]">Back</span>
            </button>
          )}
        </div>
        
        {/* App Title - Centered */}
        <h1 className="text-3xl md:text-2xl sm:text-xl font-bold text-black text-center">Voicera AI</h1>
        
        {/* Logout Button - Right */}
        <div className="flex justify-end">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] rounded-xl hover:bg-gray-200 transition-colors"
          >
            <LogOut className="w-4 h-4 md:w-3.5 md:h-3.5 sm:w-3 sm:h-3 text-[#6B7280]" />
            <span className="text-base md:text-sm sm:text-xs text-[#6B7280]">Logout</span>
          </button>
        </div>
      </div>

      {/* Progress Section - Hidden when percentage is 0 */}
      {completionPercentage > 0 && (
        <div className="flex flex-col items-center px-8 md:px-6 sm:px-4 mb-12 md:mb-8 sm:mb-6">
          <div className="flex flex-col items-center gap-4 md:gap-3 sm:gap-2 w-full max-w-3xl">
            
            {/* Step Counter */}
            <div className="text-xl md:text-lg sm:text-base font-semibold text-[#6B7280]">
              Step {step} of {totalSteps}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 md:h-2 sm:h-1.5 bg-[#D1D5DB] rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            {/* Completion Percentage */}
            <div className="text-xl md:text-lg sm:text-base font-semibold text-[#6B7280]">
              {completionPercentage}% completed
            </div>
          </div>
        </div>
      )}

      {/* Main Content Section */}
      <div className="flex-1 flex justify-center items-center px-8 md:px-6 sm:px-4 pb-8 md:pb-6 sm:pb-4">
        <div className="w-[800px] md:w-[700px] sm:w-[95%] bg-white rounded-[28px] md:rounded-[24px] sm:rounded-[20px] border-2 border-[#E5E7EB] p-8 md:p-6 sm:p-4">
          {/* Page Content */}
          <div className={`flex flex-col gap-8 md:gap-6 sm:gap-4 ${leftAligned ? 'items-start w-full' : 'items-center'}`}>
            {children}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-10 md:mt-8 sm:mt-6">
            {/* Previous Button */}
            {showPrevious && onPrevious ? (
              <button 
                onClick={onPrevious}
                className="flex items-center gap-2 md:gap-1.5 sm:gap-1 px-5 md:px-4 sm:px-3 py-3.5 md:py-3 sm:py-2.5 bg-[#F3F4F6] rounded-xl md:rounded-lg sm:rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:w-5 md:h-5 sm:w-4 sm:h-4">
                  <path d="M4 12H20" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.99988 17C8.99988 17 4 13.3176 4 12C4 10.6824 9 7 9 7" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-lg md:text-base sm:text-sm font-semibold text-[#6B7280]">Previous</span>
              </button>
            ) : (
              <div />
            )}
            
            {/* Next Button */}
            {onNext && (
              <button 
                onClick={onNext}
                disabled={nextDisabled}
                className="flex items-center gap-2 md:gap-1.5 sm:gap-1 px-5 md:px-4 sm:px-3 py-3.5 md:py-3 sm:py-2.5 bg-black rounded-xl md:rounded-lg sm:rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-lg md:text-base sm:text-sm font-semibold text-white">{nextButtonText}</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:w-5 md:h-5 sm:w-4 sm:h-4">
                  <path d="M20 12H4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.0001 17C15.0001 17 20 13.3176 20 12C20 10.6824 15 7 15 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return to Dashboard?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to go back to the dashboard? All data for this agent will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardAndReturn}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Discard & Go Back
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};